import json
from pathlib import Path
from typing import List, Dict, Any
from logger import log_message

# 构建到 data 文件夹的路径
_data_path = Path(__file__).resolve().parent.parent / 'data' / 'historical_cases.json'

_cases: List[Dict[str, Any]] = []

def _load_cases_if_needed():
    """如果案例未加载，则从JSON文件加载它们。"""
    global _cases
    if not _cases:
        try:
            with open(_data_path, 'r', encoding='utf-8') as f:
                _cases = json.load(f)
            log_message(f"Successfully loaded {len(_cases)} historical cases from {_data_path}.")
        except FileNotFoundError:
            log_message(f"Error: Historical cases file not found at {_data_path}")
            _cases = []
        except json.JSONDecodeError:
            log_message(f"Error: Failed to parse historical cases file at {_data_path}")
            _cases = []

def get_all_cases() -> List[Dict[str, Any]]:
    """
    获取所有历史案例的摘要列表。
    """
    _load_cases_if_needed()
    # 根据API文档，列表视图只需要部分字段
    summary_list = [
        {
            "id": case.get("id"),
            "title": case.get("title"),
            "description": case.get("description"),
            "industry": case.get("industry"),
            "difficulty": case.get("difficulty"),
            "totalRounds": case.get("totalRounds")
        }
        for case in _cases
    ]
    return summary_list

def get_case_by_id(case_id: str) -> Dict[str, Any] | None:
    """
    通过ID获取单个案例的详细信息。
    """
    _load_cases_if_needed()
    for case in _cases:
        if case.get("id") == case_id:
            return case
    return None
