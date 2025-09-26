# main.py

import os
from dotenv import load_dotenv
import time
import random
import networkx as nx
from network import create_social_network
from config import LLM_PROVIDER
from llm_provider import get_llm
from langchain.prompts import PromptTemplate

def get_personalized_feed(agent_id, agents, G, all_posts_last_round):
    """根据不同平台的规则，为Agent计算本回合可见的帖子"""
    if not all_posts_last_round:
        return []

    feed = []
    
    for author_id, content, _ in all_posts_last_round:
        if author_id == agent_id: continue # 自己刚发的不会对自己的思考产生影响

        author_persona = agents[author_id].persona
        author_platform = author_persona.get("primary_platform")
        
        is_visible = False
        
        # 朋友圈：仅“互为好友”(强连接)可见
        if author_platform == "WeChat Moments-like":
            edge_data = G.get_edge_data(agent_id, author_id)
            if edge_data and edge_data.get("tie_strength") == "mutual":
                is_visible = True
        
        # 微博/Twitter：我关注了Ta，或者因热度被算法推荐
        elif author_platform == "Weibo/Twitter-like":
            if G.has_edge(agent_id, author_id): # 我关注了作者
                is_visible = True
            else: # 模拟算法推荐，影响力越高越容易被推荐给非粉丝
                if random.random() < author_persona.get("influence_score", 50) / 300.0:
                    is_visible = True

        # 小红书/抖音：纯算法推荐，社交关系弱
        elif author_platform == "TikTok-like":
            # 简化模型：影响力越高越容易刷到
            if random.random() < author_persona.get("influence_score", 50) / 150.0:
                is_visible = True
        
        # 论坛：对所有模拟中的人开放
        elif author_platform == "Forum-like":
            is_visible = True
            
        if is_visible:
            feed.append(f"{author_persona['username']}: {content}")
            
    print(f"--- Agent {agent_id} 在其信息流中刷到了 {len(feed)} 条新动态 ---")
    return feed


def summarize_discourse(discourse_history: list, agents: dict):
    """
    在模拟结束后，调用LLM生成一份舆情总结报告。
    """
    print("\n" + "="*25 + "\n=== 正在生成舆情总结报告... ===\n" + "="*25)
    
    llm = get_llm()
    
    formatted_history = ""
    for author_id, content, round_num in discourse_history:
        username = agents[author_id].persona['username'] if author_id != "system" else "系统"
        formatted_history += f"[第{round_num}回合] {username}: {content}\n"
        
    prompt = PromptTemplate.from_template(
        """你是一位专业的社会舆情分析师。以下是一场关于“AI预测股市”话题的模拟网络讨论的完整记录。

        # 讨论记录:
        ---
        {history}
        ---

        # 你的任务:
        请根据以上完整的讨论记录，撰写一份简洁明了的舆情总结报告。报告应至少包含以下几点：
        1.  **核心议题**: 讨论的中心话题是什么？
        2.  **主要观点阵营**: 讨论中形成了哪些主要的观点派别（例如：支持派、反对派、怀疑派等）？每个派别的核心论点是什么？
        3.  **关键影响者 (KOL)**: 哪些用户（请指出用户名）在讨论中扮演了关键角色？他们是如何影响舆论走向的？
        4.  **舆论的演变**: 讨论的整体情绪或主流观点是如何随着时间（回合）推移而发生变化的？
        5.  **最终共识或分歧**: 讨论结束时，是否形成了普遍共识？如果没形成，最主要的分歧点是什么？

        请以专业的、分析性的口吻撰写这份报告。"""
    )
    
    summarizer_chain = prompt | llm
    
    summary_report = summarizer_chain.invoke({
        "history": formatted_history
    }).content
    
    return summary_report

# num_rounds是回合数，测试的时候可以调整
def run_simulation(num_rounds: int = 2, participation_prob: float = 0.8, rejoining_prob: float = 0.1):
    load_dotenv()
    
    key_to_check = ""
    if LLM_PROVIDER == "GOOGLE": key_to_check = "GOOGLE_API_KEY"
    elif LLM_PROVIDER == "OPENAI": key_to_check = "OPENAI_API_KEY"
    elif LLM_PROVIDER == "ANTHROPIC": key_to_check = "ANTHROPIC_API_KEY"
    elif LLM_PROVIDER == "DEEPSEEK": key_to_check = "DEEPSEEK_API_KEY"
    if not os.getenv(key_to_check):
        print(f"错误: 您在 config.py 中选择了 {LLM_PROVIDER}, 但未能找到对应的API密钥 {key_to_check}.")
        return

    G, agents = create_social_network(10)

    initial_post = f"【初始话题 by 系统】: 一家名不见经传的初创公司发布了他们的产品，声称可以完美预测未来一周的股市走向！"
    global_discourse = [("system", initial_post, 0)]
    
    active_agent_ids = set(agents.keys())
    inactive_agent_ids = set()

    print("\n" + "="*25 + "\n=== 舆论场模拟开始 ===\n" + "="*25)

    for i in range(num_rounds):
        current_round = i + 1
        
        newly_active = {agent_id for agent_id in inactive_agent_ids if random.random() < rejoining_prob}
        if newly_active:
            active_agent_ids.update(newly_active)
            inactive_agent_ids -= newly_active
            for agent_id in newly_active:
                print(f"--- 观察者 {agents[agent_id].persona['username']} ({agent_id}) 重新对讨论产生兴趣，加入舆论场！ ---")
        
        print(f"\n\n--- 第 {current_round} 回合 | 当前活跃人数: {len(active_agent_ids)} ---")
        if not active_agent_ids: 
            print("所有Agent均已退出讨论，模拟提前结束。")
            break

        last_round_posts = [post for post in global_discourse if post[2] == current_round - 1]
        if not last_round_posts and current_round > 1:
            print("上一回合无人发言，舆论平息。模拟提前结束。")
            break
        
        initial_messages = [post[1] for post in global_discourse if post[2] == 0]

        new_posts_this_round = []
        agents_to_make_inactive = set()
        action_order = list(active_agent_ids)
        random.shuffle(action_order)
        
        for agent_id in action_order:
            if random.random() > participation_prob:
                print(f"--- {agents[agent_id].persona['username']} ({agent_id}) 本回合选择潜水，未参与讨论。 ---")
                continue

            agent = agents[agent_id]
            agent_graph = agent.get_graph()

            if current_round == 1:
                # 第一回合所有人都看初始话题
                visible_messages_for_agent = [post[1] for post in global_discourse if post[2] == 0]
            else:
                visible_messages_for_agent = get_personalized_feed(agent_id, agents, G, last_round_posts)

            if not visible_messages_for_agent:
                print(f"--- {agents[agent_id].persona['username']} ({agent_id}) 本回合没刷到任何新消息，保持沉默。 ---")
                continue

            
            state = {"recent_messages": visible_messages_for_agent, "agent_persona": agent.persona}
            final_state = agent_graph.invoke(state)
            cognitive_result = final_state.get('response')
            action = cognitive_result.final_action if cognitive_result else None

            if action and action.action == "POST" and action.content:
                new_posts_this_round.append((agent_id, action.content, current_round))
            
            elif action and action.action == "DROPOUT":
                agents_to_make_inactive.add(agent_id)
                print(f"--- {agent.persona['username']} ({agent_id}) 已对该话题失去兴趣，永久退出讨论。 ---")

            time.sleep(1)
        
        if agents_to_make_inactive:
            active_agent_ids -= agents_to_make_inactive
            inactive_agent_ids.update(agents_to_make_inactive)
        
        if new_posts_this_round:
            global_discourse.extend(new_posts_this_round)
            print(f"\n--- 第 {current_round} 回合结束，产生了 {len(new_posts_this_round)} 条新言论 ---")
        else:
            print(f"\n--- 第 {current_round} 回合结束，无人发表新言论 ---")

    print("\n" + "="*25 + f"\n=== 模拟结束 ===\n" + "="*25)

    print("\n最终舆论场全貌:")
    for author, content, round_num in global_discourse:
        username = agents[author].persona['username'] if author != "system" else "系统"
        print(f"[第{round_num}回合] {username}: {content}")
        
    final_report = summarize_discourse(global_discourse, agents)
    print("\n\n" + "#"*25 + "\n### 最终舆情分析报告 ###\n" + "#"*25)
    print(final_report)

if __name__ == "__main__":
    run_simulation()