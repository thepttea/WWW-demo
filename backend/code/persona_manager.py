# persona_manager.py 

import csv
import os
from typing import List, Dict
from pathlib import Path
from logger import log_message

current_file = Path(__file__).resolve()
file_path = current_file.parent.parent / 'data' / 'personas.csv'

def load_personas_from_csv(csv_file_path: str = file_path) -> List[Dict]:
    """
    从CSV文件加载人设信息。
    
    Args:
        csv_file_path: CSV文件路径
        
    Returns:
        List[Dict]: 人设信息列表，格式与原来的PERSONA_LIBRARY兼容
    """
    personas = []
    
    if not os.path.exists(csv_file_path):
        raise FileNotFoundError(f"人设CSV文件未找到: {csv_file_path}")
    
    with open(csv_file_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for row in reader:
            # 转换数据类型
            persona_data = {
                "username": row["username"],
                "description": row["description"],
                "emotional_style": row["emotional_style"],
                "influence_score": int(row["influence_score"]),
                "primary_platform": row["primary_platform"],
                "llm_model": row["llm_model"],
                "llm_temperature": float(row["llm_temperature"])
            }
            
            personas.append({"data": persona_data})
    
    log_message(f"从 {csv_file_path} 成功加载 {len(personas)} 个人设") 
    return personas

    # 加载csv文件数据到PERSONA_LIBRARY
try:
    PERSONA_LIBRARY = load_personas_from_csv()
except FileNotFoundError as e:
    log_message(f"警告: {e}")  
    log_message("将使用默认的硬编码人设库")  
    
    # 备用硬编码数据（防止CSV文件不存在时程序崩溃）
    PERSONA_LIBRARY = [
        {"data": {
            "username": "Default_Agent", 
            "description": "默认人设", 
            "emotional_style": "中立型", 
            "influence_score": 50,
            "primary_platform": "Weibo/Twitter-like",
            "llm_model": "gpt-4o-mini",
            "llm_temperature": 0.7
        }}
    ]

def get_persona_library() -> List[Dict]:
    """
    获取人设库的公共接口函数。
    """
    return PERSONA_LIBRARY

def get_persona_by_username(username: str) -> Dict:
    """
    根据用户名获取特定人设。
    
    Args:
        username: 用户名
        
    Returns:
        Dict: 人设数据，如果未找到返回None
    """
    for persona in PERSONA_LIBRARY:
        if persona["data"]["username"] == username:
            return persona["data"]
    return None

def add_persona_to_csv(persona_data: Dict, csv_file_path: str = "personas.csv"):
    """
    向CSV文件添加新的人设。
    
    Args:
        persona_data: 人设数据字典
        csv_file_path: CSV文件路径
    """
    file_exists = os.path.exists(csv_file_path)
    
    with open(csv_file_path, 'a', encoding='utf-8', newline='') as file:
        fieldnames = ["username", "description", "emotional_style", "influence_score", 
                     "primary_platform", "llm_model", "llm_temperature"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow({
            "username": persona_data["username"],
            "description": persona_data["description"],
            "emotional_style": persona_data["emotional_style"],
            "influence_score": persona_data["influence_score"],
            "primary_platform": persona_data["primary_platform"],
            "llm_model": persona_data["llm_model"],
            "llm_temperature": persona_data["llm_temperature"]
        })
    
    log_message(f"已成功添加人设 '{persona_data['username']}' 到 {csv_file_path}")  

def list_personas():
    """列出所有人设"""
    for i, persona in enumerate(PERSONA_LIBRARY, 1):
        data = persona['data']
        log_message(f"{i}. {data['username']} - {data['description']} ({data['primary_platform']})")

