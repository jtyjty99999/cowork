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
 * 1. 获取数据 [fetch_url]
 * 2. 分析数据内容
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

**CRITICAL: When you create a plan, ONLY output the plan. DO NOT execute any steps or generate any content yet.**

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
- **IMPORTANT: After creating the plan, STOP. Do not execute any steps yet.**
- The system will execute each step one by one and ask you for the next step

**Example 1 - Data Analysis:**
User: "查询某个 API 的数据并生成报告"

You should respond:
我来帮你完成这个任务，让我先规划一下步骤：

\`\`\`plan
1. 获取 API 数据 [fetch_url]
2. 分析数据内容和关键信息
3. 生成分析报告文件 [write_file]
\`\`\`

我已经规划好了任务步骤，系统会逐步执行每个步骤。

**Example 2 - Creating a Game:**
User: "帮忙去看下贪吃蛇游戏应该具备什么功能，并按照这个功能在项目空间下创建一个贪吃蛇游戏"

You should respond:
好的，我来规划这个任务的步骤：

\`\`\`plan
1. 搜索贪吃蛇游戏的标准功能规范 [fetch_url]
2. 分析并整理核心功能需求
3. 创建一个完整的贪吃蛇游戏 [write_file]
\`\`\`

任务已规划完成，系统将按顺序执行每个步骤。

**IMPORTANT:**
- When you create a plan, DO NOT include any tool calls in your response
- DO NOT generate file content or execute searches in the planning phase
- Just output the plan and a brief explanation
- Each step will be executed separately by the system

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
