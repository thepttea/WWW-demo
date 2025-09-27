/**
 * 模拟服务API
 * 处理模拟相关的API调用
 */

import { 
  SimulationConfig, 
  SimulationResult, 
  CreateSimulationResponse,
  StartSimulationResponse 
} from '@/types/api';
import { generateMockSimulationResult } from './mockData';

// 模拟服务类
export class SimulationService {
  /**
   * 创建新模拟
   */
  static async createSimulation(_config: SimulationConfig): Promise<CreateSimulationResponse> {
    try {
      // TODO: 替换为真实API调用
      // return await api.post<CreateSimulationResponse>('/simulations', { config });
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        simulation_id: `sim_${Date.now()}`,
      };
    } catch (error) {
      console.error('Failed to create simulation:', error);
      throw error;
    }
  }

  /**
   * 获取模拟详情
   */
  static async getSimulation(_simulationId: string): Promise<SimulationResult> {
    try {
      // TODO: 替换为真实API调用
      // const response = await api.get<GetSimulationResponse>(`/simulations/${simulationId}`);
      // return response.data.simulation;
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockConfig: SimulationConfig = {
        num_rounds: 3,
        participation_prob: 0.8,
        rejoining_prob: 0.1,
        llm_model: 'gpt-4o-mini',
        initial_topic: 'AI预测股市技术发布',
      };
      return generateMockSimulationResult(mockConfig);
    } catch (error) {
      console.error('Failed to get simulation:', error);
      throw error;
    }
  }

  /**
   * 开始模拟
   */
  static async startSimulation(_simulationId: string): Promise<StartSimulationResponse> {
    try {
      // TODO: 替换为真实API调用
      // return await api.post<StartSimulationResponse>(`/simulations/${simulationId}/start`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        status: 'running',
      };
    } catch (error) {
      console.error('Failed to start simulation:', error);
      throw error;
    }
  }

  /**
   * 暂停模拟
   */
  static async pauseSimulation(_simulationId: string): Promise<void> {
    try {
      // TODO: 替换为真实API调用
      // await api.post(`/simulations/${simulationId}/pause`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Simulation paused');
    } catch (error) {
      console.error('Failed to pause simulation:', error);
      throw error;
    }
  }

  /**
   * 停止模拟
   */
  static async stopSimulation(_simulationId: string): Promise<void> {
    try {
      // TODO: 替换为真实API调用
      // await api.post(`/simulations/${simulationId}/stop`);
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Simulation stopped');
    } catch (error) {
      console.error('Failed to stop simulation:', error);
      throw error;
    }
  }

  /**
   * 获取模拟列表
   */
  static async getSimulations(): Promise<SimulationResult[]> {
    try {
      // TODO: 替换为真实API调用
      // return await api.get<SimulationResult[]>('/simulations');
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      return [];
    } catch (error) {
      console.error('Failed to get simulations:', error);
      throw error;
    }
  }
}

// WebSocket连接管理
export class SimulationWebSocket {
  private ws: WebSocket | null = null;
  private _simulationId: string | null = null;
  private onMessage: ((data: any) => void) | null = null;

  /**
   * 连接到模拟WebSocket
   */
  connect(_simulationId: string, onMessage: (data: any) => void): void {
    this._simulationId = _simulationId;
    this.onMessage = onMessage;

    // TODO: 替换为真实WebSocket连接
    // this.ws = new WebSocket(`ws://localhost:8000/ws/simulations/${simulationId}`);
    
    // 模拟WebSocket连接
    console.log(`Mock WebSocket connected to simulation ${_simulationId}`);
    
    // 模拟接收消息
    setTimeout(() => {
      if (this.onMessage) {
        this.onMessage({
          type: 'round_update',
          simulation_id: _simulationId,
          data: {
            round: 1,
            posts: [],
            active_agents: [],
            network_changes: [],
          },
          timestamp: new Date().toISOString(),
        });
      }
    }, 2000);
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log(`WebSocket disconnected from simulation ${this._simulationId}`);
    this._simulationId = null;
    this.onMessage = null;
  }

  /**
   * 发送消息
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.log('Mock WebSocket send:', message);
    }
  }
}
