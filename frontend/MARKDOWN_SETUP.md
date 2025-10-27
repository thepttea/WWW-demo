# Markdown渲染功能安装说明

## 安装依赖

为了支持markdown格式渲染，需要安装以下依赖：

```bash
cd frontend
npm install react-markdown remark-gfm
```

## 功能说明

### 1. Markdown格式渲染
- **Scenario1报告页面**：详细分析报告支持markdown格式
- **Scenario2报告页面**：详细分析报告支持markdown格式
- **支持的格式**：
  - 标题 (H1-H6)
  - 段落
  - 列表 (有序/无序)
  - 粗体/斜体
  - 代码块
  - 引用
  - 表格
  - GitHub风格markdown (GFM)

### 2. 查看上一次报告功能
- **Scenario1报告页面**：添加"View Last Report"按钮
- **Scenario2报告页面**：添加"View Last Report"按钮
- **使用方式**：
  - 当`hasLastReport`为true且`onViewLastReport`回调存在时显示按钮
  - 点击按钮可查看上一次生成的报告，无需重新调用后端

## 接口更新

### Scenario1ReportPageProps
```typescript
interface Scenario1ReportPageProps {
  reportData: ReportResponse;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
  onViewLastReport?: () => void;  // 新增
  hasLastReport?: boolean;         // 新增
}
```

### Scenario2ReportPageProps
```typescript
interface Scenario2ReportPageProps {
  reportData: ReportResponse;
  onBack: () => void;
  onClose: () => void;
  onReset: () => void;
  onViewLastReport?: () => void;  // 新增
  hasLastReport?: boolean;         // 新增
}
```

## 样式说明

所有markdown元素都经过精心设计，适配暗色主题：
- 标题：白色，不同大小
- 段落：半透明白色
- 代码：蓝色高亮，灰色背景
- 表格：半透明边框，表头高亮
- 引用：蓝色左边框
- 列表：标准缩进

## 使用示例

```typescript
// 在父组件中使用
<Scenario1ReportPage
  reportData={currentReport}
  onBack={handleBack}
  onClose={handleClose}
  onReset={handleReset}
  onViewLastReport={handleViewLastReport}
  hasLastReport={!!lastReport}
/>
```
