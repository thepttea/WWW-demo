import uuid
import random
from typing import Dict, Any

from logger import log_message
import case_manager as cm

# 使用字典在内存中存储正在进行的模拟
# 在生产环境中，应使用Redis或数据库
_simulations: Dict[str, Dict[str, Any]] = {}

def start_scenario2_simulation(case_id: str, llm_model: str, simulation_config: Dict) -> Dict[str, Any]:
    """
    启动一个新的Scenario 2模拟任务。
    """
    case = cm.get_case_by_id(case_id)
    if not case:
        raise ValueError(f"Case ID '{case_id}' does not exist.")

    sim_id = f"sim_scenario2_{uuid.uuid4()}"
    log_message(f"Starting Scenario 2 simulation: {sim_id}, case: {case['title']}")

    # 存储模拟状态
    _simulations[sim_id] = {
        "simulationId": sim_id,
        "caseId": case_id,
        "status": "started",
        "totalRounds": case.get("totalRounds", 1),
        "currentRound": 1,
        "llmModel": llm_model,
        "simulationConfig": simulation_config,
        "results": [] # 存储每轮的结果
    }

    return {
        "simulationId": sim_id,
        "caseId": case_id,
        "status": "started",
        "totalRounds": case.get("totalRounds", 1),
        "currentRound": 1,
        "websocketUrl": f"ws://localhost:8000/ws/simulation/{sim_id}"
    }

def advance_to_next_round(simulation_id: str) -> Dict[str, Any]:
    """
    将模拟推进到下一轮。
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]

    if sim["currentRound"] >= sim["totalRounds"]:
        raise ValueError("Simulation has already reached the final round and cannot continue.")

    sim["currentRound"] += 1
    sim["status"] = "running"
    
    log_message(f"Simulation {simulation_id} advancing to round {sim['currentRound']}.")

    case = cm.get_case_by_id(sim["caseId"])
    round_strategy = "No strategy found for this round."
    if case and 'strategies' in case:
        for strategy in case['strategies']:
            if strategy.get('round') == sim['currentRound']:
                round_strategy = strategy.get('content', round_strategy)
                break

    return {
        "simulationId": simulation_id,
        "currentRound": sim["currentRound"],
        "status": sim["status"],
        "roundStrategy": round_strategy
    }

def get_scenario2_result(simulation_id: str) -> Dict[str, Any]:
    """
    获取Scenario 2当前轮次的模拟结果（模拟）。
    """
    if simulation_id not in _simulations:
        raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")

    sim = _simulations[simulation_id]
    case = cm.get_case_by_id(sim["caseId"])
    if not case:
        raise ValueError(f"Associated case '{sim['caseId']}' not found for simulation.")

    # --- 这里是实际模拟逻辑的入口 ---
    # 目前，我们只生成一个模拟/伪造的结果用于API测试
    log_message(f"Generating mock result for simulation {simulation_id} (Round {sim['currentRound']}).")
    
    # 模拟情感值的微小随机变化
    simulated_sentiment = case["realWorldOutcome"]["metrics"]["sentimentImprovement"] / 100 + (random.random() - 0.5) * 0.1
    
    mock_result = {
        "round": sim["currentRound"],
        "summary": {
            "totalAgents": sim["simulationConfig"].get("agents", 100),
            "activeAgents": random.randint(85, 98),
            "totalPosts": random.randint(150, 300),
            "positiveSentiment": max(0, min(1, simulated_sentiment + random.uniform(-0.05, 0.05))),
            "negativeSentiment": max(0, min(1, 1 - (simulated_sentiment + random.uniform(-0.1, 0.1)))),
            "neutralSentiment": 0.1
        },
        "realWorldComparison": {
            "round": sim["currentRound"],
            "realWorldSentiment": case["realWorldOutcome"]["metrics"]["sentimentImprovement"] / 100.0,
            "simulationSentiment": simulated_sentiment,
            "accuracy": max(0, 1 - abs(case["realWorldOutcome"]["metrics"]["sentimentImprovement"] / 100.0 - simulated_sentiment))
        },
        # ... 其他API文档中定义的字段可以类似地模拟
    }

    # 检查是否是最后一轮
    if sim["currentRound"] >= sim["totalRounds"]:
        sim["status"] = "completed"
        log_message(f"Simulation {simulation_id} has completed.")

    return {
        "simulationId": simulation_id,
        "caseId": sim["caseId"],
        "status": sim["status"],
        **mock_result
    }
