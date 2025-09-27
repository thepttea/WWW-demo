# Multi-Agent 舆论模拟系统 - 前端

基于 React + TypeScript + Ant Design 的现代化前端应用，用于可视化多智能体舆论模拟系统。

## 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全
- **Ant Design** - UI组件库
- **Zustand** - 状态管理
- **React Query** - 数据获取和缓存
- **React Force Graph 2D** - 网络图可视化
- **Framer Motion** - 动画效果
- **Vite** - 构建工具

## 项目结构

```
src/
├── components/           # 通用组件
│   ├── AgentNode/       # Agent节点组件
│   └── NetworkGraph/    # 网络图可视化
├── pages/               # 页面组件
│   └── Dashboard/       # 主仪表板
├── stores/              # 状态管理
│   ├── simulationStore.ts
│   ├── agentStore.ts
│   └── uiStore.ts
├── services/            # API服务
│   ├── api.ts
│   ├── simulationService.ts
│   └── mockData.ts
├── types/               # TypeScript类型定义
│   ├── agent.ts
│   ├── simulation.ts
│   └── api.ts
├── utils/               # 工具函数
│   ├── constants.ts
│   └── visualization.ts
└── hooks/               # 自定义Hooks
```

## 功能特性

### 已实现功能

1. **Agent节点可视化**
   - 基于影响力分数的节点大小
   - 基于立场值的颜色映射
   - 平台图标和情绪风格标签
   - 悬停显示详细信息

2. **社交网络图**
   - 力导向布局算法
   - 圆形和层次布局支持
   - 连接关系可视化（好友/关注）
   - 传播路径高亮

3. **模拟控制**
   - 开始/暂停/停止模拟
   - 实时状态显示
   - 轮次控制

4. **数据管理**
   - 静态数据模拟
   - 状态持久化
   - 响应式设计

### 待实现功能

1. **Scenario 1: 自定义公关方案**
   - LLM选择界面
   - Chat辅助优化
   - 方案确认和参数设置

2. **Scenario 2: 历史案例对比**
   - 案例库管理
   - 对比分析可视化
   - 相似度计算

3. **高级可视化**
   - 动态传播动画
   - 时间轴控制
   - 3D网络图

## 开发指南

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 设计理念

### 组件设计

- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 组件设计考虑复用场景
- **类型安全**: 完整的TypeScript类型定义
- **性能优化**: 使用React.memo和useMemo优化渲染

### 状态管理

- **Zustand**: 轻量级状态管理，避免Redux的复杂性
- **分离关注点**: 按功能模块分离store
- **类型安全**: 完整的类型定义和推导

### 可视化设计

- **直观性**: 颜色和大小直观反映数据特征
- **交互性**: 支持点击、悬停、拖拽等交互
- **响应式**: 适配不同屏幕尺寸
- **动画效果**: 流畅的过渡和动画

## 与后端集成

### API接口

当前使用静态数据模拟，待后端API完成后替换：

```typescript
// 模拟创建
POST /api/simulations
// 获取模拟状态
GET /api/simulations/{id}
// 开始模拟
POST /api/simulations/{id}/start
```

### WebSocket实时更新

```typescript
// 连接模拟WebSocket
WS /ws/simulations/{id}
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License
