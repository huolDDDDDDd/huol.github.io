# NLP备忘录记账日记 - 项目大纲

## 项目结构

### 核心文件
```
/mnt/okcomputer/output/
├── index.html          # 主页 - 智能记账面板
├── accounting.html     # 记账详情页
├── diary.html         # 日记页面
├── analytics.html     # 分析报告页
├── main.js            # 主要JavaScript逻辑
├── resources/         # 资源文件夹
│   ├── hero-bg.jpg    # 主页背景图
│   ├── finance-*.jpg  # 财务相关图片
│   └── diary-*.jpg    # 日记相关图片
└── README.md          # 项目说明
```

## 页面详细规划

### 1. 主页 (index.html)
**目标**: 提供智能记账的核心功能，展示应用价值

**内容结构**:
- **导航栏**: 品牌Logo + 四个主要页面链接
- **简短标题区**: 应用介绍 + 核心价值主张
- **智能记账面板** (主要交互组件):
  - 左侧: 自然语言输入框 (占40%宽度)
  - 中间: 实时解析结果显示 (占30%宽度)  
  - 右侧: 快速分类选择器 (占30%宽度)
- **今日概览**: 收支统计卡片 + 最近记录列表
- **功能特色**: 三个核心特性的图文介绍
- **页脚**: 版权信息

**技术实现**:
- 使用p5.js创建动态粒子背景
- Anime.js实现页面加载动画
- 集成NLP API进行文本解析
- ECharts展示今日收支饼图

### 2. 记账详情页 (accounting.html)
**目标**: 提供完整的记账记录管理和高级筛选功能

**内容结构**:
- **导航栏**: 与主页一致
- **页面标题**: "记账记录" + 添加新记录按钮
- **智能搜索与筛选器**:
  - 全文搜索框
  - 时间范围选择器
  - 金额范围滑块
  - 类别多选下拉框
- **记录列表**: 表格形式展示所有记录
  - 支持排序和分页
  - 每行记录可编辑/删除
  - 批量操作功能
- **统计面板**: 当前筛选条件下的汇总数据

**技术实现**:
- Splide.js实现筛选器的平滑切换
- 响应式表格设计
- 数据导出功能
- 本地存储数据管理

### 3. 日记页面 (diary.html)
**目标**: 结合记账数据生成智能日记，记录生活点滴

**内容结构**:
- **导航栏**: 与主页一致
- **日记智能生成器** (主要交互组件):
  - 顶部: 日期选择器 + 心情评分(5星)
  - 中间: 关键词标签选择器 (工作、生活、学习等)
  - 底部: AI生成日记文本区域 + 编辑功能
- **日记历史**: 日历视图 + 日记列表
- **心情趋势**: 基于日记数据的心情变化图表
- **写作统计**: 字数统计、写作天数等

**技术实现**:
- 温暖的颜色渐变背景
- 日历组件的自定义样式
- 心情数据的可视化图表
- 日记内容的本地存储

### 4. 分析报告页 (analytics.html)
**目标**: 提供专业的财务数据可视化和分析功能

**内容结构**:
- **导航栏**: 与主页一致
- **时间范围选择器**: 本周、本月、本季度、自定义
- **核心指标卡片**: 总收入、总支出、结余、预算执行率
- **数据可视化区域**:
  - 左侧: 支出分类饼图 (占50%宽度)
  - 右侧: 收支趋势折线图 (占50%宽度)
  - 底部: 月度对比柱状图 (全宽)
- **预算管理工具**: 预算设置 + 执行进度
- **财务健康评估**: 基于数据的健康评分和建议

**技术实现**:
- ECharts创建多种图表类型
- 图表之间的联动交互
- 数据的动态更新和动画
- 响应式图表布局

## JavaScript模块设计 (main.js)

### 核心模块
1. **NLP服务模块**:
   - `parseNaturalLanguage(text)` - 调用NLP API解析文本
   - `extractAmount(text)` - 提取金额信息
   - `classifyTransaction(text)` - 分类交易类型

2. **数据管理模块**:
   - `saveTransaction(data)` - 保存交易记录
   - `getTransactions(filters)` - 获取筛选后的记录
   - `updateTransaction(id, data)` - 更新记录
   - `deleteTransaction(id)` - 删除记录

3. **日记模块**:
   - `generateDiary(date, mood, keywords)` - AI生成日记
   - `saveDiary(data)` - 保存日记
   - `getDiaryHistory()` - 获取日记历史

4. **可视化模块**:
   - `initCharts()` - 初始化图表
   - `updateCharts(data)` - 更新图表数据
   - `animateNumbers()` - 数字滚动动画

5. **UI交互模块**:
   - `initAnimations()` - 初始化页面动画
   - `handleFormSubmit()` - 处理表单提交
   - `showNotification()` - 显示通知消息

### 工具函数
- `formatCurrency(amount)` - 格式化货币显示
- `formatDate(date)` - 格式化日期显示
- `debounce(func, wait)` - 防抖函数
- `exportData(data, format)` - 数据导出功能

## 数据结构设计

### 交易记录 (Transaction)
```javascript
{
  id: "uuid",
  date: "2026-01-02",
  amount: 35.50,
  type: "expense", // expense 或 income
  category: "餐饮",
  description: "午餐",
  rawText: "今天午餐花了35元",
  createdAt: "2026-01-02T12:30:00Z"
}
```

### 日记记录 (Diary)
```javascript
{
  id: "uuid",
  date: "2026-01-02",
  mood: 4, // 1-5星评分
  keywords: ["工作", "学习"],
  content: "今天完成了项目报告...",
  transactions: ["transaction_id_1", "transaction_id_2"],
  createdAt: "2026-01-02T20:00:00Z"
}
```

### 预算设置 (Budget)
```javascript
{
  id: "uuid",
  category: "餐饮",
  amount: 1000,
  period: "monthly", // monthly, weekly
  startDate: "2026-01-01",
  alerts: true
}
```

## 响应式设计策略

### 断点设置
- **桌面端**: > 1200px
- **平板端**: 768px - 1199px
- **移动端**: < 768px

### 适配策略
- 使用CSS Grid和Flexbox进行布局
- 图表在小屏幕上简化显示
- 触摸友好的交互元素尺寸
- 导航栏在移动端折叠为汉堡菜单

## 性能优化

### 加载优化
- 图片懒加载
- JavaScript模块化加载
- CSS关键路径优化

### 数据优化
- 本地存储缓存
- 数据分页加载
- 防抖搜索

### 动画优化
- 使用transform和opacity进行动画
- 避免重复重绘
- 合理使用will-change属性

这个项目大纲确保了应用的功能完整性和技术可行性，同时保持了良好的用户体验。