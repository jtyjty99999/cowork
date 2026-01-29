'use client';

import { useState, useCallback, useRef } from 'react';
import { AppState, Task, Message, Artifact, WorkingFile, ProgressStep } from '@/types';
import { aiService, AIMessage } from '@/lib/ai-service';
import { parseToolCalls } from '@/lib/tools/parser';
import { executeToolCalls, generateToolsDocumentation } from '@/lib/tools/registry';
import { setWorkspacePath } from '@/lib/workspace-context';
import { parsePlan, getPlanningPrompt } from '@/lib/task-planner';
import {
  parseSkillCommand,
  getSkill,
  prepareSkillPrompt,
  generateSkillsDocumentation,
  getAllSkills,
  registerSkill,
  clearRegistry,
  initializeRegistry,
} from '@/lib/skills';

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * 从用户消息中生成简短的任务标题
 * 提取核心需求，而非简单截取文本
 */
const generateTaskTitle = (userMessage: string): string => {
  const cleaned = userMessage.trim();
  
  // 如果消息很短，直接返回
  if (cleaned.length <= 25) {
    return cleaned;
  }
  
  // 定义动作词和对象提取模式
  const actionPatterns = [
    // 动词 + 对象
    { regex: /(查询|分析|生成|创建|制作|编写|写|做)(.{1,20}?)(?:[，。！？\n]|$)/, format: (m: RegExpMatchArray) => `${m[1]}${m[2]}` },
    // 帮我/请 + 动词 + 对象
    { regex: /(?:帮我|请|麻烦|能否|可以)(查询|分析|生成|创建|制作|编写|写|做|整理|搜索|找|获取)(.{1,20}?)(?:[，。！？\n]|$)/, format: (m: RegExpMatchArray) => `${m[1]}${m[2]}` },
    // 我想/我要 + 动词 + 对象
    { regex: /(?:我想|我要|想要|需要)(查询|分析|生成|创建|制作|编写|写|做|整理|搜索|找|获取|了解|知道)(.{1,20}?)(?:[，。！？\n]|$)/, format: (m: RegExpMatchArray) => `${m[1]}${m[2]}` },
    // 直接对象描述
    { regex: /^(.{1,25}?)(?:怎么|如何|的|吗|呢)/, format: (m: RegExpMatchArray) => m[1] },
  ];
  
  // 尝试匹配模式
  for (const pattern of actionPatterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      let title = pattern.format(match);
      
      // 清理常见的无用词
      title = title
        .replace(/^(?:帮我|请|麻烦|能否|可以|我想|我要|想要|需要)/, '')
        .replace(/[，、；。！？\s]+$/, '')
        .trim();
      
      // 限制长度
      if (title.length > 30) {
        // 尝试在合适的位置截断
        const cutPoints = [
          title.indexOf('，'),
          title.indexOf('、'),
          title.indexOf('并'),
          title.indexOf('和'),
        ].filter(i => i > 10 && i < 30);
        
        if (cutPoints.length > 0) {
          title = title.substring(0, Math.min(...cutPoints));
        } else {
          title = title.substring(0, 28) + '...';
        }
      }
      
      if (title.length >= 3) {
        return title;
      }
    }
  }
  
  // 如果没有匹配到模式，智能提取前面部分
  // 在第一个句子结束处截断
  const firstSentence = cleaned.split(/[。！？\n]/)[0];
  if (firstSentence.length <= 30) {
    return firstSentence;
  }
  
  // 在合适的位置截断
  const cutPoints = [
    firstSentence.indexOf('，'),
    firstSentence.indexOf('、'),
    firstSentence.indexOf('并'),
    firstSentence.indexOf('和'),
  ].filter(i => i > 8 && i < 30);
  
  if (cutPoints.length > 0) {
    return firstSentence.substring(0, Math.min(...cutPoints));
  }
  
  // 最后兜底：取前25个字符
  return firstSentence.substring(0, 25) + '...';
};

const initialState: AppState = {
  tasks: [],
  currentTaskId: null,
  messages: {},
  artifacts: {},
  workingFiles: {},
  progressSteps: {},
  isAIResponding: false,
  workspacePath: './workspace',
};

export const useCowork = () => {
  const [state, setState] = useState<AppState>(initialState);
  const isProcessingRef = useRef(false);
  const skillsLoadedRef = useRef(false);

  // 加载 Skills 到 registry
  const loadSkillsToRegistry = useCallback(async () => {
    if (skillsLoadedRef.current) return;
    
    try {
      clearRegistry();
      initializeRegistry({
        userSkillsPath: '~/.cowork/skills',
        projectSkillsPath: '.cowork/skills',
      });

      const response = await fetch('/api/skills/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSkillsPath: '~/.cowork/skills',
          projectSkillsPath: '.cowork/skills',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        for (const skill of result.skills) {
          // API 返回的是已解析的 skill 对象，直接注册
          registerSkill(skill);
        }
        skillsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  }, []);

  const createNewTask = useCallback(() => {
    const taskId = generateId();
    const task: Task = {
      id: taskId,
      title: 'New task',
      createdAt: new Date(),
      active: true,
    };

    setState(prev => ({
      ...prev,
      tasks: [task, ...prev.tasks.map(t => ({ ...t, active: false }))],
      currentTaskId: taskId,
      messages: { ...prev.messages, [taskId]: [] },
      artifacts: { ...prev.artifacts, [taskId]: [] },
      workingFiles: { ...prev.workingFiles, [taskId]: [] },
      progressSteps: { ...prev.progressSteps, [taskId]: [] },
    }));

    return taskId;
  }, []);

  const selectTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => ({ ...t, active: t.id === taskId })),
      currentTaskId: taskId,
    }));
  }, []);

  const updateTaskTitle = useCallback((taskId: string, title: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => 
        t.id === taskId ? { ...t, title: title || 'Untitled task' } : t
      ),
    }));
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>, taskId?: string): string => {
    const messageId = generateId();
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const newMessage: Message = {
        ...message,
        id: messageId,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        messages: {
          ...prev.messages,
          [targetTaskId]: [
            ...(prev.messages[targetTaskId] || []),
            newMessage,
          ],
        },
      };
    });
    return messageId;
  }, []);

  const addArtifact = useCallback((filename: string, content?: string, taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const artifact: Artifact = {
        id: generateId(),
        filename,
        content,
        createdAt: new Date(),
      };

      return {
        ...prev,
        artifacts: {
          ...prev.artifacts,
          [targetTaskId]: [
            ...(prev.artifacts[targetTaskId] || []),
            artifact,
          ],
        },
      };
    });
  }, []);

  const updateMessageTaskPlan = useCallback((messageId: string, taskPlan: Array<{ id: string; description: string; status: 'pending' | 'in_progress' | 'completed' | 'failed' }>, taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const messages = prev.messages[targetTaskId] || [];
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, taskPlan } : msg
      );

      return {
        ...prev,
        messages: {
          ...prev.messages,
          [targetTaskId]: updatedMessages,
        },
      };
    });
  }, []);

  const addWorkingFiles = useCallback((filenames: string[], taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const newFiles: WorkingFile[] = filenames.map(filename => ({
        id: generateId(),
        filename,
        addedAt: new Date(),
      }));

      return {
        ...prev,
        workingFiles: {
          ...prev.workingFiles,
          [targetTaskId]: [
            ...(prev.workingFiles[targetTaskId] || []),
            ...newFiles,
          ],
        },
      };
    });
  }, []);

  const setWorkingFiles = useCallback((filenames: string[], taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const newFiles: WorkingFile[] = filenames.map(filename => ({
        id: generateId(),
        filename,
        addedAt: new Date(),
      }));

      return {
        ...prev,
        workingFiles: {
          ...prev.workingFiles,
          [targetTaskId]: newFiles, // 直接替换，不追加
        },
      };
    });
  }, []);

  const updateProgress = useCallback((steps: ProgressStep[], taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      return {
        ...prev,
        progressSteps: {
          ...prev.progressSteps,
          [targetTaskId]: steps,
        },
      };
    });
  }, []);

  const simulateAIResponse = useCallback((userMessage: string) => {
    const lowerMsg = userMessage.toLowerCase();

    // Update progress
    updateProgress([
      { status: 'completed', label: 'Understanding request' },
      { status: 'completed', label: 'Planning approach' },
      { status: 'in_progress', label: 'Executing task' },
    ]);

    setTimeout(() => {
      if (lowerMsg.includes('find') || lowerMsg.includes('search') || lowerMsg.includes('draft')) {
        addMessage({
          role: 'assistant',
          content: "I'll help you find drafts from the last three months and check if they've been published. Let me start by looking at your drafts folder.",
        });

        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: '',
            command: {
              command: 'find',
              args: '/sessions/zealous-bold-ramanujan/mnt/blog-drafts -type f \\( -name "*.md" -o -name "*.txt" \\) -mtime -90',
              description: 'Find draft files modified in the last 90 days',
            },
          });

          addWorkingFiles([
            'llm-digest-october-2025.md',
            'tests-not-optional-coding-agen...',
            'digest-november-2025.md',
          ]);

          addArtifact('publish-encouragement.html');

          setTimeout(() => {
            addMessage({
              role: 'assistant',
              content: "Found 46 draft files. Now let me read the content of each to get their titles/topics, then check if they've been published on your site.",
            });

            updateProgress([
              { status: 'completed', label: 'Understanding request' },
              { status: 'completed', label: 'Planning approach' },
              { status: 'completed', label: 'Executing task' },
            ]);
          }, 2000);
        }, 1500);
      } else if (lowerMsg.includes('organize') || lowerMsg.includes('sort')) {
        addMessage({
          role: 'assistant',
          content: "I'll help you organize these files. Let me analyze the content and create a logical structure.",
        });

        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: "I've organized your files into categories: Documents, Images, and Archives. Would you like me to rename them with a consistent naming convention?",
          });

          updateProgress([
            { status: 'completed', label: 'Understanding request' },
            { status: 'completed', label: 'Planning approach' },
            { status: 'completed', label: 'Executing task' },
          ]);
        }, 2000);
      } else if (lowerMsg.includes('create') || lowerMsg.includes('make') || lowerMsg.includes('artifact')) {
        addMessage({
          role: 'assistant',
          content: "I'll create that for you right away.",
        });

        setTimeout(() => {
          addArtifact('encouragement-animation.html');
          addMessage({
            role: 'assistant',
            content: "I've created an artifact with exciting animated encouragements. You can view it in the Artifacts panel on the right.",
          });

          updateProgress([
            { status: 'completed', label: 'Understanding request' },
            { status: 'completed', label: 'Planning approach' },
            { status: 'completed', label: 'Executing task' },
          ]);
        }, 1500);
      } else {
        addMessage({
          role: 'assistant',
          content: "I understand. I'll help you with that task. What specific aspects would you like me to focus on?",
        });

        updateProgress([
          { status: 'completed', label: 'Understanding request' },
          { status: 'completed', label: 'Planning approach' },
          { status: 'completed', label: 'Executing task' },
        ]);
      }
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 从 AI 响应中提取代码块内容
   */
  const extractCodeBlockContent = (responseContent: string, filename: string): string | null => {
    let extracted = null;
    
    // 模式 1: ```language:filename
    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern1 = new RegExp(`\`\`\`\\w+:${escapedFilename}\\n([\\s\\S]*?)\`\`\``, 'i');
    let match = responseContent.match(pattern1);
    if (match) {
      extracted = match[1];
      return extracted;
    }
    
    // 模式 2: ```language (匹配文件扩展名)
    const ext = filename.split('.').pop();
    const pattern2 = new RegExp(`\`\`\`${ext}\\n([\\s\\S]*?)\`\`\``, 'i');
    match = responseContent.match(pattern2);
    if (match) {
      extracted = match[1];
      return extracted;
    }
    
    // 模式 3: 任何代码块（取最后一个）
    const pattern3 = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...responseContent.matchAll(pattern3)];
    if (matches.length > 0) {
      extracted = matches[matches.length - 1][1];
      return extracted;
    }
    
    return null;
  };

  /**
   * 从 AI 响应中提取代码块并创建 Artifacts
   */
  const extractAndCreateArtifacts = (responseContent: string): Map<string, string> => {
    const artifactMap = new Map<string, string>();
    
    // 提取所有代码块 - 支持多种格式，但排除工具调用
    const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    const allCodeBlocks: Array<{ language: string; filename?: string; content: string }> = [];
    
    while ((match = codeBlockRegex.exec(responseContent)) !== null) {
      const [, language, filename, content] = match;
      
      // 跳过工具调用代码块（tool:xxx）
      if (language === 'tool' || filename?.startsWith('tool:')) {
        continue;
      }
      
      allCodeBlocks.push({ language, filename: filename?.trim(), content });
      
      if (filename && !filename.includes('tool')) {
        // 有文件名的代码块，创建 Artifact
        addArtifact(filename.trim(), content);
        artifactMap.set(filename.trim(), content);
      }
    }
    
    // 如果没有带文件名的代码块，但有代码块，使用最大的一个作为 fallback代码块供后续使用
    if (allCodeBlocks.length > 0 && artifactMap.size === 0) {
      // 找到最大的代码块（通常是主要内容）
      const largestBlock = allCodeBlocks.reduce((prev, current) => 
        current.content.length > prev.content.length ? current : prev
      );
      artifactMap.set('__fallback__', largestBlock.content);
    }
    
    return artifactMap;
  };

  /**
   * 处理工具调用中的 artifact_id 引用
   */
  const processArtifactReferences = (toolCalls: any[], artifactMap: Map<string, string>, currentArtifacts: Artifact[]) => {
    toolCalls.forEach((toolCall: any) => {
      if (toolCall.tool === 'write_file') {
        // 如果有 artifact_id，从 artifacts 中获取内容
        if (toolCall.parameters.artifact_id) {
          const artifact = currentArtifacts.find(a => a.id === toolCall.parameters.artifact_id);
          if (artifact && artifact.content) {
            toolCall.parameters.content = artifact.content;
            delete toolCall.parameters.artifact_id;
          }
        }
        // 如果没有 content 但有 path，尝试从当前响应的 artifactMap 中获取
        else if (!toolCall.parameters.content && toolCall.parameters.path) {
          // 尝试精确匹配
          let content = artifactMap.get(toolCall.parameters.path);
          
          // 如果没找到，尝试使用 fallback
          if (!content && artifactMap.has('__fallback__')) {
            content = artifactMap.get('__fallback__');
          }
          
          // 如果还是没找到，尝试匹配文件扩展名
          if (!content) {
            const ext = toolCall.parameters.path.split('.').pop();
            for (const [key, value] of artifactMap.entries()) {
              if (key.endsWith(`.${ext}`)) {
                content = value;
                break;
              }
            }
          }
          
          if (content) {
            toolCall.parameters.content = content;
          }
        }
      }
    });
  };

  /**
   * 真实的 AI 响应函数
   * 调用实际的 AI API
   */
  const getRealAIResponse = useCallback(async (userMessage: string, images?: { url: string; name: string; size: number; base64?: string }[]) => {
    // 防止重复调用
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      // 设置 AI 正在响应状态
      setState(prev => ({ ...prev, isAIResponding: true }));

      // 确保 Skills 已加载到 registry
      await loadSkillsToRegistry();

      // ========== Skill 命令检测 ==========
      const skillCommand = parseSkillCommand(userMessage);
      if (skillCommand) {
        
        const skill = getSkill(skillCommand.skillName);
        if (skill) {
          // 更新进度显示 Skill 调用
          updateProgress([
            { status: 'in_progress', label: `调用 Skill: ${skill.name}` },
          ]);

          // 添加 Skill 调用消息
          const skillMessageId = addMessage({
            role: 'assistant',
            content: `⚡ **正在执行 Skill: /${skill.name}**\n\n${skill.description}`,
            skillCall: {
              skillName: skill.name,
              arguments: skillCommand.arguments,
              status: 'executing',
              description: skill.description,
              allowedTools: skill.allowedTools,
            },
          });

          // 准备 Skill 提示词
          const skillPrompt = prepareSkillPrompt(skill, skillCommand.arguments);
          
          // 更新进度
          updateProgress([
            { status: 'completed', label: `Skill: ${skill.name}` },
            { status: 'in_progress', label: '执行 Skill 指令' },
          ]);

          // 将 Skill 指令作为用户消息发送给 AI
          // 这里我们不直接返回，而是继续执行，让 AI 处理 Skill 指令
          // 修改 userMessage 为 Skill 的指令内容
          userMessage = `用户调用了 Skill: /${skill.name} ${skillCommand.arguments.join(' ')}

${skillPrompt}

请按照上述 Skill 指令执行任务。`;

        } else {
          // Skill 不存在
          addMessage({
            role: 'assistant',
            content: `⚠️ 未找到 Skill: **/${skillCommand.skillName}**\n\n可用的 Skills:\n${getAllSkills().filter(s => s.userInvocable).map(s => `- \`/${s.name}\` - ${s.description}`).join('\n')}`,
          });
          
          updateProgress([
            { status: 'failed', label: `Skill 不存在: ${skillCommand.skillName}` },
          ]);
          
          setState(prev => ({ ...prev, isAIResponding: false }));
          isProcessingRef.current = false;
          return;
        }
      }
      // ========== Skill 命令检测结束 ==========

      // 更新进度
      updateProgress([
        { status: 'in_progress', label: 'Preparing context' },
      ]);

      // 获取工作区文件列表（提供上下文）
      let workspaceContext = '';
      try {
        const response = await fetch('/api/filesystem/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '.' }),
        });
        
        if (response.ok) {
          const files = await response.json();
          if (files.length > 0) {
            workspaceContext = `\n\n[Workspace Context]\nAvailable files in workspace:\n${files.map((f: any) => `- ${f.name} (${f.type})`).join('\n')}`;
            
            // 设置工作文件列表（替换而不是追加）
            setWorkingFiles(files.slice(0, 5).map((f: any) => f.name));
          } else {
            workspaceContext = '\n\n[Workspace Context]\nThe workspace directory is empty. You can create files or ask the user to add files to the workspace.';
          }
        }
      } catch (error) {
        console.error('获取工作区上下文失败:', error);
      }

      updateProgress([
        { status: 'completed', label: 'Context prepared' },
        { status: 'in_progress', label: 'Sending request to AI' },
      ]);

      // 获取当前对话历史
      setState(prev => {
        const currentMessages = prev.currentTaskId ? prev.messages[prev.currentTaskId] || [] : [];

        const formatMessageContentWithImages = (msg: Message): AIMessage['content'] => {
          if (!msg.images || msg.images.length === 0) return msg.content;
          
          // 如果有图片且有 base64 数据，使用多模态格式
          const hasBase64 = msg.images.some(img => img.base64);
          if (hasBase64) {
            const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
            
            // 添加文本内容
            if (msg.content) {
              contentParts.push({ type: 'text', text: msg.content });
            }
            
            // 添加图片
            msg.images.forEach(img => {
              if (img.base64) {
                contentParts.push({
                  type: 'image_url',
                  image_url: { url: img.base64 }
                });
              }
            });
            
            return contentParts;
          }
          
          // 降级：如果没有 base64，只返回文本描述
          const imageLines = msg.images
            .map(img => `- ${img.name} (${img.url}, ${(img.size / 1024).toFixed(1)}KB)`)
            .join('\n');
          return `${msg.content}\n\n[Uploaded images]\n${imageLines}`;
        };
        
        // 获取当前日期信息
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const currentDay = now.getDate();
        
        // 构建当前用户消息（可能包含图片）
        let currentUserMessage: AIMessage['content'] = userMessage;
        if (images && images.length > 0 && images.some(img => img.base64)) {
          const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];
          
          if (userMessage) {
            contentParts.push({ type: 'text', text: userMessage });
          }
          
          images.forEach(img => {
            if (img.base64) {
              contentParts.push({
                type: 'image_url',
                image_url: { url: img.base64 }
              });
            }
          });
          
          currentUserMessage = contentParts;
        }
        
        const currentUploadInfo = images && images.length > 0
          ? `\n\n**User uploaded ${images.length} image(s) for this request. The images are included in the message content for your analysis.**`
          : '';

        const aiMessages: AIMessage[] = [
          {
            role: 'system',
            content: `You are a helpful AI assistant with access to a workspace filesystem, command execution, and internet access capabilities.

**CURRENT DATE AND TIME:**
- Today's date: ${currentDate} (${currentYear}年${currentMonth}月${currentDay}日)
- When user asks for "recent", "last week", "this month" etc., calculate dates based on TODAY (${currentDate})
- For time-sensitive queries, use proper date formats based on today's date

${getPlanningPrompt()}

${generateToolsDocumentation()}

${generateSkillsDocumentation()}

**SKILL USAGE GUIDELINES (IMPORTANT):**
当用户的请求匹配某个 Skill 的描述时，你**必须**使用该 Skill 的指令来完成任务，而不是直接调用工具。

**匹配规则：**
- "解释代码"、"这段代码怎么工作"、"explain code" → 使用 explain-code Skill
- "审查代码"、"检查代码质量"、"code review" → 使用 code-review Skill

**执行方式：**
1. 首先识别用户请求是否匹配某个 Skill
2. 如果匹配，**严格按照该 Skill 的指令步骤执行**
3. 使用 Skill 中定义的格式（如类比、图表、审查维度等）组织回答
4. 只有在 Skill 指令中要求使用工具时才调用工具

**示例：**
用户说"解释代码 game.html"时，你应该：
1. 读取 game.html 文件
2. 按照 explain-code Skill 的格式：使用类比、绘制 ASCII 图表、逐步讲解、指出陷阱
3. 不要只是简单地列出代码功能，要用生动的方式解释

**FILE CREATION GUIDELINES:**

**ALWAYS use write_file tool with COMPLETE content in the parameters:**

\`\`\`tool:write_file
{
  "path": "filename.html",
  "content": "<!DOCTYPE html>\\n<html>\\n...complete file content here...\\n</html>"
}
\`\`\`

**IMPORTANT RULES:**
1. ALWAYS include the COMPLETE file content in the "content" parameter
2. Use \\n for newlines in the content string
3. Escape special characters: \\" for quotes, \\\\ for backslashes
4. Do NOT use code blocks as a replacement for the content parameter
5. Do NOT leave the content parameter empty
6. The content must be valid JSON - properly escaped

**Example for a complete HTML file:**
\`\`\`tool:write_file
{
  "path": "game.html",
  "content": "<!DOCTYPE html>\\n<html>\\n<head>\\n  <title>Game</title>\\n</head>\\n<body>\\n  <h1>Hello</h1>\\n</body>\\n</html>"
}
\`\`\`

IMPORTANT: 
- Always use tool calls for file operations
- The system will automatically execute your tool calls
- You can call multiple tools in one response
- All file paths are relative to the workspace directory (./workspace)

**When using fetch_url tool**:
- After the tool returns data, you will see the raw response
- You MUST analyze and summarize the data in a user-friendly way
- Extract key information and present it clearly
- For financial data, show prices, changes, trends
- For API responses, explain what the data means
- Don't just show raw JSON, interpret it for the user

**When user uploads images**:
- Images will be indicated in the message with [图片: filename]
- You can reference and analyze the images in your response
- Describe what you see in the images if relevant to the task
- Use image context to better understand user requests

Current workspace status:${workspaceContext}${currentUploadInfo}`,
          },
          ...currentMessages.map(msg => ({
            role: msg.role,
            content: formatMessageContentWithImages(msg),
          })),
          {
            role: 'user' as const,
            content: currentUserMessage,
          },
        ];

        // 调用 AI 服务（异步）
        (async () => {
          try {
            const response = await aiService.chat(aiMessages);
            
            // 检查是否需要自动生成任务标题
            // 如果当前任务标题还是 "New task"，且这是第一次 AI 响应，则自动生成标题
            const currentTask = prev.tasks.find(t => t.id === prev.currentTaskId);
            const isFirstResponse = currentMessages.length === 1; // 只有用户的第一条消息
            
            if (currentTask && currentTask.title === 'New task' && isFirstResponse) {
              const newTitle = generateTaskTitle(userMessage);
              updateTaskTitle(currentTask.id, newTitle);
            }
            
            // 首先检查是否有任务计划
            const taskPlan = parsePlan(response.content);
            
            if (taskPlan) {
              // AI 创建了任务计划，显示计划并逐步执行
              const planMessageId = addMessage({
                role: 'assistant',
                content: response.content,
                taskPlan: taskPlan.map(step => ({
                  id: step.id,
                  description: step.description,
                  status: step.status,
                })),
              });

              // 更新进度步骤显示任务计划
              const planSteps: ProgressStep[] = taskPlan.map(step => ({
                status: 'pending' as const,
                label: step.description,
              }));
              updateProgress(planSteps);

              // 逐步执行任务
              for (let i = 0; i < taskPlan.length; i++) {
                const step = taskPlan[i];
                
                // 更新当前步骤状态为进行中（同时更新进度条和消息中的任务计划）
                updateProgress(taskPlan.map((s, idx) => ({
                  status: idx < i ? 'completed' : idx === i ? 'in_progress' : 'pending',
                  label: s.description,
                })));
                
                updateMessageTaskPlan(planMessageId, taskPlan.map((s, idx) => ({
                  id: s.id,
                  description: s.description,
                  status: idx < i ? 'completed' : idx === i ? 'in_progress' : 'pending',
                })));

                if (step.tool) {
                  // 步骤需要调用工具
                  // 让 AI 为这个步骤生成工具调用
                  
                  // 构建上下文：包含之前步骤的结果
                  let previousResults = '';
                  if (i > 0) {
                    previousResults = '\n\n**之前步骤的执行结果：**\n';
                    for (let j = 0; j < i; j++) {
                      const prevStep = taskPlan[j];
                      previousResults += `\n步骤 ${j + 1}: ${prevStep.description}\n`;
                      if (prevStep.result) {
                        previousResults += `结果: ${JSON.stringify(prevStep.result).substring(0, 500)}...\n`;
                      }
                    }
                  }
                  
                  const stepMessages: AIMessage[] = [
                    ...aiMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: `现在执行步骤 ${i + 1}: ${step.description}

**CRITICAL - 你必须调用工具：**
- 这个步骤需要使用 ${step.tool} 工具
- 你必须在响应中包含工具调用代码块
- 格式：\`\`\`tool:${step.tool}\\n{参数}\\n\`\`\`
- 不要只是描述要做什么，必须实际调用工具

**示例格式：**
\`\`\`tool:${step.tool}
{
  "path": "."
}
\`\`\`

**之前步骤的结果：**${previousResults}

请立即调用 ${step.tool} 工具（使用上面的格式）。` },
                  ];

                  const stepResponse = await aiService.chat(stepMessages);
                  const stepToolCalls = parseToolCalls(stepResponse.content);

                  if (stepToolCalls.length > 0) {
                    // 提取代码块并创建 Artifacts
                    const artifactMap = extractAndCreateArtifacts(stepResponse.content);
                    
                    // 处理 artifact 引用（直接使用 artifactMap，不依赖 state）
                    processArtifactReferences(stepToolCalls, artifactMap, []);
                    
                    // 执行工具
                    const toolResults = await executeToolCalls(stepToolCalls);
                    
                    // 保存结果
                    step.result = toolResults[0];
                    step.status = toolResults[0].success ? 'completed' : 'failed';
                    
                    // 更新消息中的任务计划状态
                    updateMessageTaskPlan(planMessageId, taskPlan.map(s => ({
                      id: s.id,
                      description: s.description,
                      status: s.status,
                    })));
                    
                    // 如果步骤失败，停止执行后续步骤
                    if (!toolResults[0].success) {
                      console.error(`❌ 步骤 ${i + 1} 执行失败:`, toolResults[0].error);
                      
                      // 添加错误消息
                      addMessage({
                        role: 'assistant',
                        content: `⚠️ 步骤 ${i + 1} 执行失败：${toolResults[0].error || '未知错误'}\n\n任务执行已停止。请检查错误信息并重新尝试。`,
                      });
                      
                      // 更新进度显示失败状态
                      updateProgress(taskPlan.map((s, idx) => ({
                        status: idx < i ? 'completed' : idx === i ? 'failed' : 'pending',
                        label: s.description,
                      })));
                      
                      // 停止执行
                      setState(prev => ({ ...prev, isAIResponding: false }));
                      return;
                    }

                    // 如果是文件写入，添加到 Artifacts
                    stepToolCalls.forEach((tc: any, idx: number) => {
                      if (tc.tool === 'write_file' && toolResults[idx].success) {
                        const filePath = tc.parameters.path;
                        addArtifact(filePath);
                      }
                    });

                    // 添加步骤执行消息
                    addMessage({
                      role: 'assistant',
                      content: stepResponse.content,
                      toolCalls: stepToolCalls.map((tc: any, idx: number) => ({
                        tool: tc.tool,
                        parameters: tc.parameters,
                        result: {
                          success: toolResults[idx].success,
                          data: toolResults[idx].result,
                          error: toolResults[idx].error,
                        },
                      })),
                    });
                  } else {
                    // AI 没有生成工具调用，但步骤需要工具
                    console.error(`❌ 步骤 ${i + 1} 需要工具 ${step.tool}，但 AI 没有生成工具调用`);
                    
                    step.status = 'failed';
                    step.error = `AI 未生成 ${step.tool} 工具调用`;
                    
                    // 添加错误消息
                    addMessage({
                      role: 'assistant',
                      content: `⚠️ 步骤 ${i + 1} 执行失败：AI 未能生成所需的 ${step.tool} 工具调用。\n\n响应内容：\n${stepResponse.content}\n\n任务执行已停止。`,
                    });
                    
                    // 更新消息中的任务计划状态
                    updateMessageTaskPlan(planMessageId, taskPlan.map(s => ({
                      id: s.id,
                      description: s.description,
                      status: s.status,
                    })));
                    
                    // 更新进度显示失败状态
                    updateProgress(taskPlan.map((s, idx) => ({
                      status: idx < i ? 'completed' : idx === i ? 'failed' : 'pending',
                      label: s.description,
                    })));
                    
                    // 停止执行
                    setState(prev => ({ ...prev, isAIResponding: false }));
                    return;
                  }
                } else {
                  // 步骤不需要工具，让 AI 思考或分析
                  
                  // 构建上下文：包含之前步骤的结果
                  let previousResults = '';
                  if (i > 0) {
                    previousResults = '\n\n**之前步骤的执行结果：**\n';
                    for (let j = 0; j < i; j++) {
                      const prevStep = taskPlan[j];
                      previousResults += `\n步骤 ${j + 1}: ${prevStep.description}\n`;
                      if (prevStep.result) {
                        previousResults += `结果: ${JSON.stringify(prevStep.result).substring(0, 500)}...\n`;
                      }
                    }
                  }
                  
                  const stepMessages: AIMessage[] = [
                    ...aiMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: `现在执行步骤 ${i + 1}: ${step.description}

**重要提示：**
- 只执行当前这一个步骤，不要执行后续步骤
- 这个步骤不需要工具，请进行分析或思考
- 基于之前步骤的结果来完成当前步骤${previousResults}

请完成当前步骤的分析或思考。` },
                  ];

                  const stepResponse = await aiService.chat(stepMessages);
                  
                  addMessage({
                    role: 'assistant',
                    content: stepResponse.content,
                  });

                  step.status = 'completed';
                  
                  // 更新消息中的任务计划状态
                  updateMessageTaskPlan(planMessageId, taskPlan.map(s => ({
                    id: s.id,
                    description: s.description,
                    status: s.status,
                  })));
                }
              }

              // 所有步骤完成
              updateProgress(taskPlan.map(s => ({
                status: 'completed' as const,
                label: s.description,
              })));
              
              // 最终更新消息中的任务计划状态
              updateMessageTaskPlan(planMessageId, taskPlan.map(s => ({
                id: s.id,
                description: s.description,
                status: 'completed',
              })));

              // 重置 AI 响应状态
              setState(prev => ({ ...prev, isAIResponding: false }));
              return;
            }
            
            // 检查是否有工具调用（没有任务计划的情况）
            const toolCalls = parseToolCalls(response.content);
            
            if (toolCalls.length > 0) {
              updateProgress([
                { status: 'completed', label: 'Response received' },
                { status: 'in_progress', label: 'Executing tools' },
              ]);

              // 提取代码块并创建 Artifacts
              const artifactMap = extractAndCreateArtifacts(response.content);
              
              // 处理 artifact 引用（直接使用 artifactMap，不依赖 state）
              processArtifactReferences(toolCalls, artifactMap, []);

              // 执行工具调用
              const toolResults = await executeToolCalls(toolCalls);
              
              // 如果是文件写入，添加到 Artifacts
              toolCalls.forEach((tc: any, idx: number) => {
                if (tc.tool === 'write_file' && toolResults[idx].success) {
                  const filePath = tc.parameters.path;
                  addArtifact(filePath);
                }
              });
              
              // 构建带有工具调用信息的消息
              const toolCallsWithResults = toolCalls.map((toolCall: any, index: number) => ({
                tool: toolCall.tool,
                parameters: toolCall.parameters,
                result: {
                  success: toolResults[index].success,
                  data: toolResults[index].result,
                  error: toolResults[index].error,
                },
              }));

              // 添加 AI 响应（包含工具调用信息）
              addMessage({
                role: 'assistant',
                content: response.content,
                toolCalls: toolCallsWithResults,
              });

              updateProgress([
                { status: 'completed', label: 'Tools executed' },
                { status: 'in_progress', label: 'Analyzing results' },
              ]);

              // 将工具结果发送给 AI 进行分析
              const resultsMessage = toolCallsWithResults.map((tc: any) => {
                const resultText = tc.result.success 
                  ? (typeof tc.result.data === 'string' ? tc.result.data : JSON.stringify(tc.result.data, null, 2))
                  : `Error: ${tc.result.error}`;
                return `Tool: ${tc.tool}\nResult:\n${resultText}`;
              }).join('\n\n---\n\n');

              // 再次调用 AI 分析结果
              const analysisMessages: AIMessage[] = [
                ...aiMessages,
                { role: 'assistant', content: response.content },
                { role: 'user', content: `工具执行结果：\n\n${resultsMessage}\n\n请分析上述数据并用易读的方式总结关键信息。` },
              ];

              const analysisResponse = await aiService.chat(analysisMessages);
              
              // 添加分析结果
              addMessage({
                role: 'assistant',
                content: analysisResponse.content,
              });

              updateProgress([
                { status: 'completed', label: 'Analysis complete' },
              ]);

              // 重置 AI 响应状态
              setState(prev => ({ ...prev, isAIResponding: false }));
            } else {
              // 没有工具调用，直接添加响应
              addMessage({
                role: 'assistant',
                content: response.content,
              });

              updateProgress([
                { status: 'completed', label: 'Context prepared' },
                { status: 'completed', label: 'Request sent' },
                { status: 'completed', label: 'Response received' },
              ]);

              // 重置 AI 响应状态
              setState(prev => ({ ...prev, isAIResponding: false }));
            }
          } catch (error) {
            console.error('AI 响应失败:', error);
            
            // 添加错误消息
            addMessage({
              role: 'assistant',
              content: `抱歉，AI 服务调用失败: ${error instanceof Error ? error.message : '未知错误'}。\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. API 额度是否充足`,
            });

            updateProgress([
              { status: 'completed', label: 'Context prepared' },
              { status: 'completed', label: 'Request sent' },
              { status: 'completed', label: 'Error occurred' },
            ]);

            // 重置 AI 响应状态
            setState(prev => ({ ...prev, isAIResponding: false }));
          } finally {
            // 确保重置 ref
            isProcessingRef.current = false;
          }
        })();

        return prev;
      });
    } catch (error) {
      console.error('处理 AI 请求失败:', error);
    }
  }, [addMessage, updateProgress, setWorkingFiles, loadSkillsToRegistry]);

  /**
   * 切换工作区
   */
  const changeWorkspace = useCallback((path: string) => {
    // 更新全局工作区上下文
    setWorkspacePath(path);
    
    setState(prev => ({
      ...prev,
      workspacePath: path,
    }));
    
    // 清空当前工作文件列表
    if (state.currentTaskId) {
      setWorkingFiles([], state.currentTaskId);
    }
  }, [state.currentTaskId, setWorkingFiles]);

  return {
    state,
    workspacePath: state.workspacePath,
    createNewTask,
    selectTask,
    updateTaskTitle,
    addMessage,
    addArtifact,
    addWorkingFiles,
    setWorkingFiles,
    updateProgress,
    simulateAIResponse,
    getRealAIResponse,
    changeWorkspace,
  };
};
