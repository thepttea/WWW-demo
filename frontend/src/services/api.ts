// API服务基础配置
const API_BASE_URL = 'http://localhost:8000/api';

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}

// 聊天相关类型
export interface ChatSession {
  sessionId: string;
  content: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'llm';
  content: string;
  timestamp: string;
}

export interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
}

// 模拟相关类型
export interface SimulationConfig {
  agents: number;
  num_rounds: number;
  interactionProbability: number;
  positiveResponseProbability: number;
  negativeResponseProbability: number;
  neutralResponseProbability: number;
  initialPositiveSentiment: number;
  initialNegativeSentiment: number;
  initialNeutralSentiment: number;
}

export interface StartSimulationRequest {
  initialTopic: string;
  llmModel: string;
  simulationConfig: SimulationConfig;
  prStrategy?: string;  // 第一轮公关策略（可选）
}

export interface SimulationStatus {
  simulationId: string;
  status: string;
  currentRound: number;
  activeAgents: number;
  totalPosts: number;
}

export interface SimulationResult {
  simulationId: string;
  status: string;
  round: number;
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalPosts: number;
    positiveSentiment: number;
    negativeSentiment: number;
    neutralSentiment: number;
  };
  agents: Array<{
    agentId: string;
    username: string;
    description: string;
    influence_score: number;
    primaryPlatform: string;
    emotionalStyle: string;
    stanceScore: number;
    postsSent: number;
    latestPost?: string;
    isActive: boolean;
  }>;
  propagationPaths: Array<{
    from: string;
    content: string;
    round: number;
    stance: number;
  }>;
}

export interface NetworkData {
  nodes: Array<{
    id: string;
    username: string;
    platform: string;
    influence_score: number;
    sentiment: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    strength: number;
    type: string;
  }>;
}

export interface ReportRequest {
  simulationId: string;
  reportType: string;
  includeVisualizations: boolean;
}

export interface ReportResponse {
  reportId: string;
  content: string;
  summary: {
    overallSentiment: number;
    keyInsights: string[];
    improvements: string[];
  };
  generatedAt: string;
}

export interface SimulationResultData {
  overallSentiment: number;
  engagementRate: number;
  reach: number;
  sentimentTrend: string;
  prEffectiveness: number;
  keyInsights: string;
  recommendations: string[];
  influentialNodes: Array<{
    node: string;
    influence_score: number;
    sentiment: string;
    reach: number;
  }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trendData: {
    positive: string;
    engagement: string;
    reach: string;
  };
  effectivenessRating: {
    score: number;
    rating: string;
    thresholds: {
      excellent: number;
      good: number;
    };
  };
}

// API客户端类
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // LLM Chat相关API
  async initChatSession(): Promise<ApiResponse<ChatSession>> {
    return this.request<ChatSession>('/scenario1/chat/init', {
      method: 'GET',
    });
  }

  async sendChatMessage(sessionId: string, message: string): Promise<ApiResponse<ChatMessage>> {
    return this.request<ChatMessage>('/scenario1/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        message,
      }),
    });
  }

  async getChatHistory(sessionId: string): Promise<ApiResponse<ChatHistory>> {
    return this.request<ChatHistory>(`/scenario1/chat/${sessionId}/history`, {
      method: 'GET',
    });
  }

  // 模拟相关API
  async startSimulation(request: StartSimulationRequest): Promise<ApiResponse<{ simulationId: string; status: string }>> {
    return this.request('/scenario1/simulation/start', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async addPRStrategy(simulationId: string, prStrategy: string): Promise<ApiResponse<SimulationResult>> {
    return this.request<SimulationResult>(`/scenario1/simulation/${simulationId}/add-strategy`, {
      method: 'POST',
      body: JSON.stringify({
        prStrategy,
      }),
    });
  }

  async getSimulationStatus(simulationId: string): Promise<ApiResponse<SimulationStatus>> {
    return this.request<SimulationStatus>(`/scenario1/simulation/${simulationId}/status`, {
      method: 'GET',
    });
  }

  async getSimulationResult(simulationId: string): Promise<ApiResponse<SimulationResult>> {
    return this.request<SimulationResult>(`/scenario1/simulation/${simulationId}/result`, {
      method: 'GET',
    });
  }

  async getSimulationResultData(simulationId: string): Promise<ApiResponse<SimulationResultData>> {
    return this.request<SimulationResultData>(`/scenario1/simulation/${simulationId}/analysis`, {
      method: 'GET',
    });
  }

  async getNetworkData(simulationId: string): Promise<ApiResponse<NetworkData>> {
    return this.request<NetworkData>(`/scenario1/simulation/${simulationId}/network`, {
      method: 'GET',
    });
  }

  async stopSimulation(simulationId: string): Promise<ApiResponse<{ simulationId: string; status: string; message: string }>> {
    return this.request(`/scenario1/simulation/${simulationId}/stop`, {
      method: 'POST',
    });
  }

  async generateReport(request: ReportRequest): Promise<ApiResponse<ReportResponse>> {
    return this.request<ReportResponse>('/scenario1/reports/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async resetSimulation(simulationId: string): Promise<ApiResponse<{ simulationId: string; status: string; message: string }>> {
    return this.request(`/simulation/${simulationId}/reset`, {
      method: 'POST',
    });
  }

  // 获取模拟数据相关API
  async getSimulationData(simulationId: string): Promise<ApiResponse<any>> {
    return this.request(`/scenario1/simulation/${simulationId}/data`, {
      method: 'GET',
    });
  }

  async getNetworkVisualizationData(simulationId: string): Promise<ApiResponse<{
    users: any[];
    platforms: any[];
    crossPlatformPropagation: any[];
  }>> {
    return this.request(`/scenario1/simulation/${simulationId}/network-data`, {
      method: 'GET',
    });
  }
}

// 导出API客户端实例
export const apiClient = new ApiClient();
export default apiClient;
