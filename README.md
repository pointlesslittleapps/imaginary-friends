# Imaginary Friends

A private, local-first journaling app with customizable AI companions. Everything — your entries, your agents, the AI itself — runs entirely on your machine. Nothing is ever sent to the internet.

## What it does

Imaginary Friends is a forum-style diary: you post, your chosen AI companion replies, and the whole conversation lives in a scrollable thread with timestamps, tags, and avatars. You can create multiple companions, each with its own personality, avatar, topics of interest, and even a status line and signature that drift over time.

## Features

- **Fully offline AI** — powered by a locally-run LLM via [Ollama](https://ollama.ai) (default: Mistral 7B). No API keys, no cloud calls, no data leaving your machine.
- **Custom AI companions** — define personality, background, topics, avatar, and forbidden subjects for each one. Create as many as you like.
- **Threaded, forum-style posts** — chronological thread with timestamps, edit/delete, and tagging (freeform + suggested pick-list).
- **Rich text composer** — BBCode and Markdown support, with a formatting toolbar (bold, italic, underline, code, quote, link).
- **Personalization** — custom app name, username, avatar (including GIFs), color palette, fonts (detected from what's installed on your Mac), and even custom button labels.
- **Content filters** — a universal "forbidden topics" list applied to every companion, regardless of which one is active.
- **Password protection** — optional local lock screen (salted hash, never stored in plain text).
- **Persistent local storage** — SQLite database stored in your app data folder; nothing lives in the cloud, ever.

## Tech stack

- **Electron** — desktop app shell
- **React** — UI
- **SQLite** (via `sqlite3`) — local persistent storage
- **Ollama** — local LLM inference (Mistral 7B by default)
- **DOMPurify** — sanitizes all rendered content (Markdown/BBCode) before display

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) (v18+)
- [Ollama](https://ollama.ai) installed, with a model pulled:
  ```bash
  ollama pull mistral
  ```

### Setup

```bash
git clone https://github.com/pointlesslittleapps/imaginary-friends.git
cd imaginary-friends
npm install
```

### Run in development

Make sure Ollama is running in the background:

```bash
ollama serve
```

Then, in a separate terminal:

```bash
npm run dev
```

This starts the React dev server and launches the Electron app.

### Build a standalone Mac app

```bash
npm run dist
```

Produces a `.dmg` in the `dist/` folder (this also rebuilds `sqlite3`'s native binding
for Electron's ABI first, since it differs from plain Node's — required for packaging
to work at all). Ollama still needs to be running separately for the AI companions to
respond.

## Project structure

```
imaginary-friends/
├── public/           # Electron main process, preload script
├── src/
│   ├── api/           # Database layer, Ollama client, IPC handlers
│   ├── components/     # React UI components
│   ├── pages/          # Top-level App component
│   ├── styles/          # CSS
│   └── utils/            # Formatters, font detection
└── package.json
```

## Privacy

All data — journal entries, companion configurations, avatars, settings — is stored locally in a SQLite database in your OS's application data folder. The app makes zero network requests; the only "external" call is to `localhost:11434`, where your own Ollama instance runs.

## Status

**Alpha.** Requires a separate Ollama install and a pulled model to actually use the
AI-companion features — not a single self-contained installer.

## License

Personal project — license terms up to you to decide (MIT is a common permissive choice if you want others to freely use/modify it).

## Links

- [live site](https://pointlesslittleapps.com/apps/imaginary-friends.html)
- [all apps](https://github.com/pointlesslittleapps)
