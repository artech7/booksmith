import { useState, useRef } from 'react';

export default function Sidebar({
  books, selectedBookId, onSelectBook, onAddBook, onDeleteBook,
  chapters, selectedChapterId, onSelectChapter, onAddChapter, onDeleteChapter,
  onReorderBooks, onReorderChapters,
}) {
  const [expanded, setExpanded] = useState(() => new Set(books.map(b => b.id)));
  const dragItem  = useRef(null);
  const [dragOverId, setDragOverId] = useState(null);

  const toggleExpand = (e, bookId) => {
    e.stopPropagation();
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(bookId) ? next.delete(bookId) : next.add(bookId);
      return next;
    });
  };

  const handleSelectBook = (id) => {
    setExpanded(prev => { const n = new Set(prev); n.add(id); return n; });
    onSelectBook(id);
  };

  const onDragStart = (e, type, id, bookId) => {
    dragItem.current = { type, id, bookId };
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, type, id, bookId) => {
    e.preventDefault();
    if (!dragItem.current) return;
    if (dragItem.current.type !== type) return;
    if (type === 'chapter' && dragItem.current.bookId !== bookId) return;
    setDragOverId(id);
  };

  const onDrop = (e, type, targetId, targetBookId) => {
    e.preventDefault();
    setDragOverId(null);
    if (!dragItem.current || dragItem.current.id === targetId) return;
    if (dragItem.current.type !== type) return;

    if (type === 'book') {
      const arr = [...books];
      const fi  = arr.findIndex(b => b.id === dragItem.current.id);
      const ti  = arr.findIndex(b => b.id === targetId);
      if (fi === -1 || ti === -1) return;
      const [m] = arr.splice(fi, 1);
      arr.splice(ti, 0, m);
      onReorderBooks(arr);
    } else {
      if (dragItem.current.bookId !== targetBookId) return;
      const arr = [...chapters];
      const fi  = arr.findIndex(c => c.id === dragItem.current.id);
      const ti  = arr.findIndex(c => c.id === targetId);
      if (fi === -1 || ti === -1) return;
      const [m] = arr.splice(fi, 1);
      arr.splice(ti, 0, m);
      onReorderChapters(targetBookId, arr);
    }
    dragItem.current = null;
  };

  const onDragEnd = () => { dragItem.current = null; setDragOverId(null); };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-wordmark">BookSmith</div>
        <div className="sidebar-tagline">Your writing sanctuary</div>
      </div>

      <div className="sidebar-body">
        <div className="sb-section">
          <span>Library</span>
          <button className="icon-btn" onClick={onAddBook} title="New book">＋</button>
        </div>

        {books.length === 0 && (
          <div style={{ padding: '8px 16px', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-faint)' }}>
            No books yet — click ＋ to begin.
          </div>
        )}

        {books.map(book => {
          const isActive   = selectedBookId === book.id;
          const isExpanded = expanded.has(book.id);

          return (
            <div key={book.id}>
              <div
                className={`sb-item ${isActive ? 'active' : ''} ${dragOverId === book.id ? 'drag-over' : ''}`}
                onClick={() => handleSelectBook(book.id)}
                draggable
                onDragStart={e => onDragStart(e, 'book', book.id, null)}
                onDragOver={e  => onDragOver(e, 'book', book.id, null)}
                onDrop={e      => onDrop(e, 'book', book.id, null)}
                onDragEnd={onDragEnd}
              >
                <span className="drag-handle" title="Drag to reorder">⣿</span>
                <span style={{ fontSize: '12px' }}>📖</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.title}
                </span>
                {isActive && (
                  <button
                    className={`collapse-btn ${isExpanded ? 'open' : ''}`}
                    onClick={e => toggleExpand(e, book.id)}
                    title={isExpanded ? 'Hide chapters' : 'Show chapters'}
                  >▶</button>
                )}
                <button className="sb-item-del" onClick={e => { e.stopPropagation(); onDeleteBook(book.id); }}>×</button>
              </div>

              {isActive && isExpanded && (
                <>
                  <div className="sb-section" style={{ paddingLeft: '30px', paddingTop: '6px' }}>
                    <span>Chapters</span>
                  </div>
                  {chapters.map(ch => (
                    <div
                      key={ch.id}
                      className={`sb-item sb-item-ch ${selectedChapterId === ch.id ? 'active' : ''} ${dragOverId === ch.id ? 'drag-over' : ''}`}
                      onClick={() => onSelectChapter(ch.id)}
                      draggable
                      onDragStart={e => onDragStart(e, 'chapter', ch.id, book.id)}
                      onDragOver={e  => onDragOver(e, 'chapter', ch.id, book.id)}
                      onDrop={e      => onDrop(e, 'chapter', ch.id, book.id)}
                      onDragEnd={onDragEnd}
                    >
                      <span className="drag-handle" title="Drag to reorder">⣿</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>§</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ch.title}
                      </span>
                      <button className="sb-item-del" onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }}>×</button>
                    </div>
                  ))}
                  <div className="sb-item sb-item-ch sb-add" onClick={onAddChapter}>
                    <span>＋</span><span>New chapter</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
