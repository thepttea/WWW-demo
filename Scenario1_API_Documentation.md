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
  "eventDescription": "某知名科技公司发布了一款具有争议性的AI产品，该产品被指控存在隐私泄露风险，引发了广泛的公众讨论和媒体关注。",
  "llm": "gpt-4o-mini",
  "strategy": "我们高度重视用户的隐私保护，这款AI产品采用了业界领先的隐私保护技术，所有数据处理都符合相关法规要求。我们将继续与监管机构合作，确保产品安全可靠。"
}
```

**响应示例**:
```json
{
  "simulationId": "sim_1759732135883",
  "status": "running"
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
  "strategy": "我们决定暂停该AI产品的商业化推广，并邀请第三方安全机构进行全面审计。同时，我们将建立用户数据保护委员会，定期发布透明度报告，确保用户隐私得到最大程度的保护。",
  "currentRound": 1
}
```

**响应示例**:
```json
{
  "simulationId": "sim_1759732135883",
  "status": "running"
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
  "simulationId": "sim_1759732135883",
  "status": "running",
  "progress": 45,
  "currentRound": 1,
  "message": "Simulation is running"
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
      "llm_model": "gpt-4o-mini",
      "llm_temperature": 0.8,
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
```

## 3. 报告生成接口

### 3.1 生成分析报告

**接口**: `POST /api/scenario1/reports/generate`

**描述**: 生成Scenario 1的舆情分析报告

**请求体**:
```json
{
  "simulationId": "sim_1759732135883"
}
```

**响应示例**:
```json
{
  "reportId": "report_1759732135883",
  "content": "基于模拟结果的分析报告...",
  "summary": {
    "overallSentiment": 0.2,
    "keyInsights": [
      "大部分用户对AI产品持谨慎态度",
      "技术专家群体支持度较高",
      "监管风险是主要关注点"
    ],
    "improvements": [
      "加强隐私保护措施",
      "提高透明度",
      "加强与监管机构沟通"
    ]
  },
  "generatedAt": "2024-01-01T12:00:00.000Z"
}
```

## 4. 通用接口

### 4.1 重置模拟

**接口**: `POST /api/scenario1/simulation/{simulationId}/reset`

**描述**: 重置模拟状态

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "message": "Simulation reset successfully"
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
  llm_model: string;                  // LLM模型
  llm_temperature: number;            // LLM温度参数
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
  likes: number;                      // 点赞数
  shares: number;                     // 分享数
  comments: number;                   // 评论数
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

## 8. 注意事项

1. **数据一致性**: 每个轮次的数据都是独立的，不会累积
2. **状态管理**: 模拟状态在获取结果后会自动变为 `consumed`，防止重复获取
3. **错误处理**: 所有接口都应该包含适当的错误处理和重试机制
4. **性能优化**: 轮询机制应该在前端组件卸载时自动清理
5. **数据格式**: 所有时间戳都使用ISO 8601格式