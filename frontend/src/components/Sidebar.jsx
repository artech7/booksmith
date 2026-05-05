export default function Sidebar({
  books, selectedBookId, onSelectBook, onAddBook, onDeleteBook,
  chapters, selectedChapterId, onSelectChapter, onAddChapter, onDeleteChapter,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-wordmark">BookSmith</div>
        <div className="sidebar-tagline">Your writing sanctuary</div>
      </div>

      <div className="sidebar-scroll">
        <div className="sidebar-section-label">
          <span>Library</span>
          <button className="icon-btn" onClick={onAddBook} title="New book">＋</button>
        </div>

        {books.length === 0 && (
          <div style={{ padding: '10px 16px 6px', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-faint)' }}>
            No books yet — click ＋ to begin.
          </div>
        )}

        {books.map(book => (
          <div key={book.id}>
            <div
              className={`sidebar-item ${selectedBookId === book.id ? 'active' : ''}`}
              onClick={() => onSelectBook(book.id)}
            >
              <span className="sidebar-item-icon">📖</span>
              <span className="sidebar-item-label">{book.title}</span>
              <button
                className="sidebar-item-del"
                onClick={e => { e.stopPropagation(); onDeleteBook(book.id); }}
                title="Delete book"
              >×</button>
            </div>

            {selectedBookId === book.id && (
              <>
                <div className="sidebar-section-label" style={{ paddingLeft: '32px', paddingTop: '6px' }}>
                  <span>Chapters</span>
                </div>

                {chapters.map(ch => (
                  <div
                    key={ch.id}
                    className={`sidebar-item sidebar-chapter ${selectedChapterId === ch.id ? 'active' : ''}`}
                    onClick={() => onSelectChapter(ch.id)}
                  >
                    <span className="sidebar-item-icon" style={{ color: 'var(--text-faint)', fontSize: '9px' }}>§</span>
                    <span className="sidebar-item-label">{ch.title}</span>
                    <button
                      className="sidebar-item-del"
                      onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }}
                      title="Delete chapter"
                    >×</button>
                  </div>
                ))}

                <div className="sidebar-item sidebar-chapter sidebar-add" onClick={onAddChapter}>
                  <span className="sidebar-item-icon">＋</span>
                  <span>New chapter</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
