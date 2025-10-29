import json
from pathlib import Path
from typing import List, Dict, Any
from logger import log_message

# Build the path to the data folder
_data_path = Path(__file__).resolve().parent.parent / 'data' / 'historical_cases.json'

_cases: List[Dict[str, Any]] = []

def _load_cases_if_needed():
    """If cases are not loaded, load them from the JSON file."""
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
    Gets a summary list of all historical cases.
    """
    _load_cases_if_needed()
<<<<<<< HEAD
    # 根据API文档，列表视图只需要部分字段
    # 适配新的数据结构：event_id, event_name, event_summary等
    summary_list = [
        {
            "id": case.get("event_id", case.get("id")),  # 兼容新旧字段
            "title": case.get("event_name", case.get("title")),  # 兼容新旧字段
            "description": case.get("event_summary", case.get("description")),  # 兼容新旧字段
            "company": case.get("company", ""),  # 新字段
            "date": case.get("date", ""),  # 新字段
            "crisis_type": case.get("crisis_type", case.get("industry", "")),  # 新字段，回退到industry
            "core_conflict": case.get("core_conflict", ""),  # 新字段
            # 旧字段保留以兼容
            "industry": case.get("industry", case.get("crisis_type", "")),
            "difficulty": case.get("difficulty", ""),
            "totalRounds": case.get("totalRounds", len(case.get("nodes", case.get("strategies", []))))  # 从nodes数量推断
=======
    # According to the API documentation, the list view only needs partial fields
    # Adapt to the new data structure: event_id, event_name, event_summary, etc.
    summary_list = [
        {
            "id": case.get("event_id", case.get("id")),  # Compatible with old and new fields
            "title": case.get("event_name", case.get("title")),  # Compatible with old and new fields
            "description": case.get("event_summary", case.get("description")),  # Compatible with old and new fields
            "company": case.get("company", ""),  # New field
            "date": case.get("date", ""),  # New field
            "crisis_type": case.get("crisis_type", case.get("industry", "")),  # New field, falls back to industry
            "core_conflict": case.get("core_conflict", ""),  # New field
            # Old fields retained for compatibility
            "industry": case.get("industry", case.get("crisis_type", "")),
            "difficulty": case.get("difficulty", ""),
            "totalRounds": case.get("totalRounds", len(case.get("nodes", case.get("strategies", []))))  # Inferred from the number of nodes
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
        }
        for case in _cases
    ]
    return summary_list

def _normalize_case_data(case: Dict[str, Any]) -> Dict[str, Any]:
    """
<<<<<<< HEAD
    规范化案例数据，统一新旧数据结构。
    将旧字段名转换为新字段名，同时保留兼容性。
    """
    normalized = case.copy()
    
    # 规范化基本字段
=======
    Normalizes case data to unify old and new data structures.
    Converts old field names to new field names while maintaining compatibility.
    """
    normalized = case.copy()
    
    # Normalize basic fields
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    normalized["id"] = case.get("event_id", case.get("id"))
    normalized["event_id"] = case.get("event_id", case.get("id"))
    normalized["title"] = case.get("event_name", case.get("title"))
    normalized["event_name"] = case.get("event_name", case.get("title"))
    normalized["description"] = case.get("event_summary", case.get("description", ""))
    normalized["event_summary"] = case.get("event_summary", case.get("description", ""))
    normalized["background"] = case.get("event_summary", case.get("background", ""))
    
<<<<<<< HEAD
    # 新字段
=======
    # New fields
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    normalized["company"] = case.get("company", "")
    normalized["date"] = case.get("date", "")
    normalized["crisis_type"] = case.get("crisis_type", case.get("industry", ""))
    normalized["core_conflict"] = case.get("core_conflict", "")
    
<<<<<<< HEAD
    # 保留旧字段以兼容
    normalized["industry"] = case.get("industry", case.get("crisis_type", ""))
    normalized["difficulty"] = case.get("difficulty", "medium")
    
    # 规范化策略/节点数据
    if "nodes" in case:
        # 新数据结构：将nodes转换为strategies格式
=======
    # Retain old fields for compatibility
    normalized["industry"] = case.get("industry", case.get("crisis_type", ""))
    normalized["difficulty"] = case.get("difficulty", "medium")
    
    # Normalize strategy/node data
    if "nodes" in case:
        # New data structure: convert nodes to strategies format
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
        normalized["strategies"] = [
            {
                "round": node.get("node_id", idx + 1),
                "title": node.get("strategy", ""),
                "content": node.get("content", ""),
                "timeline": node.get("timestamp", ""),
<<<<<<< HEAD
                # 保留新字段
=======
                # Retain new fields
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
                "node_id": node.get("node_id", idx + 1),
                "timestamp": node.get("timestamp", ""),
                "protagonist": node.get("protagonist", ""),
                "strategy": node.get("strategy", ""),
                "situation": node.get("situation", {})
            }
            for idx, node in enumerate(case.get("nodes", []))
        ]
        normalized["nodes"] = case["nodes"]
        normalized["totalRounds"] = len(case.get("nodes", []))
    elif "strategies" in case:
<<<<<<< HEAD
        # 旧数据结构：保持不变
        normalized["strategies"] = case["strategies"]
        normalized["totalRounds"] = case.get("totalRounds", len(case.get("strategies", [])))
        # 将strategies转换为nodes格式
=======
        # Old data structure: remains unchanged
        normalized["strategies"] = case["strategies"]
        normalized["totalRounds"] = case.get("totalRounds", len(case.get("strategies", [])))
        # Convert strategies to nodes format
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
        normalized["nodes"] = [
            {
                "node_id": s.get("round", idx + 1),
                "timestamp": s.get("timeline", ""),
                "protagonist": normalized.get("company", ""),
                "strategy": s.get("title", ""),
                "content": s.get("content", ""),
                "situation": {}
            }
            for idx, s in enumerate(case.get("strategies", []))
        ]
    else:
        normalized["strategies"] = []
        normalized["nodes"] = []
        normalized["totalRounds"] = 0
    
<<<<<<< HEAD
    # 真实结果（新数据可能没有这个字段）
=======
    # Real-world outcome (new data might not have this field)
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
    normalized["realWorldOutcome"] = case.get("realWorldOutcome", {
        "success": None,
        "metrics": {},
        "keyFactors": []
    })
    
    return normalized

def get_case_by_id(case_id: str) -> Dict[str, Any] | None:
    """
<<<<<<< HEAD
    通过ID获取单个案例的详细信息。
    返回规范化的数据结构，兼容新旧格式。
    """
    _load_cases_if_needed()
    for case in _cases:
        # 兼容新旧ID字段
=======
    Gets the details of a single case by its ID.
    Returns a normalized data structure compatible with both old and new formats.
    """
    _load_cases_if_needed()
    for case in _cases:
        # Compatible with old and new ID fields
>>>>>>> 0e422721 (1. Resolved the LLM configuration issue; 2. Translated all Chinese text in frontend and backend code to English; 3. Increased character designs from 10 to 100.)
        if case.get("id") == case_id or case.get("event_id") == case_id:
            return _normalize_case_data(case)
    return None
