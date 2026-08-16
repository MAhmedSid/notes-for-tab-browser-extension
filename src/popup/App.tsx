import React, { useEffect, useState } from 'react';
import type { Note } from '../types/note';
import { NOTE_COLOR_MAP } from '../types/note';

export default function PopupApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tabId, setTabId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        setLoading(false);
        return;
      }
      setTabId(activeTab.id);

      // Try sending to content script first
      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_NOTES_FOR_POPUP' }, (response) => {
        if (chrome.runtime.lastError || !response) {
          // Content script not loaded - try background
          chrome.runtime.sendMessage({ type: 'GET_NOTES_FOR_POPUP' }, (bgResponse) => {
            if (chrome.runtime.lastError || !bgResponse) {
              setError('TabNote is not active on this page. Navigate to a regular webpage and try again.');
              setLoading(false);
              return;
            }
            setNotes(bgResponse.notes ?? []);
            setLoading(false);
          });
          return;
        }
        setNotes(response.notes ?? []);
        setLoading(false);
      });
    });
  }, []);

  const handleCreateNote = () => {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'CREATE_NOTE_COMMAND', tabId });
      // Refresh after a short delay to let the note be created
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { type: 'GET_NOTES_FOR_POPUP' }, (response) => {
          if (response) {
            setNotes(response.notes ?? []);
          }
        });
      }, 300);
    }
  };

  const handleFocusNote = (noteId: string) => {
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { type: 'FOCUS_NOTE', payload: { noteId } });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (tabId) {
      // Delete via content script (which persists to storage)
      chrome.tabs.sendMessage(tabId, { type: 'DELETE_NOTE', payload: { noteId } }, () => {
        // Also try background in case content script isn't available
        if (chrome.runtime.lastError) {
          chrome.runtime.sendMessage({ type: 'DELETE_NOTE', payload: { noteId }, tabId });
        }
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#fff9b1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
            T
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>TabNote</span>
        </div>
        <span style={{ fontSize: 12, color: '#888' }}>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Note list */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>
            Loading...
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: 20, color: '#e74c3c', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>
            No notes on this tab yet.
          </div>
        )}

        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              padding: '8px 10px',
              marginBottom: 6,
              borderRadius: 6,
              backgroundColor: NOTE_COLOR_MAP[note.color],
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
            onClick={() => handleFocusNote(note.id)}
          >
            <div style={{ fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 20 }}>
              {note.content || '(empty)'}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                color: '#999',
                padding: '0 2px',
              }}
              title="Delete"
            >
              &#10005;
            </button>
          </div>
        ))}
      </div>

      {/* Create button */}
      <button
        onClick={handleCreateNote}
        style={{
          width: '100%',
          marginTop: 12,
          padding: '8px 16px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 500,
          transition: 'background 0.15s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#555')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#333')}
      >
        + Create Note
      </button>
    </div>
  );
}
