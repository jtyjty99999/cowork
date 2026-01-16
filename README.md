# Claude Cowork - Next.js Implementation

A modern web-based implementation of Claude Cowork's core features, built with Next.js, TypeScript, and Tailwind CSS. Inspired by Anthropic's agentic task management interface.

> 🤖 **想对接真实 AI 大模型？**  
> 查看 [快速配置指南 (3分钟)](./QUICK_AI_SETUP.md) 或 [详细文档索引](./INDEX.md)

## Features

### ✨ Core Functionality

- **Task Management**: Create and manage multiple tasks with a clean sidebar interface
- **Chat Interface**: Natural conversation flow with AI assistant
- **Progress Tracking**: Visual progress indicators showing task completion steps
- **Artifacts**: Display generated files and documents
- **Context Panel**: 
  - Selected folders view
  - Web search connector
  - Working files list
- **Command Execution**: Display running commands with expandable details
- **Multi-model Support**: Switch between different AI models (Opus 4.5, Sonnet 4, Haiku 4)

### 🎨 UI/UX Features

- Modern, clean interface matching Claude's design language
- Responsive layout with three-panel design
- Smooth animations and transitions
- Auto-resizing message input
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Task persistence and switching
- Type-safe with TypeScript
- Optimized performance with React hooks

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useCallback)

## Project Structure

```
cowork/
├── app/
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── components/
│   ├── LeftSidebar.tsx     # Task list sidebar
│   ├── ChatArea.tsx        # Chat interface
│   └── RightSidebar.tsx    # Context & progress panel
├── hooks/
│   └── useCowork.ts        # Custom hook for state management
├── types/
│   └── index.ts            # TypeScript type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## Getting Started

### Installation

1. Navigate to the cowork directory:
   ```bash
   cd /Users/jiangtianyi/Documents/necode/cowork
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. Open your browser and visit:
   ```
   http://localhost:3000
   ```

### Connecting to Real AI Models

By default, the app uses simulated AI responses. To connect to real AI models:

1. **Copy the environment file**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Add your API key** to `.env.local`:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=sk-your-api-key-here
   NEXT_PUBLIC_USE_REAL_AI=true
   ```

3. **Restart the dev server**:
   ```bash
   npm run dev
   ```

📚 **Detailed guide**: See [AI_SETUP.md](./AI_SETUP.md) for complete configuration instructions.

### Usage

1. **Create New Task**: Click the "+ New task" button in the left sidebar
2. **Enter Task Title**: Type your task description in the header input
3. **Chat with AI**: Type messages in the bottom input field and press Enter
4. **View Progress**: Monitor task progress in the right sidebar
5. **Check Artifacts**: View generated files in the Artifacts section
6. **Switch Tasks**: Click on any task in the left sidebar to switch between them

## Demo Features

The application includes a pre-loaded sample task that demonstrates:
- Finding unpublished blog drafts
- Running command-line operations
- Tracking multiple working files
- Generating HTML artifacts
- Multi-step progress tracking

## Simulated AI Responses

The current implementation includes mock AI responses for common task types:

- **File Search**: Responds to keywords like "find", "search", "draft"
- **Organization**: Responds to "organize", "sort"
- **Creation**: Responds to "create", "make", "artifact"

## Technical Details

### Architecture

- **Component-Based**: Modular React components for maintainability
- **Type Safety**: Full TypeScript coverage for better DX and fewer bugs
- **Custom Hooks**: `useCowork` hook encapsulates all state logic
- **Server Components**: Leverages Next.js App Router for optimal performance
- **CSS Utility-First**: Tailwind CSS for rapid UI development

### Key Components

1. **LeftSidebar**: Task management and navigation
2. **ChatArea**: Message display and input handling
3. **RightSidebar**: Progress tracking, artifacts, and context
4. **useCowork Hook**: Centralized state management with React hooks

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Customization

### Styling
Edit `tailwind.config.ts` to customize:
- Color scheme (extend theme colors)
- Spacing and sizing
- Typography
- Animations

### AI Responses
Edit `hooks/useCowork.ts` function `simulateAIResponse()` to add custom response patterns.

### UI Components
Modify components in the `components/` directory to add or remove features.

## Future Enhancements

Potential improvements for production use:

- [ ] Real AI integration (OpenAI, Anthropic API)
- [ ] File system access (File System Access API)
- [ ] Persistent storage (IndexedDB/LocalStorage)
- [ ] Real command execution (with security sandboxing)
- [ ] Markdown rendering for messages
- [ ] Code syntax highlighting
- [ ] Export/import tasks
- [ ] Collaborative features
- [ ] Mobile responsive design
- [ ] Dark mode support

## Security Considerations

This is a demo implementation. For production use:

- Implement proper authentication
- Sanitize all user inputs
- Use Content Security Policy (CSP)
- Implement rate limiting
- Sandbox command execution
- Validate file operations
- Add prompt injection defenses

## References

- [Claude Cowork Announcement](https://claude.com/blog/cowork-research-preview)
- [Simon Willison's First Impressions](https://simonwillison.net/2026/Jan/12/claude-cowork/)
- [Anthropic Documentation](https://docs.anthropic.com/)

## License

MIT License - Feel free to use and modify for your projects.

## Author

Created as a demonstration of Claude Cowork's core features in a web environment.
