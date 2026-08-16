import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import StickyNote from '../StickyNote/StickyNote';

export default function WorkspaceApp() {
  const { notes, loaded, initWorkspace, createNote, focusNote } = useWorkspaceStore();
  const [tabId, setTabId] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Get tab ID from content script
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setTabId(e.detail.tabId);
    };
    window.addEventListener('tabnote-tab-id', handler as EventListener);
    window.dispatchEvent(new CustomEvent('tabnote-get-tab-id'));

    return () => window.removeEventListener('tabnote-tab-id', handler as EventListener);
  }, []);

  // Initialize workspace when tab ID is known — URL is the stable identity
  useEffect(() => {
    if (tabId !== null) {
      initWorkspace(tabId, window.location.href);
    }
  }, [tabId, initWorkspace]);

  // Listen for create-note commands
  useEffect(() => {
    const handler = () => {
      createNote();
    };
    window.addEventListener('tabnote-create-note', handler as EventListener);
    return () => window.removeEventListener('tabnote-create-note', handler as EventListener);
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

  // Expose workspace actions to the global scope for the content script
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__tabnote = {
      createNote: () => createNote(),
      focusNote: (noteId: string) => focusNote(noteId),
    };
  }, [createNote, focusNote]);

  if (!loaded) return null;

  return (
    <div className="tabnote-workspace">
      {notes.map((note) => (
        <StickyNote key={note.id} note={note} />
      ))}
      <div className={`tabnote-create-hint ${showHint ? 'visible' : ''}`}>
        Press Alt+N to create a note
      </div>
    </div>
  );
}
