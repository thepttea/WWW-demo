# network.py

import networkx as nx
import random
from agent import Agent
from persona_library import PERSONA_LIBRARY

def create_social_network(num_agents: int = 10) -> (nx.Graph, dict):
    print("--- 正在创建多平台社交网络... ---")
    
    selected_personas_data = random.sample([p['data'] for p in PERSONA_LIBRARY], num_agents)

    agents = {}
    for i, persona_data in enumerate(selected_personas_data):
        agent_id = f"agent_{i}"
        agents[agent_id] = Agent(agent_id=agent_id, persona=persona_data)
        print(f"  已创建Agent: {agent_id}, 用户名: {persona_data['username']},活跃平台: {persona_data['primary_platform']}, 描述: {persona_data['description']}")

    # G 现在是一个有向图，可以表示单向的“关注”关系
    G = nx.DiGraph() 
    G.add_nodes_from(agents.keys())

    # 建立基础的“弱连接”(随机关注)
    for u in G.nodes():
        # 每个用户随机关注1到一半数量的其他人
        num_following = random.randint(1, num_agents // 2)
        possible_targets = [v for v in G.nodes() if u != v]
        targets = random.sample(possible_targets, min(num_following, len(possible_targets)))
        for v in targets:
            G.add_edge(u, v)

    # “强连接”(互相关注，模拟好友)
    for u in G.nodes():
        for v in G.nodes():
            if u != v and G.has_edge(u, v) and G.has_edge(v, u):
                # 如果u和v互相关注，则在他们的连接上做一个标记
                nx.set_edge_attributes(G, {(u, v): "mutual", (v, u): "mutual"}, name="tie_strength")

    print("--- 多层网络结构创建完毕 ---")
    return G, agents