// 模拟API服务 - 用于开发阶段，模拟后端返回数据
import round1Data from '../../data/round1.json';  // 第一轮数据
import round2Data from '../../data/round2.json';  // 第二轮数据
import round3Data from '../../data/round3.json';  // 第三轮数据

export interface MockSimulationData {
  simulationId: string;
  status: string;
  currentRound: number;
  eventDescription: string;
  prStrategies: Array<{
    round: number;
    strategy: string;
    timestamp: string;
  }>;
  users: Array<{
    username: string;
    description: string;
    emotional_style: string;
    influence_score: number;
    primary_platform: string;
    llm_model: string;
    llm_temperature: number;
    objective_stance_score: number;
    final_decision: string;
    contextual_memories: string[];
    short_term_memories: string[];
  }>;
  platforms: Array<{
    name: string;
    type: string;
    userCount: number;
    activeUsers: string[];
    message_propagation: Array<{
      sender: string;
      receivers: string[];
      content: string;
      sentiment: string;
      timestamp: string;
      likes: number;
      shares: number;
      comments: number;
    }>;
  }>;
}

// 轮询状态接口
export interface SimulationStatus {
  simulationId: string;
  status: 'initial' | 'running' | 'completed' | 'consumed' | 'error';
  progress: number;
  currentRound: number;
  message?: string;
}

// 模拟状态存储
interface SimulationState {
  status: 'initial' | 'running' | 'completed' | 'consumed' | 'error';
  progress: number;
  currentRound: number;
  data?: MockSimulationData;
  startTime: number;
  completedTime?: number;
}

class MockApiClient {
  private simulationStates: Map<string, SimulationState> = new Map();

  constructor(baseURL: string = '/api') {
    // baseURL is reserved for future use
    void baseURL;
  }

  private async mockRequest<T>(data: T, delay: number = 500): Promise<T> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, delay));
    return data;
  }

  // 模拟开始模拟的API调用
  async startSimulation(config: {
    eventDescription: string;
    llm: string;
    strategy: string;
  }): Promise<{ simulationId: string; status: string }> {
    console.log('Mock API: Starting simulation with config:', config);
    
    const simulationId = `sim_${Date.now()}`;
    
    // 初始化模拟状态
    this.simulationStates.set(simulationId, {
      status: 'running',
      progress: 0,
      currentRound: 1,
      startTime: Date.now()
    });

    return this.mockRequest({
      simulationId,
      status: 'running'
    }, 500);
  }


  // 模拟添加下一轮策略的API调用
  async addNextRoundStrategy(simulationId: string, strategy: string, currentRound: number = 1): Promise<{ simulationId: string; status: string }> {
    console.log('Mock API: Adding next round strategy:', strategy, 'for round:', currentRound + 1);
    
    const targetRound = currentRound + 1;
    console.log('Mock API: Target round:', targetRound);
    
    // 更新模拟状态
    const state = this.simulationStates.get(simulationId);
    if (state) {
      console.log('Mock API: Updating existing state from round', state.currentRound, 'to round', targetRound);
      state.status = 'running';
      state.progress = 0;
      state.currentRound = targetRound;
      state.startTime = Date.now();
      state.completedTime = undefined;
      state.data = undefined;
    } else {
      console.log('Mock API: Creating new state for round', targetRound);
      // 如果状态不存在，创建新的
      this.simulationStates.set(simulationId, {
        status: 'running',
        progress: 0,
        currentRound: targetRound,
        startTime: Date.now()
      });
    }

    return this.mockRequest({
      simulationId,
      status: 'running'
    }, 500);
  }

  // 模拟生成报告的API调用
  async generateReport(simulationId: string): Promise<{
    reportId: string;
    content: string;
    summary: {
      overallSentiment: number;
      keyInsights: string[];
      improvements: string[];
    };
    generatedAt: string;
  }> {
    console.log('Mock API: Generating report for:', simulationId);
    
    const reportData = {
      reportId: `report_${Date.now()}`,
      content: "基于模拟结果的分析报告...",
      summary: {
        overallSentiment: 0.2,
        keyInsights: [
          "大部分用户对AI产品持谨慎态度",
          "技术专家群体支持度较高",
          "监管风险是主要关注点"
        ],
        improvements: [
          "加强隐私保护措施",
          "提高透明度",
          "加强与监管机构沟通"
        ]
      },
      generatedAt: new Date().toISOString()
    };

    return this.mockRequest(reportData, 1200);
  }

  // 模拟重置模拟的API调用
  async resetSimulation(simulationId: string): Promise<{ success: boolean; message: string }> {
    console.log('Mock API: Resetting simulation:', simulationId);
    
    return this.mockRequest({
      success: true,
      message: 'Simulation reset successfully'
    }, 200);
  }

  // 轮询API - 获取模拟状态
  async getSimulationStatus(simulationId: string): Promise<SimulationStatus> {
    console.log('Mock API: Getting simulation status for:', simulationId);
    
    const state = this.simulationStates.get(simulationId);
    
    if (!state) {
      return {
        simulationId,
        status: 'error',
        progress: 0,
        currentRound: 0,
        message: 'Simulation not found'
      };
    }

    // 如果状态是running，模拟进度更新
    if (state.status === 'running') {
      const now = Date.now();
      const elapsed = now - state.startTime;
      const totalDuration = 2000; // 模拟10秒完成
      const progress = Math.min(Math.floor((elapsed / totalDuration) * 100), 99);
      
      // 如果超过总时长，标记为完成
      if (elapsed >= totalDuration) {
        state.status = 'completed';
        state.progress = 100;
        state.completedTime = now;
        
        // 根据当前轮数设置对应的数据
        console.log('Mock API: Setting data for round:', state.currentRound);
        let baseData;
        if (state.currentRound === 1) {
          baseData = round1Data;
          console.log('Mock API: Using round1Data');
        } else if (state.currentRound === 2) {
          baseData = round2Data;
          console.log('Mock API: Using round2Data');
        } else if (state.currentRound === 3) {
          baseData = round3Data;
          console.log('Mock API: Using round3Data');
        } else {
          baseData = round1Data;
          console.log('Mock API: Using round1Data (fallback)');
        }
        
        state.data = {
          ...baseData,
          simulationId,
          status: 'completed',
          currentRound: state.currentRound
        };
      } else {
        state.progress = progress;
      }
    }

    return this.mockRequest({
      simulationId,
      status: state.status,
      progress: state.progress,
      currentRound: state.currentRound,
      message: state.status === 'error' ? 'Simulation failed' : undefined
    }, 100);
  }

  // 轮询API - 获取模拟结果
  async getSimulationResult(simulationId: string): Promise<MockSimulationData> {
    console.log('Mock API: Getting simulation result for:', simulationId);
    
    const state = this.simulationStates.get(simulationId);
    
    if (!state) {
      throw new Error('Simulation not found');
    }

    if (state.status === 'running') {
      throw new Error('Simulation is still running');
    }

    if (state.status === 'error') {
      throw new Error('Simulation failed');
    }

    if (!state.data) {
      throw new Error('Simulation data not available');
    }

    // 如果状态是completed，获取数据后改为consumed
    if (state.status === 'completed') {
      state.status = 'consumed';
    }

    return this.mockRequest(state.data, 200);
  }
}

// 导出模拟API客户端实例
export const mockApiClient = new MockApiClient();
export default mockApiClient;
