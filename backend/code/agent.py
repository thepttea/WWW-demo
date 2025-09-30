# agent.py

import chromadb
import uuid
import json
from typing import TypedDict, List, Dict

from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langgraph.graph import StateGraph, END
from llm_provider import get_llm
from llm_provider import get_llm_for_agent
from logger import log_message

class AgentAction(BaseModel):
    action: str = Field(description="你的行动决策，必须是 'POST', 'NO_ACTION', 或 'DROPOUT' 之一")
    content: str = Field(description="如果行动是'POST'，这里是你要发表的帖子的内容。如果是其他行动，则为空。")

class CognitiveStep(BaseModel):
    internal_monologue: str = Field(description="对我刚刚看到的信息，结合我的记忆，我此刻最新、最真实的内心联想和思考过程。")
    cognitive_summary: str = Field(description="对我看到的信息，结合我刚才的联想，我此刻内心的“一句话核心看法”或“第一反应的念头”是什么。必须极其简短。")
    final_action: AgentAction = Field(description="基于以上思考，我最终决定采取的行动。")
    stance_score: int = Field(description="对自己当前就该话题的客观立场评分，范围从-3（强烈反对）到3（强烈支持）。")
    
class AgentState(TypedDict):
    recent_messages: List[str]
    agent_persona: Dict
    response: CognitiveStep

class Agent:
    def __init__(self, agent_id: str, persona: dict):
        self.id = agent_id
        self.persona = persona
        self.llm = get_llm_for_agent(persona)
        client = chromadb.Client()
        self.memory = client.get_or_create_collection(name=f"agent_memory_{self.id}")
        self.last_cognitive_summary = ""

    def update_memory(self, content: str):
        self.memory.add(documents=[content], ids=[str(uuid.uuid4())])

    def _retrieve_raw_memory_docs(self, query: str, n_results: int = 3) -> List[str]:
        doc_count = self.memory.count()
        if doc_count == 0:
            return []
        effective_n_results = min(n_results, doc_count)
        results = self.memory.query(query_texts=[query], n_results=effective_n_results)
        return results['documents'][0] if results.get('documents') else []

    def _create_graph(self):
        
        def unified_cognitive_node(state: AgentState) -> dict:
            log_message(f"--- Agent {self.id} ({self.persona['username']}) 正在思考 ---")

            llm_info = f"{self.persona.get('llm_model')}"
            log_message(f"   [使用LLM]: {llm_info}")
            
            raw_memories = self._retrieve_raw_memory_docs("\n".join(state['recent_messages']))
            
            parser = PydanticOutputParser(pydantic_object=CognitiveStep)

            template = """你正在深度扮演一个社交网络用户，你需要像一个真正的人一样思考和回应。

            # 1. 你的角色设定:
            {persona}

            # 2. 你的长期记忆中闪回了这些片段:
            {memories}
            
            # 3. 你目前对这个话题的既有看法是 (如果是第一轮思考则为空):
            {current_stance}

            # 4. 这是舆论场上的【最新】信息:
            
            **【重要】信息类型说明：**
            - `[Initial Topic]`: 最初的新闻事件或话题
            - `[Official PR Statement]`: 官方发布的公关声明/回应（来自当事企业或机构）
            - 其他（如 "用户名: 内容"）: 普通网友的评论
            
            {recent_messages}

            # === 你的任务 ===
            请一步到位，完成整个思考和决策过程，并以JSON格式输出。

            **A. internal_monologue (内心联想)**:
            - **【核心指令】**: 综合你【所有的已知信息】(角色、长期记忆、既有看法、最新信息)，生成一段自然、连贯的内心联想。
            - **【重要】**: 区分官方声明和网友评论。官方声明通常更正式、权威，但也可能引发你的质疑；网友评论代表民间舆论。
            - 你的思考应当【自然地延续或修正】你之前的看法，而不是生硬地去对比"上一轮"和"这一轮"。让思考的演变蕴含在你的文字中。
            - **【事实锚点】**: 联想【必须】基于你角色可能会知道的【真实世界事件】。**【严厉禁止】**：绝对禁止胡编乱造！

            **B. cognitive_summary (认知总结)**:
            - 基于以上的内心联想，用一句话总结你【此刻最新】的核心看法。

            **C. final_action (最终行动)**:
            - **【兴趣判断】**: 判断当前话题是否还与你人设中的"兴趣(interests)"相关。如果讨论内容已经变得非常无聊或完全偏离你的领域，你应该选择 'DROPOUT' 永久退出讨论。
            - **【风格】**: 你的发言必须符合你的人设和情绪风格，可以非常激进。**【禁止】**: 绝对不要用"作为一个XXX"的句式开头。
            - **【决策】**: 做出 'POST', 'NO_ACTION', 或 'DROPOUT' 之一的决定。
            - **【平台风格】**: 你的发言必须完全符合你主要活跃平台({platform})的文风和格式。
                - 'Weibo/Twitter-like': 短小精悍，可以带有#话题标签#，观点鲜明。
                - 'WeChat Moments-like': 语气更私人化、生活化，像在和朋友分享。
                - 'TikTok-like': 内容应像一个短视频的脚本或标题，富有创意和吸引力，多使用表情符号。
                - 'Forum-like': 内容可以更长，逻辑更严谨，适合深度讨论。

            **D. stance_score (客观立场评分)**:
            - **【抽离角色】**: 在完成以上思考后，请短暂脱离你的角色扮演，作为一个中立的AI分析程序。
            - **【客观评分】**: 根据你刚刚生成的【内心联想】和【认知总结】，对自己当前对【初始话题】的态度进行量化评分。评分标准如下：
              - 3: 强烈支持或极度乐观
              - 2: 支持或乐观
              - 1: 轻微支持或略微乐观
              - 0: 完全中立或不关心
              - -1: 轻微反对或略微悲观
              - -2: 反对或悲观
              - -3: 强烈反对或极度悲观
            - 你的评分必须是一个整数。

            {format_instructions}"""
            
            persona_data = state['agent_persona']
            platform = persona_data.get("primary_platform", "Weibo/Twitter-like")

            prompt_template = PromptTemplate(
                template=template,
                input_variables=["persona", "memory", "recent_messages", "platform"],
                partial_variables={"format_instructions": parser.get_format_instructions()}
            )

            chain = prompt_template | self.llm | parser
            
            cognitive_result = chain.invoke({
                "persona": json.dumps(persona_data, ensure_ascii=False),
                "memories": "\n- ".join(raw_memories) if raw_memories else "（没有相关长期记忆）",
                "recent_messages": "\n".join(state['recent_messages']),
                "current_stance": self.last_cognitive_summary if self.last_cognitive_summary else "（这是我的初步看法）",
                "platform": platform
            })

            log_message(f"   [关联记忆]: {cognitive_result.internal_monologue}")
            log_message(f"   [认知总结]: {cognitive_result.cognitive_summary}")
            log_message(f"   [客观立场评分]: {cognitive_result.stance_score}")
            
            self.update_memory(cognitive_result.cognitive_summary)
            self.last_cognitive_summary = cognitive_result.cognitive_summary
            
            final_action = cognitive_result.final_action

            if final_action.action == 'POST':
                log_message(f"   [决策]: {final_action.action}, 发表内容: '{final_action.content}'")
                self.update_memory(f"我对此发表了新帖子: '{final_action.content}'")
            else:
                log_message(f"   [决策]: {final_action.action}")

            return {"response": cognitive_result}

        graph = StateGraph(AgentState)
        graph.add_node("think_and_decide", unified_cognitive_node)
        graph.set_entry_point("think_and_decide")
        graph.add_edge("think_and_decide", END)
        return graph.compile()
    
    def get_graph(self):
        if not hasattr(self, '_graph'):
            self._graph = self._create_graph()
        return self._graph