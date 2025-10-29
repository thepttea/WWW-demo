import uuid
import time
import random
import networkx as nx
from typing import Dict, Any, List

from logger import log_message
from network import create_social_network
import case_manager as cm
from llm_provider import get_llm
from langchain.prompts import PromptTemplate
import evaluation_metrics as em

_simulations: Dict[str, Dict[str, Any]] = {}

def get_personalized_feed(agent_id, agents, G, all_posts_last_round):
    """Calculates the visible posts for an agent in the current round based on platform rules."""
    if not all_posts_last_round:
        return []

    feed = []
    
    for author_id, content, _, _ in all_posts_last_round: 
        if author_id == agent_id: 
            continue

        # System message (Official PR Statement)
        if author_id == "system":
            feed.append({
                "type": "official_statement",
                "content": content
            })
            continue

        # User comments' visibility depends on platform rules
        author_persona = agents[author_id].persona
        author_platform = author_persona.get("primary_platform")
        
        is_visible = False
        
        if author_platform == "WeChat Moments-like":
            edge_data = G.get_edge_data(agent_id, author_id)
            if edge_data and edge_data.get("tie_strength") == "mutual":
                is_visible = True
        
        elif author_platform == "Weibo/Twitter-like":
            if G.has_edge(agent_id, author_id):
                is_visible = True
            else:
                if random.random() < author_persona.get("influence_score", 50) / 300.0:
                    is_visible = True

        elif author_platform == "TikTok-like":
            if random.random() < author_persona.get("influence_score", 50) / 150.0:
                is_visible = True
        
        elif author_platform == "Forum-like":
            is_visible = True
            
        if is_visible:
            feed.append({
                "type": "user_comment",
                "author": author_persona['username'],
                "content": content
            })
            
    log_message(f"--- Agent {agent_id} found {len(feed)} new posts in their feed ---")
    return feed

def start_scenario1_simulation(initial_topic: str, llm_model: str, simulation_config: Dict, pr_strategy: str = "") -> Dict[str, Any]:
    """
    Starts a new Scenario 1 simulation task.
    
    Args:
        initial_topic: The initial topic input by the user.
        llm_model: The LLM model to use.
        simulation_config: Simulation configuration parameters.
        pr_strategy: The PR strategy for the first round (optional).
    
    Returns:
        A dictionary containing the simulationId and websocketUrl.
    """
    sim_id = f"sim_scenario1_{uuid.uuid4()}"
    log_message(f"Starting Scenario 1 simulation: {sim_id}")
    log_message(f"Initial topic: {initial_topic}")
    if pr_strategy:
        log_message(f"First round PR strategy: {pr_strategy[:100]}...")
    
    
    # Create network and agents
    num_agents = simulation_config.get("agents", 10)
    # Pass sim_id as a prefix to ensure unique agent IDs for each simulation
    G, agents = create_social_network(
        num_agents, 
        sim_id_prefix=sim_id,
        llm_model=llm_model  # Pass the model name
    )
    
    # Store simulation state
    _simulations[sim_id] = {
        "simulationId": sim_id,
        "status": "initialized",
        "scenario": "scenario1",
        "initialTopic": initial_topic,
        "llmModel": llm_model,
        "simulationConfig": simulation_config,
        "network": G,
        "agents": agents,
        "discourseHistory": [("system", initial_topic, 0, None)],  # (author_id, content, round, stance_score)
        "activeAgents": list(agents.keys()),  
        "inactiveAgents": [], 
        "currentRound": 0,
        "prStrategies": []  # Store PR strategies for each round
    }
    
    log_message(f"Simulation {sim_id} initialized with {num_agents} agents")
    
    # If a PR strategy is provided, execute the first round of simulation directly
    if pr_strategy:
        log_message(f"Executing first round simulation with PR strategy...")
        try:
            # Add PR strategy to history
            _simulations[sim_id]["prStrategies"].append(pr_strategy)
            _simulations[sim_id]["discourseHistory"].append(("system", f"[Official PR Statement] {pr_strategy}", 1, None))
            
            # Execute the first round of simulation
            result = run_scenario1_round(sim_id)
            
            # Update status
            _simulations[sim_id]["status"] = "round_completed"
            _simulations[sim_id]["currentRound"] = 1
            
            log_message(f"First round simulation completed for {sim_id}")
            
            return {
                "simulationId": sim_id,
                "status": "round_completed",
                "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}",
                "result": result
            }
        except Exception as e:
            log_message(f"Error executing first round simulation: {str(e)}")
            # If the first round fails, still return the initialized state
            return {
                "simulationId": sim_id,
                "status": "initialized",
                "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}",
                "error": str(e)
            }
    
    return {
        "simulationId": sim_id,
        "status": "initialized",
        "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}"
    }

def add_pr_strategy_and_simulate(simulation_id: str, pr_strategy: str = "") -> Dict[str, Any]:
    """
    Adds a PR strategy for Scenario 1 and executes one round of simulation.
    Supports adding strategies multiple times in the 'round_completed' state for intervention.
    
    Args:
        simulation_id: The simulation ID.
        pr_strategy: The content of the PR strategy (optional, if empty, simulates without adding a new strategy).
    
    Returns:
        The result of the current simulation round.
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    if sim.get("scenario") != "scenario1":
        raise ValueError("This API is only for Scenario 1 simulations.")
    
    # Check status, allowing strategies to be added in 'initialized' and 'round_completed' states
    if sim["status"] == "completed":
        raise ValueError("Simulation has been stopped. Cannot add more strategies.")
    
    # Remind user if all agents have dropped out
    if not sim.get("activeAgents"):
        log_message(f"Warning: All agents have left the discussion in simulation {simulation_id}")
    
    next_round = sim["currentRound"] + 1
    
    # Only add PR strategy if it's not empty
    if pr_strategy and pr_strategy.strip():
        # Record the PR strategy
        sim["prStrategies"].append({
            "round": next_round,
            "strategy": pr_strategy
        })
        
        # Add the PR strategy as a system message to the discourse
        sim["discourseHistory"].append(("system", f"[PR Strategy]: {pr_strategy}", next_round, None))
        
        log_message(f"Added PR strategy for round {next_round}: {pr_strategy[:100]}...")
    else:
        log_message(f"No PR strategy provided for round {next_round}, agents will discuss naturally.")
    
    # Get the number of configured rounds, default to 1
    num_rounds = sim["simulationConfig"].get("num_rounds", 1)
    log_message(f"Will simulate {num_rounds} interaction round(s) after adding PR strategy")
    
    # Execute multiple simulation rounds
    result = None
    for i in range(num_rounds):
        log_message(f"Executing interaction round {i+1}/{num_rounds}")
        result = run_scenario1_round(simulation_id)
        
        # If all agents have dropped out, end early
        if sim["status"] == "all_agents_inactive":
            log_message(f"All agents inactive after round {i+1}, stopping early")
            break
    
    return result

def run_scenario1_round(simulation_id: str) -> Dict[str, Any]:
    """
    Executes one round of simulation for Scenario 1.
    
    Args:
        simulation_id: The simulation ID.
    
    Returns:
        The result of the current simulation round.
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    sim["currentRound"] += 1
    current_round = sim["currentRound"]
    sim["status"] = "running"
    
    log_message(f"\n=== Simulation {simulation_id} - Round {current_round} ===")
    
    G = sim["network"]
    agents = sim["agents"]

    active_agent_ids = set(sim["activeAgents"]) if isinstance(sim["activeAgents"], (set, list)) else set()
    inactive_agent_ids = set(sim["inactiveAgents"]) if isinstance(sim["inactiveAgents"], (set, list)) else set()
    discourse_history = sim["discourseHistory"]
    
    config = sim["simulationConfig"]
    participation_prob = config.get("interactionProbability", 0.8)
    rejoining_prob = 0.1  # Can be added to config
    
    # Check if any agents rejoin
    newly_active = {agent_id for agent_id in inactive_agent_ids if random.random() < rejoining_prob}
    if newly_active:
        active_agent_ids.update(newly_active)
        inactive_agent_ids -= newly_active
        for agent_id in newly_active:
            log_message(f"--- {agents[agent_id].persona['username']} ({agent_id}) rejoined! ---")
    
    if not active_agent_ids:
        log_message("All agents have left. Waiting for user intervention.")
        # Even if all agents have dropped out, allow the user to continue adding PR strategies to try to reactivate the discussion
        sim["status"] = "all_agents_inactive"
        return get_scenario1_result(simulation_id)
    
    # Get posts from the last round
    last_round_posts = [post for post in discourse_history if post[2] == current_round - 1]
    
    new_posts_this_round = []
    agents_to_make_inactive = set()
    action_order = list(active_agent_ids)
    random.shuffle(action_order)
    
    # Each agent makes a decision
    for agent_id in action_order:
        if random.random() > participation_prob:
            continue
        
        agent = agents[agent_id]
        agent_graph = agent.get_graph()
        
        # Determine visible messages
        if current_round == 1:
            # Round 1: Only the initial topic (system message)
            structured_messages = [{"type": "initial_topic", "content": post[1]} 
                                  for post in discourse_history if post[2] == 0]
        else:
            # Subsequent rounds: Get a structured list of messages
            structured_messages = get_personalized_feed(agent_id, agents, G, last_round_posts)
        
        if not structured_messages:
            log_message(f"--- {agent.persona['username']} ({agent_id}) saw no messages. ---")
            continue
        
        # Clearly distinguish between official statements and user comments
        formatted_messages = []
        for msg in structured_messages:
            if msg["type"] == "official_statement":
                # Official PR Statement
                formatted_messages.append(f"[Official PR Statement]: {msg['content']}")
            elif msg["type"] == "user_comment":
                # User Comment
                formatted_messages.append(f"{msg['author']}: {msg['content']}")
            elif msg["type"] == "initial_topic":
                # Initial Topic
                formatted_messages.append(f"[Initial Topic]: {msg['content']}")
        
        # Agent thinks and decides
        state = {"recent_messages": formatted_messages, "agent_persona": agent.persona}
        final_state = agent_graph.invoke(state)
        cognitive_result = final_state.get('response')
        
        if not cognitive_result:
            continue
        
        action = cognitive_result.final_action
        stance_score = cognitive_result.stance_score
        
        if action.action == "POST" and action.content:
            new_posts_this_round.append((agent_id, action.content, current_round, stance_score))
            log_message(f"--- {agent.persona['username']} posted with stance {stance_score} ---")
        
        elif action.action == "DROPOUT":
            agents_to_make_inactive.add(agent_id)
            log_message(f"--- {agent.persona['username']} ({agent_id}) dropped out. ---")
        
        time.sleep(0.5)  # Avoid requests being too fast
    
    # Update status
    if agents_to_make_inactive:
        active_agent_ids -= agents_to_make_inactive
        inactive_agent_ids.update(agents_to_make_inactive)
    
    # Save as list to ensure serializability and avoid errors in subsequent rounds
    sim["activeAgents"] = list(active_agent_ids)
    sim["inactiveAgents"] = list(inactive_agent_ids)
    
    if new_posts_this_round:
        discourse_history.extend(new_posts_this_round)
        log_message(f"--- Round {current_round} ended with {len(new_posts_this_round)} new posts ---")
        # After each round, set to "round_completed" and wait for the user to add a new strategy or stop
        sim["status"] = "round_completed"
    else:
        log_message(f"--- Round {current_round} ended with no new posts ---")
        # Even if there are no new posts, allow the user to continue intervening
        sim["status"] = "round_completed_no_activity"
    
    # Return the result of this round
    return get_scenario1_result(simulation_id)

def get_scenario1_result(simulation_id: str) -> Dict[str, Any]:
    """
    Gets the simulation result for Scenario 1 (supports querying by round).
    
    Returns:
        A result containing detailed agent information, stance scores, posts, etc.
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    current_round = sim["currentRound"]
    
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    # Tally sentiment distribution for this round
    round_posts = [post for post in discourse_history if post[2] == current_round and post[3] is not None]
    
    if round_posts:
        stance_scores = [post[3] for post in round_posts]
        positive_count = sum(1 for s in stance_scores if s > 0)
        negative_count = sum(1 for s in stance_scores if s < 0)
        neutral_count = sum(1 for s in stance_scores if s == 0)
        total = len(stance_scores)
        
        positive_sentiment = positive_count / total if total > 0 else 0
        negative_sentiment = negative_count / total if total > 0 else 0
        neutral_sentiment = neutral_count / total if total > 0 else 0
    else:
        positive_sentiment = 0
        negative_sentiment = 0
        neutral_sentiment = 0
    
    # Build detailed agent information
    agents_info = []
    for agent_id, agent in agents.items():
        # Tally posts for this agent
        agent_posts = [post for post in discourse_history if post[0] == agent_id]
        latest_stance = agent_posts[-1][3] if agent_posts and agent_posts[-1][3] is not None else 0
        
        agents_info.append({
            "agentId": agent_id,
            "username": agent.persona.get("username"),
            "description": agent.persona.get("description"),
            "influenceScore": agent.persona.get("influence_score"),
            "primaryPlatform": agent.persona.get("primary_platform"),
            "emotionalStyle": agent.persona.get("emotional_style"),
            "stanceScore": latest_stance,  # Current stance score
            "postsSent": len([p for p in agent_posts if p[2] > 0]),  # Number of posts sent
            "latestPost": agent_posts[-1][1] if agent_posts else None,  # Latest comment
            "isActive": agent_id in sim["activeAgents"]
        })
    
    # Build propagation path (simplified version, showing who posted what)
    propagation_paths = []
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system" or round_num != current_round:
            continue
        propagation_paths.append({
            "from": author_id,
            "content": content[:100],  # Truncate to first 100 characters
            "round": round_num,
            "stance": stance
        })
    
    return {
        "simulationId": simulation_id,
        "status": sim["status"],
        "round": current_round,
        "summary": {
            "totalAgents": len(agents),
            "activeAgents": len(sim["activeAgents"]),
            "totalPosts": len([p for p in discourse_history if p[0] != "system"]),
            "positiveSentiment": round(positive_sentiment, 2),
            "negativeSentiment": round(negative_sentiment, 2),
            "neutralSentiment": round(neutral_sentiment, 2)
        },
        "agents": agents_info,  # Detailed agent information
        "propagationPaths": propagation_paths  # Propagation paths
    }

def stop_scenario1_simulation(simulation_id: str) -> Dict[str, Any]:
    """
    Manually stops a Scenario 1 simulation.
    
    Args:
        simulation_id: The simulation ID.
    
    Returns:
        A confirmation message for stopping.
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    if sim.get("scenario") != "scenario1":
        raise ValueError("This API is only for Scenario 1 simulations.")
    
    sim["status"] = "stopped_by_user"
    log_message(f"Simulation {simulation_id} stopped by user.")
    
    return {
        "simulationId": simulation_id,
        "status": "stopped_by_user",
        "message": "Simulation has been stopped successfully."
    }

def generate_scenario1_report(simulation_id: str, report_type: str = "comprehensive") -> Dict[str, Any]:
    """
<<<<<<< HEAD
    生成 Scenario 1 的舆情分析报告（使用9维度评估）。
=======
    Generates a public opinion analysis report for Scenario 1 (using 9-dimensional evaluation).
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    
    Args:
        simulation_id: The simulation ID.
        report_type: The report type ("summary" or "comprehensive").
    
    Returns:
<<<<<<< HEAD
        包含报告内容和维度评分的字典
=======
        A dictionary containing the report content and dimension scores.
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    if sim.get("scenario") != "scenario1":
        raise ValueError("This API is only for Scenario 1 simulations.")
    
    log_message(f"Generating {report_type} report for Scenario 1 simulation {simulation_id}")
    
<<<<<<< HEAD
    # 准备模拟数据
    log_message("准备模拟数据...")
    sim_data = em.prepare_simulation_data(sim)
    
    # 执行9维度评估（场景一：只评估模拟本身）
    log_message("执行维度评估...")
    evaluation_result = em.comprehensive_evaluation(sim_data, real_case_data=None)
    
    # 生成文字报告（使用LLM）
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    log_message("生成文字报告...")
    formatted_history = ""
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system":
            formatted_history += f"\n[第{round_num}轮] 【官方公关声明】: {content}\n"
        else:
            username = agents[author_id].persona.get('username', author_id) if author_id in agents else "Unknown"
            formatted_history += f"[第{round_num}轮] {username} (立场: {stance}): {content}\n"
    
    llm = get_llm()
=======
    # Prepare simulation data
    log_message("Preparing simulation data...")
    sim_data = em.prepare_simulation_data(sim)
    
    # Perform 9-dimensional evaluation (Scenario 1: only evaluate the simulation itself)
    log_message("Performing dimensional evaluation...")
    evaluation_result = em.comprehensive_evaluation(sim_data, real_case_data=None)
    
    # Generate text report (using LLM)
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    log_message("Generating text report...")
    formatted_history = ""
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system":
            formatted_history += f"\n[Round {round_num}] [Official PR Statement]: {content}\n"
        else:
            username = agents[author_id].persona.get('username', author_id) if author_id in agents else "Unknown"
            formatted_history += f"[Round {round_num}] {username} (Stance: {stance}): {content}\n"
    
    llm = get_llm(model_name="gemini-2.5-pro")
    
    # Build evaluation result summary
    eval_summary = evaluation_result.get('summary', '')
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    
    # 构建评估结果摘要
    eval_summary = evaluation_result.get('summary', '')
    
    if report_type == "summary":
<<<<<<< HEAD
        prompt = f"""请为以下舆情模拟生成简要分析报告（200-300字）。

模拟对话记录：
{formatted_history[:1500]}

评估结果：
{eval_summary}
=======
        prompt = f"""Please generate a brief analysis report (200-300 words) for the following public opinion simulation.

Simulation Dialogue Log:
{formatted_history[:1500]}
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)

Evaluation Results:
{eval_summary}

Please briefly summarize:
1. Overall trend of public opinion
2. Effectiveness of the PR strategy
3. Attitudes of key opinion leaders

Please write the report in concise language."""
    else:  # comprehensive
<<<<<<< HEAD
        prompt = f"""请为以下舆情模拟生成详细的分析报告。

模拟对话记录：
{formatted_history[:3000]}

9维度评估结果：
{eval_summary}
=======
        prompt = f"""Please generate a detailed analysis report for the following public opinion simulation.

Simulation Dialogue Log:
{formatted_history[:3000]}
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)

9-Dimension Evaluation Results:
{eval_summary}

Please analyze the following in detail:

## 1. Public Opinion Evolution Analysis
- Initial state of public opinion
- Changes in public opinion after each round of PR strategy
- Overall trend of public opinion (changes in positive/negative/neutral sentiment)

## 2. PR Strategy Effectiveness Evaluation
- Specific effects of each PR strategy
- Which strategies were effective, which were not
- Was the timing of the strategies appropriate

## 3. Key Opinion Leader Analysis
- Identify the most influential users
- Their changes in attitude
- Their impact on public opinion

## 4. Public Opinion Differences Across Platforms
- Different reactions on platforms like Weibo/Twitter, WeChat Moments, TikTok, forums, etc.
- The impact of platform characteristics on the spread of public opinion

## 5. Suggestions for Improvement
- Based on this simulation, provide 3-5 specific suggestions for PR improvement

Please write the report in professional and objective language."""
    
    report_content = llm.invoke(prompt).content
    
    log_message("\n" + "="*80)
    log_message("=== SCENARIO 1 REPORT ===")
    log_message("="*80)
    log_message(report_content)
    log_message("="*80 + "\n")
    
    report_data = {
        "reportId": f"report_{simulation_id}_{int(time.time())}",
        "reportType": "scenario1",
        "content": report_content,
        "evaluation": evaluation_result,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    log_message(f"\n✅ Scenario 1 report generation completed!")
    log_message(f"Report ID: {report_data['reportId']}")
    
    return report_data

def generate_scenario2_report(simulation_id: str, report_type: str = "comprehensive") -> Dict[str, Any]:
    """
<<<<<<< HEAD
    生成 Scenario 2 的对比分析报告（模拟vs真实案例）。
    
    Args:
        simulation_id: 模拟ID
        report_type: 报告类型 ("summary" 或 "comprehensive")
    
    Returns:
        包含对比分析和相似度评分的字典
=======
    Generates a comparative analysis report for Scenario 2 (simulation vs. real case).
    
    Args:
        simulation_id: The simulation ID.
        report_type: The report type ("summary" or "comprehensive").
    
    Returns:
        A dictionary containing the comparative analysis and similarity score.
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
<<<<<<< HEAD
    # 场景二需要有关联的case
=======
    # Scenario 2 requires an associated case
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    case_id = sim.get("caseId")
    if not case_id:
        raise ValueError("This simulation is not associated with a historical case.")
    
    log_message(f"Generating {report_type} report for Scenario 2 simulation {simulation_id}")
    log_message(f"Associated case: {case_id}")
    
<<<<<<< HEAD
    # 获取真实案例数据
=======
    # Get real case data
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Case '{case_id}' not found.")
    
<<<<<<< HEAD
    # 准备数据
    log_message("准备模拟数据和真实案例数据...")
    sim_data = em.prepare_simulation_data(sim)
    real_case_data = em.prepare_real_case_context(case)
    
    # 执行9维度对比评估
    log_message("执行对比评估...")
    evaluation_result = em.comprehensive_evaluation(sim_data, real_case_data)
    
    # 生成对比报告
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    log_message("生成对比分析报告...")
    formatted_history = ""
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system":
            formatted_history += f"\n[第{round_num}轮] 【官方公关声明】: {content}\n"
        else:
            username = agents[author_id].persona.get('username', author_id) if author_id in agents else "Unknown"
            formatted_history += f"[第{round_num}轮] {username} (立场: {stance}): {content}\n"
    
    llm = get_llm()
    
    # 构建评估结果摘要
=======
    # Prepare data
    log_message("Preparing simulation data and real case data...")
    sim_data = em.prepare_simulation_data(sim)
    real_case_data = em.prepare_real_case_context(case)
    
    # Perform 9-dimensional comparative evaluation
    log_message("Performing comparative evaluation...")
    evaluation_result = em.comprehensive_evaluation(sim_data, real_case_data)
    
    # Generate comparative report
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    log_message("Generating comparative analysis report...")
    formatted_history = ""
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system":
            formatted_history += f"\n[Round {round_num}] [Official PR Statement]: {content}\n"
        else:
            username = agents[author_id].persona.get('username', author_id) if author_id in agents else "Unknown"
            formatted_history += f"[Round {round_num}] {username} (Stance: {stance}): {content}\n"
    
    llm = get_llm(model_name="gemini-2.5-pro")
    
    # Build evaluation result summary
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    eval_summary = evaluation_result.get('summary', '')
    overall_similarity = evaluation_result.get('overall_similarity_percentage', 0)
    
    if report_type == "summary":
<<<<<<< HEAD
        prompt = f"""请为以下模拟与真实案例的对比生成简要报告（200-300字）。

真实案例：{case['title']}
案例背景：{case['background'][:200]}...

模拟对话记录（部分）：
{formatted_history[:1000]}...

总体相似度：{overall_similarity}%

请简要总结：
1. 模拟与真实案例的主要相似之处
2. 模拟与真实案例的主要差异
3. 模拟的整体表现评价

请用简洁的语言撰写报告。"""
    else:  # comprehensive
        prompt = f"""请为以下模拟与真实案例生成详细的对比分析报告。

# 真实案例信息
案例：{case['title']}
行业：{case['industry']}
背景：{case['background']}

各轮策略：
{chr(10).join([f"第{s['round']}轮: {s['title']} - {s['content'][:100]}..." for s in case['strategies']])}

真实结果：
成功：{case['realWorldOutcome']['success']}
关键因素：{', '.join(case['realWorldOutcome']['keyFactors'])}

# 模拟数据
{formatted_history[:2000]}...

# 相似度评估
总体相似度：{overall_similarity}%

评估详情：
{eval_summary}

请详细分析以下内容：

## 1. 立场分布对比
- 模拟的立场分布
- 真实案例的立场描述
- 相似度分析

## 2. 演变趋势对比
- 模拟的舆论演变轨迹
- 真实案例的舆论走向
- 关键转折点是否匹配

## 3. 核心议题对比
- 模拟讨论的主要焦点
- 真实案例的核心矛盾
- 议题覆盖度分析

## 4. 情绪和论点对比
- 模拟的情绪表达特征
- 真实案例的舆论情绪
- 主流论点的匹配程度

## 5. 综合评价
- 模拟的优点（哪些方面高度还原）
- 模拟的不足（哪些方面需要改进）
- 对模拟系统的建议

请用专业、客观的语言撰写报告，突出对比分析。"""
=======
        prompt = f"""Please generate a brief report (200-300 words) comparing the following simulation with the real case.

Real Case: {case['title']}
Case Background: {case['background'][:200]}...

Simulation Dialogue Log (Partial):
{formatted_history[:1000]}...

Overall Similarity: {overall_similarity}%

Please briefly summarize:
1. Main similarities between the simulation and the real case
2. Main differences between the simulation and the real case
3. Overall evaluation of the simulation's performance

Please write the report in concise language."""
    else:  # comprehensive
        prompt = f"""Please generate a detailed comparative analysis report for the following simulation and real case.

# Real Case Information
Case: {case['title']}
Industry: {case['industry']}
Background: {case['background']}

Strategies per Round:
{chr(10).join([f"Round {s['round']}: {s['title']} - {s['content'][:100]}..." for s in case['strategies']])}

Real Outcome:
Success: {case['realWorldOutcome']['success']}
Key Factors: {', '.join(case['realWorldOutcome']['keyFactors'])}

# Simulation Data
{formatted_history[:2000]}...

# Similarity Assessment
Overall Similarity: {overall_similarity}%

Evaluation Details:
{eval_summary}

Please analyze the following in detail:

## 1. Stance Distribution Comparison
- Stance distribution in the simulation
- Description of stance in the real case
- Similarity analysis

## 2. Evolution Trend Comparison
- Trajectory of public opinion evolution in the simulation
- Public opinion trend in the real case
- Do the key turning points match?

## 3. Core Issue Comparison
- Main focus of discussion in the simulation
- Core conflict in the real case
- Analysis of issue coverage

## 4. Emotion and Argument Comparison
- Characteristics of emotional expression in the simulation
- Public opinion sentiment in the real case
- Degree of matching for mainstream arguments

## 5. Comprehensive Evaluation
- Strengths of the simulation (which aspects were highly replicated)
- Weaknesses of the simulation (which aspects need improvement)
- Suggestions for the simulation system

Please write the report in professional and objective language, emphasizing comparative analysis."""
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    
    report_content = llm.invoke(prompt).content
    
    log_message("\n" + "="*80)
    log_message("=== SCENARIO 2 COMPARATIVE REPORT ===")
    log_message("="*80)
    log_message(report_content)
    log_message("="*80 + "\n")
    
<<<<<<< HEAD
    # 提取总体相似度
=======
    # Extract overall similarity
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    overall_similarity = evaluation_result.get('overall_similarity_percentage', 0)
    
    report_data = {
        "reportId": f"report_{simulation_id}_{int(time.time())}",
        "reportType": "scenario2_comparative",
        "caseId": case_id,
        "caseTitle": case['title'],
        "content": report_content,
        "evaluation": evaluation_result,
        "overallSimilarityPercentage": overall_similarity,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    log_message(f"\n✅ Scenario 2 comparative report generation completed!")
    log_message(f"Report ID: {report_data['reportId']}")
    log_message(f"Overall Similarity: {overall_similarity}%")
    
    return report_data


def start_scenario2_simulation(case_id: str, llm_model: str, simulation_config: Dict) -> Dict[str, Any]:
    """
<<<<<<< HEAD
    启动一个新的Scenario 2模拟任务（使用agent模拟）。
=======
    Starts a new Scenario 2 simulation task (using agent simulation).
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    """
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Case ID '{case_id}' does not exist.")

    sim_id = f"sim_scenario2_{uuid.uuid4()}"
    log_message(f"Starting Scenario 2 simulation: {sim_id}, case: {case['title']}")
    
<<<<<<< HEAD
    # 创建网络和agents（与scenario1相同）
    num_agents = simulation_config.get("agents", 10)
    G, agents = create_social_network(num_agents, sim_id_prefix=sim_id)
    
    # 使用案例背景作为初始话题
    initial_topic = case.get("background", case.get("title"))
    
    # 获取第一轮的公关策略
=======
    # Create network and agents (same as scenario1)
    num_agents = simulation_config.get("agents", 10)
    G, agents = create_social_network(
        num_agents, 
        sim_id_prefix=sim_id,
        llm_model=llm_model # Pass the model name
    )
    
    # Use case background as the initial topic
    initial_topic = case.get("background", case.get("title"))
    
    # Get the PR strategy for the first round
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    first_round_strategy = ""
    if case.get("strategies"):
        for strategy in case["strategies"]:
            if strategy.get("round") == 1:
                first_round_strategy = strategy.get("content", "")
                break

<<<<<<< HEAD
    # 存储模拟状态（结构与scenario1类似）
=======
    # Store simulation state (similar structure to scenario1)
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    _simulations[sim_id] = {
        "simulationId": sim_id,
        "scenario": "scenario2",
        "caseId": case_id,
        "caseTitle": case.get("title"),
        "initialTopic": initial_topic,
        "llmModel": llm_model,
        "simulationConfig": simulation_config,
        "network": G,
        "agents": agents,
        "discourseHistory": [("system", f"[Initial Topic] {initial_topic}", 0, None)],
        "activeAgents": list(agents.keys()),
        "inactiveAgents": [],
        "status": "initialized",
        "totalRounds": case.get("totalRounds", 1),
        "currentRound": 0,
        "prStrategies": []
    }
    
<<<<<<< HEAD
    # 如果有第一轮策略，直接执行
=======
    # If there is a first-round strategy, execute it directly
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    if first_round_strategy:
        log_message(f"Executing first round with strategy from case...")
        try:
            _simulations[sim_id]["prStrategies"].append({
                "round": 1,
                "strategy": first_round_strategy
            })
            _simulations[sim_id]["discourseHistory"].append(
                ("system", f"[Official PR Statement] {first_round_strategy}", 1, None)
            )
            
<<<<<<< HEAD
            result = run_scenario1_round(sim_id)  # 复用scenario1的模拟逻辑
=======
            result = run_scenario1_round(sim_id)  # Reuse scenario1's simulation logic
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
            _simulations[sim_id]["status"] = "round_completed"
            _simulations[sim_id]["currentRound"] = 1
            
            return {
                "simulationId": sim_id,
                "caseId": case_id,
                "caseTitle": case.get("title"),
                "status": "round_completed",
                "totalRounds": case.get("totalRounds", 1),
                "currentRound": 1,
                "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}",
                "result": result
            }
        except Exception as e:
            log_message(f"Error executing first round: {str(e)}")
            return {
                "simulationId": sim_id,
                "caseId": case_id,
                "status": "initialized",
                "totalRounds": case.get("totalRounds", 1),
                "currentRound": 0,
                "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}",
                "error": str(e)
            }

    return {
        "simulationId": sim_id,
        "caseId": case_id,
        "caseTitle": case.get("title"),
        "status": "initialized",
        "totalRounds": case.get("totalRounds", 1),
        "currentRound": 0,
        "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}"
    }

def advance_to_next_round(simulation_id: str) -> Dict[str, Any]:
    """
<<<<<<< HEAD
    将Scenario 2模拟推进到下一轮（执行agent模拟）。
=======
    Advances the Scenario 2 simulation to the next round (executes agent simulation).
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]
    
    if sim["currentRound"] >= sim["totalRounds"]:
        raise ValueError("Simulation has already reached the final round and cannot continue.")
    
<<<<<<< HEAD
    # 获取下一轮的策略
=======
    # Get the strategy for the next round
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    next_round = sim["currentRound"] + 1
    case = cm.get_case_by_id(sim["caseId"])
    
    round_strategy = ""
    if case and 'strategies' in case:
        for strategy in case['strategies']:
            if strategy.get('round') == next_round:
                round_strategy = strategy.get('content', "")
                break
    
    if not round_strategy:
        log_message(f"Warning: No strategy found for round {next_round}")
    
<<<<<<< HEAD
    # 添加公关策略
=======
    # Add PR strategy
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    sim["prStrategies"].append({
        "round": next_round,
        "strategy": round_strategy
    })
    
    if round_strategy:
        sim["discourseHistory"].append(
            ("system", f"[Official PR Statement] {round_strategy}", next_round, None)
        )
    
    log_message(f"Simulation {simulation_id} advancing to round {next_round}...")
    
<<<<<<< HEAD
    # 执行模拟
=======
    # Execute simulation
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    try:
        num_rounds = sim["simulationConfig"].get("num_rounds", 1)
        log_message(f"Will simulate {num_rounds} interaction round(s)")
        
        result = None
        for i in range(num_rounds):
            log_message(f"Executing interaction round {i+1}/{num_rounds}")
<<<<<<< HEAD
            result = run_scenario1_round(simulation_id)  # 复用scenario1的逻辑
=======
            result = run_scenario1_round(simulation_id)  # Reuse scenario1's logic
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
            
            if sim["status"] == "all_agents_inactive":
                log_message(f"All agents inactive, stopping early")
                break
        
        return {
            "simulationId": simulation_id,
            "currentRound": sim["currentRound"],
            "status": sim["status"],
            "roundStrategy": round_strategy,
            "result": result
        }
    except Exception as e:
        log_message(f"Error advancing to next round: {str(e)}")
        raise

def get_scenario2_result(simulation_id: str) -> Dict[str, Any]:
    """
<<<<<<< HEAD
    获取Scenario 2当前轮次的模拟结果（使用真实agent模拟数据）。
=======
    Gets the current round's simulation result for Scenario 2 (using real agent simulation data).
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]
    
    # Check for caseId (use .get() to avoid KeyError)
    case_id = sim.get("caseId")
    if not case_id:
        raise ValueError(f"Simulation '{simulation_id}' is not a Scenario 2 simulation (missing caseId).")
    
    # Get case information
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Associated case '{case_id}' not found for simulation.")

<<<<<<< HEAD
    # 使用与scenario1相同的结果获取逻辑
    result = get_scenario1_result(simulation_id)
    
    # 添加scenario2特有的信息
=======
    # Use the same result retrieval logic as scenario1
    result = get_scenario1_result(simulation_id)
    
    # Add scenario2-specific information
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    result["caseId"] = sim["caseId"]
    result["caseTitle"] = case.get("title")
    result["totalRounds"] = sim["totalRounds"]
    
<<<<<<< HEAD
    # 检查是否是最后一轮
=======
    # Check if it's the last round
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    if sim["currentRound"] >= sim["totalRounds"]:
        sim["status"] = "completed"
        log_message(f"Simulation {simulation_id} has completed all rounds.")

    return result
