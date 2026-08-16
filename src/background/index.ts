import type { Message, NotesForPopupMessage } from '../types/note';
import { chromeStorage } from '../storage/chromeStorage';

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse) => {
    switch (message.type) {
      case 'GET_TAB_ID': {
        sendResponse({ tabId: sender.tab?.id ?? null });
        return false;
      }

      case 'GET_NOTES_FOR_POPUP': {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          const activeTab = tabs[0];
          if (!activeTab?.id || !activeTab.url) {
            sendResponse({ notes: [], tabId: 0 } as NotesForPopupMessage['payload']);
            return;
          }
          const workspace = await chromeStorage.loadWorkspace(activeTab.url);
          sendResponse({
            notes: workspace?.notes ?? [],
            tabId: activeTab.id,
          });
        });
        return true; // async response
      }

      case 'CREATE_NOTE_COMMAND': {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (activeTab?.id) {
            chrome.tabs.sendMessage(activeTab.id, message);
          }
        });
        return false;
      }

      case 'DELETE_NOTE':
      case 'FOCUS_NOTE': {
        const tabId = message.tabId ?? sender.tab?.id;
        if (tabId) {
          chrome.tabs.sendMessage(tabId, message);
        }
        return false;
      }

      default:
        return false;
    }
  }
);

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'create-note') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          type: 'CREATE_NOTE_COMMAND',
          tabId: activeTab.id,
        } as Message);
      }
    });
  }
});

// Tab close: do NOT delete workspace data.
// Notes are keyed by URL and persist across browser restarts.
// chrome.tabs.onRemoved is intentionally not used for cleanup.

console.log('TabNote background service worker loaded');
