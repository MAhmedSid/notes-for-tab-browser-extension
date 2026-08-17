import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Message, NotesForPopupMessage } from '../types/note';
import WorkspaceApp from '../components/Workspace/WorkspaceApp';
import { useWorkspaceStore } from '../store/workspaceStore';

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let currentTabId: number | null = null;
let tabMetaCache: { tabId: number; index: number; windowId: number } | null = null;

function ensureContainer(): HTMLDivElement {
  if (container && document.body.contains(container)) {
    return container;
  }

  container = document.createElement('div');
  container.id = 'webnote-workspace-root';
  container.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';

  const shadow = container.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getStyles();
  shadow.appendChild(style);

  const mountPoint = document.createElement('div');
  mountPoint.id = 'webnote-mount';
  mountPoint.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;';
  shadow.appendChild(mountPoint);

  document.body.appendChild(container);

  root = createRoot(mountPoint);
  root.render(React.createElement(WorkspaceApp));

  return container;
}

function getStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .webnote-workspace { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 2147483647; }
    .webnote-note { position: absolute; pointer-events: all; display: flex; flex-direction: column; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); overflow: hidden; font-size: 14px; line-height: 1.4; transition: box-shadow 0.15s ease; }
    .webnote-note:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
    .webnote-note.focused { box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
    .webnote-header { display: flex; align-items: center; padding: 4px 6px; cursor: grab; user-select: none; min-height: 28px; gap: 4px; }
    .webnote-header:active { cursor: grabbing; }
    .webnote-header-left { display: flex; align-items: center; gap: 4px; flex: 1; position: relative; }
    .webnote-header-right { display: flex; align-items: center; gap: 2px; }
    .webnote-color-btn { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.15); cursor: pointer; padding: 0; transition: transform 0.1s; }
    .webnote-color-btn:hover { transform: scale(1.2); }
    .webnote-color-picker { display: none; position: absolute; top: 100%; left: 0; background: white; border-radius: 6px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); gap: 4px; z-index: 10; }
    .webnote-color-picker.visible { display: flex; }
    .webnote-color-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.1); cursor: pointer; padding: 0; transition: transform 0.1s; }
    .webnote-color-swatch:hover { transform: scale(1.15); }
    .webnote-color-swatch.active { border-color: rgba(0,0,0,0.4); box-shadow: 0 0 0 2px rgba(0,0,0,0.15); }
    .webnote-btn { background: none; border: none; cursor: pointer; font-size: 14px; line-height: 1; padding: 2px; opacity: 0.5; transition: opacity 0.15s; color: rgba(0,0,0,0.6); }
    .webnote-btn:hover { opacity: 1; }
    .webnote-btn.delete:hover { color: #e74c3c; }
    .webnote-body { flex: 1; padding: 8px 10px; overflow-y: auto; cursor: text; }
    .webnote-editor { width: 100%; min-height: 60px; border: none; background: transparent; outline: none; resize: none; font-family: inherit; font-size: 13px; line-height: 1.5; color: #333; }
    .webnote-resize-handle { position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; cursor: nwse-resize; pointer-events: all; }
    .webnote-resize-handle::after { content: ''; position: absolute; bottom: 3px; right: 3px; width: 8px; height: 8px; border-right: 2px solid rgba(0,0,0,0.2); border-bottom: 2px solid rgba(0,0,0,0.2); }
    .webnote-collapsed-indicator { display: flex; align-items: center; padding: 4px 8px; font-size: 12px; color: rgba(0,0,0,0.5); cursor: pointer; }
    .webnote-create-hint { position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 14px; border-radius: 6px; font-size: 12px; pointer-events: all; opacity: 0; transition: opacity 0.3s; z-index: 2147483647; }
    .webnote-create-hint.visible { opacity: 1; }
  `;
}

// Initialize workspace for this tab
async function init() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_TAB_ID' });
    if (!response?.tabId) {
      console.warn('WebNote: Could not determine tab ID');
      return;
    }
    currentTabId = response.tabId;
    tabMetaCache = {
      tabId: response.tabId,
      index: response.index ?? 0,
      windowId: response.windowId ?? 0,
    };
    ensureContainer();
  } catch (e) {
    console.warn('WebNote: Could not initialize workspace', e);
  }
}

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case 'CREATE_NOTE_COMMAND': {
      ensureContainer();
      window.dispatchEvent(new CustomEvent('webnote-create-note', { detail: message.payload }));
      return false;
    }

    case 'GET_NOTES_FOR_POPUP': {
      const state = useWorkspaceStore.getState();
      sendResponse({
        notes: state.notes,
        tabId: currentTabId,
      } as NotesForPopupMessage['payload']);
      return true;
    }

    case 'DELETE_NOTE': {
      const payload = message.payload as { noteId: string };
      if (payload?.noteId) {
        useWorkspaceStore.getState().deleteNote(payload.noteId);
      }
      return false;
    }

    case 'FOCUS_NOTE': {
      const payload = message.payload as { noteId: string };
      if (payload?.noteId) {
        useWorkspaceStore.getState().focusNote(payload.noteId);
      }
      return false;
    }

    default:
      return false;
  }
});

// Custom event bridge for WorkspaceApp to get tab metadata
window.addEventListener('webnote-get-tab-meta', () => {
  if (tabMetaCache) {
    window.dispatchEvent(new CustomEvent('webnote-tab-meta', { detail: tabMetaCache }));
  } else {
    // Fetch and then dispatch
    chrome.runtime.sendMessage({ type: 'GET_TAB_ID' }).then((response) => {
      if (response?.tabId) {
        tabMetaCache = {
          tabId: response.tabId,
          index: response.index ?? 0,
          windowId: response.windowId ?? 0,
        };
        window.dispatchEvent(new CustomEvent('webnote-tab-meta', { detail: tabMetaCache }));
      }
    });
  }
});

init();
