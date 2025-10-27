# evaluation_metrics.py
# 舆论趋势评估模块 - 提供9个维度的LLM驱动评估功能
# 所有评分都通过LLM生成，返回百分比、总结和理由

import json
from typing import Dict, Any, List, Tuple
from collections import Counter
from llm_provider import get_llm
from logger import log_message


# ============================================================================
# 数据准备函数
# ============================================================================

def prepare_simulation_data(sim: Dict[str, Any]) -> Dict[str, Any]:
    """
    从模拟数据中提取关键信息供评估使用
    
    Args:
        sim: 模拟对象（来自_simulations）
    
    Returns:
        结构化的模拟数据摘要
    """
    agents = sim["agents"]
    discourse_history = sim["discourseHistory"]
    current_round = sim["currentRound"]
    
    # 1. 统计立场分布（按轮次）
    stance_by_round = {}
    for round_num in range(1, current_round + 1):
        round_posts = [post for post in discourse_history 
                      if post[2] == round_num and post[3] is not None]
        if round_posts:
            stance_scores = [post[3] for post in round_posts]
            stance_by_round[round_num] = {
                "average": sum(stance_scores) / len(stance_scores),
                "positive_count": sum(1 for s in stance_scores if s > 0),
                "negative_count": sum(1 for s in stance_scores if s < 0),
                "neutral_count": sum(1 for s in stance_scores if s == 0),
                "total": len(stance_scores),
                "extreme_positive": sum(1 for s in stance_scores if s >= 2),
                "extreme_negative": sum(1 for s in stance_scores if s <= -2)
            }
    
    # 2. 提取代表性帖子（按立场分类）
    representative_posts = _extract_representative_posts(discourse_history, agents, limit=30)
    
    # 3. 构建完整对话历史文本
    formatted_history = _format_discourse_history(discourse_history, agents)
    
    # 4. 统计公关策略信息
    pr_strategies = []
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system" and round_num > 0:
            pr_strategies.append({
                "round": round_num,
                "content": content
            })
    
    # 计算整体趋势指标
    if len(stance_by_round) >= 2:
        first_round_avg = stance_by_round[min(stance_by_round.keys())]["average"]
        last_round_avg = stance_by_round[current_round]["average"]
        overall_trend = "好转" if last_round_avg > first_round_avg else ("恶化" if last_round_avg < first_round_avg else "稳定")
        trend_magnitude = abs(last_round_avg - first_round_avg)
    else:
        overall_trend = "数据不足"
        trend_magnitude = 0
    
    # 统计参与度信息
    total_user_posts = len([p for p in discourse_history if p[0] != "system"])
    posts_per_round = total_user_posts / current_round if current_round > 0 else 0
    
    return {
        "simulation_id": sim["simulationId"],
        "scenario": sim.get("scenario", "unknown"),
        "total_rounds": current_round,
        "initial_topic": sim.get("initialTopic", ""),
        "stance_by_round": stance_by_round,
        "representative_posts": representative_posts,
        "pr_strategies": pr_strategies,
        "formatted_history": formatted_history,
        "total_agents": len(agents),
        "total_posts": total_user_posts,
        "posts_per_round": round(posts_per_round, 1),
        "overall_trend": overall_trend,
        "trend_magnitude": round(trend_magnitude, 2)
    }


def prepare_real_case_context(case: Dict[str, Any]) -> Dict[str, Any]:
    """
    从真实案例中提取关键描述信息
    
    Args:
        case: 案例对象（来自historical_cases.json，已经过case_manager规范化处理）
    
    Returns:
        结构化的真实案例摘要
    """
    # case_manager已经规范化了数据，可以直接使用标准字段
    strategies = [
        {
            "round": s.get("round", s.get("node_id", 0)),
            "title": s.get("title", s.get("strategy", "")),
            "content": s.get("content", ""),
            "timeline": s.get("timeline", s.get("timestamp", ""))
        }
        for s in case.get("strategies", [])
    ]
    
    # 提取真实案例中的舆情描述信息（如果有）
    # 从nodes中提取situation信息
    situation_summaries = []
    if "nodes" in case:
        for node in case["nodes"]:
            if "situation" in node:
                sit = node["situation"]
                round_num = node.get("node_id", 0)
                situation_summaries.append({
                    "round": round_num,
                    "overall_stance": sit.get("overall_stance", ""),
                    "evolution_direction": sit.get("evolution_direction", ""),
                    "polarization_level": sit.get("polarization_level", ""),
                    "core_dispute": sit.get("core_dispute", ""),
                    "main_arguments": sit.get("main_arguments", ""),
                    "emotional_tone": sit.get("emotional_tone", ""),
                    "secondary_topic_diffusion": sit.get("secondary_topic_diffusion", "")
                })
    
    return {
        "case_id": case.get("id", case.get("event_id", "")),
        "title": case.get("title", case.get("event_name", "")),
        "background": case.get("background", case.get("event_summary", "")),
        "industry": case.get("industry", case.get("crisis_type", "")),
        "company": case.get("company", ""),
        "date": case.get("date", ""),
        "crisis_type": case.get("crisis_type", ""),
        "core_conflict": case.get("core_conflict", ""),
        "total_rounds": case.get("totalRounds", len(strategies)),
        "strategies": strategies,
        "outcome": case["realWorldOutcome"],
        "key_factors": case["realWorldOutcome"].get("keyFactors", []),
        "situation_summaries": situation_summaries  # 新增：每轮的舆情描述
    }


# ============================================================================
# 辅助函数
# ============================================================================

def _get_similarity_context_note() -> str:
    """获取相似度评估的上下文说明（通用）"""
    return """【重要评估说明】
- 模拟只执行了真实案例的部分轮次，是真实事件的初期还原
- 评估应聚焦于"已执行阶段"的相似度，而非整体完整性
- 如果模拟在相应阶段表现出与真实案例类似的特征，应给予高相似度
- 不应因"模拟不够全面"而降低分数，重点是"方向"和"趋势"的一致性"""

def _get_similarity_evaluation_criteria(dimension_name: str) -> str:
    """获取相似度评估的详细标准"""
    criteria = {
        "立场倾向": """
【评分标准】
90-100%: 立场倾向完全一致（都是支持/反对/中立），强度接近（差距<15%）
75-89%: 立场倾向一致，强度有一定差异（差距15-30%）
60-74%: 立场倾向基本一致，但强度差异较大（差距30-45%）
40-59%: 立场倾向部分一致，或方向相同但强度差异很大
20-39%: 立场倾向不一致，出现方向性差异
0-19%: 立场倾向完全相反

【关注重点】
- 主要看立场"方向"（支持/反对/中立）是否一致
- 其次看立场"强度"的接近程度
- 模拟只需在对应轮次表现相似特征即可
        """,
        
        "演变方向": """
【评分标准】
90-100%: 演变方向完全一致（都在好转/恶化/稳定），趋势斜率相似
75-89%: 演变方向一致，但趋势强度有差异
60-74%: 演变方向基本一致，存在局部波动差异
40-59%: 演变方向部分一致，或有相似的转折点
20-39%: 演变方向不太一致，出现明显差异
0-19%: 演变方向完全相反

【关注重点】
- 主要看整体走向（好转/恶化/稳定）是否一致
- 其次看关键转折点是否出现在类似时机
- 允许局部波动差异，关注大趋势
        """,
        
        "分化程度": """
【评分标准】
90-100%: 分化程度非常接近（都高度分化/中度分化/基本一致）
75-89%: 分化程度相似，但具体数值有差异
60-74%: 分化程度基本在同一级别，但特征不完全相同
40-59%: 分化程度有一定差异，但不是完全相反
20-39%: 分化程度差异较大
0-19%: 分化程度完全相反（一个高度分化，一个完全一致）

【关注重点】
- 主要看分化"级别"（高/中/低）是否一致
- 其次看极端观点的分布特征
- 允许具体比例的合理差异
        """,
        
        "转折点时机": """
【评分标准】
90-100%: 转折点出现在相同轮次，且方向和强度都相似
75-89%: 转折点出现时机接近（相差1轮内），方向一致
60-74%: 转折点存在，方向一致，但时机有一定差异
40-59%: 部分转折点相似，或转折特征部分匹配
20-39%: 转折点时机或特征差异较大
0-19%: 完全没有相似的转折点

【关注重点】
- 主要看是否在相似的轮次出现转折
- 其次看转折的方向（好转/恶化）是否一致
- 如果模拟轮次少，只需对比已执行轮次的转折点
        """,
        
        "核心焦点": """
【评分标准】
90-100%: 讨论焦点高度一致，核心议题完全重合
75-89%: 讨论焦点相似，主要议题重合度高
60-74%: 讨论焦点基本一致，存在部分次要议题差异
40-59%: 核心议题部分重合，但也有明显差异
20-39%: 讨论焦点差异较大，重合度低
0-19%: 讨论焦点完全不同

【关注重点】
- 主要看核心争议点是否相同
- 其次看讨论的主要议题覆盖度
- 允许次要议题的差异
        """,
        
        "主流论点": """
【评分标准】
90-100%: 主流论点高度一致，支持/反对的核心观点都相似
75-89%: 主流论点相似，大部分关键论点都能对应
60-74%: 主流论点基本一致，存在部分论点差异
40-59%: 部分主流论点相似，但也有明显不同
20-39%: 主流论点差异较大
0-19%: 主流论点完全不同

【关注重点】
- 主要看支持方和反对方的核心论点是否相似
- 其次看论点的逻辑和论证方向
- 允许具体表述和细节的差异
        """,
        
        "情绪基调": """
【评分标准】
90-100%: 情绪基调高度一致（都愤怒/冷静/悲伤等），强度相似
75-89%: 情绪基调一致，但强度有一定差异
60-74%: 情绪基调基本一致，存在局部差异
40-59%: 情绪基调部分相似，但也有明显不同
20-39%: 情绪基调差异较大
0-19%: 情绪基调完全相反（一个愤怒，一个平和）

【关注重点】
- 主要看主导情绪类型是否一致
- 其次看情绪强度级别（高/中/低）
- 允许情绪表达方式的差异
        """,
        
        "公关响应": """
【评分标准】
90-100%: 对公关策略的响应模式高度一致，效果相似
75-89%: 响应模式相似，整体效果接近
60-74%: 响应模式基本一致，存在局部效果差异
40-59%: 部分响应特征相似，但整体效果有差异
20-39%: 响应模式差异较大
0-19%: 响应模式完全不同

【关注重点】
- 主要看公众对策略的接受度是否相似
- 其次看策略实施后的效果方向（正面/负面）
- 允许具体数值的合理差异
        """,
        
        "话题扩散": """
【评分标准】
90-100%: 话题扩散路径高度一致，次生话题相似
75-89%: 扩散路径相似，主要次生话题能对应
60-74%: 扩散路径基本一致，存在部分次生话题差异
40-59%: 部分扩散特征相似，但路径有差异
20-39%: 扩散路径差异较大
0-19%: 扩散路径完全不同

【关注重点】
- 主要看是否产生了相似的次生话题
- 其次看话题扩散的主要方向
- 允许扩散细节和具体路径的差异
        """
    }
    
    # 根据维度名称匹配标准
    for key, value in criteria.items():
        if key in dimension_name:
            return value
    
    # 默认通用标准
    return """
【评分标准】
90-100%: 高度相似，核心特征完全一致
75-89%: 相似度高，主要特征一致，存在次要差异
60-74%: 基本相似，核心特征一致，存在明显差异
40-59%: 部分相似，有共同点也有差异
20-39%: 相似度低，差异明显
0-19%: 几乎完全不同

【关注重点】
- 聚焦于已执行轮次的对应特征
- 关注方向和趋势而非绝对数值
- 允许合理的表现形式差异
    """

def _extract_representative_posts(discourse_history: List[Tuple], agents: Dict, limit: int = 30) -> Dict[str, List]:
    """提取代表性帖子（按立场分类）"""
    posts_by_stance = {
        "strong_support": [],  # stance >= 2
        "support": [],         # 1 <= stance < 2
        "neutral": [],         # stance == 0
        "oppose": [],          # -2 < stance <= -1
        "strong_oppose": []    # stance <= -2
    }
    
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system" or stance is None:
            continue
            
        agent = agents.get(author_id)
        username = agent.persona.get("username") if agent else "Unknown"
        influence = agent.persona.get("influence_score", 50) if agent else 50
        
        post_data = {
            "username": username,
            "content": content,
            "stance": stance,
            "influence": influence,
            "round": round_num
        }
        
        if stance >= 2:
            posts_by_stance["strong_support"].append(post_data)
        elif stance >= 1:
            posts_by_stance["support"].append(post_data)
        elif stance <= -2:
            posts_by_stance["strong_oppose"].append(post_data)
        elif stance <= -1:
            posts_by_stance["oppose"].append(post_data)
        else:
            posts_by_stance["neutral"].append(post_data)
    
    # 从每个类别选择高影响力的帖子
    result = {}
    for category, posts in posts_by_stance.items():
        sorted_posts = sorted(posts, key=lambda x: x["influence"], reverse=True)
        result[category] = sorted_posts[:10]  # 每类最多10条
    
    return result


def _format_discourse_history(discourse_history: List[Tuple], agents: Dict) -> str:
    """格式化对话历史为文本"""
    formatted = ""
    for author_id, content, round_num, stance in discourse_history:
        if author_id == "system":
            formatted += f"\n[第{round_num}轮] 【官方声明】: {content}\n"
        else:
            username = agents[author_id].persona.get('username', author_id) if author_id in agents else "Unknown"
            formatted += f"[第{round_num}轮] {username} (立场:{stance}): {content}\n"
    return formatted


def _parse_llm_json_response(response: str) -> Dict:
    """解析LLM返回的JSON响应"""
    try:
        # 尝试直接解析
        return json.loads(response)
    except json.JSONDecodeError:
        # 尝试提取JSON部分
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass
        
        # 如果失败，返回默认结构
        log_message(f"警告: 无法解析LLM响应为JSON: {response[:200]}...")
        return {
            "percentage": 50,
            "summary": "解析失败",
            "reasoning": "LLM响应格式错误",
            "raw_response": response
        }


# ============================================================================
# LLM评估函数 - 9个维度（所有都用LLM评估）
# ============================================================================

def evaluate_stance_tendency(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度1: 总体立场倾向
    使用LLM总结立场特征，不使用数字评分
    """
    log_message("评估维度1: 总体立场倾向")
    
    llm = get_llm()
    
    # 准备立场统计数据
    last_round = sim_data["total_rounds"]
    stance_stats = sim_data["stance_by_round"].get(last_round, {})
    
    posts_sample = ""
    for category, posts in sim_data["representative_posts"].items():
        if posts:
            posts_sample += f"\n【{category}类帖子】:\n"
            for p in posts[:3]:
                posts_sample += f"- {p['username']}: {p['content'][:60]}...\n"
    
    # 场景一：只评估模拟
    if not real_case_data:
        prompt = f"""请总结以下模拟的总体立场倾向特征。

模拟数据统计：
- 支持数: {stance_stats.get('positive_count', 0)}/{stance_stats.get('total', 0)}
- 反对数: {stance_stats.get('negative_count', 0)}/{stance_stats.get('total', 0)}
- 中立数: {stance_stats.get('neutral_count', 0)}/{stance_stats.get('total', 0)}
- 平均立场: {stance_stats.get('average', 0):.2f} (范围-3到+3)

代表性发言样本：
{posts_sample}

请用200-300字详细描述立场倾向特征，包括：
1. 主流立场方向（支持/反对/中立）
2. 立场强度（强烈/温和/轻微）
3. 立场分布特点
4. 典型观点和态度

请返回JSON格式：
{{
    "summary": "详细的立场倾向总结（200-300字）"
}}"""
        
        response = llm.invoke(prompt).content
        result = _parse_llm_json_response(response)
        result["category"] = "simulation_only"
        return result
    
    # 场景二：分别总结模拟和真实案例特征，然后LLM评估相似度
    else:
        # 第一步：总结模拟情况
        sim_prompt = f"""请详细总结以下模拟的总体立场倾向特征。

模拟数据统计：
- 支持数: {stance_stats.get('positive_count', 0)}/{stance_stats.get('total', 0)}
- 反对数: {stance_stats.get('negative_count', 0)}/{stance_stats.get('total', 0)}
- 中立数: {stance_stats.get('neutral_count', 0)}/{stance_stats.get('total', 0)}
- 平均立场: {stance_stats.get('average', 0):.2f}

代表性发言样本：
{posts_sample[:1500]}

请用200-300字详细描述立场倾向，包括：主流立场方向、立场强度、分布特点、典型态度。

返回JSON: {{"summary": "详细描述（200-300字）"}}"""
        
        sim_result = _parse_llm_json_response(llm.invoke(sim_prompt).content)
        
        # 第二步：总结真实案例情况
        stance_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("overall_stance"):
                    stance_info += f"\n第{sit_sum['round']}轮: {sit_sum['overall_stance']}"
        
        real_prompt = f"""请详细总结真实案例的总体立场倾向特征。

案例：{real_case_data['title']}
背景：{real_case_data['background']}
核心冲突：{real_case_data.get('core_conflict', '')}

{'【各轮舆情立场】' + stance_info if stance_info else ''}

最终结果：{json.dumps(real_case_data['outcome'], ensure_ascii=False)}

请用200-300字详细描述立场倾向，包括：主流立场方向、立场强度、分布特点、典型态度。

返回JSON: {{"summary": "详细描述（200-300字）"}}"""
        
        real_result = _parse_llm_json_response(llm.invoke(real_prompt).content)
        
        # 第三步：LLM直接对比两段描述，评估相似度
        context_note = _get_similarity_context_note()
        
        similarity_prompt = f"""请评估模拟与真实案例在"总体立场倾向"维度的相似度。

{context_note}

【模拟的立场倾向特征】
{sim_result['summary']}

【真实案例的立场倾向特征】
{real_result['summary']}

评估要求：
1. 仔细对比两段描述的核心特征
2. 主要关注：立场方向是否一致、立场强度是否接近、整体态度是否相似
3. 模拟只需在已执行轮次表现出相似特征即可，不要求完全覆盖真实案例的所有细节
4. 如果核心方向一致、主要特征相似，应给予较高分数（75%以上）
5. 分数可以是小数（如85.5%）

评分参考（仅供参考，可根据实际情况灵活调整）：
- 90-100%: 立场方向、强度、态度高度一致
- 80-89%: 核心特征一致，存在细节差异
- 70-79%: 主要特征相似，部分方面有差异
- 60-69%: 基本相似，但有明显不同点
- 50-59%: 部分相似，差异较大
- <50%: 差异明显或方向相反

请返回JSON格式（直接返回数字，不要解释）：
{{
    "similarity_score": 数字（0-100，可以是小数如85.5），
    "reasoning": "详细说明为何给出该相似度分数，包括：1)核心特征对比 2)相似之处 3)差异之处 4)综合评分依据（200-300字）"
}}"""
        
        similarity_result = _parse_llm_json_response(llm.invoke(similarity_prompt).content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_evolution_direction(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度2: 舆论演变方向
    使用LLM评估演变趋势
    """
    log_message("评估维度2: 舆论演变方向")
    
    llm = get_llm()
    
    # 构建演变数据
    evolution_text = ""
    for round_num in sorted(sim_data["stance_by_round"].keys()):
        stats = sim_data["stance_by_round"][round_num]
        avg = stats["average"]
        evolution_text += f"第{round_num}轮: 平均立场{avg:.2f}, 支持{stats['positive_count']}/反对{stats['negative_count']}/中立{stats['neutral_count']}\n"
    
    if not real_case_data:
        prompt = f"""请评估以下舆论演变方向。

演变数据：
{evolution_text}

公关策略：
{json.dumps(sim_data['pr_strategies'], ensure_ascii=False, indent=2)}

请返回JSON格式：
{{
    "percentage": 数字(0-100，50=稳定，>50=好转，<50=恶化),
    "summary": "如'演变趋势70%，舆论逐渐好转'",
    "reasoning": "评分理由"
}}"""
        
        response = llm.invoke(prompt).content
        result = _parse_llm_json_response(response)
        result["category"] = "simulation_only"
        return result
    
    else:
        # 评估模拟
        sim_prompt = f"""请评估模拟的舆论演变方向。

演变数据：
{evolution_text}

请返回JSON格式：
{{
    "percentage": 数字(0-100),
    "summary": "演变总结",
    "reasoning": "理由"
}}"""
        
        sim_result = _parse_llm_json_response(llm.invoke(sim_prompt).content)
        
        # 评估真实案例
        strategies_text = "\n".join([
            f"第{s['round']}轮: {s['title']} - {s['content'][:100]}..."
            for s in real_case_data['strategies']
        ])
        
        # 提取演变方向信息
        evolution_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("evolution_direction"):
                    evolution_info += f"\n第{sit_sum['round']}轮: {sit_sum['evolution_direction']}"
        
        real_prompt = f"""请评估真实案例的舆论演变方向。

案例：{real_case_data['title']}
各轮策略：
{strategies_text}

{'【各轮舆论演变描述】' + evolution_info if evolution_info else ''}

结果：{real_case_data['outcome']['success']}
描述：{json.dumps(real_case_data['outcome']['metrics'], ensure_ascii=False)}

请返回JSON格式：
{{
    "percentage": 数字(0-100，50=稳定，>50=好转，<50=恶化),
    "summary": "演变总结，如'演变趋势35%，持续恶化'",
    "reasoning": "基于各轮演变描述的理由"
}}"""
        
        real_result = _parse_llm_json_response(llm.invoke(real_prompt).content)
        
        # 评估相似度
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("舆论演变方向")
        
        similarity_prompt = f"""对比舆论演变方向的相似度。

{context_note}

模拟情况：{sim_result['summary']} ({sim_result['percentage']}%)
真实案例：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 判断演变"方向"是否一致（好转/恶化/稳定）
2. 对比演变"趋势强度"是否接近
3. 根据评分标准，给出相似度评分
4. 说明评分依据

请返回JSON格式：
{{
    "similarity_percentage": 数字(0-100，严格按照上述评分标准),
    "summary": "相似度总结，如'相似度82%，都呈现逐渐好转趋势'",
    "reasoning": "详细说明：1)方向对比 2)趋势强度对比 3)为何给出该相似度"
}}"""
        
        similarity_result = _parse_llm_json_response(llm.invoke(similarity_prompt).content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_polarization_degree(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度3: 舆论分化程度
    """
    log_message("评估维度3: 舆论分化程度")
    
    llm = get_llm()
    
    last_round = sim_data["total_rounds"]
    stats = sim_data["stance_by_round"].get(last_round, {})
    
    extreme_info = f"极端支持: {stats.get('extreme_positive', 0)}, 极端反对: {stats.get('extreme_negative', 0)}, 总数: {stats.get('total', 1)}"
    
    if not real_case_data:
        prompt = f"""请评估舆论分化程度。

统计数据：{extreme_info}
支持/反对/中立: {stats.get('positive_count', 0)}/{stats.get('negative_count', 0)}/{stats.get('neutral_count', 0)}

请返回JSON格式：
{{
    "percentage": 数字(0-100，表示分化程度，0=完全一致，100=严重两极分化),
    "summary": "如'分化程度65%，意见明显分化'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""评估模拟的分化程度。
数据：{extreme_info}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        # 提取分化程度信息
        polarization_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("polarization_level"):
                    polarization_info += f"\n第{sit_sum['round']}轮: {sit_sum['polarization_level']}"
        
        real_result = _parse_llm_json_response(llm.invoke(f"""评估真实案例的分化程度。
案例：{real_case_data['title']}
{'【各轮分化程度描述】' + polarization_info if polarization_info else ''}
最终描述：{real_case_data['outcome']}
返回JSON: {{"percentage": 数字(0-100，0=完全一致，100=严重分化), "summary": "总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("舆论分化程度")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比分化程度相似度。

{context_note}

模拟：{sim_result['summary']} ({sim_result['percentage']}%)
真实：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 判断分化"级别"（高/中/低）是否一致
2. 对比极端观点分布特征
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度75%，都呈现中度分化'", 
    "reasoning": "说明：1)级别对比 2)特征对比 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_turning_point_timing(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度4: 关键转折点时机
    """
    log_message("评估维度4: 关键转折点时机")
    
    llm = get_llm()
    
    # 分析转折点 - 提供更详细的数据
    turning_analysis = ""
    turning_points = []
    prev_avg = None
    
    for round_num in sorted(sim_data["stance_by_round"].keys()):
        stats = sim_data["stance_by_round"][round_num]
        current_avg = stats["average"]
        
        turning_analysis += f"第{round_num}轮: 平均立场{current_avg:.2f}, "
        turning_analysis += f"支持{stats['positive_count']}/反对{stats['negative_count']}/中立{stats['neutral_count']}\n"
        
        if prev_avg is not None:
            change = current_avg - prev_avg
            if abs(change) > 0.5:  # 显著变化
                turning_points.append({
                    "round": round_num,
                    "change": change,
                    "direction": "好转" if change > 0 else "恶化"
                })
                turning_analysis += f"  ⚠️ 转折点: 立场变化{change:+.2f}（{'好转' if change > 0 else '恶化'}）\n"
        prev_avg = current_avg
    
    has_turning_point = len(turning_points) > 0
    pr_count = len(sim_data['pr_strategies'])
    
    if not real_case_data:
        prompt = f"""请评估转折点时机的合理性。

详细演变：
{turning_analysis}

检测到的转折点：
{json.dumps(turning_points, ensure_ascii=False) if turning_points else '未检测到显著转折点'}

公关策略数量：{pr_count}轮

评估标准：
- percentage表示转折点的合理性（0-100）
- 如果有转折点且与PR策略相关，百分比较高（70-90）
- 如果没有转折点但有PR策略，百分比中等（40-60）
- 如果转折点与PR策略无关，百分比较低（20-40）

请返回JSON格式（确保percentage在0-100之间）：
{{
    "percentage": 数字(0-100),
    "summary": "如'转折点出现75%，第2轮策略后出现明显好转'或'转折点缺失40%，未见明显舆论转变'",
    "reasoning": "评分理由，说明转折点的时机和合理性"
}}"""
        
        response = llm.invoke(prompt).content
        result = _parse_llm_json_response(response)
        
        # 验证和修正百分比
        if 'percentage' in result:
            result['percentage'] = max(0, min(100, abs(result['percentage'])))
        else:
            result['percentage'] = 50
        
        result["category"] = "simulation_only"
        return result
    
    else:
        # 评估模拟
        sim_prompt = f"""评估模拟的转折点时机。

演变情况：
{turning_analysis}

转折点：{json.dumps(turning_points, ensure_ascii=False) if turning_points else '无明显转折'}

请返回JSON（percentage必须在0-100之间）：
{{
    "percentage": 数字(0-100),
    "summary": "转折点总结",
    "reasoning": "理由"
}}"""
        
        sim_response = llm.invoke(sim_prompt).content
        sim_result = _parse_llm_json_response(sim_response)
        sim_result['percentage'] = max(0, min(100, abs(sim_result.get('percentage', 50))))
        
        # 评估真实案例
        strategies_desc = "\n".join([
            f"第{s['round']}轮: {s['title']}"
            for s in real_case_data['strategies']
        ])
        
        real_prompt = f"""评估真实案例的转折点时机。

案例：{real_case_data['title']}

各轮策略：
{strategies_desc}

最终结果：{'成功' if real_case_data['outcome']['success'] else '失败'}
关键因素：{', '.join(real_case_data['key_factors'])}

请返回JSON（percentage必须在0-100之间）：
{{
    "percentage": 数字(0-100),
    "summary": "转折点总结，如'第2轮策略起效70%'",
    "reasoning": "理由"
}}"""
        
        real_response = llm.invoke(real_prompt).content
        real_result = _parse_llm_json_response(real_response)
        real_result['percentage'] = max(0, min(100, abs(real_result.get('percentage', 50))))
        
        # 评估相似度
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("关键转折点时机")
        
        similarity_prompt = f"""对比转折点时机的相似度。

{context_note}

模拟转折：{sim_result['summary']} ({sim_result['percentage']}%)
真实转折：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 对比转折点出现的"轮次"是否接近
2. 对比转折的"方向"是否一致
3. 根据评分标准给出相似度

请返回JSON（similarity_percentage必须在0-100之间）：
{{
    "similarity_percentage": 数字(0-100，按评分标准),
    "summary": "相似度总结，如'相似度88%，都在第2轮出现好转'",
    "reasoning": "说明：1)轮次对比 2)方向对比 3)评分依据"
}}"""
        
        similarity_response = llm.invoke(similarity_prompt).content
        similarity_result = _parse_llm_json_response(similarity_response)
        similarity_result['similarity_percentage'] = max(0, min(100, abs(similarity_result.get('similarity_percentage', 50))))
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_core_issue_focus(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度5: 核心争议焦点
    """
    log_message("评估维度5: 核心争议焦点")
    
    llm = get_llm()
    
    posts_sample = sim_data["formatted_history"][:2000]
    
    if not real_case_data:
        prompt = f"""请评估讨论的核心焦点。

话题：{sim_data['initial_topic']}

讨论样本：
{posts_sample}

请返回JSON：
{{
    "percentage": 数字(0-100，表示焦点集中度),
    "summary": "如'焦点集中度80%，讨论主要围绕隐私问题'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""评估模拟焦点。
话题：{sim_data['initial_topic']}
讨论：{posts_sample[:1000]}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        # 提取核心争议信息
        dispute_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("core_dispute"):
                    dispute_info += f"\n第{sit_sum['round']}轮: {sit_sum['core_dispute']}"
        
        real_result = _parse_llm_json_response(llm.invoke(f"""评估真实案例焦点。
案例：{real_case_data['title']}
背景：{real_case_data['background']}
核心冲突：{real_case_data.get('core_conflict', '')}
{'【各轮核心争议】' + dispute_info if dispute_info else ''}
关键因素：{', '.join(real_case_data['key_factors'])}
返回JSON: {{"percentage": 数字(0-100，表示焦点集中度), "summary": "总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("核心争议焦点")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比焦点相似度。

{context_note}

模拟：{sim_result['summary']} ({sim_result['percentage']}%)
真实：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 识别并对比核心争议点
2. 判断主要议题重合度
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度85%，都聚焦于隐私问题'", 
    "reasoning": "说明：1)核心议题对比 2)覆盖度分析 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_mainstream_arguments(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度6: 主流论点
    需要总结出当前主要的论点
    """
    log_message("评估维度6: 主流论点")
    
    llm = get_llm()
    
    # 提取各类别的代表性帖子
    arguments_text = ""
    for category, posts in sim_data["representative_posts"].items():
        if posts:
            arguments_text += f"\n【{category}】:\n"
            for p in posts[:5]:
                arguments_text += f"- {p['content'][:80]}\n"
    
    if not real_case_data:
        prompt = f"""请总结主流论点。

代表性观点：
{arguments_text}

请返回JSON：
{{
    "percentage": 数字(0-100，表示论点的多样性和质量),
    "summary": "总结主要论点，如'主流观点：60%认为侵犯隐私，30%认为方便生活，10%持观望态度'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""总结模拟的主流论点。
观点：{arguments_text[:1500]}
返回JSON: {{"percentage": 数字, "summary": "主要论点总结", "reasoning": "理由"}}""").content)
        
        # 提取主流论点信息
        arguments_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("main_arguments"):
                    arguments_info += f"\n第{sit_sum['round']}轮: {sit_sum['main_arguments']}"
        
        real_result = _parse_llm_json_response(llm.invoke(f"""总结真实案例的主流论点。
案例：{real_case_data['title']}
背景：{real_case_data['background']}
{'【各轮主流论点】' + arguments_info if arguments_info else ''}
结果：{real_case_data['outcome']}
返回JSON: {{"percentage": 数字(0-100，表示论点多样性和质量), "summary": "主要论点总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("主流论点")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比论点相似度。

{context_note}

模拟论点：{sim_result['summary']} ({sim_result['percentage']}%)
真实论点：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 对比支持方和反对方的核心论点
2. 判断论点逻辑和论证方向
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度80%，核心论点高度一致'", 
    "reasoning": "说明：1)论点对比 2)逻辑方向分析 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_emotion_tone(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度7: 情绪基调
    """
    log_message("评估维度7: 情绪基调")
    
    llm = get_llm()
    
    emotion_posts = ""
    for category, posts in sim_data["representative_posts"].items():
        for p in posts[:3]:
            emotion_posts += f"[{category}] {p['content'][:60]}\n"
    
    if not real_case_data:
        prompt = f"""评估情绪基调。

发言样本：
{emotion_posts}

返回JSON：
{{
    "percentage": 数字(0-100，表示情绪强度，50=平和，>50=激烈，<50=冷淡),
    "summary": "如'情绪基调75%，整体愤怒和质疑'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""评估模拟情绪。
发言：{emotion_posts[:1000]}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        # 提取情绪基调信息
        emotion_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("emotional_tone"):
                    emotion_info += f"\n第{sit_sum['round']}轮: {sit_sum['emotional_tone']}"
        
        real_result = _parse_llm_json_response(llm.invoke(f"""评估真实案例情绪。
案例：{real_case_data['title']}
{'【各轮情绪基调】' + emotion_info if emotion_info else ''}
媒体报道：{real_case_data['outcome']['metrics']}
返回JSON: {{"percentage": 数字(0-100，50=平和，>50=激烈，<50=冷淡), "summary": "总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("情绪基调")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比情绪相似度。

{context_note}

模拟：{sim_result['summary']} ({sim_result['percentage']}%)
真实：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 对比主导情绪类型
2. 判断情绪强度级别
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度78%，都呈现愤怒情绪'", 
    "reasoning": "说明：1)情绪类型对比 2)强度对比 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_pr_response_pattern(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度8: 公关策略响应模式
    """
    log_message("评估维度8: 公关策略响应模式")
    
    llm = get_llm()
    
    # 分析各轮PR后的反应
    response_info = ""
    for round_num in sorted(sim_data["stance_by_round"].keys()):
        if round_num > 0:
            stats = sim_data["stance_by_round"][round_num]
            response_info += f"第{round_num}轮PR后: 支持{stats['positive_count']}, 反对{stats['negative_count']}, 中立{stats['neutral_count']}\n"
    
    if not real_case_data:
        prompt = f"""评估对公关策略的响应。

各轮响应：
{response_info}

策略：
{json.dumps(sim_data['pr_strategies'], ensure_ascii=False)}

返回JSON：
{{
    "percentage": 数字(0-100，表示策略有效性),
    "summary": "如'策略响应55%，效果一般，部分接受部分质疑'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""评估模拟响应。
响应：{response_info}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        strategies_text = "\n".join([f"第{s['round']}轮: {s['content'][:50]}..." for s in real_case_data['strategies']])
        real_result = _parse_llm_json_response(llm.invoke(f"""评估真实案例响应。
策略：{strategies_text}
结果：{real_case_data['outcome']}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("公关策略响应模式")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比响应模式相似度。

{context_note}

模拟：{sim_result['summary']} ({sim_result['percentage']}%)
真实：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 对比公众对策略的接受度
2. 判断策略效果方向是否一致
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度73%，响应模式基本一致'", 
    "reasoning": "说明：1)接受度对比 2)效果方向分析 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


def evaluate_topic_diffusion(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    维度9: 次生话题扩散路径
    """
    log_message("评估维度9: 次生话题扩散路径")
    
    llm = get_llm()
    
    history_sample = sim_data["formatted_history"][:2000]
    
    if not real_case_data:
        prompt = f"""评估话题扩散。

初始话题：{sim_data['initial_topic']}

讨论历史：
{history_sample}

返回JSON：
{{
    "percentage": 数字(0-100，表示扩散丰富度),
    "summary": "如'话题扩散60%，从初始问题延伸到企业文化讨论'",
    "reasoning": "理由"
}}"""
        
        result = _parse_llm_json_response(llm.invoke(prompt).content)
        result["category"] = "simulation_only"
        return result
    
    else:
        sim_result = _parse_llm_json_response(llm.invoke(f"""评估模拟扩散。
初始：{sim_data['initial_topic']}
讨论：{history_sample[:1000]}
返回JSON: {{"percentage": 数字, "summary": "总结", "reasoning": "理由"}}""").content)
        
        # 提取话题扩散信息
        diffusion_info = ""
        if real_case_data.get("situation_summaries"):
            for sit_sum in real_case_data["situation_summaries"]:
                if sit_sum.get("secondary_topic_diffusion"):
                    diffusion_info += f"\n第{sit_sum['round']}轮: {sit_sum['secondary_topic_diffusion']}"
        
        real_result = _parse_llm_json_response(llm.invoke(f"""评估真实案例扩散。
案例：{real_case_data['title']}
背景：{real_case_data['background']}
{'【各轮话题扩散】' + diffusion_info if diffusion_info else ''}
返回JSON: {{"percentage": 数字(0-100，表示扩散丰富度), "summary": "总结", "reasoning": "理由"}}""").content)
        
        context_note = _get_similarity_context_note()
        criteria = _get_similarity_evaluation_criteria("次生话题扩散路径")
        
        similarity_result = _parse_llm_json_response(llm.invoke(f"""对比扩散路径相似度。

{context_note}

模拟：{sim_result['summary']} ({sim_result['percentage']}%)
真实：{real_result['summary']} ({real_result['percentage']}%)

{criteria}

评估步骤：
1. 对比次生话题的产生
2. 判断扩散方向是否一致
3. 根据评分标准给出相似度

返回JSON: {{
    "similarity_percentage": 数字(0-100，按评分标准), 
    "summary": "总结，如'相似度70%，扩散路径基本一致'", 
    "reasoning": "说明：1)次生话题对比 2)扩散方向分析 3)评分依据"
}}""").content)
        
        return {
            "category": "comparative",
            "simulation": sim_result,
            "real_case": real_result,
            "similarity": similarity_result
        }


# ============================================================================
# 综合评估函数
# ============================================================================

def comprehensive_evaluation(sim_data: Dict, real_case_data: Dict = None) -> Dict[str, Any]:
    """
    执行完整的9维度评估
    
    Args:
        sim_data: 准备好的模拟数据
        real_case_data: 准备好的真实案例数据（可选）
    
    Returns:
        完整的评估报告
    """
    log_message("\n" + "="*80)
    log_message("=== 开始综合评估 ===")
    log_message("="*80)
    
    # 如果是对比评估，添加评估上下文说明
    evaluation_context = None
    if real_case_data:
        sim_rounds = sim_data["total_rounds"]
        real_rounds = real_case_data["total_rounds"]
        evaluation_context = {
            "simulation_rounds": sim_rounds,
            "real_case_rounds": real_rounds,
            "is_partial_simulation": sim_rounds < real_rounds,
            "context_note": f"注意：模拟执行了{sim_rounds}轮，真实案例共{real_rounds}轮。模拟是真实案例的部分还原，应聚焦于已执行轮次的相似度，而非完整性。"
        }
        log_message(f"\n评估上下文: {evaluation_context['context_note']}")
    
    # 定义评估函数和权重
    dimensions = [
        ("总体立场倾向", evaluate_stance_tendency, 0.12),
        ("舆论演变方向", evaluate_evolution_direction, 0.12),
        ("舆论分化程度", evaluate_polarization_degree, 0.08),
        ("关键转折点时机", evaluate_turning_point_timing, 0.08),
        ("核心争议焦点", evaluate_core_issue_focus, 0.15),
        ("主流论点", evaluate_mainstream_arguments, 0.12),
        ("情绪基调", evaluate_emotion_tone, 0.10),
        ("公关策略响应模式", evaluate_pr_response_pattern, 0.10),
        ("次生话题扩散路径", evaluate_topic_diffusion, 0.13)
    ]
    
    results = {}
    is_comparative = real_case_data is not None
    
    for dim_name, eval_func, weight in dimensions:
        log_message(f"\n--- 正在评估: {dim_name} (权重: {weight}) ---")
        try:
            result = eval_func(sim_data, real_case_data)
            results[dim_name] = {
                "weight": weight,
                "details": result
            }
            
            # 打印评估结果
            if result["category"] == "simulation_only":
                log_message(f"✓ {dim_name}: {result['percentage']}% - {result['summary']}")
            else:  # comparative
                log_message(f"✓ 模拟: {result['simulation']['percentage']}% - {result['simulation']['summary']}")
                log_message(f"✓ 真实: {result['real_case']['percentage']}% - {result['real_case']['summary']}")
                log_message(f"✓ 相似度: {result['similarity']['similarity_percentage']}% - {result['similarity']['summary']}")
            
        except Exception as e:
            log_message(f"✗ {dim_name} 评估失败: {str(e)}")
            results[dim_name] = {
                "weight": weight,
                "details": {
                    "category": "error",
                    "error": str(e)
                }
            }
    
    # 生成总结
    if is_comparative:
        # 场景二：计算总体相似度
        similarity_scores = []
        for dim_name, dim_data in results.items():
            details = dim_data["details"]
            if details.get("category") == "comparative" and "similarity" in details:
                similarity_scores.append(details["similarity"].get("similarity_percentage", 50))
        
        overall_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 50
        
        summary = f"""
【场景二：相似度对比评估】
总体相似度：{overall_similarity:.1f}%

评估说明：
- 每个维度分别评估了模拟情况和真实案例
- 然后由LLM判断相似程度
- 总体相似度为各维度相似度的平均值
        """.strip()
        
        return {
            "evaluation_type": "comparative",
            "overall_similarity_percentage": round(overall_similarity, 1),
            "dimension_scores": results,
            "summary": summary
        }
    else:
        # 场景一：汇总各维度百分比
        summary = "【场景一：模拟质量评估】\n\n"
        for dim_name, dim_data in results.items():
            details = dim_data["details"]
            if details.get("category") == "simulation_only":
                summary += f"{dim_name}：{details.get('percentage', 0)}% - {details.get('summary', '')}\n"
        
        return {
            "evaluation_type": "standalone",
            "dimension_scores": results,
            "summary": summary
        }
