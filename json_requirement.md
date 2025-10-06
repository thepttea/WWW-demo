# 后端JSON数据格式需求文档

## 概述
本文档定义了EchoChamber多智能体舆论模拟系统后端需要提供的数据格式。基于前端实际使用情况，我们移除了不必要的字段，优化了数据结构。

## 1. 模拟数据格式 (Simulation Data)

### 1.1 基础信息
```json
{
  "simulationId": "string",           // 模拟ID
  "status": "string",                 // 状态: "running" | "completed" | "error"
  "currentRound": "number",           // 当前轮次
  "eventDescription": "string"        // 事件描述
}
```

### 1.2 公关策略历史
```json
{
  "prStrategies": [
    {
      "round": "number",              // 轮次
      "strategy": "string",           // 策略内容
      "timestamp": "string"           // ISO时间戳
    }
  ]
}
```

### 1.3 用户数据
```json
{
  "users": [
    {
      "username": "string",           // 用户名 (必需)
      "description": "string",         // 用户描述 (必需)
      "influence_score": "number",     // 影响力分数 0-100 (必需)
      "primary_platform": "string",   // 主要平台 (必需)
      "emotional_style": "string",     // 情感风格 (必需)
      "final_decision": "string",      // 最终决策/观点 (必需)
      "objective_stance_score": "number", // 立场分数 -3到3 (必需)
      "contextual_memories": ["string"], // 上下文记忆 (必需)
      "short_term_memories": ["string"]  // 短期记忆 (必需)
    }
  ]
}
```

### 1.4 平台数据
```json
{
  "platforms": [
    {
      "name": "string",               // 平台名称 (必需)
      "type": "string",               // 平台类型 (必需)
      "userCount": "number",          // 用户数量 (必需)
      "activeUsers": ["string"],      // 活跃用户列表 (必需)
      "message_propagation": [         // 消息传播数据 (必需)
        {
          "sender": "string",         // 发送者
          "receivers": ["string"],    // 接收者列表
          "content": "string",        // 消息内容
          "sentiment": "string",      // 情感: "positive" | "negative" | "neutral"
          "timestamp": "string"       // ISO时间戳
        }
      ]
    }
  ]
}
```

## 2. 分析结果数据格式 (Analysis Results)

### 2.1 核心指标
```json
{
  "overallSentiment": "number",       // 整体情感分数 0-100
  "engagementRate": "number",         // 参与率百分比
  "reach": "number",                  // 触达人数 (K为单位)
  "prEffectiveness": "number"         // PR效果分数 0-100
}
```

### 2.2 趋势数据
```json
{
  "sentimentTrend": "string",         // 情感趋势 "+12%"
  "trendData": {
    "positive": "string",             // 正面趋势 "+8%"
    "engagement": "string",           // 参与趋势 "+8%"
    "reach": "string"                 // 触达趋势 "+15%"
  }
}
```

### 2.3 情感分布
```json
{
  "sentimentDistribution": {
    "positive": "number",             // 正面情感百分比
    "neutral": "number",              // 中性情感百分比
    "negative": "number"              // 负面情感百分比
  }
}
```

### 2.4 效果评级
```json
{
  "effectivenessRating": {
    "score": "number",                // 效果分数
    "rating": "string",               // 评级: "Excellent" | "Good" | "Needs Improvement"
    "thresholds": {
      "excellent": "number",          // 优秀阈值
      "good": "number"                // 良好阈值
    }
  }
}
```

### 2.5 分析洞察
```json
{
  "keyInsights": "string",            // 关键洞察文本
  "recommendations": ["string"]       // 改进建议列表
}
```

### 2.6 关键影响者
```json
{
  "influentialNodes": [
    {
      "node": "string",               // 影响者名称
      "influenceScore": "number",     // 影响力分数 0-100
      "sentiment": "string",          // 情感倾向
      "reach": "number"               // 触达人数
    }
  ]
}
```

## 3. 完整数据格式示例

### 3.1 模拟数据完整示例
```json
{
  "simulationId": "sim_scenario1_demo_001",
  "status": "completed",
  "currentRound": 1,
  "eventDescription": "某知名科技公司发布了一款具有争议性的AI产品...",
  "prStrategies": [
    {
      "round": 1,
      "strategy": "我们高度重视用户的隐私保护...",
      "timestamp": "2024-10-03T10:00:00Z"
    }
  ],
  "users": [
    {
      "username": "MarketingPro_Serena",
      "influence_score": 90,
      "primary_platform": "Weibo/Twitter-like",
      "emotional_style": "激情支持型",
      "final_decision": "这个AI产品代表了技术发展的未来方向...",
      "objective_stance_score": 2
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
          "timestamp": "2024-10-03T10:00:00Z"
        }
      ]
    }
  ]
}
```

### 3.2 分析结果完整示例
```json
{
  "overallSentiment": 72,
  "engagementRate": 15.3,
  "reach": 850,
  "prEffectiveness": 85,
  "sentimentTrend": "+12%",
  "trendData": {
    "positive": "+8%",
    "engagement": "+8%",
    "reach": "+15%"
  },
  "sentimentDistribution": {
    "positive": 45,
    "neutral": 35,
    "negative": 20
  },
  "effectivenessRating": {
    "score": 85,
    "rating": "Excellent",
    "thresholds": {
      "excellent": 80,
      "good": 60
    }
  },
  "keyInsights": "The PR strategy has shown significant effectiveness...",
  "recommendations": [
    "Continue the current communication strategy...",
    "Focus on maintaining engagement..."
  ],
  "influentialNodes": [
    {
      "node": "Media Outlet A",
      "influenceScore": 95,
      "sentiment": "Positive",
      "reach": 120
    }
  ]
}
```

## 4. API端点需求

### 4.1 模拟数据端点
- `GET /scenario1/simulation/{simulationId}/data` - 获取模拟数据
- `GET /scenario1/simulation/{simulationId}/network-data` - 获取网络可视化数据

### 4.2 分析结果端点
- `GET /scenario1/simulation/{simulationId}/analysis` - 获取分析结果
- `POST /scenario1/reports/generate` - 生成分析报告

