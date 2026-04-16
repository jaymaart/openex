# OpenEx Design Spec
**Date:** 2026-04-16
**Project:** OpenEx — open-source, open-model Codex desktop app clone

---

## Overview

OpenEx is a downloadable desktop coding agent application — an open-source clone of OpenAI's Codex desktop app — built with Electron + TypeScript. It supports open and alternative AI model providers, giving users full control over which model powers their agentic coding assistant.

The app provides a chat-first UI where users can assign coding tasks to an AI agent that can autonomously read/write files, run shell commands, and iterate on code. Users retain control via a configurable approval flow.

---

## Stack

- **Runtime:** Electron 30
- **Renderer:** React 18 + Vite + TypeScript + TailwindCSS
- **IPC:** tRPC over Electron `contextBridge` (type-safe main ↔ renderer communication)
- **Client state:** Zustand
- **Config persistence:** `electron-store` with `safeStorage` encryption

---

## Project Structure

```
openex/
├── electron/
│   ├── main.ts              # App entry, BrowserWindow setup
│   ├── ipc/                 # tRPC router exposed to renderer
│   ├── providers/           # AI provider adapters
│   │   ├── openai-compat.ts # OpenAI-compatible endpoint adapter
│   │   └── anthropic.ts     # Anthropic SDK adapter
│   ├── tools/               # Agent tools: readFile, writeFile, shell, listDir
│   ├── agent/               # Agentic loop: tool dispatch, approval gating
│   └── config/              # API key + settings persistence
├── src/                     # Renderer process (React)
│   ├── components/
│   │   ├── Chat/            # Message thread, input bar
│   │   ├── Blocks/          # Expandable inline blocks: FileEdit, ShellOutput
│   │   └── Settings/        # API key config panel
│   ├── store/               # Zustand: conversation, approval state
│   └── App.tsx
├── shared/                  # Types shared between main + renderer
└── package.json             # Single package, Vite builds renderer
```

---

## Section 1: API Key Management

### Storage

Keys are stored via `electron-store` in the OS user data directory, encrypted at rest using Electron's `safeStorage` (OS keychain wrapper). Keys are never stored in env vars or the repository.

### Providers

Two providers supported at launch:

- **`openai-compat`** — configurable base URL + API key. Covers Ollama (no key needed), OpenRouter, Together AI, Groq, and any OpenAI-compatible endpoint.
- **`anthropic`** — API key only. Endpoint hardcoded to Anthropic's API, uses `@anthropic-ai/sdk`.

### Config Shape

```ts
interface Config {
  activeProvider: 'openai-compat' | 'anthropic'
  providers: {
    'openai-compat': { baseUrl: string; apiKey: string; model: string }
    'anthropic':     { apiKey: string; model: string }
  }
  approval: 'auto' | 'manual' | 'smart'
}
```

### Settings UI

Accessible via gear icon in the top bar. Simple form:
- Provider dropdown (openai-compat / anthropic)
- API key field (masked input)
- Base URL field (visible only for openai-compat)
- Model name text input
- Approval mode selector (Auto / Ask for everything / Smart)
- Save button — writes to electron-store via tRPC mutation

### First-Run Flow

If no config exists on launch, the settings panel opens automatically before the chat UI is usable.

---

## Section 2: Agent Loop & Tools

### Tools

| Tool | Description | Approval (smart mode) |
|------|-------------|----------------------|
| `read_file` | Read file contents by path | Auto |
| `list_dir` | List directory contents | Auto |
| `write_file` | Write or overwrite a file | Ask |
| `shell` | Run a shell command | Ask |

### Loop

1. User message appended to conversation history
2. History + system prompt sent to active provider with tools defined
3. Model streams response — text tokens forwarded to renderer in real time via tRPC subscription
4. On tool call: pause stream, emit `approval_request` to renderer
5. Renderer renders inline approval block — user approves or rejects
6. On approve: execute tool, append `tool_result` to history, resume from step 2
7. On reject: append rejection message, model decides how to proceed
8. Loop ends when model emits a plain text response with no pending tool calls

### System Prompt

Sets the agent persona, describes available tools, instructs the model to prefer targeted file edits over full rewrites, and to ask for clarification before destructive operations.

### Shell Safety

Commands run in a child process with a configurable working directory set per session. No network restrictions enforced — user responsibility beyond working directory scope.

---

## Section 3: Chat UI

### Layout

Full-height single-column window:
- **Top bar:** Project folder selector + settings gear icon
- **Middle:** Scrolling message thread
- **Bottom:** Multiline message input (`Shift+Enter` = newline, `Enter` = send)

### Message Types

| Type | Rendering |
|------|-----------|
| User message | Plain text bubble |
| Assistant text | Streaming markdown with syntax-highlighted code blocks |
| Tool call block | Expandable card: tool name + args → approval buttons → running spinner → collapsible output |
| File edit block | Diff view (before/after) rendered after `write_file` completes |
| Shell output block | Collapsible terminal-style output with exit code badge |

### Approval UX (Smart Mode)

When a tool call requires approval:
- Message input bar is disabled
- Approval card is visually highlighted
- Approve / Reject buttons rendered inline in the thread — no modal dialogs

### Session State

Each window is one session with its own conversation history and working directory. History is in-memory only in v1 — no persistence between sessions.

---

## Approval Modes

| Mode | Behavior |
|------|----------|
| `smart` (default) | Read operations auto-approved; write and shell operations require user approval |
| `auto` | All tool calls execute without asking |
| `manual` | Every tool call requires approval |

---

## Out of Scope (v1)

- Session history persistence / search
- Multi-window / multi-session management
- Plugin system
- Git integration
- Voice input
- Remote/cloud agent execution
