# EchoChamber Multi-Agent 舆论模拟系统 API 文档

## 概述

本文档描述了EchoChamber多智能体舆论模拟系统的前后端接口规范。系统支持两种主要场景：
- **Scenario 1**: 用户输入公关场景和策略，通过LLM优化后进行模拟
- **Scenario 2**: 选择历史公关案例，通过LLM+Agent模拟并与真实结果对比

## 基础信息

- **API基础URL**: `http://localhost:8000/api`
- **WebSocket URL**: `ws://localhost:8000/ws`
- **认证方式**: 暂不需要（可根据需要添加JWT）
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 1. Scenario 1 相关接口

### 1.1 LLM策略优化接口

#### 1.1.1 初始化LLM对话会话

> 考虑到用户不止模拟一个公关场景，需要给一个初始化Chat的口，做在前端就是一个按钮。这个请求主要是为了启动一个session。后端LLM应当有一个固定System Prompt，前端用户只需要输入策略即可。

```http
GET /api/scenario1/chat/init
```

**响应示例：**

> 这里的content就是后端输入system prompt后LLM的返回内容

```json
{
  "success": true,
  "data": {
    "sessionId": "chat_session_12345",
    "content": "你好！我来帮助你制定完美的公关策略。请描述一下情况和你的目标。",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.1.2 发送聊天消息

> 绑定在发送按钮上

```http
POST /api/scenario1/chat/message
```

**请求体：**
```json
{
  "sessionId": "chat_session_12345",
  "message": "我们需要在24小时内回应，强调客户安全是我们的首要任务",
  "messageType": "user"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_67890",
    "content": "基于你提供的信息，我建议采用以下策略：\n1. 立即发布公开声明...",
    "messageType": "llm",
    "timestamp": "2024-01-15T10:31:00Z"
  }
}
```

#### 1.1.3 获取聊天历史

> 同一窗口内的交互通过发一个收一个的形式动态渲染在前端。
>
> 如果用户退出该页面再次进入，需要调用这个接口来显示上一次的聊天历史内容。当然，如果用户想要新开一个聊天页面，点击按钮调用上面的init接口即可。

```http
GET /api/scenario1/chat/{sessionId}/history
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "sessionId": "chat_session_12345",
    "messages": [
      {
        "id": "msg_12345",
        "type": "llm",
        "content": "你好！我来帮助你制定完美的公关策略...",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg_67890",
        "type": "user",
        "content": "我们需要在24小时内回应...",
        "timestamp": "2024-01-15T10:31:00Z"
      }
    ]
  }
}
```

### 1.2 模拟配置和执行接口

#### 1.2.1 启动Scenario 1模拟
```http
POST /api/scenario1/simulation/start
```

**请求体：**

> 这里的config看系统需要什么参数

```json
{
  "llmModel": "gpt-4-turbo",
  "strategy": "经过优化的最终公关策略内容",
  "simulationConfig": {
    "agents": 100,
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

**响应示例：**

```json
{
  "success": true,
  "data": {
    "simulationId": "sim_12345",
    "status": "started",
    "websocketUrl": "ws://localhost:8000/ws/simulation/sim_12345"
  }
}
```

#### 1.2.2 获取模拟状态

> 用于在模拟运行过程中检查状态，比如用户刷新页面后需要恢复模拟状态，或者在前端需要显示当前进度时调用

```http
GET /api/scenario1/simulation/{simulationId}/status
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_12345",
    "status": "running",
    "progress": 45,
    "currentRound": 2,
    "totalRounds": 5,
    "activeAgents": 87,
    "totalPosts": 156
  }
}
```

#### 1.2.3 获取模拟结果

> 每轮。添加一个所有node的立场值，用于可视化（需要后端支持）
>
> 预期通过这个接口来渲染模拟出的传播过程

```http
GET /api/scenario1/simulation/{simulationId}/result
```

**响应示例：**
```json
{
  "success": true,
  "round": 2,
  "data": {
    "simulationId": "sim_12345",
    "status": "completed",
    "summary": {
      "totalAgents": 100,
      "activeAgents": 95,
      "totalPosts": 234,
      "positiveSentiment": 0.45,
      "negativeSentiment": 0.35,
      "neutralSentiment": 0.20
    },
    "agents": [
      {
        "nodeId": 1,
        "value": 70,
        "postSend": 3,
        "postReceived": 2
      }
    ],
    "propagationPaths": [
      {
        "from": "agent_1",
        "to": "agent_15",
        "content": "传播的内容片段"
      }
    ]
  }
}
```

### 1.3 可视化数据接口

#### 1.3.1 获取网络拓扑数据

> 获取网络结构（偏静态），在最开始的时候渲染出网络静态结构

```http
GET /api/scenario1/simulation/{simulationId}/network
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "agent_1",
        "username": "User1",
        "platform": "Weibo/Twitter-like",
        "influenceScore": 75,
        "sentiment": "positive",
        "position": {"x": 100, "y": 200}
      }
    ],
    "edges": [
      {
        "source": "agent_1",
        "target": "agent_2",
        "strength": 0.8,
        "type": "mutual"
      }
    ],
    "propagationTimeline": [
      {
        "round": 1,
        "activeNodes": 50,
        "newPosts": 25
      }
    ]
  }
}
```

---

## 2. Scenario 2 相关接口

### 2.1 历史案例管理接口

#### 2.1.1 获取历史案例列表
```http
GET /api/scenario2/cases
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "case_001",
      "title": "Tech Product Controversy",
      "description": "A tech company faces backlash over a controversial product feature. The PR team must address user concerns and restore trust.",
      "industry": "technology",
      "difficulty": "medium",
      "totalRounds": 3,
    },
    {
      "id": "case_002",
      "title": "Food Safety Crisis",
      "description": "A food brand encounters a health scare related to one of its products. The PR response focuses on transparency and consumer safety.",
      "industry": "food",
      "difficulty": "high",
      "totalRounds": 4,
    }
  ]
}
```

#### 2.1.2 获取案例详细信息
```http
GET /api/scenario2/cases/{caseId}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": "case_001",
    "title": "Tech Product Controversy",
    "description": "A tech company faces backlash over a controversial product feature...",
    "background": "详细的事件背景信息...",
    "totalRounds": 3,
    "strategies": [
      {
        "round": 1,
        "title": "Initial Response",
        "content": "第一轮公关策略内容...",
        "timeline": "24小时内"
      },
      {
        "round": 2,
        "title": "Follow-up Actions",
        "content": "第二轮公关策略内容...",
        "timeline": "48-72小时"
      },
      {
        "round": 3,
        "title": "Long-term Recovery",
        "content": "第三轮公关策略内容...",
        "timeline": "1-2周"
      }
    ],
    "realWorldOutcome": {
      "success": true,
      "metrics": {
        "sentimentImprovement": 25,
        "mediaCoverage": "positive",
        "stockPrice": "+5%"
      },
      "keyFactors": ["快速响应", "透明沟通", "产品改进"]
    }
  }
}
```

### 2.2 Scenario 2模拟执行接口

#### 2.2.1 启动Scenario 2模拟
```http
POST /api/scenario2/simulation/start
```

**请求体：**
```json
{
  "caseId": "case_001",
  "llmModel": "gpt-4-turbo",
  "simulationConfig": {
    "agents": 100,
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

**响应示例：**
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_12345",
    "caseId": "case_001",
    "status": "started",
    "totalRounds": 3,
    "currentRound": 1,
    "websocketUrl": "ws://localhost:8000/ws/simulation/sim_scenario2_12345"
  }
}
```

#### 2.2.2 继续下一轮模拟
```http
POST /api/scenario2/simulation/{simulationId}/next-round
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_12345",
    "currentRound": 2,
    "status": "running",
    "roundStrategy": "第二轮公关策略内容..."
  }
}
```

#### 2.2.3 获取Scenario 2模拟结果

> 每轮结果，返回格式与Scenario 1类似，但包含真实世界对比数据

```http
GET /api/scenario2/simulation/{simulationId}/result
```

**响应示例：**
```json
{
  "success": true,
  "round": 2,
  "data": {
    "simulationId": "sim_scenario2_12345",
    "caseId": "case_001",
    "status": "running",
    "summary": {
      "totalAgents": 100,
      "activeAgents": 95,
      "totalPosts": 234,
      "positiveSentiment": 0.45,
      "negativeSentiment": 0.35,
      "neutralSentiment": 0.20
    },
    "agents": [
      {
        "nodeId": 1,
        "value": 70,
        "postSend": 3,
        "postReceived": 2
      }
    ],
    "realWorldComparison": {
      "round": 2,
      "realWorldSentiment": 0.52,
      "simulationSentiment": 0.45,
      "accuracy": 0.87
    },
    "propagationPaths": [
      {
        "from": "agent_1",
        "to": "agent_15",
        "content": "传播的内容片段"
      }
    ]
  }
}
``` 



---

## 3. WebSocket实时通信接口

> WebSocket用于实时更新模拟进度和网络状态，具体用途包括：
> - 实时显示模拟进度条
> - 动态更新网络可视化中的节点状态
> - 推送每轮模拟完成的通知
> - 实时显示agent的立场变化
> - 推送模拟错误和异常信息

### 3.1 模拟进度更新
```javascript
// 连接WebSocket
const ws = new WebSocket('ws://localhost:8000/ws/simulation/{simulationId}');

// 监听消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  switch(data.type) {
    case 'progress_update':
      // 更新进度条和状态信息
      updateProgress(data.progress);
      updateStatus(data.status);
      break;
    case 'round_complete':
      // 轮次完成，更新UI状态
      handleRoundComplete(data.round);
      enableNextRoundButton();
      break;
    case 'simulation_complete':
      // 模拟完成，显示结果
      handleSimulationComplete(data.result);
      showResultsButton();
      break;
    case 'agent_update':
      // 更新单个agent的状态
      updateAgentStatus(data.agentId, data.sentiment, data.position);
      break;
    case 'network_update':
      // 更新网络可视化
      updateNetworkVisualization(data.networkData);
      break;
    case 'error':
      // 错误处理
      handleError(data.error);
      break;
  }
};
```

### 3.2 实时网络数据更新
```javascript
// WebSocket消息示例
const messageTypes = {
  // 进度更新
  progress_update: {
    type: 'progress_update',
    progress: 45,
    currentRound: 2,
    totalRounds: 5,
    activeAgents: 87
  },
  
  // 轮次完成
  round_complete: {
    type: 'round_complete',
    round: 2,
    roundData: {
      posts: 25,
      sentimentChange: 0.05,
      activeAgents: 90
    }
  },
  
  // Agent状态更新
  agent_update: {
    type: 'agent_update',
    agentId: 'agent_23',
    sentiment: 'positive',
    position: { x: 100, y: 200 },
    influenceScore: 85
  },
  
  // 网络结构更新
  network_update: {
    type: 'network_update',
    networkData: {
      newConnections: [
        { from: 'agent_1', to: 'agent_5', strength: 0.8 }
      ],
      updatedNodes: [
        { id: 'agent_1', sentiment: 'positive', influenceScore: 90 }
      ]
    }
  }
};
```

---

## 4. 通用接口

### 4.1 Scenario 1 生成分析报告

> 生成Scenario 1的舆情分析报告，包含模拟结果和改进建议

```http
POST /api/scenario1/reports/generate
```

**请求体：**
```json
{
  "simulationId": "sim_12345",
  "reportType": "comprehensive", // "summary", "comprehensive"
  "includeVisualizations": true
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "reportId": "report_scenario1_12345",
    "content": "舆情分析报告内容...",
    "summary": {
      "overallSentiment": 0.45,
      "keyInsights": ["关键洞察1", "关键洞察2"],
      "improvements": ["改进建议1", "改进建议2"]
    },
    "visualizations": {
      "sentimentChart": "base64_encoded_chart",
      "networkGraph": "base64_encoded_graph"
    },
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.2 Scenario 2 生成对比报告

> 生成Scenario 2的对比分析报告，包含模拟结果与真实结果的对比

```http
POST /api/scenario2/reports/generate
```

**请求体：**
```json
{
  "simulationId": "sim_scenario2_12345",
  "reportType": "comparison", // "simulation_only", "real_world_only", "comparison"
  "includeVisualizations": true
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "reportId": "report_scenario2_12345",
    "simulationReport": {
      "content": "模拟结果报告内容...",
      "summary": {
        "overallSentiment": 0.45,
        "keyInsights": ["模拟关键洞察1", "模拟关键洞察2"]
      }
    },
    "realWorldReport": {
      "content": "真实世界结果报告内容...",
      "summary": {
        "overallSentiment": 0.52,
        "keyInsights": ["真实关键洞察1", "真实关键洞察2"]
      }
    },
    "comparison": {
      "accuracy": 0.87,
      "keyDifferences": ["主要差异1", "主要差异2"],
      "recommendations": ["改进建议1", "改进建议2"]
    },
    "visualizations": {
      "comparisonChart": "base64_encoded_chart",
      "accuracyGraph": "base64_encoded_graph"
    },
    "generatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.3 重置模拟
```http
POST /api/simulation/{simulationId}/reset
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_12345",
    "status": "reset",
    "message": "Simulation has been reset successfully"
  }
}
```

## 5. 错误处理

### 5.1 标准错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "SIMULATION_NOT_FOUND",
    "message": "Simulation with ID sim_12345 not found",
    "details": "The requested simulation may have expired or been deleted",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 5.2 常见错误代码
- `INVALID_SIMULATION_ID`: 无效的模拟ID
- `SIMULATION_NOT_FOUND`: 模拟不存在
- `SIMULATION_ALREADY_RUNNING`: 模拟已在运行
- `INVALID_LLM_MODEL`: 无效的LLM模型
- `INSUFFICIENT_AGENTS`: Agent数量不足
- `NETWORK_ERROR`: 网络连接错误
- `LLM_SERVICE_ERROR`: LLM服务错误

---

## 6. 数据模型

### 6.1 模拟配置模型

> 加入LLM选项

```typescript
interface SimulationConfig {
  llmModel: string;
  agents: number;
  interactionProbability: number;
  positiveResponseProbability: number;
  negativeResponseProbability: number;
  neutralResponseProbability: number;
  initialPositiveSentiment: number;
  initialNegativeSentiment: number;
  initialNeutralSentiment: number;
}
```

### 6.2 Agent模型

> position 不一定需要

```typescript
interface Agent {
  id: string;
  username: string;
  platform: string;
  influenceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  position?: { x: number; y: number }; // 可选，用于可视化
  postSend?: number; // 发送的帖子数量
  postReceived?: number; // 接收的帖子数量
}
```

### 6.3 网络边模型
```typescript
interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
  type: 'mutual' | 'following' | 'recommended';
}
```

### 6.4 聊天消息模型
```typescript
interface ChatMessage {
  id: string;
  type: 'user' | 'llm';
  content: string;
  timestamp: string;
  sessionId: string;
}
```

### 6.5 历史案例模型
```typescript
interface HistoricalCase {
  id: string;
  title: string;
  description: string;
  background: string;
  industry: string;
  difficulty: 'easy' | 'medium' | 'hard';
  totalRounds: number;
  strategies: CaseStrategy[];
  realWorldOutcome: RealWorldOutcome;
}

interface CaseStrategy {
  round: number;
  title: string;
  content: string;
  timeline: string;
}

interface RealWorldOutcome {
  success: boolean;
  metrics: {
    sentimentImprovement: number;
    mediaCoverage: string;
    stockPrice: string;
  };
  keyFactors: string[];
}
```

---

## 7. 接口使用示例

### 7.1 Scenario 1 完整流程示例

```javascript
// 1. 初始化聊天会话
const session = await fetch('/api/scenario1/chat/init', {
  method: 'GET'
}).then(r => r.json());

// 3. 发送消息进行策略优化
const response = await fetch('/api/scenario1/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: session.data.sessionId,
    message: '我们需要快速响应...',
    messageType: 'user'
  })
}).then(r => r.json());

// 4. 启动模拟
const simulation = await fetch('/api/scenario1/simulation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    llmModel: 'gpt-4-turbo',
    strategy: '优化后的策略...',
    simulationConfig: { 
      llmModel: 'gpt-4-turbo',
      agents: 100, 
      interactionProbability: 0.5,
      positiveResponseProbability: 0.3,
      negativeResponseProbability: 0.3,
      neutralResponseProbability: 0.4,
      initialPositiveSentiment: 0.2,
      initialNegativeSentiment: 0.6,
      initialNeutralSentiment: 0.2
    }
  })
}).then(r => r.json());

// 5. 监听WebSocket更新
const ws = new WebSocket(simulation.data.websocketUrl);
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理实时更新
};
```

### 7.2 Scenario 2 完整流程示例

```javascript
// 1. 获取历史案例列表
const cases = await fetch('/api/scenario2/cases').then(r => r.json());

// 2. 获取选定案例详情
const caseDetail = await fetch(`/api/scenario2/cases/${cases.data[0].id}`).then(r => r.json());

// 3. 启动Scenario 2模拟
const simulation = await fetch('/api/scenario2/simulation/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caseId: caseDetail.data.id,
    llmModel: 'gpt-4-turbo',
    simulationConfig: { agents: 100, ... }
  })
}).then(r => r.json());

// 4. 继续下一轮
const nextRound = await fetch(`/api/scenario2/simulation/${simulation.data.simulationId}/next-round`, {
  method: 'POST'
}).then(r => r.json());

// 5. 获取最终结果和对比
const results = await fetch(`/api/scenario2/simulation/${simulation.data.simulationId}/result`).then(r => r.json());
```

