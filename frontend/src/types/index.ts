// 项目类型定义

export interface LLMOption {
  value: string;
  label: string;
}

export interface PRStrategy {
  content: string;
  isOptimized: boolean;
}

export interface SimulationConfig {
  llm: string;
  initialTopic?: string;  // 【新增】用户输入的初始话题
  numRounds?: number;  // 【新增】每次策略后的交互轮数
  strategy: PRStrategy;
  enableRefinement: boolean;
  simulationParameters?: SimulationParameters;  // 【新增】模拟参数
}

export interface SimulationResult {
  success: boolean;
  simulationId: string;  // 【修改】添加模拟ID
  status: string;
  round: number;  // 【新增】当前轮次
  summary: {
    totalAgents: number;
    activeAgents: number;
    totalPosts: number;
    positiveSentiment: number;
    negativeSentiment: number;
    neutralSentiment: number;
  };
  agents: AgentInfo[];  // 【新增】详细的agent信息列表
  propagationPaths: PropagationPath[];  // 【新增】传播路径列表
}

export interface HistoricalCase {
  id: string;
  title: string;
  description: string;
  originalStrategy: string;
  actualOutcome: string;
  successRate: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'llm';
  content: string;
  timestamp: Date;
}

export interface SimulationParameters {
  agents: number;
  interactionProbability: number;
  positiveResponseProbability: number;
  negativeResponseProbability: number;
  neutralResponseProbability: number;
  initialPositiveSentiment: number;
  initialNegativeSentiment: number;
  initialNeutralSentiment: number;
}

// 【新增】Agent详细信息类型
export interface AgentInfo {
  agentId: string;
  username: string;
  description: string;
  influenceScore: number;
  primaryPlatform: string;
  emotionalStyle: string;
  stanceScore: number;  // 【新增】立场评分 (-3 到 3)
  postsSent: number;
  latestPost: string | null;  // 【新增】最新评论
  isActive: boolean;
}

// 【新增】传播路径类型
export interface PropagationPath {
  from: string;
  content: string;
  round: number;
  stance: number;
}

export interface Scenario2Config {
  llm: string;
  case: HistoricalCase;
  enableRefinement: boolean;
}

export interface Scenario2Result {
  success: boolean;
  score: number;
  accuracy: number;
  comparison: {
    predicted: {
      positive: number;
      negative: number;
      neutral: number;
    };
    actual: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  networkData: {
    nodes: number;
    connections: number;
  };
}
