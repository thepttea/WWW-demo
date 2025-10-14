import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from llm_provider import get_llm
from logger import log_message

# 使用一个简单的字典来模拟数据库存储会话
# key: sessionId, value: session_data
# 在生产环境中，这里应该替换为Redis或数据库
_chat_sessions: Dict[str, Dict[str, Any]] = {}

# System Prompt for the PR assistant
SYSTEM_PROMPT = """You are a world-class public relations strategy expert. Your mission is to help users analyze public relations incidents and develop professional, effective, and forward-looking PR strategies.
Please communicate with users in a guiding and advisory tone. At the beginning of the conversation, please greet the user and guide them to describe the current PR problem they are facing."""

def create_new_chat_session() -> Dict[str, Any]:
    """
    创建一个新的聊天会话。
    """
    session_id = f"chat_session_{uuid.uuid4()}"
    log_message(f"Creating a new chat session: {session_id}")
    
    # 1. 获取LLM实例
    llm = get_llm()
    
    # 2. 创建初始消息列表，包含System Prompt
    message_history = [SystemMessage(content=SYSTEM_PROMPT)]
    
    # 3. 调用LLM获取第一条欢迎语
    initial_response = llm.invoke(message_history)
    welcome_content = initial_response.content
    log_message(f"LLM response received: {welcome_content[:50]}...")
    
    # 4. 将AI的第一条消息也加入历史记录
    welcome_message = {
        "id": f"msg_{uuid.uuid4()}",
        "type": "llm",
        "content": welcome_content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    message_history.append(AIMessage(content=welcome_content))
    
    # 5. 在内存中存储会话
    _chat_sessions[session_id] = {
        "created_at": datetime.now(timezone.utc),
        "message_history_langchain": message_history, # 用于和LLM交互
        "message_history_api": [welcome_message] # 用于API返回
    }
    
    log_message(f"Session {session_id} created successfully.")
    
    return {
        "sessionId": session_id,
        "content": welcome_message["content"],
        "timestamp": welcome_message["timestamp"]
    }

def add_message_to_session(session_id: str, user_message: str) -> Dict[str, Any]:
    """
    向现有会话中添加用户消息，并获取LLM的回复。
    """
    if session_id not in _chat_sessions:
        raise ValueError("Session ID does not exist")
        
    log_message(f"Session {session_id} received new message: '{user_message[:50]}...'")
    session = _chat_sessions[session_id]
    
    # 1. 将用户消息添加到历史记录
    session["message_history_langchain"].append(HumanMessage(content=user_message))
    session["message_history_api"].append({
        "id": f"msg_{uuid.uuid4()}",
        "type": "user",
        "content": user_message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # 2. 调用LLM获取回复
    llm = get_llm()
    ai_response = llm.invoke(session["message_history_langchain"])
    response_content = ai_response.content
    log_message(f"LLM response received: {response_content[:50]}...")
    
    # 3. 将LLM的回复添加到历史记录
    response_message = {
        "id": f"msg_{uuid.uuid4()}",
        "type": "llm",
        "content": response_content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    session["message_history_langchain"].append(AIMessage(content=response_content))
    session["message_history_api"].append(response_message)
    
    log_message(f"Session {session_id} LLM response: '{response_message['content'][:50]}...'")
    
    return response_message

def get_session_history(session_id: str) -> Dict[str, Any]:
    """
    获取指定会话的聊天历史。
    """
    if session_id not in _chat_sessions:
        raise ValueError("Session ID does not exist")
    
    log_message(f"Fetching history for session {session_id}.")
    session = _chat_sessions[session_id]
    
    return {
        "sessionId": session_id,
        "messages": session["message_history_api"]
    }
