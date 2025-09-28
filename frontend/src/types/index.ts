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
  strategy: PRStrategy;
  enableRefinement: boolean;
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
