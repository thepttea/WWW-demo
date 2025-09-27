/**
 * 模拟相关的类型定义
 * 基于后端main.py的模拟逻辑
 */

import { Agent, AgentPost } from './agent';

export interface SimulationConfig {
  num_rounds: number;
  participation_prob: number; // 参与概率
  rejoining_prob: number; // 重新加入概率
  llm_model: string;
  initial_topic: string;
  pr_strategy?: string; // 公关策略（Scenario 1）
}

export interface SimulationRound {
  round_number: number;
  posts: AgentPost[];
  active_agents: string[];
  network_changes: NetworkChange[];
  timestamp: string;
}

export interface NetworkChange {
  agent_id: string;
  change_type: 'activated' | 'deactivated' | 'stance_changed';
  old_value?: any;
  new_value?: any;
  timestamp: string;
}

export interface SimulationResult {
  simulation_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: SimulationConfig;
  rounds: SimulationRound[];
  agents: Record<string, Agent>;
  final_report: string;
  network_graph: NetworkGraph;
  created_at: string;
  completed_at?: string;
}

export interface NetworkGraph {
  nodes: SimulationAgentNode[];
  edges: SimulationAgentConnection[];
}

export interface SimulationAgentNode {
  id: string;
  agent: Agent;
  position: { x: number; y: number };
  isHighlighted: boolean;
  isSelected: boolean;
}

export interface SimulationAgentConnection {
  source: string;
  target: string;
  tie_strength: 'weak' | 'mutual';
  isActive: boolean;
}

// 历史案例相关类型（Scenario 2）
export interface HistoricalCase {
  id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  event_date: string;
  real_pr_strategy: string;
  real_outcome: string;
  real_timeline: CaseTimeline[];
  real_metrics: CaseMetrics;
}

export interface CaseTimeline {
  date: string;
  event: string;
  description: string;
}

export interface CaseMetrics {
  sentiment_score: number;
  reach_count: number;
  engagement_rate: number;
  crisis_resolution_time: number; // 小时
}

export interface ComparisonResult {
  similarity_score: number; // 0-1之间
  key_differences: string[];
  accuracy_metrics: {
    sentiment_accuracy: number;
    timeline_accuracy: number;
    outcome_accuracy: number;
  };
}
