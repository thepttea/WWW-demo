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

**描述**: 启动Scenario 1模拟，支持用户输入初始话题

**请求体**:

> 这里的配置应该只会用到 agents 数量，甚至都不用。先放着，后端反正不处理就行

```json
{
  "initialTopic": "某科技公司数据泄露事件",
  "llmModel": "gpt-4o-mini",
  "prStrategy": "the content of the strategy"
  "simulationConfig": {
    "agents": 10,
    "num_rounds": 1,
    "interactionProbability": 0.5,
    "positiveResponseProbability": 0.3,
    "negativeResponseProbability": 0.3,
    "neutralResponseProbability": 0.4,
    "initialPositiveSentiment": 0.2,
    "initialNegativeSentiment": 0.6,
    "initialNeutralSentiment": 0.2
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
    "status": "running",
    "websocketUrl": "ws://localhost:8000/ws/simulation/sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313"
  }
}
```

### 2.2 添加公关策略

**接口**: `POST /api/scenario1/simulation/{simulationId}/add-strategy`

**描述**: 添加公关策略并执行一轮模拟

**路径参数**:
- `simulationId`: 模拟ID

**请求体**:
```json
{
  "prStrategy": "在Youtube上发文章，详细列举我们需要用户数据的用途，并说明我们这个企业用这些数据的用途是合法的..."
}
```

**响应示例**:

> 与实现的不一致，待修改。没有 agents, propagationPath等详细信息，相当于启动下一轮，和start语义差不多。

```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
    "status": "running",
    "round": 4
  }
}
```

### 2.3 获取模拟状态

**接口**: `GET /api/scenario1/simulation/{simulationId}/status`

**描述**: 获取模拟的当前状态信息

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:

> 目前是轮询实现，但是没有用。这个接口肯定要改，可以改成判断后端当前轮次是否跑完。如果跑完了去调result拿数据渲染map

```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
    "status": "running",
    "currentRound": 4
  }
}
```

### 2.4 获取模拟结果

**接口**: `GET /api/scenario1/simulation/{simulationId}/result`

**描述**: 获取模拟的详细结果数据

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
    "status": "completed",
    "round": 4,
    "summary": {
      "totalAgents": 10,
      "activeAgents": 8,
      "totalPosts": 15,
      "positiveSentiment": 0.3,
      "negativeSentiment": 0.4,
      "neutralSentiment": 0.3
    },
    "agents": [
      {
        "agentId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313_agent_0",
        "username": "Skeptical_Journalist",
        "description": "追求真相的调查记者，习惯于公开质疑。",
        "influenceScore": 80,
        "primaryPlatform": "Weibo/Twitter-like",
        "emotionalStyle": "尖锐批评型",
        "stanceScore": -2,
        "postsSent": 3,
        "latestPost": "#科技安全# 官方声明能否完全消除公众疑虑？",
        "isActive": true
      }
    ],
    "propagationPaths": [
      {
        "from": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313_agent_0",
        "content": "#科技安全# 官方声明能否完全消除公众疑虑？",
        "round": 4,
        "stance": -2
      }
    ]
  }
}
```

## 3. 网络可视化接口

### 3.1 获取网络拓扑数据

**接口**: `GET /api/scenario1/simulation/{simulationId}/network`

**描述**: 获取用于网络可视化的节点和边数据

**路径参数**:
- `simulationId`: 模拟ID

> 照理说这个接口只会在第一轮开始时被调用，用来构建静态网络拓扑（包括点和边，平台信息，可选人物身份信息，身份信息可以在一轮结束后再传过来）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313_agent_0",
        "username": "Skeptical_Journalist",
        "platform": "Weibo/Twitter-like",
        "influenceScore": 80,
        "sentiment": "negative"
      }
    ],
    "edges": [
      {
        "source": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313_agent_0",
        "target": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313_agent_1",
        "strength": 0.8,
        "type": "following"
      }
    ]
  }
}
```

## 4. 报告生成接口

### 4.1 生成分析报告

**接口**: `POST /api/scenario1/reports/generate`

**描述**: 生成Scenario 1的舆情分析报告

> 只有在轮次之间可以调用（设置按钮逻辑）

**请求体**:

```json
{
  "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
  "reportType": "comprehensive",
  "includeVisualizations": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "reportId": "report_12345678-1234-1234-1234-123456789012",
    "content": "## 舆情分析报告\n\n### 总体态势...",
    "summary": {
      "overallSentiment": -0.1,
      "keyInsights": [
        "公众对官方声明持怀疑态度",
        "需要更多透明度来建立信任"
      ],
      "improvements": [
        "增加数据使用透明度",
        "提供更多技术细节"
      ]
    },
    "generatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

## 5. 通用接口

### 5.1 重置模拟

**接口**: `POST /api/simulation/{simulationId}/reset`

**描述**: 重置模拟状态（通用接口）

**路径参数**:
- `simulationId`: 模拟ID

> 只需要告诉后端停下来，重置即可

**响应示例**:

```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario1_5a54fbeb-41c7-43f1-809a-4d09e6cbd313",
    "status": "reset",
    "message": "Simulation has been reset successfully"
  }
}
```

## 错误码说明

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `SESSION_NOT_FOUND` | 聊天会话不存在 | 404 |
| `SIMULATION_NOT_FOUND` | 模拟不存在 | 404 |
| `SIMULATION_ERROR` | 模拟执行错误 | 400 |
| `CASE_NOT_FOUND` | 案例不存在 | 404 |
| `NETWORK_ERROR` | 网络连接错误 | - |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |
