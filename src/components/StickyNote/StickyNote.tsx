import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Note } from '../../types/note';
import { NOTE_COLORS, NOTE_COLOR_MAP } from '../../types/note';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface StickyNoteProps {
  note: Note;
}

export default function StickyNote({ note }: StickyNoteProps) {
  const { updateNote, deleteNote, focusNote } = useWorkspaceStore();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [focused, setFocused] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const noteRef = useRef<HTMLDivElement>(null);

  // --- Drag ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.webnote-btn, .webnote-color-btn, .webnote-color-swatch, .webnote-editor')) {
        return;
      }
      e.preventDefault();
      focusNote(note.id);
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, noteX: note.x, noteY: note.y };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - dragStart.current.x;
        const dy = ev.clientY - dragStart.current.y;
        updateNote(note.id, {
          x: dragStart.current.noteX + dx,
          y: dragStart.current.noteY + dy,
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [note.id, note.x, note.y, updateNote, focusNote]
  );

  // --- Resize ---
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY, w: note.width, h: note.height };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - resizeStart.current.x;
        const dy = ev.clientY - resizeStart.current.y;
        const newW = Math.max(160, Math.min(600, resizeStart.current.w + dx));
        const newH = Math.max(100, Math.min(500, resizeStart.current.h + dy));
        updateNote(note.id, { width: newW, height: newH });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [note.id, note.width, note.height, updateNote]
  );

  // --- Focus ---
  const handleFocus = useCallback(() => {
    focusNote(note.id);
    setFocused(true);
  }, [note.id, focusNote]);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  // --- Keyboard handling: prevent host page shortcuts while typing ---
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
  }, []);

  // --- Color picker toggle ---
  const toggleColorPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker((prev) => !prev);
  }, []);

  const handleColorSelect = useCallback(
    (color: typeof NOTE_COLORS[number], e: React.MouseEvent) => {
      e.stopPropagation();
      updateNote(note.id, { color });
      setShowColorPicker(false);
    },
    [note.id, updateNote]
  );

  const bgColor = NOTE_COLOR_MAP[note.color];

  if (note.collapsed) {
    return (
      <div
        ref={noteRef}
        className="webnote-note"
        style={{
          left: note.x,
          top: note.y,
          width: 140,
          height: 28,
          backgroundColor: bgColor,
          zIndex: note.zIndex,
          cursor: 'pointer',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          focusNote(note.id);
          // Un-collapse on click
          updateNote(note.id, { collapsed: false });
        }}
      >
        <div className="webnote-collapsed-indicator" style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
          {note.content.slice(0, 20) || '(empty)'}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={noteRef}
      className={`webnote-note ${focused ? 'focused' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: bgColor,
        zIndex: note.zIndex,
      }}
      onMouseDown={() => handleFocus()}
    >
      {/* Header */}
      <div
        className="webnote-header"
        onMouseDown={handleDragStart}
        style={{ position: 'relative' }}
      >
        <div className="webnote-header-left">
          <div className="webnote-color-btn" style={{ backgroundColor: bgColor }} onClick={toggleColorPicker} />
          {showColorPicker && (
            <div className="webnote-color-picker visible">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  className={`webnote-color-swatch ${c === note.color ? 'active' : ''}`}
                  style={{ backgroundColor: NOTE_COLOR_MAP[c] }}
                  onClick={(e) => handleColorSelect(c, e)}
                  title={c}
                />
              ))}
            </div>
          )}
        </div>
        <div className="webnote-header-right">
          <button
            className="webnote-btn"
            onClick={(e) => { e.stopPropagation(); updateNote(note.id, { collapsed: true }); }}
            title="Collapse"
          >
            &#8722;
          </button>
          <button
            className="webnote-btn delete"
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
            title="Delete"
          >
            &#10005;
          </button>
        </div>
      </div>

      {/* Body */}
      {!note.collapsed && (
        <div className="webnote-body">
          <textarea
            className="webnote-editor"
            value={note.content}
            placeholder="Type a note..."
            onKeyDown={handleKeyDown}
            onChange={(e) => updateNote(note.id, { content: e.target.value })}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>
      )}

      {/* Resize handle */}
      <div
        className="webnote-resize-handle"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
