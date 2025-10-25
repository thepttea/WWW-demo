# API测试指南

## 🚀 三种测试方法

### 方法一：Swagger UI（最简单，推荐）

#### 1. 启动服务
```bash
cd backend/code
python api_server.py
```

#### 2. 打开浏览器访问
```
http://localhost:8000/docs
```

你会看到FastAPI自动生成的交互式API文档！

#### 3. 测试场景一

**步骤1：展开 "Scenario 1 - Simulation" 分组**
- 找到 `POST /api/scenario1/simulation/start`
- 点击 "Try it out"
- 填入请求体：
```json
{
  "initialTopic": "某科技公司推出新功能，默认开启用户位置共享",
  "llmModel": "gpt-4",
  "simulationConfig": {
    "agents": 10,
    "num_rounds": 1,
    "interactionProbability": 0.8
  },
  "prStrategy": "我们对造成的困扰深表歉意，已立即关闭该功能。"
}
```
- 点击 "Execute"
- 复制返回的 `simulationId`

**步骤2：生成报告**
- 找到 `POST /api/scenario1/reports/generate`
- 点击 "Try it out"
- 填入：
```json
{
  "simulationId": "粘贴刚才的simulationId",
  "reportType": "comprehensive"
}
```
- 点击 "Execute"
- 查看返回的报告，包含9维度评分！

#### 4. 测试场景二

**步骤1：获取案例列表**
- 找到 `GET /api/scenario2/cases`
- 点击 "Try it out" → "Execute"
- 选择一个 `id`（如 "case_004"）

**步骤2：启动模拟**
- 找到 `POST /api/scenario2/simulation/start`
- 填入：
```json
{
  "caseId": "case_004",
  "llmModel": "gpt-4",
  "simulationConfig": {
    "agents": 10,
    "num_rounds": 1,
    "interactionProbability": 0.8
  }
}
```
- 复制返回的 `simulationId`

**步骤3：推进轮次（如果totalRounds > 1）**
- 找到 `POST /api/scenario2/simulation/{simulation_id}/next-round`
- 填入simulationId
- 点击 "Execute"
- 重复直到完成所有轮次

**步骤4：生成对比报告**
- 找到 `POST /api/scenario2/reports/generate`
- 填入：
```json
{
  "simulationId": "粘贴simulationId",
  "reportType": "comprehensive"
}
```
- 查看返回的对比分析报告！

### 方法二：使用TestClient（单元测试）

```bash
# 安装依赖
pip install pytest httpx

# 运行测试脚本
cd backend
python test_evaluation_api.py
```

这个脚本会自动测试：
- ✅ 场景一完整流程
- ✅ 场景二完整流程
- ✅ 验证两个场景的报告不同

### 方法三：使用curl命令

#### 场景一测试

```bash
# 1. 启动模拟
curl -X POST http://localhost:8000/api/scenario1/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "initialTopic": "某科技公司推出新功能，默认开启用户位置共享",
    "llmModel": "gpt-4",
    "simulationConfig": {
      "agents": 10,
      "num_rounds": 1,
      "interactionProbability": 0.8
    },
    "prStrategy": "我们对造成的困扰深表歉意，已立即关闭该功能。"
  }'

# 保存返回的simulationId，然后：

# 2. 生成报告
curl -X POST http://localhost:8000/api/scenario1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "simulationId": "YOUR_SIMULATION_ID",
    "reportType": "comprehensive"
  }'
```

#### 场景二测试

```bash
# 1. 获取案例列表
curl http://localhost:8000/api/scenario2/cases

# 2. 启动模拟
curl -X POST http://localhost:8000/api/scenario2/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "case_004",
    "llmModel": "gpt-4",
    "simulationConfig": {
      "agents": 10,
      "num_rounds": 1,
      "interactionProbability": 0.8
    }
  }'

# 保存simulationId，然后推进轮次（如果需要）：

# 3. 推进下一轮
curl -X POST http://localhost:8000/api/scenario2/simulation/YOUR_SIM_ID/next-round

# 4. 生成对比报告
curl -X POST http://localhost:8000/api/scenario2/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "simulationId": "YOUR_SIMULATION_ID",
    "reportType": "comprehensive"
  }'
```

## 🔍 验证两个场景报告的差异

### 场景一报告返回（质量评估）

```json
{
  "success": true,
  "data": {
    "reportId": "report_xxx",
    "reportType": "scenario1",  // ← 注意这里
    "content": "LLM生成的质量分析报告...",
    "evaluation": {
      "overall_score": 7.2,  // ← 质量评分
      "evaluation_type": "standalone",  // ← 独立评估
      "dimension_scores": {
        "总体立场倾向": {
          "score": 8,  // ← 质量得分
          "details": {
            "simulation_data": {...},  // ← 只有模拟数据
            "reasoning": "立场分布合理..."  // ← 评估合理性
          }
        }
        // ... 其他8个维度
      },
      "summary": "评估等级：良好\n模拟舆论基本合理..."  // ← 质量评价
    }
  }
}
```

### 场景二报告返回（相似度对比）

```json
{
  "success": true,
  "data": {
    "reportId": "report_xxx",
    "reportType": "scenario2_comparative",  // ← 对比类型
    "caseId": "case_004",  // ← 有案例信息
    "caseTitle": "Bud Light案例",
    "content": "LLM生成的对比分析报告...",
    "evaluation": {
      "overall_score": 6.8,  // ← 相似度评分
      "evaluation_type": "comparative",  // ← 对比评估
      "dimension_scores": {
        "总体立场倾向": {
          "score": 7,  // ← 相似度得分
          "details": {
            "real_case_stance": "真实案例的立场...",  // ← 有真实案例描述
            "simulation_data": {...},  // ← 模拟数据
            "real_case_data": {...},  // ← 真实案例数据
            "similarity_score": 7,  // ← 明确的相似度得分
            "reasoning": "对比分析：模拟与真实的相似度..."  // ← 对比分析
          }
        }
        // ... 其他8个维度
      },
      "summary": "评估等级：较为相似\n模拟基本符合真实案例..."  // ← 相似度评价
    },
    "similarityScore": 6.8  // ← 额外的相似度字段
  }
}
```

## 📊 关键差异对照表

| 特征 | 场景一 | 场景二 |
|------|--------|--------|
| **API端点** | `/api/scenario1/reports/generate` | `/api/scenario2/reports/generate` |
| **reportType** | `"scenario1"` | `"scenario2_comparative"` |
| **evaluation_type** | `"standalone"` | `"comparative"` |
| **评分含义** | 质量（0-10） | 相似度（0-10） |
| **维度details** | simulation_data, reasoning | simulation_data, real_case_data, real_case_xxx, similarity_score, reasoning |
| **额外字段** | 无 | caseId, caseTitle, similarityScore |
| **LLM prompt** | "评估模拟的合理性" | "对比模拟与真实案例的相似度" |
| **报告内容** | 单一质量分析 | 双方对比分析 |

## ✅ 测试检查清单

### 场景一测试

- [ ] 能成功启动模拟
- [ ] 能添加多轮策略
- [ ] 能生成报告
- [ ] 报告包含9个维度评分
- [ ] reportType是"scenario1"
- [ ] evaluation_type是"standalone"
- [ ] 总分在0-10之间
- [ ] 每个维度都有reasoning
- [ ] 没有caseId等字段

### 场景二测试

- [ ] 能获取案例列表
- [ ] 能启动案例模拟
- [ ] 能推进多轮
- [ ] 能生成对比报告
- [ ] 报告包含9个维度对比
- [ ] reportType是"scenario2_comparative"
- [ ] evaluation_type是"comparative"
- [ ] 有caseId和caseTitle
- [ ] 有similarityScore字段
- [ ] 每个维度都有真实案例描述
- [ ] reasoning是对比分析

## 🎯 预期结果

### 成功的标志

1. **场景一**：
   - 得到一个质量评分（如7.2/10）
   - 报告分析模拟的合理性
   - 提出改进建议

2. **场景二**：
   - 得到一个相似度评分（如6.8/10）
   - 报告对比模拟与真实案例
   - 指出相似之处和差异

### 常见问题

**Q: 评估时间很长？**
A: 正常现象，每次需要调用10次LLM（约30-60秒）

**Q: 某个维度得分是0？**
A: 检查LLM响应是否解析失败，查看日志中的警告信息

**Q: 场景二必须完成所有轮次吗？**
A: 是的，否则对比不完整，建议选择轮次少的案例测试

## 📝 快速测试命令

### 完整测试（推荐）
```bash
# 方法1: 使用测试脚本
python backend/test_evaluation_api.py

# 方法2: 使用Swagger UI
# 1. 启动服务：python backend/code/api_server.py
# 2. 访问：http://localhost:8000/docs
# 3. 按照上面的步骤操作
```

### 只测试接口可用性
```bash
# 测试场景一启动
curl -X POST http://localhost:8000/api/scenario1/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"initialTopic":"测试","llmModel":"gpt-4","simulationConfig":{"agents":5}}'

# 测试场景二案例列表
curl http://localhost:8000/api/scenario2/cases
```

## 🎉 总结

✅ **功能完整**：两个场景的所有功能都已实现  
✅ **接口独立**：两个报告接口完全分离  
✅ **报告不同**：评估目标、结构、内容都不同  
✅ **可以测试**：提供了三种测试方法  

**推荐使用 Swagger UI 进行测试，最直观方便！**



