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

class MockApiClient {
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
  }): Promise<MockSimulationData> {
    console.log('Mock API: Starting simulation with config:', config);
    
    // 返回round1.json的数据（第一轮），但更新一些字段
    const simulationData: MockSimulationData = {
      ...round1Data,
      simulationId: `sim_${Date.now()}`,
      status: 'running',
      currentRound: 1,
      prStrategies: [{
        round: 1,
        strategy: config.strategy,
        timestamp: new Date().toISOString()
      }]
    };

    return this.mockRequest(simulationData, 1000);
  }

  // 模拟获取模拟结果的API调用
  async getSimulationResult(simulationId: string): Promise<MockSimulationData> {
    console.log('Mock API: Getting simulation result for:', simulationId);
    
    // 返回round1.json的数据（第一轮）
    const simulationData: MockSimulationData = {
      ...round1Data,
      simulationId,
      status: 'completed',
      currentRound: 1
    };

    return this.mockRequest(simulationData, 300);
  }

  // 模拟添加下一轮策略的API调用
  async addNextRoundStrategy(simulationId: string, strategy: string, currentRound: number = 1): Promise<MockSimulationData> {
    console.log('Mock API: Adding next round strategy:', strategy, 'for round:', currentRound + 1);
    
    // 根据当前轮数决定返回哪个数据
    let baseData;
    let targetRound;
    
    if (currentRound === 1) {
      // 第二轮：返回round2.json的数据
      baseData = round2Data;
      targetRound = 2;
    } else if (currentRound === 2) {
      // 第三轮：返回round3.json的数据
      baseData = round3Data;
      targetRound = 3;
    } else {
      // 默认返回round2.json
      baseData = round2Data;
      targetRound = 2;
    }
    
    const simulationData: MockSimulationData = {
      ...baseData,
      simulationId,
      status: 'running',
      currentRound: targetRound,
      prStrategies: [
        {
          round: 1,
          strategy: "我们高度重视用户的隐私保护，这款AI产品采用了业界领先的隐私保护技术，所有数据处理都符合相关法规要求。我们将继续与监管机构合作，确保产品安全可靠。",
          timestamp: "2024-10-03T10:00:00Z"
        },
        {
          round: 2,
          strategy: "我们决定暂停该AI产品的商业化推广，并邀请第三方安全机构进行全面审计。同时，我们将建立用户数据保护委员会，定期发布透明度报告，确保用户隐私得到最大程度的保护。",
          timestamp: "2024-10-03T11:30:00Z"
        },
        ...(targetRound >= 3 ? [{
          round: 3,
          strategy: strategy,
          timestamp: new Date().toISOString()
        }] : [])
      ]
    };

    return this.mockRequest(simulationData, 800);
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
}

// 导出模拟API客户端实例
export const mockApiClient = new MockApiClient();
export default mockApiClient;
