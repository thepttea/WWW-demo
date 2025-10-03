# network.py

import networkx as nx
import random
from agent import Agent
import persona_manager
from logger import log_message

def create_social_network(num_agents: int = 10, sim_id_prefix: str = "") -> (nx.Graph, dict):
    log_message("--- 正在创建多平台社交网络... ---")

    persona_library = persona_manager.get_persona_library()

    # 提取人设数据
    available_personas = [p['data'] for p in persona_library]

    # 确保请求的智能体数量不超过可用人设数量
    if num_agents > len(available_personas):
        log_message(f"警告: 请求的智能体数量({num_agents})超过可用人设数量({len(available_personas)})")  
        log_message(f"将使用所有可用的人设: {len(available_personas)}个")  
        num_agents = len(available_personas)
    
    # 随机选择指定数量的人设
    selected_personas_data = random.sample(available_personas, num_agents)

    agents = {}
    for i, persona_data in enumerate(selected_personas_data):
        # 【修复】添加 sim_id_prefix 确保每个模拟的 agent ID 唯一
        agent_id = f"{sim_id_prefix}_agent_{i}" if sim_id_prefix else f"agent_{i}"
        agents[agent_id] = Agent(agent_id=agent_id, persona=persona_data)
        log_message(f"  已创建Agent: {agent_id}, 用户名: {persona_data['username']},活跃平台: {persona_data['primary_platform']}, 描述: {persona_data['description']}")

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

    log_message("--- 多层网络结构创建完毕 ---")
    return G, agents