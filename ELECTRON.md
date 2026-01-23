# Cowork Desktop Application

This document describes how to run and build the Cowork desktop application using Electron.

## Development

To run the desktop app in development mode:

```bash
npm run electron:dev
```

This will:
1. Start the Next.js development server on port 3000
2. Wait for the server to be ready
3. Launch the Electron app pointing to localhost:3000

## Building

### Build for your current platform

```bash
npm run electron:build
```

### Build for specific platforms

```bash
# macOS
npm run electron:build:mac

# Windows
npm run electron:build:win

# Linux
npm run electron:build:linux
```

The built applications will be in the `dist` folder.

## Features

### Desktop-specific features:
- Native window controls
- Application menu with keyboard shortcuts
- File system access through Electron APIs
- Workspace stored in user data directory

### Keyboard Shortcuts:
- `Cmd/Ctrl + N` - New Chat
- `Cmd/Ctrl + Q` - Quit Application
- `Cmd/Ctrl + R` - Reload
- `Cmd/Ctrl + Shift + I` - Toggle DevTools

## Architecture

- **Main Process** (`electron/main.js`): Manages the application lifecycle and native features
- **Preload Script** (`electron/preload.js`): Safely exposes Electron APIs to the renderer
- **Renderer Process**: The Next.js application running in the Electron window

## Configuration

The Electron configuration is in `package.json` under the `build` section. You can customize:
- App ID and name
- Icons for different platforms
- Build targets (DMG, NSIS, AppImage, etc.)
- File associations
- Auto-updater settings

## Workspace Location

In desktop mode, the workspace is stored in:
- **macOS**: `~/Library/Application Support/Cowork/workspace`
- **Windows**: `%APPDATA%\Cowork\workspace`
- **Linux**: `~/.config/Cowork/workspace`

## Notes

- The app uses static export mode in production for Electron compatibility
- Image optimization is disabled for static builds
- DevTools are automatically opened in development mode
