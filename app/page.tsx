'use client';

import { useEffect, useRef } from 'react';
import { useCowork } from '@/hooks/useCowork';
import LeftSidebar from '@/components/LeftSidebar';
import ChatArea from '@/components/ChatArea';
import RightSidebar from '@/components/RightSidebar';

export default function Home() {
  const {
    state,
    createNewTask,
    selectTask,
    updateTaskTitle,
    addMessage,
    simulateAIResponse,
    getRealAIResponse,
  } = useCowork();

  // 是否使用真实 AI（可以通过环境变量控制）
  const useRealAI = process.env.NEXT_PUBLIC_USE_REAL_AI === 'true';

  // Load sample task on mount
  const initialized = useRef(false);
  
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initialized.current) return;
    initialized.current = true;
    
    const taskId = createNewTask();
    updateTaskTitle(taskId, 'Review unpublished drafts for publication');
    
    // Add sample messages
    setTimeout(() => {
      addMessage({
        role: 'user',
        content: "Look at my drafts that were started within the last three months and then check that I didn't publish them on simonwillison.net using a search against content on that site and then suggest the ones that are most close to being ready",
      }, taskId);

      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: "I'll help you find drafts from the last three months and check if they've been published. Let me start by looking at your drafts folder.",
        }, taskId);

        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: '',
            command: {
              command: 'find',
              args: '/sessions/zealous-bold-ramanujan/mnt/blog-drafts -type f \\( -name "*.md" -o -name "*.txt" \\) -mtime -90 -exec ls -la {} \\;',
              description: 'Find draft files modified in the last 90 days',
            },
          }, taskId);

          setTimeout(() => {
            addMessage({
              role: 'assistant',
              content: "Found 46 draft files. Now let me read the content of each to get their titles/topics, then check if they've been published on your site.",
            }, taskId);
          }, 1500);
        }, 1000);
      }, 500);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = (content: string) => {
    addMessage({ role: 'user', content });
    
    // 根据配置选择使用真实 AI 或模拟 AI
    if (useRealAI) {
      getRealAIResponse(content);
    } else {
      simulateAIResponse(content);
    }
  };

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
      />
      
      <ChatArea
        taskTitle={currentTask?.title || ''}
        messages={currentMessages}
        onTitleChange={handleTitleChange}
        onSendMessage={handleSendMessage}
      />
      
      <RightSidebar
        artifacts={currentArtifacts}
        workingFiles={currentWorkingFiles}
        progressSteps={currentProgressSteps}
      />
    </div>
  );
}
