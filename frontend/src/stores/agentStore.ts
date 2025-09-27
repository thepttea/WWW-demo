/**
 * Agent状态管理Store
 * 管理Agent相关的状态和操作
 */

import { create } from 'zustand';
import { Agent, AgentPost } from '@/types';

interface AgentState {
  // Agent列表
  agents: Record<string, Agent>;
  agentList: Agent[];
  
  // 当前选中的Agent
  selectedAgent: Agent | null;
  
  // Agent详情面板状态
  isDetailPanelOpen: boolean;
  
  // 过滤和搜索
  searchQuery: string;
  platformFilter: string | null;
  emotionalStyleFilter: string | null;
  
  // 网络图相关
  agentPositions: Record<string, { x: number; y: number }>;
  
  // Actions
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setDetailPanelOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setPlatformFilter: (platform: string | null) => void;
  setEmotionalStyleFilter: (style: string | null) => void;
  setAgentPosition: (agentId: string, position: { x: number; y: number }) => void;
  
  // 计算属性
  getFilteredAgents: () => Agent[];
  getAgentById: (id: string) => Agent | undefined;
  getAgentPosts: (agentId: string) => AgentPost[];
  getAgentStance: (agentId: string) => number;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  // 初始状态
  agents: {},
  agentList: [],
  selectedAgent: null,
  isDetailPanelOpen: false,
  searchQuery: '',
  platformFilter: null,
  emotionalStyleFilter: null,
  agentPositions: {},
  
  // Actions
  setAgents: (agents) => {
    const agentMap = agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, Agent>);
    
    set({ 
      agents: agentMap, 
      agentList: agents 
    });
  },
  
  updateAgent: (agentId, updates) => {
    const { agents } = get();
    const agent = agents[agentId];
    if (agent) {
      const updatedAgent = { ...agent, ...updates };
      set({
        agents: { ...agents, [agentId]: updatedAgent },
        agentList: Object.values({ ...agents, [agentId]: updatedAgent })
      });
    }
  },
  
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  setEmotionalStyleFilter: (style) => set({ emotionalStyleFilter: style }),
  
  setAgentPosition: (agentId, position) => {
    const { agentPositions } = get();
    set({
      agentPositions: { ...agentPositions, [agentId]: position }
    });
  },
  
  // 计算属性
  getFilteredAgents: () => {
    const { agentList, searchQuery, platformFilter, emotionalStyleFilter } = get();
    
    return agentList.filter(agent => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          agent.persona.username.toLowerCase().includes(query) ||
          agent.persona.description.toLowerCase().includes(query) ||
          agent.persona.emotional_style.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // 平台过滤
      if (platformFilter && agent.persona.primary_platform !== platformFilter) {
        return false;
      }
      
      // 情绪风格过滤
      if (emotionalStyleFilter && agent.persona.emotional_style !== emotionalStyleFilter) {
        return false;
      }
      
      return true;
    });
  },
  
  getAgentById: (id) => {
    const { agents } = get();
    return agents[id];
  },
  
  getAgentPosts: (agentId) => {
    const agent = get().getAgentById(agentId);
    return agent?.recent_posts || [];
  },
  
  getAgentStance: (agentId) => {
    const agent = get().getAgentById(agentId);
    return agent?.stance || 0;
  },
}));
