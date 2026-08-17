# WebNote

**Webpage-specific sticky notes for Chrome.**

Every webpage gets its own lightweight workspace. Create, edit, move, resize, recolor, collapse, and delete sticky notes — all persisted locally per URL.

## Features

- **Page-specific notes** — notes are tied to the page URL, not the tab
- **Multiple notes per page** — create as many as you need
- **Drag & resize** — position and size notes freely
- **Color picker** — 6 predefined note colors
- **Collapse/minimize** — minimize notes without losing content
- **Persistent** — notes survive page reloads, tab switches, and browser restarts
- **Keyboard shortcut** — `Alt+N` to create a note instantly
- **Popup overview** — see and manage all notes on the current page
- **Local-first** — no accounts, no backend, no data leaves your device

## Setup

### Prerequisites

- Google Chrome (current stable)
- Node.js 18+ (for building)

### Install & Build

```bash
cd tabnote
npm install
npm run build
```

The built extension will be in the `dist/` folder.

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `tabnote/dist/` folder
5. The WebNote icon appears in your toolbar

### Development

```bash
npm run dev
```

This starts Vite in dev mode. After changes, rebuild and reload the extension in `chrome://extensions/`.

## Usage

| Action                    | How                                                                       |
| ------------------------- | ------------------------------------------------------------------------- |
| **Create a note**   | Click the WebNote popup icon and press "+ Create Note", or press`Alt+N` |
| **Edit a note**     | Click inside the note body and start typing                               |
| **Move a note**     | Drag the note header                                                      |
| **Resize a note**   | Drag the bottom-right corner                                              |
| **Change color**    | Click the colored circle in the note header                               |
| **Collapse a note** | Click the`−` button in the header                                      |
| **Delete a note**   | Click the`✕` button in the header                                      |
| **Focus a note**    | Click on it (brings to front) or select it from the popup                 |

## Architecture

```
tabnote/
├── src/
│   ├── background/index.ts       # Service worker: lifecycle, messaging, shortcuts
│   ├── content/index.ts          # Content script: Shadow DOM mount, message handling
│   ├── popup/                    # Extension popup: note list, create button
│   ├── components/
│   │   ├── StickyNote/           # Individual note: drag, resize, edit, color
│   │   └── Workspace/            # Workspace container: renders all notes
│   ├── store/workspaceStore.ts   # Zustand state management
│   ├── storage/chromeStorage.ts  # chrome.storage.local adapter with debouncing
│   ├── types/note.ts             # TypeScript types and message contracts
│   └── utils/                    # ID generation, positioning helpers
├── public/manifest.json          # Manifest V3 configuration
├── build.mjs                     # esbuild: bundles content (IIFE) and background (ESM)
├── index.html                    # Popup HTML entry
└── vite.config.ts                # Popup Vite build
```

## Tech Stack

- **Chrome Extension** — Manifest V3
- **UI** — React 19 + TypeScript
- **Build** — Vite (popup) + esbuild (content/background)
- **State** — Zustand
- **Storage** — `chrome.storage.local`
- **Isolation** — Shadow DOM

## Permissions

| Permission    | Why                                          |
| ------------- | -------------------------------------------- |
| `storage`   | Persist notes locally                        |
| `tabs`      | Identify active tab for background messaging |
| `activeTab` | Access the current tab's ID                  |
| `commands`  | Keyboard shortcut (`Alt+N`)                |

## Data Model

Notes are stored per URL under `ws:<normalizedUrl>` in `chrome.storage.local`:

```typescript
type Note = {
  id: string;
  content: string;
  x: number; y: number;
  width: number; height: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';
  collapsed: boolean;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
};

type Workspace = {
  tabId: number;
  url: string;
  notes: Note[];
  createdAt: number;
  updatedAt: number;
};
```

## Build Details

Content and background scripts are bundled with esbuild (not Vite) to avoid Chrome compatibility issues:

- **Content script** (`content.js`): IIFE format — zero ES module imports, works in all content script contexts
- **Background service worker** (`background.js`): ESM format — runs with `type: "module"` in manifest
- **Popup** (`popup.js`): Standard Vite HTML+JS entry point

## License

MIT
