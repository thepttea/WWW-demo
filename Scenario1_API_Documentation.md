# Scenario 1 API 接口文档

## 通用响应格式

所有API接口都遵循统一的响应格式：

```json
{
  "success": boolean,
  "data": any | null,
  "error": {
    "code": string,
    "message": string,
    "details": string,
    "timestamp": string
  } | null
}
```

## 1. LLM 策略优化接口

### 1.1 初始化聊天会话

**接口**: `GET /api/scenario1/chat/init`

**描述**: 创建新的LLM聊天会话，用于策略优化

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sessionId": "chat_session_712781f2-ad53-4b04-86ba-129baaffe5e7",
    "content": "你好！我是你的公关策略优化助手...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to create chat session",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### 1.2 发送聊天消息

**接口**: `POST /api/scenario1/chat/message`

**描述**: 向LLM发送消息，获取策略优化建议

**请求体**:
```json
{
  "sessionId": "chat_session_712781f2-ad53-4b04-86ba-129baaffe5e7",
  "message": "请帮我优化这个公关策略..."
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "msg_12345678-1234-1234-1234-123456789012",
    "type": "llm",
    "content": "基于你的公关策略，我建议...",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### 1.3 获取聊天历史

**接口**: `GET /api/scenario1/chat/{sessionId}/history`

**描述**: 获取指定会话的完整聊天历史

**路径参数**:
- `sessionId`: 聊天会话ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "sessionId": "chat_session_712781f2-ad53-4b04-86ba-129baaffe5e7",
    "messages": [
      {
        "id": "msg_1",
        "type": "llm",
        "content": "你好！我是你的公关策略优化助手...",
        "timestamp": "2024-01-01T12:00:00.000Z"
      },
      {
        "id": "msg_2",
        "type": "user",
        "content": "请帮我优化这个公关策略...",
        "timestamp": "2024-01-01T12:01:00.000Z"
      }
    ]
  }
}
```

## 2. 模拟执行接口

### 2.1 启动模拟

**接口**: `POST /api/scenario1/simulation/start`

**描述**: 启动Scenario 1模拟，支持用户输入初始话题和策略

**请求体**:
```json
{
  "initialTopic": "某知名科技公司发布了一款具有争议性的AI产品，该产品被指控存在隐私泄露风险，引发了广泛的公众讨论和媒体关注。",
  "llmModel": "gpt-4o-mini",
  "simulationConfig": {
    "agents": 20,
    "num_rounds": 3,
    "interactionProbability": 0.7,
    "positiveResponseProbability": 0.3,
    "negativeResponseProbability": 0.2,
    "neutralResponseProbability": 0.5,
    "initialPositiveSentiment": 0.3,
    "initialNegativeSentiment": 0.4,
    "initialNeutralSentiment": 0.3
  },
  "prStrategy": "我们高度重视用户的隐私保护，这款AI产品采用了业界领先的隐私保护技术，所有数据处理都符合相关法规要求。我们将继续与监管机构合作，确保产品安全可靠。"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_1759732135883",
    "status": "running"
  }
}
```

### 2.2 添加公关策略

**接口**: `POST /api/scenario1/simulation/{simulationId}/add-strategy`

**描述**: 添加公关策略并执行下一轮模拟

**路径参数**:
- `simulationId`: 模拟ID

**请求体**:
```json
{
  "prStrategy": "我们决定暂停该AI产品的商业化推广，并邀请第三方安全机构进行全面审计。同时，我们将建立用户数据保护委员会，定期发布透明度报告，确保用户隐私得到最大程度的保护。"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_1759732135883",
    "status": "running"
  }
}
```

### 2.3 获取模拟状态

**接口**: `GET /api/scenario1/simulation/{simulationId}/status`

**描述**: 获取模拟的当前状态信息，用于轮询

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_1759732135883",
    "status": "running",
    "progress": 45,
    "currentRound": 1,
    "message": "Simulation is running"
  }
}
```

**状态说明**:
- `initial`: 初始状态
- `running`: 运行中
- `completed`: 已完成
- `consumed`: 已消费（数据已获取）
- `error`: 错误状态

### 2.4 获取模拟结果

**接口**: `GET /api/scenario1/simulation/{simulationId}/result`

**描述**: 获取模拟的详细结果数据，用于网络可视化

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_demo_001",
    "status": "completed",
    "currentRound": 1,
    "eventDescription": "某知名科技公司发布了一款具有争议性的AI产品，该产品被指控存在隐私泄露风险，引发了广泛的公众讨论和媒体关注。",
  "prStrategies": [
    {
      "round": 1,
      "strategy": "我们高度重视用户的隐私保护，这款AI产品采用了业界领先的隐私保护技术，所有数据处理都符合相关法规要求。我们将继续与监管机构合作，确保产品安全可靠。",
      "timestamp": "2024-10-03T10:00:00Z"
    }
  ],
  "users": [
    {
      "username": "MarketingPro_Serena",
      "description": "嗅觉敏锐的市场营销专家，擅长引爆话题。",
      "emotional_style": "激情支持型",
      "influence_score": 90,
      "primary_platform": "Weibo/Twitter-like",
      "objective_stance_score": 2,
      "final_decision": "这个AI产品代表了技术发展的未来方向，我们应该拥抱变化，而不是恐惧。任何新技术都会面临质疑，这是正常的。",
      "contextual_memories": [
        "作为营销专家，我看到了这个AI产品的巨大商业潜力。从市场角度来说，争议性产品往往更容易获得关注，这正是我们需要的。我需要帮助公司塑造一个积极正面的形象，让公众看到技术带来的价值。"
      ],
      "short_term_memories": [
        "AI产品争议是正常的，关键是引导舆论向积极方向发展"
      ]
    }
  ],
  "platforms": [
    {
      "name": "Weibo/Twitter-like",
      "type": "social_media",
      "userCount": 4,
      "activeUsers": ["MarketingPro_Serena", "Skeptical_Journalist", "TechBro_Elon", "SocialMedia_Intern"],
      "message_propagation": [
        {
          "sender": "MarketingPro_Serena",
          "receivers": ["Skeptical_Journalist", "TechBro_Elon", "ValueInvestor_Graham", "ArtStudent_Vivian"],
          "content": "这个AI产品代表了技术发展的未来方向，我们应该拥抱变化，而不是恐惧。任何新技术都会面临质疑，这是正常的。",
          "sentiment": "positive",
          "timestamp": "2024-10-03T10:15:00Z"
        }
      ]
    }
  ]
  }
}
```

## 3. 报告生成接口

### 3.1 生成分析报告 (真实API)

**接口**: `POST /api/scenario1/reports/generate`

**描述**: 生成Scenario 1的舆情分析报告

**请求体**:
```json
{
  "simulationId": "sim_1759732135883",
  "reportType": "comprehensive",
  "includeVisualizations": true
}
```

### 3.2 生成分析报告 (Mock API - 临时静态数据)

**接口**: `POST /api/scenario1/simulation/{simulationId}/generate-report`

**描述**: 生成Scenario 1的舆情分析报告 (临时静态数据实现)

**路径参数**:
- `simulationId`: 模拟ID

**请求体**: 无

**响应示例**:
```json
{
  "reportId": "report_1759732135883",
  "content": "基于模拟结果的分析报告...",
  "overallSentiment": 72,
  "engagementRate": 15.3,
  "reach": 850,
  "sentimentTrend": "+12%",
  "prEffectiveness": 85,
  "keyInsights": "The PR strategy has shown significant effectiveness in shifting public opinion. The sentiment analysis reveals a 12% positive trend over the simulation period, with high engagement rates indicating strong public interest. The strategy successfully mitigated initial negative sentiment and built positive momentum.",
  "recommendations": [
    "Continue the current communication strategy as it shows strong positive momentum",
    "Focus on maintaining engagement through regular updates and transparency",
    "Monitor key opinion leaders and influencers for potential amplification opportunities",
    "Consider expanding the message to reach additional demographic segments"
  ],
    "influentialNodes": [
      {
        "node": "Media Outlet A",
        "influence_score": 95,
        "sentiment": "Positive",
        "reach": 120
      },
      {
        "node": "Industry Expert B",
        "influence_score": 88,
        "sentiment": "Positive",
        "reach": 85
      }
    ],
  "sentimentDistribution": {
    "positive": 45,
    "neutral": 35,
    "negative": 20
  },
  "trendData": {
    "positive": "+8%",
    "engagement": "+8%",
    "reach": "+15%"
  },
  "effectivenessRating": {
    "score": 85,
    "rating": "Excellent",
    "thresholds": {
      "excellent": 80,
      "good": 60
    }
  },
  "generatedAt": "2024-01-01T12:00:00.000Z"
}
```

### 3.2 获取分析结果数据

**接口**: `GET /api/scenario1/simulation/{simulationId}/analysis`

**描述**: 获取模拟的详细分析结果数据，用于结果页面展示

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "overallSentiment": 72,
    "engagementRate": 15.3,
    "reach": 850,
    "sentimentTrend": "+12%",
    "prEffectiveness": 85,
    "keyInsights": "The PR strategy has shown significant effectiveness in shifting public opinion...",
    "recommendations": [
      "Continue the current communication strategy as it shows strong positive momentum",
      "Focus on maintaining engagement through regular updates and transparency"
    ],
    "influentialNodes": [
      {
        "node": "Media Outlet A",
        "influence_score": 95,
        "sentiment": "Positive",
        "reach": 120
      }
    ],
    "sentimentDistribution": {
      "positive": 45,
      "neutral": 35,
      "negative": 20
    },
    "trendData": {
      "positive": "+8%",
      "engagement": "+8%",
      "reach": "+15%"
    },
    "effectivenessRating": {
      "score": 85,
      "rating": "Excellent",
      "thresholds": {
        "excellent": 80,
        "good": 60
      }
    }
  }
}
```

## 4. 通用接口

### 4.1 重置模拟 (真实API)

**接口**: `POST /api/simulation/{simulationId}/reset`

**描述**: 重置模拟状态

**路径参数**:
- `simulationId`: 模拟ID

### 4.2 重置模拟 (Mock API - 临时静态数据)

**接口**: `POST /api/scenario1/simulation/{simulationId}/reset`

**描述**: 重置模拟状态 (临时静态数据实现)

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Simulation reset successfully"
  }
}
```

## 5. 数据模型说明

### 5.1 用户模型 (User)

```typescript
interface User {
  username: string;                    // 用户名
  description: string;                 // 用户描述
  emotional_style: string;            // 情感风格
  influence_score: number;            // 影响力分数 (0-100)
  primary_platform: string;           // 主要平台
  objective_stance_score: number;     // 客观立场分数 (-3到3)
  final_decision: string;             // 最终决策
  contextual_memories: string[];      // 上下文记忆
  short_term_memories: string[];      // 短期记忆
}
```

### 5.2 平台模型 (Platform)

```typescript
interface Platform {
  name: string;                       // 平台名称
  type: string;                       // 平台类型
  userCount: number;                  // 用户数量
  activeUsers: string[];              // 活跃用户列表
  message_propagation: Message[];     // 消息传播数据
}
```

### 5.3 消息模型 (Message)

```typescript
interface Message {
  sender: string;                     // 发送者
  receivers: string[];                // 接收者列表
  content: string;                    // 消息内容
  sentiment: string;                  // 情感倾向 (positive/negative/neutral)
  timestamp: string;                  // 时间戳
}
```

### 5.4 模拟状态模型 (SimulationStatus)

```typescript
interface SimulationStatus {
  simulationId: string;               // 模拟ID
  status: 'initial' | 'running' | 'completed' | 'consumed' | 'error';
  progress: number;                   // 进度百分比 (0-100)
  currentRound: number;               // 当前轮次
  message?: string;                   // 状态消息
}
```

### 5.5 分析结果模型 (AnalysisResult)

```typescript
interface AnalysisResult {
  reportId: string;                   // 报告ID
  content: string;                    // 报告内容
  overallSentiment: number;           // 整体情感分数 0-100
  engagementRate: number;             // 参与率百分比
  reach: number;                      // 触达人数 (K为单位)
  sentimentTrend: string;             // 情感趋势 "+12%"
  prEffectiveness: number;           // PR效果分数 0-100
  keyInsights: string;                // 关键洞察文本
  recommendations: string[];           // 改进建议列表
  influentialNodes: InfluentialNode[]; // 关键影响者列表
  sentimentDistribution: {            // 情感分布
    positive: number;
    neutral: number;
    negative: number;
  };
  trendData: {                        // 趋势数据
    positive: string;
    engagement: string;
    reach: string;
  };
  effectivenessRating: {              // 效果评级
    score: number;
    rating: string;
    thresholds: {
      excellent: number;
      good: number;
    };
  };
  generatedAt: string;                // 生成时间
}

interface InfluentialNode {
  node: string;                       // 影响者名称
  influence_score: number;            // 影响力分数 0-100
  sentiment: string;                  // 情感倾向
  reach: number;                      // 触达人数
}
```

## 6. 错误码说明

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `SESSION_NOT_FOUND` | 聊天会话不存在 | 404 |
| `SIMULATION_NOT_FOUND` | 模拟不存在 | 404 |
| `SIMULATION_ERROR` | 模拟执行错误 | 400 |
| `SIMULATION_RUNNING` | 模拟仍在运行中 | 400 |
| `SIMULATION_DATA_UNAVAILABLE` | 模拟数据不可用 | 400 |
| `NETWORK_ERROR` | 网络连接错误 | - |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

## 7. 前端轮询机制

### 7.1 轮询流程

1. **启动模拟**: 调用 `POST /api/scenario1/simulation/start`
2. **开始轮询**: 每1秒调用 `GET /api/scenario1/simulation/{simulationId}/status`
3. **检查状态**: 
   - `running`: 继续轮询
   - `completed`: 调用 `GET /api/scenario1/simulation/{simulationId}/result` 获取数据
   - `error`: 停止轮询，显示错误信息
4. **获取数据**: 调用 `result` 接口后，状态自动变为 `consumed`

### 7.2 轮询参数

- **轮询间隔**: 1秒
- **超时时间**: 40秒
- **最大重试次数**: 3次

### 7.3 状态转换

```
initial → running → completed → consumed
   ↓         ↓         ↓
  error ← error ← error
```

## 8. 前端静态数据说明

### 8.1 当前实现状态

**注意**: 目前前端使用的是静态数据和模拟API，所有接口都通过 `mockApi.ts` 实现，数据来源于静态JSON文件。

### 8.2 静态数据文件

#### 8.2.1 轮次数据文件
- **文件位置**: `frontend/data/round1.json`, `frontend/data/round2.json`, `frontend/data/round3.json`
- **用途**: 存储不同轮次的模拟数据
- **数据结构**: 包含用户信息、平台信息、消息传播数据等

#### 8.2.2 结果数据文件
- **文件位置**: `frontend/data/result.json`
- **用途**: 存储模拟结果分析数据
- **数据结构**: 包含整体情感、参与率、触达人数、关键洞察、建议等

### 8.3 Mock API 实现

#### 8.3.1 文件位置
- **文件**: `frontend/src/services/mockApi.ts`
- **导出**: `mockApiClient` 实例

#### 8.3.2 实现的接口
```typescript
// 启动模拟
async startSimulation(config: {
  eventDescription: string;
  llm: string;
  strategy: string;
}): Promise<ApiResponse<{ simulationId: string; status: string }>>

// 添加下一轮策略
async addNextRoundStrategy(simulationId: string, strategy: string, currentRound: number): Promise<ApiResponse<{ simulationId: string; status: string }>>

// 生成报告
async generateReport(simulationId: string): Promise<ApiResponse<{...}>>

// 获取模拟结果数据
async getSimulationResultData(simulationId: string): Promise<ApiResponse<SimulationResultData>>

// 重置模拟
async resetSimulation(simulationId: string): Promise<ApiResponse<{ success: boolean; message: string }>>

// 获取模拟状态
async getSimulationStatus(simulationId: string): Promise<ApiResponse<SimulationStatus>>

// 获取模拟结果
async getSimulationResult(simulationId: string): Promise<ApiResponse<MockSimulationData>>
```

#### 8.3.3 响应格式
所有 Mock API 都返回 `ApiResponse<T>` 格式：
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}
```

### 8.4 数据流程

#### 8.4.1 模拟启动流程
1. 用户配置事件描述和PR策略
2. 调用 `mockApiClient.startSimulation()`
3. 返回模拟ID和状态
4. 开始轮询状态

#### 8.4.2 轮次数据获取流程
1. 根据当前轮次选择对应的JSON文件
2. 返回用户、平台、消息等数据
3. 前端渲染网络可视化

#### 8.4.3 结果分析流程
1. 模拟完成后调用 `getSimulationResultData()`
2. 返回 `result.json` 中的分析数据
3. 前端显示结果页面

### 8.5 与真实API的差异

#### 8.5.1 当前静态实现
- **数据来源**: 本地JSON文件
- **状态管理**: 内存中的Map存储
- **延迟模拟**: 使用 `setTimeout` 模拟网络延迟
- **错误处理**: 简单的错误返回

#### 8.5.2 真实API预期
- **数据来源**: 后端数据库
- **状态管理**: 后端状态存储
- **实时处理**: 真实的异步处理
- **错误处理**: 完整的错误码和重试机制

### 8.6 迁移到真实API的准备工作

#### 8.6.1 接口兼容性
- 所有Mock API接口都遵循真实API的接口规范
- 响应格式完全一致（`ApiResponse<T>`）
- 错误处理机制已就位

#### 8.6.2 需要修改的部分
1. **API客户端**: 从 `mockApiClient` 切换到 `apiClient`
2. **数据源**: 从静态JSON文件切换到HTTP请求
3. **状态管理**: 从内存存储切换到后端状态
4. **错误处理**: 增强错误处理和重试机制

## 9. 注意事项

1. **数据一致性**: 每个轮次的数据都是独立的，不会累积
2. **状态管理**: 模拟状态在获取结果后会自动变为 `consumed`，防止重复获取
3. **错误处理**: 所有接口都应该包含适当的错误处理和重试机制
4. **性能优化**: 轮询机制应该在前端组件卸载时自动清理
5. **数据格式**: 所有时间戳都使用ISO 8601格式
6. **静态数据**: 当前使用静态JSON文件，便于开发和测试
7. **API兼容性**: Mock API与真实API接口完全兼容，便于后续迁移