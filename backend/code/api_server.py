from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any
import uvicorn

import chat_manager
import case_manager
import simulation_manager
from logger import log_message

# 初始化FastAPI应用
app = FastAPI(
    title="EchoChamber Multi-Agent Simulation API",
    description="API for managing LLM chat sessions and multi-agent simulations.",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允许前端开发服务器的域名
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有请求头
)

# --- Pydantic Models for Request/Response Validation ---

class ChatMessageRequest(BaseModel):
    sessionId: str
    message: str

class SimulationConfigRequest(BaseModel):
    agents: int = 10
    num_rounds: int = 1 
    interactionProbability: float = 0.5
    positiveResponseProbability: float = 0.3
    negativeResponseProbability: float = 0.3
    neutralResponseProbability: float = 0.4
    initialPositiveSentiment: float = 0.2
    initialNegativeSentiment: float = 0.6
    initialNeutralSentiment: float = 0.2

class StartScenario2Request(BaseModel):
    caseId: str
    llmModel: str
    simulationConfig: SimulationConfigRequest

# Scenario 1 请求模型
class StartScenario1Request(BaseModel):
    initialTopic: str  # 用户输入的初始话题
    llmModel: str
    simulationConfig: SimulationConfigRequest
    prStrategy: str = ""  # 第一轮公关策略（可选）

class AddPRStrategyRequest(BaseModel):
    prStrategy: str = ""  # 公关策略内容（可选）

class GenerateReportRequest(BaseModel):
    simulationId: str
    reportType: str = "comprehensive"  # "summary" or "comprehensive"
    includeVisualizations: bool = False

class ApiResponse(BaseModel):
    success: bool
    data: Any | None = None
    error: dict | None = None

# --- API Endpoints for 1.1 LLM Strategy Refinement ---

@app.get("/api/scenario1/chat/init", response_model=ApiResponse, tags=["Scenario 1 - Chat"])
def init_chat_session():
    """
    1.1.1 初始化LLM对话会话
    """
    try:
        session_data = chat_manager.create_new_chat_session()
        return ApiResponse(success=True, data=session_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario1/chat/message", response_model=ApiResponse, tags=["Scenario 1 - Chat"])
def post_chat_message(request: ChatMessageRequest):
    """
    1.1.2 发送聊天消息
    """
    try:
        response_data = chat_manager.add_message_to_session(
            session_id=request.sessionId,
            user_message=request.message
        )
        return ApiResponse(success=True, data=response_data)
    except ValueError as e:
        error_payload = {"code": "SESSION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario1/chat/{session_id}/history", response_model=ApiResponse, tags=["Scenario 1 - Chat"])
def get_chat_history(session_id: str):
    """
    1.1.3 获取聊天历史
    """
    try:
        history_data = chat_manager.get_session_history(session_id)
        return ApiResponse(success=True, data=history_data)
    except ValueError as e:
        error_payload = {"code": "SESSION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- API Endpoints for 1.2 Scenario 1 Simulation ---

@app.post("/api/scenario1/simulation/start", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def start_scenario1_sim(request: StartScenario1Request):
    """
    1.2.1 启动Scenario 1模拟（支持用户输入初始话题和第一轮PR策略）
    """
    try:
        sim_data = simulation_manager.start_scenario1_simulation(
            initial_topic=request.initialTopic,  # 接收用户输入的话题
            llm_model=request.llmModel,
            simulation_config=request.simulationConfig.model_dump(),
            pr_strategy=request.prStrategy  # 接收第一轮PR策略
        )
        return ApiResponse(success=True, data=sim_data)
    except Exception as e:
        # 添加详细的错误日志
        import traceback
        print(f"❌ Error starting simulation: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario1/simulation/{simulation_id}/add-strategy", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def add_pr_strategy(simulation_id: str, request: AddPRStrategyRequest):
    """
    1.2.2 添加公关策略并执行一轮模拟
    支持在一个话题下多次输入公关方案进行模拟
    """
    try:
        result_data = simulation_manager.add_pr_strategy_and_simulate(
            simulation_id=simulation_id,
            pr_strategy=request.prStrategy
        )
        return ApiResponse(success=True, data=result_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_ERROR", "message": str(e)}
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        # 添加详细的错误日志
        import traceback
        print(f"❌ Error adding strategy: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario1/simulation/{simulation_id}/status", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def get_scenario1_status(simulation_id: str):
    """
    1.2.2 获取模拟状态
    """
    try:
        # 简单返回当前状态
        if simulation_id not in simulation_manager._simulations:
            raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
        
        sim = simulation_manager._simulations[simulation_id]
        status_data = {
            "simulationId": simulation_id,
            "status": sim["status"],
            "currentRound": sim.get("currentRound", 0),
            "activeAgents": len(sim.get("activeAgents", [])),
            "totalPosts": len([p for p in sim.get("discourseHistory", []) if p[0] != "system"])
        }
        return ApiResponse(success=True, data=status_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario1/simulation/{simulation_id}/result", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def get_scenario1_result(simulation_id: str):
    """
    1.2.3 获取模拟结果（包含详细的agent信息、立场评分、决策和评论）
    """
    try:
        result_data = simulation_manager.get_scenario1_result(simulation_id)
        return ApiResponse(success=True, data=result_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario1/simulation/{simulation_id}/network", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def get_scenario1_network(simulation_id: str):
    """
    1.3.1 获取网络拓扑数据
    """
    try:
        if simulation_id not in simulation_manager._simulations:
            raise ValueError(f"Simulation ID '{simulation_id}' does not exist.")
        
        sim = simulation_manager._simulations[simulation_id]
        G = sim["network"]
        agents = sim["agents"]
        
        # 构建节点数据
        nodes = []
        for agent_id, agent in agents.items():
            nodes.append({
                "id": agent_id,
                "username": agent.persona.get("username"),
                "platform": agent.persona.get("primary_platform"),
                "influenceScore": agent.persona.get("influence_score"),
                "sentiment": "neutral"  # 可以根据最新stance_score动态计算
            })
        
        # 构建边数据
        edges = []
        for source, target in G.edges():
            edge_data = G.get_edge_data(source, target)
            edges.append({
                "source": source,
                "target": target,
                "strength": 0.8,
                "type": edge_data.get("tie_strength", "following")
            })
        
        network_data = {
            "nodes": nodes,
            "edges": edges
        }
        
        return ApiResponse(success=True, data=network_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario1/simulation/{simulation_id}/stop", response_model=ApiResponse, tags=["Scenario 1 - Simulation"])
def stop_scenario1_sim(simulation_id: str):
    """
    手动停止 Scenario 1 模拟
    用户决定不再继续添加公关策略时调用
    """
    try:
        result = simulation_manager.stop_scenario1_simulation(simulation_id)
        return ApiResponse(success=True, data=result)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_ERROR", "message": str(e)}
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario1/reports/generate", response_model=ApiResponse, tags=["Scenario 1 - Reports"])
def generate_scenario1_report(request: GenerateReportRequest):
    """
    生成 Scenario 1 舆情分析报告
    """
    try:
        report_data = simulation_manager.generate_scenario1_report(
            simulation_id=request.simulationId,
            report_type=request.reportType
        )
        return ApiResponse(success=True, data=report_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        import traceback
        print(f"❌ Error generating report: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# --- 通用接口 ---

@app.post("/api/simulation/{simulation_id}/reset", response_model=ApiResponse, tags=["General"])
def reset_simulation(simulation_id: str):
    """
    重置模拟（通用接口）
    """
    try:
        # 这里可以添加重置逻辑，比如清理模拟数据等
        # 目前只是返回成功响应
        log_message(f"Simulation {simulation_id} reset requested")
        return ApiResponse(
            success=True, 
            data={
                "simulationId": simulation_id,
                "status": "reset",
                "message": "Simulation has been reset successfully"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- [NEW] API Endpoints for 2. Scenario 2 ---

@app.get("/api/scenario2/cases", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def get_historical_cases():
    """
    2.1.1 获取历史案例列表
    """
    try:
        cases = case_manager.get_all_cases()
        return ApiResponse(success=True, data=cases)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario2/cases/{case_id}", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def get_case_details(case_id: str):
    """
    2.1.2 获取案例详细信息
    """
    try:
        case = case_manager.get_case_by_id(case_id)
        if case:
            return ApiResponse(success=True, data=case)
        else:
            error_payload = {"code": "CASE_NOT_FOUND", "message": f"Case with ID '{case_id}' not found."}
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": error_payload}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario2/simulation/start", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def start_scenario2_sim(request: StartScenario2Request):
    """
    2.2.1 启动Scenario 2模拟
    """
    try:
        sim_data = simulation_manager.start_scenario2_simulation(
            case_id=request.caseId,
            llm_model=request.llmModel,
            simulation_config=request.simulationConfig.model_dump()  
        )
        return ApiResponse(success=True, data=sim_data)
    except ValueError as e:
        error_payload = {"code": "CASE_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario2/simulation/{simulation_id}/add-strategy", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def add_scenario2_strategy(simulation_id: str):
    """
    2.2.2 继续下一轮模拟（添加策略）
    """
    try:
        round_data = simulation_manager.advance_to_next_round(simulation_id)
        return ApiResponse(success=True, data=round_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_ERROR", "message": str(e)}
        return JSONResponse(
            status_code=400, # Bad Request, e.g., sim not found or already finished
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario2/simulation/{simulation_id}/status", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def get_scenario2_status(simulation_id: str):
    """
    2.2.2 获取Scenario 2模拟状态
    直接使用Scenario1的状态系统。
    """
    try:
        # 直接调用Scenario1的状态查询函数
        status_response = get_scenario1_status(simulation_id)
        
        # 添加案例ID信息
        if simulation_id in simulation_manager._simulations:
            case_id = simulation_manager._simulations[simulation_id].get("caseId", "")
            if status_response.success and status_response.data:
                status_response.data["caseId"] = case_id
        
        return status_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scenario2/simulation/{simulation_id}/result", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def get_scenario2_sim_result(simulation_id: str):
    """
    2.2.3 获取Scenario 2模拟结果
    直接使用Scenario1的结果系统。
    """
    try:
        # 直接调用Scenario1的结果获取函数
        result_response = get_scenario1_result(simulation_id)
        
        # 添加案例ID信息
        if simulation_id in simulation_manager._simulations:
            case_id = simulation_manager._simulations[simulation_id].get("caseId", "")
            if result_response.success and result_response.data:
                result_response.data["caseId"] = case_id
        
        return result_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scenario2/simulation/{simulation_id}/generate-report", response_model=ApiResponse, tags=["Scenario 2 - Reports"])
def generate_scenario2_report(simulation_id: str):
    """
    生成 Scenario 2 对比分析报告
    """
    try:
        report_data = simulation_manager.generate_scenario2_report(simulation_id)
        return ApiResponse(success=True, data=report_data)
    except ValueError as e:
        error_payload = {"code": "SIMULATION_NOT_FOUND", "message": str(e)}
        return JSONResponse(
            status_code=404,
            content={"success": False, "error": error_payload}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # 启动API服务器
    # 文档中要求端口为8000
    uvicorn.run(app, host="127.0.0.1", port=8000)
