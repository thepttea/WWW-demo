/**
 * 应用常量定义
 */

// LLM模型配置
export const LLM_MODELS = [
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: '快速、高效的GPT-4模型',
    provider: 'OpenAI',
    maxTokens: 128000,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: '最强大的GPT-4模型',
    provider: 'OpenAI',
    maxTokens: 128000,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Google的快速AI模型',
    provider: 'Google',
    maxTokens: 1000000,
    temperature: { min: 0, max: 2, default: 0.7 },
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Anthropic的快速模型',
    provider: 'Anthropic',
    maxTokens: 200000,
    temperature: { min: 0, max: 1, default: 0.7 },
  },
];

// 平台类型
export const PLATFORM_TYPES = [
  { value: 'Weibo/Twitter-like', label: '微博/推特', icon: '🐦' },
  { value: 'WeChat Moments-like', label: '朋友圈', icon: '💬' },
  { value: 'TikTok-like', label: '抖音/短视频', icon: '🎵' },
  { value: 'Forum-like', label: '论坛', icon: '💻' },
];

// 情绪风格类型
export const EMOTIONAL_STYLES = [
  { value: '激情支持型', label: '激情支持型', color: '#52c41a' },
  { value: '尖锐批评型', label: '尖锐批评型', color: '#ff4d4f' },
  { value: '冷静分析型', label: '冷静分析型', color: '#1890ff' },
  { value: '幽默讽刺型', label: '幽默讽刺型', color: '#faad14' },
];

// 模拟状态
export const SIMULATION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// 连接类型
export const CONNECTION_TYPES = {
  WEAK: 'weak',
  MUTUAL: 'mutual',
} as const;

// 网络布局类型
export const NETWORK_LAYOUTS = [
  { value: 'force', label: '力导向布局' },
  { value: 'circular', label: '圆形布局' },
  { value: 'hierarchical', label: '层次布局' },
];

// 动画速度
export const ANIMATION_SPEEDS = [
  { value: 'slow', label: '慢速', multiplier: 2 },
  { value: 'normal', label: '正常', multiplier: 1 },
  { value: 'fast', label: '快速', multiplier: 0.5 },
];

// 颜色映射
export const COLOR_SCHEMES = {
  stance: {
    positive: '#52c41a', // 绿色
    negative: '#ff4d4f', // 红色
    neutral: '#8c8c8c',  // 灰色
  },
  influence: {
    high: '#faad14',     // 金色
    medium: '#1890ff',   // 蓝色
    low: '#8c8c8c',      // 灰色
  },
  platform: {
    'Weibo/Twitter-like': '#1da1f2',
    'WeChat Moments-like': '#07c160',
    'TikTok-like': '#ff0050',
    'Forum-like': '#1890ff',
  },
};

// 默认配置
export const DEFAULT_CONFIG = {
  simulation: {
    num_rounds: 3,
    participation_prob: 0.8,
    rejoining_prob: 0.1,
    llm_model: 'gpt-4o-mini',
  },
  ui: {
    theme: 'light',
    layout: 'horizontal',
    networkPanelSize: 0.7,
    enableAnimations: true,
    animationSpeed: 'normal',
    showInfluenceScores: true,
    showStanceValues: true,
    showPlatformIcons: true,
  },
  network: {
    layout: 'force',
    showConnections: true,
    highlightPath: false,
  },
};

// API配置
export const API_CONFIG = {
  baseURL: '/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// WebSocket配置
export const WS_CONFIG = {
  baseURL: 'ws://localhost:8000/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
};
