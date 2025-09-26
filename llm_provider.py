# llm_provider.py

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_deepseek import ChatDeepSeek
from config import LLM_PROVIDER, MODEL_NAME

def get_llm():
    """
    根据配置文件加载并返回相应的LLM实例。
    """
    # 接口这里可能需要根据群里那个文档修改一下
    provider = LLM_PROVIDER.upper()
    
    if provider == "GOOGLE":
        print(f"--- 加载模型: Google ({MODEL_NAME}) ---")
        return ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.7, convert_system_message_to_human=True)
    
    elif provider == "OPENAI":
        print(f"--- 加载模型: OpenAI ({MODEL_NAME}) ---")
        return ChatOpenAI(model=MODEL_NAME, temperature=0.7)
        
    elif provider == "ANTHROPIC":
        print(f"--- 加载模型: Anthropic ({MODEL_NAME}) ---")
        return ChatAnthropic(model=MODEL_NAME, temperature=0.7)
        
    elif provider == "DEEPSEEK":
        print(f"--- 加载模型: DeepSeek ({MODEL_NAME}) ---")
        return ChatDeepSeek(model=MODEL_NAME, temperature=0.7)
        
    else:
        raise ValueError(f"未知的LLM提供商: {LLM_PROVIDER}. 请检查 config.py 文件。")
