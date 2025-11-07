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

### 3.1 生成分析报告

**接口**: `POST /api/scenario1/reports/generate`

**描述**: 生成Scenario 1的舆情分析报告，使用9维度LLM驱动评估系统

**请求体**:
```json
{
  "simulationId": "sim_1759732135883",
  "reportType": "comprehensive",
  "includeVisualizations": true
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "reportId": "report_sim_1759732135883_1729987200",
    "reportType": "scenario1",
    "content": "# 舆情分析报告\n\n## 1. 舆情演变分析\n- 初始舆情状态：负面情绪占主导...\n\n## 2. 公关策略效果评估\n- 第一轮策略：立即道歉和暂停产品...\n\n## 3. 关键意见领袖分析\n- MarketingPro_Serena：影响力90分，态度转变明显...\n\n## 4. 不同平台的舆情差异\n- 微博/Twitter：讨论活跃，情绪波动较大...\n\n## 5. 改进建议\n- 增强对品牌公关策略的分析...\n- 加强对多样化公众人群反应的模拟...",
    "evaluation": {
      "evaluation_type": "standalone",
      "overall_ideal_achievement_percentage": 78.5,
      "rating": "良好 - 大部分达到理想效果",
      "dimension_scores": {
        "总体立场倾向": {
          "weight": 0.12,
          "details": {
            "category": "simulation_only",
            "description": "模拟中的总体立场倾向显示出明显的反对态度，反对者数量超过支持者，且平均立场为负值，反映出对品牌诚信和透明度的质疑。虽然有部分支持声音，但整体上公众对品牌恢复信任的前景持悲观态度，强调实质性改革的重要性。",
            "key_features": [
              "反对态度占主导地位",
              "平均立场为负值",
              "强调实质性改革需求"
            ],
            "ideal_achievement_percentage": 75.0,
            "reasoning": "当前模拟在总体立场倾向方面表现中等。虽然成功反映了公众对品牌诚信的质疑，但未能充分展现品牌恢复信任的可能性。建议在后续轮次中加强正面信息的传播，提升公众对品牌改进的信心。"
          }
        },
        "舆论演变方向": {
          "weight": 0.12,
          "details": {
            "category": "simulation_only",
            "description": "舆论演变整体走向趋向恶化，平均立场从0.11下降至-0.33，变化幅度达到0.44，显示出支持与反对意见的剧烈反转。",
            "key_features": [
              "立场变化幅度较大",
              "支持与反对意见反转",
              "整体趋势向负面发展"
            ],
            "ideal_achievement_percentage": 65.0,
            "reasoning": "舆论演变方向显示公关策略需要调整。当前策略未能有效扭转负面趋势，建议在后续轮次中采用更积极的沟通策略，及时回应公众关切。"
          }
        },
        "舆论分化程度": {
          "weight": 0.08,
          "details": {
            "category": "simulation_only",
            "description": "该模拟中舆论呈现出明显的分化特征，参与者的观点呈现出极端支持与极端反对的对立局面，导致整体舆论趋向极端化且缺乏中立意见。",
            "key_features": [
              "观点极端化明显",
              "缺乏中立意见",
              "支持与反对对立"
            ],
            "ideal_achievement_percentage": 70.0,
            "reasoning": "舆论分化程度较高，反映了争议性话题的特点。建议通过提供更多客观信息来减少极端化，促进理性讨论。"
          }
        },
        "关键转折点时机": {
          "weight": 0.08,
          "details": {
            "category": "simulation_only",
            "description": "在第3轮出现了显著的转折点，立场发生了恶化，平均立场下降幅度达到-0.56。",
            "key_features": [
              "第3轮出现转折点",
              "立场恶化明显",
              "下降幅度较大"
            ],
            "ideal_achievement_percentage": 60.0,
            "reasoning": "转折点时机显示公关策略在后期出现失误。建议优化策略执行时机，避免在关键时刻出现负面转折。"
          }
        },
        "核心争议焦点": {
          "weight": 0.15,
          "details": {
            "category": "simulation_only",
            "description": "公众讨论的焦点主要集中在品牌对AI产品的回应及透明度上，围绕品牌的声誉和消费者对产品安全的担忧形成。传递出对品牌责任感的期待。",
            "key_features": [
              "关注品牌回应透明度",
              "消费者安全担忧",
              "期待品牌责任感"
            ],
            "ideal_achievement_percentage": 80.0,
            "reasoning": "核心争议焦点把握准确，成功识别了公众的主要关切。建议继续围绕透明度和责任感进行沟通。"
          }
        },
        "主流论点": {
          "weight": 0.12,
          "details": {
            "category": "simulation_only",
            "description": "在AI产品争议案例中，强调了品牌恢复信任需要以透明和诚实为基础，消费者希望看到实际的行动而不仅是口头承诺。对品牌形象的脆弱性应给予重视，面对质疑时，企业必须展示出真诚的改进措施。",
            "key_features": [
              "强调透明和诚实",
              "期待实际行动",
              "重视品牌形象脆弱性"
            ],
            "ideal_achievement_percentage": 85.0,
            "reasoning": "主流论点分析准确，成功捕捉了公众对品牌改进的期待。建议在后续策略中更多展示具体行动。"
          }
        },
        "情绪基调": {
          "weight": 0.10,
          "details": {
            "category": "simulation_only",
            "description": "大部分发言者支持品牌通过透明和真诚来重建信任，但也有不少人对其诚意表示怀疑，认为应采取更多实质性措施。",
            "key_features": [
              "支持透明和真诚",
              "对诚意表示怀疑",
              "期待实质性措施"
            ],
            "ideal_achievement_percentage": 75.0,
            "reasoning": "情绪基调分析合理，反映了公众的复杂心理。建议通过具体行动来增强公众对品牌诚意的信心。"
          }
        },
        "公关策略响应模式": {
          "weight": 0.10,
          "details": {
            "category": "simulation_only",
            "description": "在多轮评审后，支持票和反对票接近平衡，显示出争议性。",
            "key_features": [
              "支持与反对接近平衡",
              "显示出争议性",
              "多轮评审结果"
            ],
            "ideal_achievement_percentage": 70.0,
            "reasoning": "公关策略响应模式显示策略效果有限。建议调整策略方向，增强说服力和影响力。"
          }
        },
        "次生话题扩散路径": {
          "weight": 0.13,
          "details": {
            "category": "simulation_only",
            "description": "品牌初始的公关回应是防御性和对抗性的，未能有效解决公众关切。",
            "key_features": [
              "防御性和对抗性回应",
              "未能解决公众关切",
              "初始策略存在问题"
            ],
            "ideal_achievement_percentage": 65.0,
            "reasoning": "次生话题扩散路径分析准确，识别了初始策略的问题。建议采用更积极的沟通方式。"
          }
        }
      },
      "summary": "【场景一：独立评估】\n\n本次模拟在9个关键维度上表现中等偏上，总体达标度为78.5%，评级为"良好"。\n\n**优势方面**：\n- 核心争议焦点把握准确，成功识别公众主要关切\n- 主流论点分析深入，准确捕捉公众期待\n- 情绪基调分析合理，反映公众复杂心理\n\n**改进空间**：\n- 舆论演变方向需要调整，当前策略未能扭转负面趋势\n- 关键转折点时机把握不当，后期出现负面转折\n- 公关策略响应模式效果有限，需要增强说服力\n\n**建议**：\n1. 优化策略执行时机，避免关键时刻出现负面转折\n2. 采用更积极的沟通策略，及时回应公众关切\n3. 通过具体行动增强公众对品牌诚意的信心\n4. 调整策略方向，增强说服力和影响力"
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
    "message": "Simulation ID 'xxx' does not exist.",
    "timestamp": "2024-01-01T12:00:00.000Z"
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
interface ReportResponse {
  reportId: string;                   // 报告ID
  reportType: string;                 // 报告类型 ("scenario1")
  content: string;                    // 报告内容 (Markdown格式)
  evaluation: {                       // 9维度评估结果
    evaluation_type: string;          // 评估类型 ("standalone")
    overall_ideal_achievement_percentage: number; // 总体达标度 0-100
    rating: string;                   // 评级文字
    dimension_scores: {               // 9个维度的详细评分
      [dimensionName: string]: {
        weight: number;               // 权重
        details: {
          category: string;            // 类别 ("simulation_only")
          description: string;        // 200-300字详细描述
          key_features: string[];     // 核心特征列表
          ideal_achievement_percentage: number; // 达标度分数
          reasoning: string;          // 详细推理说明
        };
      };
    };
    summary: string;                  // 评估总结
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

