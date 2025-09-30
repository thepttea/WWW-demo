from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any
import uvicorn

import chat_manager
import case_manager
import simulation_manager

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
    agents: int = 100
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
            simulation_config=request.simulationConfig.dict()
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

@app.post("/api/scenario2/simulation/{simulation_id}/next-round", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def next_round_scenario2_sim(simulation_id: str):
    """
    2.2.2 继续下一轮模拟
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

@app.get("/api/scenario2/simulation/{simulation_id}/result", response_model=ApiResponse, tags=["Scenario 2 - Cases & Simulation"])
def get_scenario2_sim_result(simulation_id: str):
    """
    2.2.3 获取Scenario 2模拟结果
    """
    try:
        result_data = simulation_manager.get_scenario2_result(simulation_id)
        return ApiResponse(success=True, data=result_data)
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
