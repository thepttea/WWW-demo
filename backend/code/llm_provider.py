from langchain_openai import ChatOpenAI
import config
import os
from logger import log_message

def get_llm(model_name="gpt-4o-mini", temperature=0.7):
    """
    加载配置的LLM实例，支持自定义OpenAI兼容端点。
    """
    
    # 统一使用OpenAI客户端
    base_url = config.CUSTOM_API_BASE
    log_message(f"--- Loading model: {model_name} ---")
        
    return ChatOpenAI(
        model=model_name,
        temperature=temperature,
        base_url=base_url,  
        api_key=config.API_KEY,
    )
    
def get_llm_for_agent(agent_persona):
    """
    根据agent的人设配置返回合适的LLM实例。
    """
    model = agent_persona.get("llm_model")
    temperature = agent_persona.get("llm_temperature")
    
    return get_llm(model, temperature)