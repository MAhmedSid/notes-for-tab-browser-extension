import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import StickyNote from '../StickyNote/StickyNote';

interface TabMeta {
  tabId: number;
  index: number;
  windowId: number;
}

export default function WorkspaceApp() {
  const { notes, loaded, initWorkspace, createNote, focusNote } = useWorkspaceStore();
  const [tabMeta, setTabMeta] = useState<TabMeta | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Get tab metadata from content script
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTabMeta(e.detail);
    };
    window.addEventListener('webnote-tab-meta', handler as EventListener);
    window.dispatchEvent(new CustomEvent('webnote-get-tab-meta'));

    return () => window.removeEventListener('webnote-tab-meta', handler as EventListener);
  }, []);

  // Initialize workspace when tab metadata is known
  useEffect(() => {
    if (tabMeta) {
      initWorkspace(tabMeta.tabId, window.location.href);
    }
  }, [tabMeta, initWorkspace]);

  // Listen for create-note commands
  useEffect(() => {
    const handler = () => createNote();
    window.addEventListener('webnote-create-note', handler as EventListener);
    return () => window.removeEventListener('webnote-create-note', handler as EventListener);
  }, [createNote]);

  // Show hint briefly when notes are empty
  useEffect(() => {
    if (loaded && notes.length === 0) {
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(timer);
    }
    setShowHint(false);
  }, [loaded, notes.length]);

  // Expose workspace actions to global scope
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__webnote = {
      createNote: () => createNote(),
      focusNote: (noteId: string) => focusNote(noteId),
    };
  }, [createNote, focusNote]);

  if (!loaded) return null;

  return (
    <div className="webnote-workspace">
      {notes.map((note) => (
        <StickyNote key={note.id} note={note} />
      ))}
      <div className={`webnote-create-hint ${showHint ? 'visible' : ''}`}>
        Press Alt+N to create a note
      </div>
    </div>
  );
}
