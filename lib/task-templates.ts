/**
 * 任务模板配置
 * 提供预设的示例任务，用于演示和测试
 */

import { Message } from '@/types';

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  messages: Omit<Message, 'id' | 'timestamp'>[];
  workingFiles?: string[];
  artifacts?: string[];
}

export const taskTemplates: TaskTemplate[] = [
  {
    id: 'blog-drafts-review',
    title: 'Review unpublished drafts for publication',
    description: '查找并审查未发布的博客草稿',
    messages: [
      {
        role: 'user',
        content: "Look at my drafts that were started within the last three months and then check that I didn't publish them on simonwillison.net using a search against content on that site and then suggest the ones that are most close to being ready",
      },
      {
        role: 'assistant',
        content: "I'll help you find drafts from the last three months and check if they've been published. Let me start by looking at your drafts folder.",
      },
      {
        role: 'assistant',
        content: '',
        command: {
          command: 'find',
          args: '/sessions/zealous-bold-ramanujan/mnt/blog-drafts -type f \\( -name "*.md" -o -name "*.txt" \\) -mtime -90 -exec ls -la {} \\;',
          description: 'Find draft files modified in the last 90 days',
        },
      },
      {
        role: 'assistant',
        content: "Found 46 draft files. Now let me read the content of each to get their titles/topics, then check if they've been published on your site.",
      },
    ],
    workingFiles: [
      'llm-digest-october-2025.md',
      'tests-not-optional-coding-agen...',
      'digest-november-2025.md',
    ],
    artifacts: ['publish-encouragement.html'],
  },
  {
    id: 'web-api-demo',
    title: 'Fetch GitHub repository information',
    description: '演示互联网访问功能 - 获取 GitHub 仓库信息',
    messages: [
      {
        role: 'user',
        content: '请帮我获取 https://api.github.com/repos/microsoft/vscode 的信息',
      },
      {
        role: 'assistant',
        content: '我来帮你获取 VS Code 仓库的信息...',
      },
    ],
  },
  {
    id: 'markdown-demo',
    title: 'Markdown formatting examples',
    description: '演示 Markdown 渲染功能',
    messages: [
      {
        role: 'user',
        content: '请展示一些 Markdown 格式的示例',
      },
      {
        role: 'assistant',
        content: `# Markdown 功能演示

## 文本格式

这是一段普通文本，支持 **粗体**、*斜体* 和 \`行内代码\`。

## 代码块

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('World');
\`\`\`

## 列表

### 无序列表
- 第一项
- 第二项
  - 子项 1
  - 子项 2
- 第三项

### 有序列表
1. 首先
2. 其次
3. 最后

## 引用

> 这是一段引用文本。
> 可以跨越多行。

## 表格

| 功能 | 状态 | 说明 |
|------|------|------|
| Markdown | ✅ | 完全支持 |
| 代码高亮 | ✅ | 使用 highlight.js |
| 表格 | ✅ | GitHub 风格 |

## 链接

访问 [GitHub](https://github.com) 了解更多。

---

这就是 Markdown 的主要功能！`,
      },
    ],
  },
  {
    id: 'file-operations',
    title: 'Workspace file operations',
    description: '演示文件系统操作功能',
    messages: [
      {
        role: 'user',
        content: '请列出工作区的文件',
      },
      {
        role: 'assistant',
        content: '我来查看工作区的文件列表...',
      },
    ],
  },
];

/**
 * 根据 ID 获取模板
 */
export function getTemplateById(id: string): TaskTemplate | undefined {
  return taskTemplates.find(t => t.id === id);
}

/**
 * 获取所有模板列表
 */
export function getAllTemplates(): TaskTemplate[] {
  return taskTemplates;
}

/**
 * 获取默认模板（用于演示）
 */
export function getDefaultTemplate(): TaskTemplate | undefined {
  return taskTemplates[0];
}
