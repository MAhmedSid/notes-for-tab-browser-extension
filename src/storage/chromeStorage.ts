import type { Workspace } from '../types/note';

const SCHEMA_VERSION = 1;

interface StorageEntry {
  schemaVersion: number;
  workspace: Workspace;
}

// Normalize URL: strip trailing slash and fragment for consistent keys
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // Strip trailing slash from pathname (but keep root "/")
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function storageKey(url: string): string {
  return `ws:${normalizeUrl(url)}`;
}

// Debounce helper
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

function debouncedSet(key: string, value: StorageEntry, delay = 300): void {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    key,
    setTimeout(() => {
      chrome.storage.local.set({ [key]: value });
      debounceTimers.delete(key);
    }, delay)
  );
}

export const chromeStorage = {
  async loadWorkspace(url: string): Promise<Workspace | null> {
    const key = storageKey(url);
    const result = await chrome.storage.local.get(key);
    const entry = result[key] as StorageEntry | undefined;
    if (!entry || entry.schemaVersion !== SCHEMA_VERSION) {
      return null;
    }
    return entry.workspace;
  },

  async saveWorkspace(workspace: Workspace): Promise<void> {
    const key = storageKey(workspace.url);
    const entry: StorageEntry = {
      schemaVersion: SCHEMA_VERSION,
      workspace: { ...workspace, updatedAt: Date.now() },
    };
    debouncedSet(key, entry);
  },

  async saveWorkspaceImmediate(workspace: Workspace): Promise<void> {
    const key = storageKey(workspace.url);
    const entry: StorageEntry = {
      schemaVersion: SCHEMA_VERSION,
      workspace: { ...workspace, updatedAt: Date.now() },
    };
    await chrome.storage.local.set({ [key]: entry });
  },

  // Tab close no longer deletes URL-persisted workspace data.
  // Notes survive browser restarts and tab closures.
};
