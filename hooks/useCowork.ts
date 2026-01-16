'use client';

import { useState, useCallback } from 'react';
import { AppState, Task, Message, Artifact, WorkingFile, ProgressStep } from '@/types';
import { aiService, AIMessage } from '@/lib/ai-service';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialState: AppState = {
  tasks: [],
  currentTaskId: null,
  messages: {},
  artifacts: {},
  workingFiles: {},
  progressSteps: {},
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
        timestamp: new Date(),
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

  const addArtifact = useCallback((filename: string, taskId?: string) => {
    setState(prev => {
      const targetTaskId = taskId || prev.currentTaskId;
      if (!targetTaskId) return prev;

      const artifact: Artifact = {
        id: generateId(),
        filename,
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
   * 真实的 AI 响应函数
   * 调用实际的 AI API
   */
  const getRealAIResponse = useCallback(async (userMessage: string) => {
    try {
      // 更新进度
      updateProgress([
        { status: 'in_progress', label: 'Sending request to AI' },
      ]);

      // 获取当前对话历史
      setState(prev => {
        const currentMessages = prev.currentTaskId ? prev.messages[prev.currentTaskId] || [] : [];
        
        // 转换为 AI 服务需要的格式
        const aiMessages: AIMessage[] = currentMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        }));

        // 调用 AI 服务（异步）
        (async () => {
          try {
            const response = await aiService.chat(aiMessages);
            
            // 添加 AI 响应
            addMessage({
              role: 'assistant',
              content: response.content,
            });

            // 更新进度为完成
            updateProgress([
              { status: 'completed', label: 'Request sent' },
              { status: 'completed', label: 'Response received' },
            ]);
          } catch (error) {
            console.error('AI 响应失败:', error);
            
            // 添加错误消息
            addMessage({
              role: 'assistant',
              content: `抱歉，AI 服务调用失败: ${error instanceof Error ? error.message : '未知错误'}。\n\n请检查：\n1. API Key 是否正确配置\n2. 网络连接是否正常\n3. API 额度是否充足`,
            });

            updateProgress([
              { status: 'completed', label: 'Request sent' },
              { status: 'completed', label: 'Error occurred' },
            ]);
          }
        })();

        return prev;
      });
    } catch (error) {
      console.error('处理 AI 请求失败:', error);
    }
  }, [addMessage, updateProgress]);

  return {
    state,
    createNewTask,
    selectTask,
    updateTaskTitle,
    addMessage,
    addArtifact,
    addWorkingFiles,
    updateProgress,
    simulateAIResponse,
    getRealAIResponse, // 导出真实 AI 响应函数
  };
};
