import { create } from 'zustand';
import type { Note, NoteColor, Workspace } from '../types/note';
import { chromeStorage } from '../storage/chromeStorage';
import { generateId } from '../utils/id';
import { getDefaultPosition, getDefaultSize } from '../utils/positioning';

interface WorkspaceState {
  tabId: number | null;
  url: string | null;
  notes: Note[];
  maxZIndex: number;
  loaded: boolean;

  initWorkspace: (tabId: number, url: string) => Promise<void>;
  createNote: (opts?: { color?: NoteColor; x?: number; y?: number }) => Note;
  deleteNote: (noteId: string) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  focusNote: (noteId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabId: null,
  url: null,
  notes: [],
  maxZIndex: 0,
  loaded: false,

  initWorkspace: async (tabId: number, url: string) => {
    const existing = await chromeStorage.loadWorkspace(url);
    if (existing) {
      const maxZ = existing.notes.reduce((max, n) => Math.max(max, n.zIndex), 0);
      // Update tabId to current (URL is the stable identity)
      const updated = { ...existing, tabId };
      set({ tabId, url, notes: updated.notes, maxZIndex: maxZ, loaded: true });
    } else {
      const workspace: Workspace = {
        tabId,
        url,
        notes: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await chromeStorage.saveWorkspaceImmediate(workspace);
      set({ tabId, url, notes: [], maxZIndex: 0, loaded: true });
    }
  },

  createNote: (opts) => {
    const state = get();
    if (state.url === null || state.tabId === null) return null as unknown as Note;
    const pos = getDefaultPosition(state.notes.length);
    const size = getDefaultSize();
    const newMaxZ = state.maxZIndex + 1;

    const note: Note = {
      id: generateId(),
      content: '',
      x: opts?.x ?? pos.x,
      y: opts?.y ?? pos.y,
      width: size.width,
      height: size.height,
      color: opts?.color ?? 'yellow',
      collapsed: false,
      zIndex: newMaxZ,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const newNotes = [...state.notes, note];
    set({ notes: newNotes, maxZIndex: newMaxZ });

    const workspace: Workspace = {
      tabId: state.tabId,
      url: state.url,
      notes: newNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    chromeStorage.saveWorkspace(workspace);

    return note;
  },

  deleteNote: (noteId: string) => {
    const state = get();
    if (state.url === null || state.tabId === null) return;
    const newNotes = state.notes.filter((n) => n.id !== noteId);
    set({ notes: newNotes });

    const workspace: Workspace = {
      tabId: state.tabId,
      url: state.url,
      notes: newNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    chromeStorage.saveWorkspace(workspace);
  },

  updateNote: (noteId: string, updates: Partial<Note>) => {
    const state = get();
    if (state.url === null || state.tabId === null) return;
    const newNotes = state.notes.map((n) =>
      n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n
    );
    set({ notes: newNotes });

    const workspace: Workspace = {
      tabId: state.tabId,
      url: state.url,
      notes: newNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    chromeStorage.saveWorkspace(workspace);
  },

  focusNote: (noteId: string) => {
    const state = get();
    if (state.url === null || state.tabId === null) return;
    const newMaxZ = state.maxZIndex + 1;
    const newNotes = state.notes.map((n) =>
      n.id === noteId ? { ...n, zIndex: newMaxZ } : n
    );
    set({ notes: newNotes, maxZIndex: newMaxZ });

    const workspace: Workspace = {
      tabId: state.tabId,
      url: state.url,
      notes: newNotes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    chromeStorage.saveWorkspace(workspace);
  },
}));
