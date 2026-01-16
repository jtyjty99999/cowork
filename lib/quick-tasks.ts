/**
 * 快速任务模板
 * 预制的任务模板，包含最佳实践和工具使用建议
 */

export interface QuickTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'data' | 'file' | 'analysis' | 'web' | 'automation';
}

export const quickTasks: QuickTask[] = [
  // 数据分析类
  {
    id: 'stock-analysis',
    title: '股票数据分析',
    description: '查询股票数据并生成分析报告',
    icon: '📈',
    category: 'data',
    prompt: '请帮我查询英伟达（NVDA）最近一周的股票数据，分析走势，并生成一份详细的分析报告保存为 stock_analysis.md 文件',
  },
  {
    id: 'web-scraping',
    title: '网页数据抓取',
    description: '从网页获取数据并整理',
    icon: '🌐',
    category: 'web',
    prompt: '请帮我访问 https://api.github.com/repos/microsoft/vscode，获取仓库信息，并整理成易读的格式保存为 repo_info.md',
  },
  
  // 文件操作类
  {
    id: 'organize-files',
    title: '整理项目文件',
    description: '按类型分类整理文件',
    icon: '📁',
    category: 'file',
    prompt: '请帮我整理当前目录的文件：1. 列出所有文件 2. 按文件类型分类（文档、代码、图片等）3. 创建对应的文件夹 4. 生成整理报告',
  },
  {
    id: 'create-readme',
    title: '生成项目文档',
    description: '创建 README 和文档结构',
    icon: '📝',
    category: 'file',
    prompt: '请帮我创建一个完整的项目文档结构：1. 生成 README.md 2. 创建 docs 文件夹 3. 添加 API 文档模板 4. 添加贡献指南',
  },
  
  // 分析类
  {
    id: 'code-review',
    title: '代码审查报告',
    description: '分析代码质量并提供建议',
    icon: '🔍',
    category: 'analysis',
    prompt: '请帮我审查当前目录的代码：1. 列出所有代码文件 2. 分析代码结构 3. 提供改进建议 4. 生成审查报告',
  },
  {
    id: 'dependency-check',
    title: '依赖分析',
    description: '检查项目依赖和版本',
    icon: '📦',
    category: 'analysis',
    prompt: '请帮我分析项目依赖：1. 读取 package.json 2. 检查依赖版本 3. 查找过时的包 4. 生成更新建议',
  },
  
  // 自动化类
  {
    id: 'daily-report',
    title: '生成日报',
    description: '创建每日工作报告',
    icon: '📊',
    category: 'automation',
    prompt: '请帮我生成今天的工作日报：1. 创建日期标题 2. 添加工作内容模板 3. 添加待办事项 4. 保存为 daily_report_[日期].md',
  },
  {
    id: 'backup-files',
    title: '备份重要文件',
    description: '创建文件备份',
    icon: '💾',
    category: 'automation',
    prompt: '请帮我备份重要文件：1. 列出当前目录文件 2. 创建 backup 文件夹 3. 复制重要文件（.md, .json, .txt）4. 生成备份清单',
  },
];

/**
 * 根据类别获取任务
 */
export function getTasksByCategory(category: QuickTask['category']): QuickTask[] {
  return quickTasks.filter(task => task.category === category);
}

/**
 * 获取所有类别
 */
export function getAllCategories(): QuickTask['category'][] {
  return ['data', 'file', 'analysis', 'web', 'automation'];
}

/**
 * 类别显示名称
 */
export const categoryNames: Record<QuickTask['category'], string> = {
  data: '数据分析',
  file: '文件操作',
  analysis: '代码分析',
  web: '网络请求',
  automation: '自动化',
};
