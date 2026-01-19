'use client';

import { useState, useCallback } from 'react';
import { AppState, Task, Message, Artifact, WorkingFile, ProgressStep } from '@/types';
import { aiService, AIMessage } from '@/lib/ai-service';
import { parseToolCalls } from '@/lib/tools/parser';
import { executeToolCalls, generateToolsDocumentation } from '@/lib/tools/registry';
import { setWorkspacePath } from '@/lib/workspace-context';
import { parsePlan, getPlanningPrompt } from '@/lib/task-planner';

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

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>, taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const newMessage: Message = {
        ...message,
        id: generateId(),
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
      console.log('✅ Matched pattern 1 (language:filename)');
      return extracted;
    }
    
    // 模式 2: ```language (匹配文件扩展名)
    const ext = filename.split('.').pop();
    const pattern2 = new RegExp(`\`\`\`${ext}\\n([\\s\\S]*?)\`\`\``, 'i');
    match = responseContent.match(pattern2);
    if (match) {
      extracted = match[1];
      console.log('✅ Matched pattern 2 (extension only)');
      return extracted;
    }
    
    // 模式 3: 任何代码块（取最后一个）
    const pattern3 = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...responseContent.matchAll(pattern3)];
    if (matches.length > 0) {
      extracted = matches[matches.length - 1][1];
      console.log('✅ Matched pattern 3 (last code block)');
      return extracted;
    }
    
    return null;
  };

  /**
   * 从 AI 响应中提取代码块并创建 Artifacts
   */
  const extractAndCreateArtifacts = (responseContent: string): Map<string, string> => {
    const artifactMap = new Map<string, string>();
    
    console.log('🔍 Extracting code blocks from response...');
    
    // 提取所有代码块 - 支持多种格式
    const codeBlockRegex = /```(\w+)(?::([^\n]+))?\n([\s\S]*?)```/g;
    let match;
    const allCodeBlocks: Array<{ language: string; filename?: string; content: string }> = [];
    
    while ((match = codeBlockRegex.exec(responseContent)) !== null) {
      const [, language, filename, content] = match;
      allCodeBlocks.push({ language, filename: filename?.trim(), content });
      
      if (filename) {
        // 有文件名的代码块，创建 Artifact
        console.log('📦 Creating artifact for:', filename.trim());
        addArtifact(filename.trim(), content);
        artifactMap.set(filename.trim(), content);
      } else {
        // 没有文件名，但记录下来供后续匹配
        console.log('📝 Found code block without filename, language:', language);
      }
    }
    
    console.log(`✅ Extracted ${allCodeBlocks.length} code blocks, ${artifactMap.size} with filenames`);
    
    // 如果有代码块但没有文件名，存储最后一个大代码块供后续使用
    if (allCodeBlocks.length > 0 && artifactMap.size === 0) {
      // 找到最大的代码块（通常是主要内容）
      const largestBlock = allCodeBlocks.reduce((prev, current) => 
        current.content.length > prev.content.length ? current : prev
      );
      console.log('💡 Using largest code block as fallback:', largestBlock.language, largestBlock.content.length, 'chars');
      artifactMap.set('__fallback__', largestBlock.content);
    }
    
    return artifactMap;
  };

  /**
   * 处理工具调用中的 artifact_id 引用
   */
  const processArtifactReferences = (toolCalls: any[], artifactMap: Map<string, string>, currentArtifacts: Artifact[]) => {
    console.log('🔧 Processing artifact references...');
    console.log('📦 Available artifacts in map:', Array.from(artifactMap.keys()));
    console.log('🔨 Tool calls to process:', toolCalls.map(tc => ({ tool: tc.tool, path: tc.parameters?.path, hasContent: !!tc.parameters?.content })));
    
    toolCalls.forEach((toolCall: any) => {
      if (toolCall.tool === 'write_file') {
        console.log(`\n🔍 Processing write_file for: ${toolCall.parameters.path}`);
        console.log('   Has content param:', !!toolCall.parameters.content);
        console.log('   Has artifact_id:', !!toolCall.parameters.artifact_id);
        
        // 如果有 artifact_id，从 artifacts 中获取内容
        if (toolCall.parameters.artifact_id) {
          const artifact = currentArtifacts.find(a => a.id === toolCall.parameters.artifact_id);
          if (artifact && artifact.content) {
            console.log('✅ Using artifact content for:', toolCall.parameters.path);
            toolCall.parameters.content = artifact.content;
            delete toolCall.parameters.artifact_id;
          } else {
            console.warn('⚠️ Artifact not found:', toolCall.parameters.artifact_id);
          }
        }
        // 如果没有 content 但有 path，尝试从当前响应的 artifactMap 中获取
        else if (!toolCall.parameters.content && toolCall.parameters.path) {
          console.log('   Searching in artifactMap for:', toolCall.parameters.path);
          
          // 尝试精确匹配
          let content = artifactMap.get(toolCall.parameters.path);
          
          // 如果没找到，尝试使用 fallback
          if (!content && artifactMap.has('__fallback__')) {
            console.log('   Using fallback code block');
            content = artifactMap.get('__fallback__');
          }
          
          // 如果还是没找到，尝试匹配文件扩展名
          if (!content) {
            const ext = toolCall.parameters.path.split('.').pop();
            for (const [key, value] of artifactMap.entries()) {
              if (key.endsWith(`.${ext}`)) {
                console.log('   Found by extension match:', key);
                content = value;
                break;
              }
            }
          }
          
          if (content) {
            console.log('✅ Found and injecting content:', content.length, 'characters');
            toolCall.parameters.content = content;
          } else {
            console.warn('⚠️ No content found in artifactMap for:', toolCall.parameters.path);
            console.warn('   Available keys:', Array.from(artifactMap.keys()));
          }
        } else {
          console.log('   Already has content or no path');
        }
      }
    });
    
    console.log('\n✅ Artifact processing complete\n');
  };

  /**
   * 真实的 AI 响应函数
   * 调用实际的 AI API
   */
  const getRealAIResponse = useCallback(async (userMessage: string, images?: { url: string; name: string; size: number; base64?: string }[]) => {
    try {
      // 设置 AI 正在响应状态
      setState(prev => ({ ...prev, isAIResponding: true }));

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

**FILE CREATION GUIDELINES:**

For SMALL files (< 50 lines), use write_file tool directly:
\`\`\`tool:write_file
{
  "path": "hello.txt",
  "content": "Hello World"
}
\`\`\`

For LARGE files (> 50 lines, like HTML/CSS/JS games), use code blocks with filename:

Step 1: Display the file content in a code block with language:filename format:
\`\`\`html:snake-game.html
<!DOCTYPE html>
<html>
...full content here...
</html>
\`\`\`

Step 2: Use write_file WITHOUT content parameter (system will auto-extract from code block):
\`\`\`tool:write_file
{
  "path": "snake-game.html"
}
\`\`\`

The system automatically:
1. Extracts code blocks with filenames (e.g., \`\`\`html:filename.html)
2. Creates Artifacts for each code block
3. Injects content when write_file is called with matching path

**IMPORTANT:**
- Use language:filename format in code blocks for large files
- Do NOT include "content" parameter for files shown in code blocks
- Do NOT embed large content in JSON parameters
- The filename in code block must match the path in write_file

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
              addMessage({
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
                
                // 更新当前步骤状态为进行中
                updateProgress(taskPlan.map((s, idx) => ({
                  status: idx < i ? 'completed' : idx === i ? 'in_progress' : 'pending',
                  label: s.description,
                })));

                if (step.tool) {
                  // 步骤需要调用工具
                  // 让 AI 为这个步骤生成工具调用
                  const stepMessages: AIMessage[] = [
                    ...aiMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: `现在执行步骤 ${i + 1}: ${step.description}。请使用 ${step.tool} 工具完成这个步骤。` },
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
                  }
                } else {
                  // 步骤不需要工具，让 AI 思考或分析
                  const stepMessages: AIMessage[] = [
                    ...aiMessages,
                    { role: 'assistant', content: response.content },
                    { role: 'user', content: `现在执行步骤 ${i + 1}: ${step.description}` },
                  ];

                  const stepResponse = await aiService.chat(stepMessages);
                  
                  addMessage({
                    role: 'assistant',
                    content: stepResponse.content,
                  });

                  step.status = 'completed';
                }
              }

              // 所有步骤完成
              updateProgress(taskPlan.map(s => ({
                status: 'completed' as const,
                label: s.description,
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
          }
        })();

        return prev;
      });
    } catch (error) {
      console.error('处理 AI 请求失败:', error);
    }
  }, [addMessage, updateProgress, setWorkingFiles]);

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
