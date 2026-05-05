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

        {books.map(book => (
          <div key={book.id}>
            <div
              className={`sb-item ${selectedBookId === book.id ? 'active' : ''}`}
              onClick={() => onSelectBook(book.id)}
            >
              <span style={{ fontSize: '12px' }}>📖</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {book.title}
              </span>
              <button
                className="sb-item-del"
                onClick={e => { e.stopPropagation(); onDeleteBook(book.id); }}
              >×</button>
            </div>

            {selectedBookId === book.id && (
              <>
                <div className="sb-section" style={{ paddingLeft: '30px', paddingTop: '6px' }}>
                  <span>Chapters</span>
                </div>
                {chapters.map(ch => (
                  <div
                    key={ch.id}
                    className={`sb-item sb-item-ch ${selectedChapterId === ch.id ? 'active' : ''}`}
                    onClick={() => onSelectChapter(ch.id)}
                  >
                    <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>§</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.title}
                    </span>
                    <button
                      className="sb-item-del"
                      onClick={e => { e.stopPropagation(); onDeleteChapter(ch.id); }}
                    >×</button>
                  </div>
                ))}
                <div className="sb-item sb-item-ch sb-add" onClick={onAddChapter}>
                  <span>＋</span><span>New chapter</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
