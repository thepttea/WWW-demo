/**
 * API接口相关的类型定义
 */

import { SimulationConfig, SimulationResult, HistoricalCase } from './simulation';
import { Agent } from './agent';

// API响应基础类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 模拟相关API
export interface CreateSimulationRequest {
  config: SimulationConfig;
}

export interface CreateSimulationResponse {
  simulation_id: string;
}

export interface GetSimulationResponse {
  simulation: SimulationResult;
}

export interface StartSimulationResponse {
  status: string;
}

// 重新导出simulation类型
export type { SimulationConfig, SimulationResult } from './simulation';

// Agent相关API
export interface GetAgentsResponse {
  agents: Agent[];
}

export interface GetAgentResponse {
  agent: Agent;
}

// 历史案例相关API
export interface GetCasesRequest {
  category?: string;
  industry?: string;
  limit?: number;
  offset?: number;
}

export interface GetCasesResponse {
  cases: HistoricalCase[];
  total: number;
}

export interface GetCaseResponse {
  case: HistoricalCase;
}

// WebSocket消息类型
export interface SimulationUpdateMessage {
  type: 'round_update' | 'agent_update' | 'simulation_complete' | 'error';
  simulation_id: string;
  data: any;
  timestamp: string;
}

export interface RoundUpdateData {
  round: number;
  posts: any[];
  active_agents: string[];
  network_changes: any[];
}

export interface AgentUpdateData {
  agent_id: string;
  changes: any;
}
