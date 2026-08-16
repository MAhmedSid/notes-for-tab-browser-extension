export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple' | 'orange';

export const NOTE_COLORS: NoteColor[] = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'];

export const NOTE_COLOR_MAP: Record<NoteColor, string> = {
  yellow: '#fff9b1',
  green: '#c8f7c5',
  blue: '#c5dff8',
  pink: '#f9c5d1',
  purple: '#e8d5f5',
  orange: '#fde2c8',
};

export interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: NoteColor;
  collapsed: boolean;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface Workspace {
  tabId: number;
  url: string;
  notes: Note[];
  createdAt: number;
  updatedAt: number;
}

// Message types for extension messaging
export type MessageType =
  | 'CREATE_NOTE'
  | 'DELETE_NOTE'
  | 'UPDATE_NOTE'
  | 'LOAD_WORKSPACE'
  | 'WORKSPACE_LOADED'
  | 'FOCUS_NOTE'
  | 'NOTE_FOCUSED'
  | 'GET_NOTES_FOR_POPUP'
  | 'NOTES_FOR_POPUP'
  | 'TAB_CLOSED'
  | 'CREATE_NOTE_COMMAND'
  | 'TAB_UPDATED'
  | 'GET_TAB_ID';

export interface Message {
  type: MessageType;
  payload?: unknown;
  tabId?: number;
}

export interface CreateNoteMessage extends Message {
  type: 'CREATE_NOTE';
  payload?: { color?: NoteColor; x?: number; y?: number };
}

export interface DeleteNoteMessage extends Message {
  type: 'DELETE_NOTE';
  payload: { noteId: string };
}

export interface UpdateNoteMessage extends Message {
  type: 'UPDATE_NOTE';
  payload: Partial<Note> & { id: string };
}

export interface LoadWorkspaceMessage extends Message {
  type: 'LOAD_WORKSPACE';
}

export interface WorkspaceLoadedMessage extends Message {
  type: 'WORKSPACE_LOADED';
  payload: Workspace;
}

export interface FocusNoteMessage extends Message {
  type: 'FOCUS_NOTE';
  payload: { noteId: string };
}

export interface GetNotesForPopupMessage extends Message {
  type: 'GET_NOTES_FOR_POPUP';
}

export interface NotesForPopupMessage extends Message {
  type: 'NOTES_FOR_POPUP';
  payload: { notes: Note[]; tabId: number };
}
