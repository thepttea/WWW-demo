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
  eventDescription?: string;
  strategy: PRStrategy;
  enableRefinement: boolean;
}

export interface SimulationState {
  isRunning: boolean;
  currentRound: number;
  lockedConfig: {
    llm: string;
    eventDescription: string;
  };
  strategyHistory: {
    round: number;
    strategy: string;
    timestamp: Date;
  }[];
  nextRoundStrategy?: string;
}

export interface SimulationResult {
  success: boolean;
  score: number;
  improvements: string[];
  networkVisualization: string; // 图片URL或数据
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
