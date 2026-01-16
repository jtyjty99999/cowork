/**
 * 任务规划和执行系统
 * AI 先规划任务步骤，然后逐步执行
 */

export interface TaskStep {
  id: string;
  description: string;
  tool?: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface TaskPlan {
  steps: TaskStep[];
  currentStepIndex: number;
}

/**
 * 解析 AI 规划的任务步骤
 * AI 应该使用特定格式输出任务计划
 * 
 * 格式示例：
 * ```plan
 * 1. 查询英伟达股票数据 [fetch_url]
 * 2. 分析股票走势数据
 * 3. 生成分析报告 [write_file]
 * ```
 */
export function parsePlan(content: string): TaskStep[] | null {
  const planRegex = /```plan\n([\s\S]*?)```/;
  const match = content.match(planRegex);
  
  if (!match) {
    return null;
  }
  
  const planText = match[1];
  const lines = planText.split('\n').filter(line => line.trim());
  
  const steps: TaskStep[] = lines.map((line, index) => {
    // 匹配格式: "1. 描述 [tool_name]" 或 "1. 描述"
    const stepMatch = line.match(/^\d+\.\s+(.+?)(?:\s+\[(\w+)\])?$/);
    
    if (!stepMatch) {
      return null;
    }
    
    const description = stepMatch[1].trim();
    const tool = stepMatch[2];
    
    return {
      id: `step_${index + 1}`,
      description,
      tool,
      status: 'pending' as const,
    };
  }).filter(Boolean) as TaskStep[];
  
  return steps.length > 0 ? steps : null;
}

/**
 * 生成任务计划的提示词
 */
export function getPlanningPrompt(): string {
  return `
## Task Planning

When the user asks you to perform a complex task, you should FIRST create a task plan before executing any tools.

**Planning Format:**
\`\`\`plan
1. Step description [tool_name]
2. Another step description
3. Final step [tool_name]
\`\`\`

**Rules:**
- Break down complex tasks into clear steps
- Specify which tool to use for each step (if needed)
- Some steps may not need tools (like analysis or thinking)
- Keep steps concise and actionable

**Example 1 - Stock Query:**
User: "查询英伟达最近一周的股价并生成报告"

You should respond:
我来帮你完成这个任务，让我先规划一下步骤：

\`\`\`plan
1. 查询英伟达股票数据 [fetch_url]
2. 分析股票走势和关键指标
3. 生成分析报告文件 [write_file]
\`\`\`

现在开始执行...

**Example 2 - File Operations:**
User: "帮我整理项目文档"

You should respond:
好的，我来规划整理步骤：

\`\`\`plan
1. 列出当前目录的所有文件 [list_directory]
2. 识别文档类型并分类
3. 创建分类文件夹 [create_directory]
4. 移动文件到对应文件夹
\`\`\`

开始执行...

**When to create a plan:**
- Task involves multiple steps
- Task requires different tools
- Task needs data processing between steps
- User explicitly asks for a structured approach

**When NOT to create a plan:**
- Simple single-step tasks (just use the tool directly)
- User asks a simple question
- Task is just reading or listing information
`;
}
