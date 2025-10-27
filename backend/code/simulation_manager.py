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
    """根据不同平台的规则，为Agent计算本回合可见的帖子"""
    if not all_posts_last_round:
        return []

    feed = []
    
    for author_id, content, _, _ in all_posts_last_round: 
        if author_id == agent_id: 
            continue

        # 系统消息（官方公关声明）
        if author_id == "system":
            feed.append({
                "type": "official_statement",
                "content": content
            })
            continue

        # 用户评论需要根据平台规则判断可见性
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
    启动一个新的Scenario 1模拟任务。
    
    Args:
        initial_topic: 用户输入的初始话题
        llm_model: 使用的LLM模型
        simulation_config: 模拟配置参数
        pr_strategy: 第一轮公关策略（可选）
    
    Returns:
        包含simulationId和websocketUrl的字典
    """
    sim_id = f"sim_scenario1_{uuid.uuid4()}"
    log_message(f"Starting Scenario 1 simulation: {sim_id}")
    log_message(f"Initial topic: {initial_topic}")
    if pr_strategy:
        log_message(f"First round PR strategy: {pr_strategy[:100]}...")
    
    
    # 创建网络和agents
    num_agents = simulation_config.get("agents", 10)
    # 传入 sim_id 作为前缀，确保每个模拟的 agent ID 唯一
    G, agents = create_social_network(num_agents, sim_id_prefix=sim_id)
    
    # 存储模拟状态
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
        "prStrategies": []  # 存储每轮公关策略
    }
    
    log_message(f"Simulation {sim_id} initialized with {num_agents} agents")
    
    # 如果提供了PR strategy，直接执行第一轮模拟
    if pr_strategy:
        log_message(f"Executing first round simulation with PR strategy...")
        try:
            # 添加PR策略到历史记录
            _simulations[sim_id]["prStrategies"].append(pr_strategy)
            _simulations[sim_id]["discourseHistory"].append(("system", f"[Official PR Statement] {pr_strategy}", 1, None))
            
            # 执行第一轮模拟
            result = run_scenario1_round(sim_id)
            
            # 更新状态
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
            # 如果第一轮模拟失败，仍然返回初始化的状态
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
    为Scenario 1添加公关策略并执行一轮模拟。
    支持在 round_completed 状态下多次添加策略进行干预。
    
    Args:
        simulation_id: 模拟ID
        pr_strategy: 公关策略内容（可选，如果为空则不添加策略，直接模拟）
    
    Returns:
        本轮模拟结果
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    if sim.get("scenario") != "scenario1":
        raise ValueError("This API is only for Scenario 1 simulations.")
    
    # 检查状态，允许在 initialized 和 round_completed 状态下添加策略
    if sim["status"] == "completed":
        raise ValueError("Simulation has been stopped. Cannot add more strategies.")
    
    # 如果所有 agent 都退出了，提醒用户
    if not sim.get("activeAgents"):
        log_message(f"Warning: All agents have left the discussion in simulation {simulation_id}")
    
    next_round = sim["currentRound"] + 1
    
    # 只在策略非空时添加公关策略
    if pr_strategy and pr_strategy.strip():
        # 记录公关策略
        sim["prStrategies"].append({
            "round": next_round,
            "strategy": pr_strategy
        })
        
        # 将公关策略作为系统消息添加到discourse
        sim["discourseHistory"].append(("system", f"[PR Strategy]: {pr_strategy}", next_round, None))
        
        log_message(f"Added PR strategy for round {next_round}: {pr_strategy[:100]}...")
    else:
        log_message(f"No PR strategy provided for round {next_round}, agents will discuss naturally.")
    
    # 获取配置的回合数，默认为1
    num_rounds = sim["simulationConfig"].get("num_rounds", 1)
    log_message(f"Will simulate {num_rounds} interaction round(s) after adding PR strategy")
    
    # 执行多轮模拟
    result = None
    for i in range(num_rounds):
        log_message(f"Executing interaction round {i+1}/{num_rounds}")
        result = run_scenario1_round(simulation_id)
        
        # 如果所有 agent 都退出了，提前结束
        if sim["status"] == "all_agents_inactive":
            log_message(f"All agents inactive after round {i+1}, stopping early")
            break
    
    return result

def run_scenario1_round(simulation_id: str) -> Dict[str, Any]:
    """
    执行Scenario 1的一轮模拟。
    
    Args:
        simulation_id: 模拟ID
    
    Returns:
        本轮模拟结果
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
    rejoining_prob = 0.1  # 可以添加到config中
    
    # 检查是否有agent重新加入
    newly_active = {agent_id for agent_id in inactive_agent_ids if random.random() < rejoining_prob}
    if newly_active:
        active_agent_ids.update(newly_active)
        inactive_agent_ids -= newly_active
        for agent_id in newly_active:
            log_message(f"--- {agents[agent_id].persona['username']} ({agent_id}) rejoined! ---")
    
    if not active_agent_ids:
        log_message("All agents have left. Waiting for user intervention.")
        # 即使所有agent都退出，也允许用户继续添加公关策略尝试重新激活讨论
        sim["status"] = "all_agents_inactive"
        return get_scenario1_result(simulation_id)
    
    # 获取上一轮的帖子
    last_round_posts = [post for post in discourse_history if post[2] == current_round - 1]
    
    new_posts_this_round = []
    agents_to_make_inactive = set()
    action_order = list(active_agent_ids)
    random.shuffle(action_order)
    
    # 每个agent进行决策
    for agent_id in action_order:
        if random.random() > participation_prob:
            continue
        
        agent = agents[agent_id]
        agent_graph = agent.get_graph()
        
        # 确定可见消息
        if current_round == 1:
            # 第一轮：只有初始话题（系统消息）
            structured_messages = [{"type": "initial_topic", "content": post[1]} 
                                  for post in discourse_history if post[2] == 0]
        else:
            # 后续轮次：获取结构化的消息列表
            structured_messages = get_personalized_feed(agent_id, agents, G, last_round_posts)
        
        if not structured_messages:
            log_message(f"--- {agent.persona['username']} ({agent_id}) saw no messages. ---")
            continue
        
        # 明确区分官方声明和用户评论
        formatted_messages = []
        for msg in structured_messages:
            if msg["type"] == "official_statement":
                # 官方公关声明
                formatted_messages.append(f"[Official PR Statement]: {msg['content']}")
            elif msg["type"] == "user_comment":
                # 用户评论
                formatted_messages.append(f"{msg['author']}: {msg['content']}")
            elif msg["type"] == "initial_topic":
                # 初始话题
                formatted_messages.append(f"[Initial Topic]: {msg['content']}")
        
        # Agent思考和决策
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
        
        time.sleep(0.5)  # 避免请求过快
    
    # 更新状态
    if agents_to_make_inactive:
        active_agent_ids -= agents_to_make_inactive
        inactive_agent_ids.update(agents_to_make_inactive)
    
    # 保存为 list 以确保可序列化，避免后续轮次出错
    sim["activeAgents"] = list(active_agent_ids)
    sim["inactiveAgents"] = list(inactive_agent_ids)
    
    if new_posts_this_round:
        discourse_history.extend(new_posts_this_round)
        log_message(f"--- Round {current_round} ended with {len(new_posts_this_round)} new posts ---")
        # 每轮结束后设置为 "round_completed"，等待用户添加新策略或停止
        sim["status"] = "round_completed"
    else:
        log_message(f"--- Round {current_round} ended with no new posts ---")
        # 即使没有新帖子，也允许用户继续干预
        sim["status"] = "round_completed_no_activity"
    
    # 返回本轮结果
    return get_scenario1_result(simulation_id)

def get_scenario1_result(simulation_id: str) -> Dict[str, Any]:
    """
    获取Scenario 1的模拟结果（支持按轮次查询）。
    
    Returns:
        包含agents详细信息、立场评分、帖子等的结果
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    current_round = sim["currentRound"]
    
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    
    # 统计本轮情感分布
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
    
    # 构建详细的agent信息
    agents_info = []
    for agent_id, agent in agents.items():
        # 统计该agent的帖子
        agent_posts = [post for post in discourse_history if post[0] == agent_id]
        latest_stance = agent_posts[-1][3] if agent_posts and agent_posts[-1][3] is not None else 0
        
        agents_info.append({
            "agentId": agent_id,
            "username": agent.persona.get("username"),
            "description": agent.persona.get("description"),
            "influenceScore": agent.persona.get("influence_score"),
            "primaryPlatform": agent.persona.get("primary_platform"),
            "emotionalStyle": agent.persona.get("emotional_style"),
            "stanceScore": latest_stance,  # 当前立场评分
            "postsSent": len([p for p in agent_posts if p[2] > 0]),  # 发送的帖子数
            "latestPost": agent_posts[-1][1] if agent_posts else None,  # 最新评论
            "isActive": agent_id in sim["activeAgents"]
        })
    
    # 构建传播路径（简化版，显示谁发了什么）
    propagation_paths = []
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system" or round_num != current_round:
            continue
        propagation_paths.append({
            "from": author_id,
            "content": content[:100],  # 截取前100字符
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
        "agents": agents_info,  # 详细的agent信息
        "propagationPaths": propagation_paths  # 传播路径
    }

def stop_scenario1_simulation(simulation_id: str) -> Dict[str, Any]:
    """
    手动停止 Scenario 1 模拟。
    
    Args:
        simulation_id: 模拟ID
    
    Returns:
        停止确认信息
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
    生成 Scenario 1 的舆情分析报告（使用9维度评估）。
    
    Args:
        simulation_id: 模拟ID
        report_type: 报告类型 ("summary" 或 "comprehensive")
    
    Returns:
        包含报告内容和维度评分的字典
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    if sim.get("scenario") != "scenario1":
        raise ValueError("This API is only for Scenario 1 simulations.")
    
    log_message(f"Generating {report_type} report for Scenario 1 simulation {simulation_id}")
    
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
    
    # 构建评估结果摘要
    eval_summary = evaluation_result.get('summary', '')
    
    if report_type == "summary":
        prompt = f"""请为以下舆情模拟生成简要分析报告（200-300字）。

模拟对话记录：
{formatted_history[:1500]}

评估结果：
{eval_summary}

请简要总结：
1. 舆情整体走向
2. 公关策略的效果
3. 关键意见领袖的态度

请用简洁的语言撰写报告。"""
    else:  # comprehensive
        prompt = f"""请为以下舆情模拟生成详细的分析报告。

模拟对话记录：
{formatted_history[:3000]}

9维度评估结果：
{eval_summary}

请详细分析以下内容：

## 1. 舆情演变分析
- 初始舆情状态
- 各轮公关策略后的舆情变化
- 整体舆情走向（正面/负面/中立的变化趋势）

## 2. 公关策略效果评估
- 每个公关策略的具体效果
- 哪些策略有效，哪些无效
- 策略的时机是否合适

## 3. 关键意见领袖分析
- 识别影响力最大的用户
- 他们的态度变化
- 他们对舆情的影响

## 4. 不同平台的舆情差异
- 微博/Twitter、朋友圈、抖音、论坛等平台上的不同反应
- 平台特性对舆情传播的影响

## 5. 改进建议
- 针对本次模拟，提出3-5条具体的公关改进建议

请用专业、客观的语言撰写报告。"""
    
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
    生成 Scenario 2 的对比分析报告（模拟vs真实案例）。
    
    Args:
        simulation_id: 模拟ID
        report_type: 报告类型 ("summary" 或 "comprehensive")
    
    Returns:
        包含对比分析和相似度评分的字典
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
    
    sim = _simulations[simulation_id]
    
    # 场景二需要有关联的case
    case_id = sim.get("caseId")
    if not case_id:
        raise ValueError("This simulation is not associated with a historical case.")
    
    log_message(f"Generating {report_type} report for Scenario 2 simulation {simulation_id}")
    log_message(f"Associated case: {case_id}")
    
    # 获取真实案例数据
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Case '{case_id}' not found.")
    
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
    eval_summary = evaluation_result.get('summary', '')
    overall_similarity = evaluation_result.get('overall_similarity_percentage', 0)
    
    if report_type == "summary":
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
    
    report_content = llm.invoke(prompt).content
    
    log_message("\n" + "="*80)
    log_message("=== SCENARIO 2 COMPARATIVE REPORT ===")
    log_message("="*80)
    log_message(report_content)
    log_message("="*80 + "\n")
    
    # 提取总体相似度
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
    启动一个新的Scenario 2模拟任务（使用agent模拟）。
    """
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Case ID '{case_id}' does not exist.")

    sim_id = f"sim_scenario2_{uuid.uuid4()}"
    log_message(f"Starting Scenario 2 simulation: {sim_id}, case: {case['title']}")
    
    # 创建网络和agents（与scenario1相同）
    num_agents = simulation_config.get("agents", 10)
    G, agents = create_social_network(num_agents, sim_id_prefix=sim_id)
    
    # 使用案例背景作为初始话题
    initial_topic = case.get("background", case.get("title"))
    
    # 获取第一轮的公关策略
    first_round_strategy = ""
    if case.get("strategies"):
        for strategy in case["strategies"]:
            if strategy.get("round") == 1:
                first_round_strategy = strategy.get("content", "")
                break

    # 存储模拟状态（结构与scenario1类似）
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
    
    # 如果有第一轮策略，直接执行
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
            
            result = run_scenario1_round(sim_id)  # 复用scenario1的模拟逻辑
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
    将Scenario 2模拟推进到下一轮（执行agent模拟）。
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]
    
    if sim["currentRound"] >= sim["totalRounds"]:
        raise ValueError("Simulation has already reached the final round and cannot continue.")
    
    # 获取下一轮的策略
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
    
    # 添加公关策略
    sim["prStrategies"].append({
        "round": next_round,
        "strategy": round_strategy
    })
    
    if round_strategy:
        sim["discourseHistory"].append(
            ("system", f"[Official PR Statement] {round_strategy}", next_round, None)
        )
    
    log_message(f"Simulation {simulation_id} advancing to round {next_round}...")
    
    # 执行模拟
    try:
        num_rounds = sim["simulationConfig"].get("num_rounds", 1)
        log_message(f"Will simulate {num_rounds} interaction round(s)")
        
        result = None
        for i in range(num_rounds):
            log_message(f"Executing interaction round {i+1}/{num_rounds}")
            result = run_scenario1_round(simulation_id)  # 复用scenario1的逻辑
            
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
    获取Scenario 2当前轮次的模拟结果（使用真实agent模拟数据）。
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]
    
    # 检查是否有 caseId（使用 .get() 方法避免 KeyError）
    case_id = sim.get("caseId")
    if not case_id:
        raise ValueError(f"Simulation '{simulation_id}' is not a Scenario 2 simulation (missing caseId).")
    
    # 获取案例信息
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Associated case '{case_id}' not found for simulation.")

    # 使用与scenario1相同的结果获取逻辑
    result = get_scenario1_result(simulation_id)
    
    # 添加scenario2特有的信息
    result["caseId"] = sim["caseId"]
    result["caseTitle"] = case.get("title")
    result["totalRounds"] = sim["totalRounds"]
    
    # 检查是否是最后一轮
    if sim["currentRound"] >= sim["totalRounds"]:
        sim["status"] = "completed"
        log_message(f"Simulation {simulation_id} has completed all rounds.")

    return result
