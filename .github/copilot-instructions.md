# Water Reminder VS Code Extension - AI Agent Instructions

## Architecture Overview

This is a **VS Code Extension** with a **React-based webview** for the UI. The extension follows a clean separation between:
- **Extension Host** (`src/`) - TypeScript backend running in Node.js context
- **Webview UI** (`webview-ui/`) - React frontend running in browser context with VS Code API bridge

### Key Components

1. **extension.ts** - Main entry point, registers commands and providers
2. **retroViewProvider.ts** - Bridges extension and webview, handles message passing
3. **timerManager.ts** - Core timer logic, persists state via `globalState`
4. **achievementManager.ts** - Tracks streaks and goals
5. **App.tsx** - Main React component with themes, timer display, and animations

## Critical References
- refer to '.github/instructions/development-guidelines.instructions.md' for overall development workflow, testing, and UI design guidelines.
- refer to '.github\instructions\ui.instructions.md' for detailed UI component design guidelines and best practices.

## Critical Build & Debug Workflow

```bash
# Initial setup
npm install

# Development workflow (TWO separate compilations required!)
npm run compile           # Compile TypeScript (src/ → out/)
npm run compile:webview   # Bundle React app (webview-ui/ → out/webview.js)

# Watch mode for active development
npm run watch            # Auto-compile TypeScript
npm run watch:webview    # Auto-rebuild React bundle

# Testing
npm test                 # Run Jest tests

# Debug: Press F5 in VS Code (must open THIS directory as workspace root)
```

**CRITICAL**: Always run BOTH compile commands before testing. The webview won't update without `compile:webview`.

## VS Code-Specific Patterns

### Webview Communication (Bidirectional Message Passing)

**Frontend → Extension:**
```typescript
// In App.tsx
vscode.postMessage({ type: 'start', data: value });
```

**Extension → Frontend:**
```typescript
// In retroViewProvider.ts
webviewView.webview.postMessage({ type: 'update', remainingSeconds: 1800 });
```

**Pattern**: All webview state updates flow through `RetroViewProvider.updateWebview()`.

### State Persistence

Uses VS Code `globalState` API (NOT localStorage):
```typescript
context.globalState.get('dailyCount', 0)
context.globalState.update('dailyCount', count)
```

**Why**: Survives window reloads and workspace switches.

### Configuration

Settings defined in `package.json` "contributes.configuration", accessed via:
```typescript
const config = vscode.workspace.getConfiguration('waterReminder');
const interval = config.get<number>('intervalMinutes', 30);
```

## Project-Specific Conventions

### Theme System
- 4 predefined themes in `App.tsx`: dark, light, ocean, forest
- Uses CSS-in-JS with gradient animations (NOT CSS files)
- Theme colors passed as props to all components via `THEMES[theme]`

### Timer Architecture
- Single `setInterval` in `TimerManager` updates every second
- Emits events: `onTimerUpdate`, `onTimerComplete`, `onDailyCountUpdate`
- **No** React state for timer - fully controlled by extension host

### Webview Bundle
- Single `out/webview.js` built by esbuild (see `build-webview.mjs`)
- Entry point: `webview-ui/index.tsx` → renders `<App />`
- Loaded via `webview.asWebviewUri()` in `retroViewProvider.ts`

## Common Pitfalls & Solutions

### ❌ "Changes don't appear in debug window"
**Solution**: Run `npm run compile:webview` - TypeScript compilation doesn't rebuild React.

### ❌ "Cannot find module 'vscode'"
**Normal** - The `vscode` module only exists at runtime in Extension Host. Use `@types/vscode` for typing.

### ❌ "Webview shows 'Loading...' forever"
**Debug**: Check browser console in webview (Ctrl+Shift+I), likely React error or missing `vscode.postMessage` handler.

### ❌ Extension not appearing in Activity Bar
**Check**:
1. `package.json` → `contributes.viewsContainers` is registered
2. Extension activated (`activationEvents: ["onStartupFinished"]`)
3. Icon path correct: `resources/water-icon.svg`

## File Structure Rationale

```
src/                    # Extension host code (has VS Code API access)
webview-ui/            # React app (sandboxed, no direct VS Code API)
out/                   # Compiled output (git-ignored)
resources/             # Static assets (icons, images)
```

**Why separate src/ and webview-ui/?** Different JavaScript contexts with different APIs. Extension code uses Node.js APIs + VS Code API. Webview uses DOM APIs + message passing.

## Testing Strategy

- **Jest** for unit tests (`__tests__/` directories)
- Tests use `@testing-library/react` for component testing
- **No** E2E tests currently (manual testing via F5 debug)

## Key Dependencies

- `esbuild` - Bundles React app (faster than Webpack)
- `react` - Webview UI framework
- `typescript` - Both extension and webview use TS
- `@types/vscode` - VS Code API types (dev-only)

## When Modifying Code

1. **Adding new commands**: Register in `package.json` contributes.commands AND `extension.ts`
2. **New webview message types**: Handle in BOTH `App.tsx` and `retroViewProvider.ts`
3. **New settings**: Add to `package.json` contributes.configuration
4. **Theme changes**: Update `THEMES` object in `App.tsx`
5. **Timer logic**: Modify `timerManager.ts`, NOT App.tsx (single source of truth)

## Integration Points

- **VS Code Status Bar**: Shows timer countdown (updated every second)
- **Activity Bar**: Custom icon launches webview
- **Notifications**: Uses `vscode.window.showInformationMessage()`
- **Configuration**: Synced via VS Code settings (workspace/user/global scopes)

## Code Style Notes

- Functional React components (hooks, no classes)
- Event emitter pattern for timer updates (`EventEmitter` in Node.js)
- CSS-in-JS for styling (inline `style` props)
- TypeScript strict mode enabled
