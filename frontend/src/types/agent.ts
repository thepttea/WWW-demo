/**
 * Agent相关的类型定义
 * 基于后端personas.csv和agent.py的数据结构
 */

export interface AgentPersona {
  username: string;
  description: string;
  emotional_style: string;
  influence_score: number;
  primary_platform: 'Weibo/Twitter-like' | 'WeChat Moments-like' | 'TikTok-like' | 'Forum-like';
  llm_model: string;
  llm_temperature: number;
}

export interface AgentMemory {
  id: string;
  content: string;
  timestamp: string;
}

export interface AgentPost {
  id: string;
  author_id: string;
  content: string;
  round: number;
  timestamp: string;
  platform: string;
  internal_monologue?: string; // Agent的内心独白
  cognitive_summary?: string; // 认知总结
}

export interface Agent {
  id: string;
  persona: AgentPersona;
  stance: number; // 当前立场值，-1到1之间
  is_active: boolean;
  memories: AgentMemory[];
  recent_posts: AgentPost[];
  last_cognitive_summary?: string;
}

export interface AgentNode {
  id: string;
  agent: Agent;
  position: { x: number; y: number };
  isHighlighted: boolean;
  isSelected: boolean;
}

export interface AgentConnection {
  source: string;
  target: string;
  tie_strength: 'weak' | 'mutual'; // 弱连接(关注)或强连接(好友)
  isActive: boolean; // 当前传播路径是否经过此连接
}
