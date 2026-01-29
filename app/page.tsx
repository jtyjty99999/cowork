'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useCowork } from '@/hooks/useCowork';
import { useSkills } from '@/hooks/useSkills';
import LeftSidebar from '@/components/LeftSidebar';
import ChatArea from '@/components/ChatArea';
import RightSidebar from '@/components/RightSidebar';
import { getDefaultTemplate } from '@/lib/task-templates';

export default function Home() {
  const {
    state,
    createNewTask,
    selectTask,
    updateTaskTitle,
    addMessage,
    simulateAIResponse,
    getRealAIResponse,
    changeWorkspace,
    workspacePath,
  } = useCowork();

  // 初始化 Skills 系统
  const { skills, isLoading: skillsLoading, error: skillsError, loadSkills } = useSkills({
    autoLoad: true,
  });

  // Skills 加载状态日志
  useEffect(() => {
    if (skills.length > 0) {
      console.log(`⚡ Skills loaded: ${skills.length} skills available`);
      skills.forEach(s => console.log(`  - /${s.name}: ${s.description}`));
    }
    if (skillsError) {
      console.error('❌ Skills loading error:', skillsError);
    }
  }, [skills, skillsError]);

  // 是否使用真实 AI（可以通过环境变量控制）
  const useRealAI = process.env.NEXT_PUBLIC_USE_REAL_AI === 'true';
  
  // 是否加载示例任务（可以通过环境变量控制）
  const loadDemoTask = process.env.NEXT_PUBLIC_LOAD_DEMO_TASK === 'true';

  // 初始化任务
  const initialized = useRef(false);
  const lastMessageRef = useRef<{ content: string; timestamp: number } | null>(null);
  
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initialized.current) return;
    initialized.current = true;
    
    // 根据配置决定是否加载示例任务
    if (loadDemoTask) {
      const template = getDefaultTemplate();
      if (template) {
        const taskId = createNewTask();
        updateTaskTitle(taskId, template.title);
        
        // 逐步添加模板消息
        template.messages.forEach((msg, index) => {
          setTimeout(() => {
            addMessage(msg, taskId);
          }, index * 600);
        });
      }
    } else {
      // 创建一个空白任务
      createNewTask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = useCallback((content: string, images?: { url: string; name: string; size: number; base64?: string }[]) => {
    // 防止重复发送（500ms内相同内容视为重复）
    const now = Date.now();
    if (lastMessageRef.current && 
        lastMessageRef.current.content === content && 
        now - lastMessageRef.current.timestamp < 500) {
      console.warn('⚠️ Duplicate message send prevented');
      return;
    }
    
    lastMessageRef.current = { content, timestamp: now };
    
    addMessage({ role: 'user', content, images });
    
    // 根据配置选择使用真实 AI 或模拟 AI
    if (useRealAI) {
      getRealAIResponse(content, images);
    } else {
      simulateAIResponse(content);
    }
  }, [useRealAI, addMessage, getRealAIResponse, simulateAIResponse]);

  const handleTitleChange = (title: string) => {
    if (state.currentTaskId) {
      updateTaskTitle(state.currentTaskId, title);
    }
  };

  const currentTask = state.tasks.find(t => t.id === state.currentTaskId);
  const currentMessages = state.currentTaskId ? state.messages[state.currentTaskId] || [] : [];
  const currentArtifacts = state.currentTaskId ? state.artifacts[state.currentTaskId] || [] : [];
  const currentWorkingFiles = state.currentTaskId ? state.workingFiles[state.currentTaskId] || [] : [];
  const currentProgressSteps = state.currentTaskId ? state.progressSteps[state.currentTaskId] || [] : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <LeftSidebar
        tasks={state.tasks}
        onNewTask={createNewTask}
        onSelectTask={selectTask}
        workspacePath={state.workspacePath}
        onWorkspaceChange={changeWorkspace}
      />
      
      <ChatArea
        key={state.currentTaskId || 'no-task'}
        taskTitle={currentTask?.title || ''}
        messages={currentMessages}
        onTitleChange={handleTitleChange}
        onSendMessage={handleSendMessage}
        isAIResponding={state.isAIResponding}
      />
      
      <RightSidebar
        artifacts={currentArtifacts}
        workingFiles={currentWorkingFiles}
        progressSteps={currentProgressSteps}
        workspacePath={workspacePath}
      />
    </div>
  );
}
