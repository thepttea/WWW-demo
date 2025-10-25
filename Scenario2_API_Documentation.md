# Scenario 2 API 接口文档

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

---

## 1. 案例选择接口

### 1.1 获取历史案例列表

**接口**: `GET /api/scenario2/cases`

**描述**: 获取所有可用的历史公关案例列表（摘要信息）

**请求参数**: 无

**响应示例**:
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
      "totalRounds": 3
    },
    {
      "id": "case_002",
      "title": "Food Safety Crisis",
      "description": "A food brand encounters a health scare related to one of its products. The PR response focuses on transparency and consumer safety.",
      "industry": "food",
      "difficulty": "high",
      "totalRounds": 2
    }
  ]
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to load historical cases",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 1.2 获取案例详细信息

**接口**: `GET /api/scenario2/cases/{caseId}`

**描述**: 获取指定历史案例的完整详细信息，包括背景、策略和真实结果

**路径参数**:
- `caseId`: 案例ID（例如: `case_001`）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "case_001",
    "title": "Tech Product Controversy",
    "description": "A tech company faces backlash over a controversial product feature...",
    "background": "A major tech firm launched a new social media app with a feature that automatically shared users' locations with friends by default. This led to a massive public outcry over privacy concerns, with #TechGiantIsWatching trending globally. The company's stock dropped 15% within 48 hours.",
    "industry": "technology",
    "difficulty": "medium",
    "totalRounds": 3,
    "strategies": [
      {
        "round": 1,
        "title": "Initial Response",
        "content": "Immediately issue a public apology acknowledging the mistake. Temporarily disable the feature for all users. Promise a full review and a more transparent redesign.",
        "timeline": "Within 12 hours"
      },
      {
        "round": 2,
        "title": "Follow-up Actions",
        "content": "Publish a detailed blog post explaining what went wrong and the steps being taken. Announce the feature will be opt-in only in the future. Engage with privacy advocates and key tech journalists.",
        "timeline": "48-72 hours"
      },
      {
        "round": 3,
        "title": "Long-term Recovery",
        "content": "Launch a 'Privacy First' marketing campaign. Roll out the redesigned feature with clear, user-friendly privacy controls. Partner with a respected third-party for a security audit.",
        "timeline": "1-2 weeks"
      }
    ],
    "realWorldOutcome": {
      "success": true,
      "metrics": {
        "sentimentImprovement": 35,
        "mediaCoverage": "positive",
        "stockPrice": "+8% over 3 months"
      },
      "keyFactors": ["Quick apology", "Decisive action (disabling feature)", "Transparency"]
    }
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "Case with ID 'case_xxx' not found",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## 2. 模拟执行接口

### 2.1 启动模拟

**接口**: `POST /api/scenario2/simulation/start`

**描述**: 启动 Scenario 2 模拟。与 Scenario 1 不同，这里只需要传递 `caseId`，后端会自动读取案例的事件描述和第一轮策略

**请求体**:
```json
{
  "caseId": "case_001",
  "llmModel": "gpt-4o-mini",
  "simulationConfig": {
    "agents": 20,
    "num_rounds": 1,
    "interactionProbability": 0.7,
    "positiveResponseProbability": 0.3,
    "negativeResponseProbability": 0.2,
    "neutralResponseProbability": 0.5,
    "initialPositiveSentiment": 0.3,
    "initialNegativeSentiment": 0.4,
    "initialNeutralSentiment": 0.3
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_1759732135883",
    "status": "running",
    "caseId": "case_001",
    "currentRound": 1,
    "totalRounds": 3
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "CASE_NOT_FOUND",
    "message": "Case with ID 'case_xxx' not found",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 2.2 继续下一轮模拟

**接口**: `POST /api/scenario2/simulation/{simulationId}/next-round`

**描述**: 基于历史案例的下一轮策略，继续执行模拟。后端会自动读取案例中对应轮次的策略

**路径参数**:
- `simulationId`: 模拟ID

**请求体**: 无（策略从案例数据中自动读取）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_1759732135883",
    "status": "running",
    "currentRound": 2,
    "totalRounds": 3,
    "roundStrategy": {
      "round": 2,
      "title": "Follow-up Actions",
      "content": "Publish a detailed blog post explaining what went wrong..."
    }
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "SIMULATION_ERROR",
    "message": "Simulation has already completed all rounds",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 2.3 获取模拟状态

**接口**: `GET /api/scenario2/simulation/{simulationId}/status`

**描述**: 获取模拟的当前状态信息，用于轮询

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_1759732135883",
    "status": "running",
    "currentRound": 2,
    "totalRounds": 3,
    "progress": 66,
    "message": "Simulation is running"
  }
}
```

**状态说明**:
- `initial`: 初始状态
- `running`: 运行中
- `completed`: 已完成（所有轮次完成）
- `error`: 错误状态

---

### 2.4 获取模拟结果

**接口**: `GET /api/scenario2/simulation/{simulationId}/result`

**描述**: 获取模拟的详细结果数据，包括网络可视化数据和agent决策信息

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_scenario2_1759732135883",
    "caseId": "case_001",
    "status": "completed",
    "currentRound": 3,
    "eventDescription": "某知名科技公司发布了一款具有争议性的AI产品...",
    "executedStrategies": [
      {
        "round": 1,
        "title": "Initial Response",
        "content": "Immediately issue a public apology...",
        "timestamp": "2024-10-03T10:00:00Z"
      },
      {
        "round": 2,
        "title": "Follow-up Actions",
        "content": "Publish a detailed blog post...",
        "timestamp": "2024-10-03T10:30:00Z"
      },
      {
        "round": 3,
        "title": "Long-term Recovery",
        "content": "Launch a 'Privacy First' marketing campaign...",
        "timestamp": "2024-10-03T11:00:00Z"
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
        "final_decision": "这个AI产品代表了技术发展的未来方向...",
        "contextual_memories": ["作为营销专家，我看到了这个AI产品的巨大商业潜力..."],
        "short_term_memories": ["AI产品争议是正常的，关键是引导舆论向积极方向发展"]
      }
    ],
    "platforms": [
      {
        "name": "Weibo/Twitter-like",
        "type": "social_media",
        "userCount": 4,
        "activeUsers": ["MarketingPro_Serena", "Skeptical_Journalist"],
        "message_propagation": [
          {
            "sender": "MarketingPro_Serena",
            "receivers": ["Skeptical_Journalist", "TechBro_Elon"],
            "content": "这个AI产品代表了技术发展的未来方向...",
            "sentiment": "positive",
            "timestamp": "2024-10-03T10:15:00Z"
          }
        ]
      }
    ],
    "sentimentSummary": {
      "positive": 45,
      "negative": 20,
      "neutral": 35
    }
  }
}
```

---

## 3. 报告生成接口

### 3.1 生成对比分析报告

**接口**: `POST /api/scenario2/simulation/{simulationId}/generate-report`

**描述**: 生成 Scenario 2 的对比分析报告，对比模拟结果与历史真实结果

**路径参数**:
- `simulationId`: 模拟ID

**请求体**: 
```json
{
  "reportType": "comparison",
  "includeVisualizations": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "reportId": "report_scenario2_1759732135883",
    "simulationId": "sim_scenario2_1759732135883",
    "caseId": "case_001",
    "caseTitle": "Tech Product Controversy",
    "comparisonAnalysis": {
      "accuracyScore": 87,
      "rating": "High Accuracy",
      "simulatedOutcome": {
        "sentimentDistribution": {
          "positive": 45,
          "negative": 20,
          "neutral": 35
        },
        "overallSentiment": 72,
        "engagementRate": 15.3,
        "reach": 850
      },
      "realWorldOutcome": {
        "success": true,
        "sentimentImprovement": 35,
        "mediaCoverage": "positive",
        "stockPrice": "+8% over 3 months",
        "keyFactors": ["Quick apology", "Decisive action", "Transparency"]
      },
      "alignment": {
        "sentimentAlignment": 92,
        "outcomeAlignment": 85,
        "trendAlignment": 88
      }
    },
    "keyInsights": "The simulation successfully predicted the positive outcome of the PR strategy. The sentiment distribution closely matches reported media coverage patterns. The model accurately captured the importance of quick response and transparency.",
    "deviations": [
      "Simulation slightly overestimated negative sentiment in Round 1",
      "Engagement rate prediction was 2% higher than actual"
    ],
    "modelValidation": {
      "strengths": [
        "Accurate prediction of overall sentiment trend",
        "Successfully identified key influencers",
        "Realistic propagation patterns"
      ],
      "improvements": [
        "Fine-tune initial sentiment distribution",
        "Improve engagement rate modeling"
      ]
    },
    "visualizations": {
      "sentimentComparison": {
        "simulated": { "positive": 45, "negative": 20, "neutral": 35 },
        "estimated_real": { "positive": 48, "negative": 18, "neutral": 34 }
      },
      "timelineComparison": [
        {
          "round": 1,
          "simulated_sentiment": 58,
          "estimated_real_sentiment": 55
        },
        {
          "round": 2,
          "simulated_sentiment": 68,
          "estimated_real_sentiment": 70
        },
        {
          "round": 3,
          "simulated_sentiment": 72,
          "estimated_real_sentiment": 75
        }
      ]
    },
    "generatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "SIMULATION_NOT_FOUND",
    "message": "Simulation not found or not completed",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 3.2 获取分析结果数据

**接口**: `GET /api/scenario2/simulation/{simulationId}/analysis`

**描述**: 获取模拟的详细分析数据，用于结果页面展示

**路径参数**:
- `simulationId`: 模拟ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "accuracyScore": 87,
    "simulatedSentiment": {
      "positive": 45,
      "negative": 20,
      "neutral": 35
    },
    "comparisonMetrics": {
      "sentimentAlignment": 92,
      "outcomeAlignment": 85,
      "trendAlignment": 88
    },
    "keyFindings": [
      "High accuracy in predicting overall sentiment",
      "Successfully identified key influencers",
      "Minor deviation in engagement rate"
    ],
    "realWorldComparison": {
      "success": true,
      "sentimentImprovement": 35,
      "mediaCoverage": "positive"
    }
  }
}
```

---

## 4. 数据模型说明

### 4.1 历史案例模型 (HistoricalCase)

```typescript
interface HistoricalCase {
  id: string;                           // 案例ID
  title: string;                        // 案例标题
  description: string;                  // 简要描述
  background: string;                   // 详细背景
  industry: string;                     // 行业分类
  difficulty: string;                   // 难度等级 (low/medium/high)
  totalRounds: number;                  // 总轮次数
  strategies: HistoricalPRStrategy[];   // 各轮次策略
  realWorldOutcome: RealWorldOutcome;   // 真实结果
}
```

### 4.2 历史策略模型 (HistoricalPRStrategy)

```typescript
interface HistoricalPRStrategy {
  round: number;          // 轮次编号
  title: string;          // 策略标题
  content: string;        // 策略内容
  timeline: string;       // 执行时间线
}
```

### 4.3 真实结果模型 (RealWorldOutcome)

```typescript
interface RealWorldOutcome {
  success: boolean;       // 是否成功
  metrics: {
    sentimentImprovement: number | string;  // 情感改善程度
    mediaCoverage: string;                  // 媒体报道情况
    stockPrice: string;                     // 股价变化
  };
  keyFactors: string[];   // 关键成功因素
}
```

### 4.4 模拟状态模型 (Scenario2SimulationStatus)

```typescript
interface Scenario2SimulationStatus {
  simulationId: string;               // 模拟ID
  caseId: string;                     // 案例ID
  status: 'initial' | 'running' | 'completed' | 'error';
  currentRound: number;               // 当前轮次
  totalRounds: number;                // 总轮次数
  progress: number;                   // 进度百分比 (0-100)
  message?: string;                   // 状态消息
}
```

### 4.5 对比分析报告模型 (ComparisonReport)

```typescript
interface ComparisonReport {
  reportId: string;                   // 报告ID
  simulationId: string;               // 模拟ID
  caseId: string;                     // 案例ID
  caseTitle: string;                  // 案例标题
  comparisonAnalysis: {
    accuracyScore: number;            // 准确度分数 0-100
    rating: string;                   // 评级
    simulatedOutcome: {               // 模拟结果
      sentimentDistribution: {
        positive: number;
        negative: number;
        neutral: number;
      };
      overallSentiment: number;
      engagementRate: number;
      reach: number;
    };
    realWorldOutcome: RealWorldOutcome;  // 真实结果
    alignment: {                      // 对齐度
      sentimentAlignment: number;
      outcomeAlignment: number;
      trendAlignment: number;
    };
  };
  keyInsights: string;                // 关键洞察
  deviations: string[];               // 偏差说明
  modelValidation: {                  // 模型验证
    strengths: string[];
    improvements: string[];
  };
  visualizations?: any;               // 可视化数据
  generatedAt: string;                // 生成时间
}
```

---

## 5. 与 Scenario 1 的接口差异对比

| 功能 | Scenario 1 | Scenario 2 |
|------|-----------|-----------|
| **初始输入** | 用户输入事件描述和策略 | 选择案例ID，自动读取 |
| **策略来源** | 用户手动输入/LLM优化 | 从案例数据自动读取 |
| **轮次推进** | `POST /add-strategy` 需要传入策略 | `POST /next-round` 自动读取 |
| **报告类型** | 舆情分析报告（PR效果评估） | 对比报告（模拟vs真实） |
| **核心指标** | PR Effectiveness, Sentiment Trend | Accuracy Score, Alignment |
| **LLM Chat** | 有策略优化Chat界面 | 无（直接使用历史策略） |

---

## 6. 错误码说明

| 错误码 | 描述 | HTTP状态码 |
|--------|------|------------|
| `CASE_NOT_FOUND` | 历史案例不存在 | 404 |
| `SIMULATION_NOT_FOUND` | 模拟不存在 | 404 |
| `SIMULATION_ERROR` | 模拟执行错误 | 400 |
| `ROUND_LIMIT_EXCEEDED` | 已达最大轮次 | 400 |
| `NETWORK_ERROR` | 网络连接错误 | - |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |

---

## 7. 前端工作流程

### 7.1 案例选择流程

1. **加载案例列表**: 页面加载时调用 `GET /api/scenario2/cases`
2. **选择案例**: 用户点击案例 → 调用 `GET /api/scenario2/cases/{caseId}` 获取详情
3. **显示详情**: 在右侧显示案例背景、策略预览等信息

### 7.2 模拟执行流程

1. **启动模拟**: 调用 `POST /api/scenario2/simulation/start`（传入caseId）
2. **轮询状态**: 每1秒调用 `GET /api/scenario2/simulation/{simulationId}/status`
3. **获取轮次结果**: 
   - `status: completed` → 调用 `GET /api/scenario2/simulation/{simulationId}/result`
   - 显示当前轮次的网络可视化
4. **继续下一轮**: 用户点击"下一轮" → 调用 `POST /api/scenario2/simulation/{simulationId}/next-round`
5. **重复步骤2-4**，直到所有轮次完成

### 7.3 报告生成流程

1. **生成报告**: 所有轮次完成后，调用 `POST /api/scenario2/simulation/{simulationId}/generate-report`
2. **显示对比**: 展示模拟结果 vs 真实结果的对比分析
3. **验证模型**: 显示准确度评分和模型验证信息

---

## 8. 注意事项

1. **自动策略读取**: Scenario 2 的策略由后端从案例数据中自动读取，前端无需传入
2. **轮次控制**: 每个案例的 `totalRounds` 决定了最大轮次数，超过后无法继续
3. **真实结果对比**: 报告中的对比分析是 Scenario 2 的核心价值
4. **数据完整性**: 确保历史案例数据包含完整的策略和真实结果信息
5. **状态管理**: 模拟完成后状态变为 `completed`，可以生成报告
6. **多轮可视化**: 每一轮完成后都应该展示该轮的网络传播情况

---

## 9. 示例：完整的前端交互流程

```javascript
// 1. 加载案例列表
const casesResponse = await apiClient.getHistoricalCases();
const cases = casesResponse.data;

// 2. 选择案例
const caseDetailResponse = await apiClient.getHistoricalCaseDetail('case_001');
const selectedCase = caseDetailResponse.data;

// 3. 启动模拟
const startResponse = await apiClient.startScenario2Simulation({
  caseId: 'case_001',
  llmModel: 'gpt-4',
  simulationConfig: { /* ... */ }
});
const simulationId = startResponse.data.simulationId;

// 4. 轮询状态
const statusInterval = setInterval(async () => {
  const statusResponse = await apiClient.getSimulationStatus(simulationId);
  if (statusResponse.data.status === 'completed') {
    clearInterval(statusInterval);
    // 5. 获取结果
    const resultResponse = await apiClient.getScenario2Result(simulationId);
    displayResults(resultResponse.data);
  }
}, 1000);

// 6. 继续下一轮
const nextRoundResponse = await apiClient.advanceScenario2NextRound(simulationId);

// 7. 生成报告（所有轮次完成后）
const reportResponse = await apiClient.generateScenario2Report(simulationId);
displayComparisonReport(reportResponse.data);
```

---

## 10. 开发建议

1. **前端复用**: Scenario 2 可以复用 Scenario 1 的网络可视化组件
2. **轮次展示**: 建议使用 Steps 组件展示当前进行到第几轮
3. **对比展示**: 报告页面使用对比布局（左侧模拟、右侧真实）
4. **准确度可视化**: 使用进度条或仪表盘展示准确度分数
5. **案例筛选**: 可以增加按行业、难度筛选案例的功能

