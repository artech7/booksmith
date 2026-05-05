import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

const WORDS_PER_PAGE = 250;

function splitIntoPages(text) {
  if (!text.trim()) return [''];
  const words = text.split(/(\s+)/); // preserve whitespace tokens
  const pages = [];
  let page = '';
  let wordCount = 0;

  for (const token of words) {
    const isWord = /\S/.test(token);
    if (isWord) wordCount++;
    page += token;
    if (wordCount >= WORDS_PER_PAGE && isWord) {
      pages.push(page.trimEnd());
      page = '';
      wordCount = 0;
    }
  }
  if (page.trim() || pages.length === 0) pages.push(page.trimEnd());
  return pages;
}

export default function StoryEditor({
  chapter,
  onSave,
  onFocusChange,
  distractionFree,
  onToggleDistractionFree,
  setSaveStatus,
}) {
  const [title,   setTitle]   = useState(chapter.title   ?? '');
  const [content, setContent] = useState(chapter.content ?? '');
  const [view,    setView]    = useState('edit'); // 'edit' | 'pages'
  const [curPage, setCurPage] = useState(0);
  const textareaRef = useRef(null);

  const debouncedSave = useDebounce((data) => { onSave(chapter.id, data); }, 1100);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setSaveStatus('saving');
    debouncedSave({ title: e.target.value });
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setSaveStatus('saving');
    debouncedSave({ content: e.target.value });
  };

  const handleFocus = () => onFocusChange(true);
  const handleBlur  = () => onFocusChange(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && distractionFree) onToggleDistractionFree();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [distractionFree, onToggleDistractionFree]);

  // Stats
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const pages = splitIntoPages(content);
  const totalPages = pages.length;
  const pageLabel  = words === 0 ? '< 1 pg' : `~${totalPages} ${totalPages === 1 ? 'pg' : 'pgs'}`;

  // Keep curPage in bounds when content changes
  useEffect(() => {
    if (curPage >= totalPages) setCurPage(Math.max(0, totalPages - 1));
  }, [totalPages]);

  const switchView = (v) => {
    setView(v);
    if (v === 'pages') setCurPage(0);
    onFocusChange(false);
  };

  return (
    <div className="story-editor">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <input
          className="chapter-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Chapter title…"
          spellCheck
          style={{ flex: 1 }}
        />
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${view === 'edit'  ? 'active' : ''}`}
            onClick={() => switchView('edit')}
          >✎ Edit</button>
          <button
            className={`view-toggle-btn ${view === 'pages' ? 'active' : ''}`}
            onClick={() => switchView('pages')}
          >◫ Pages</button>
        </div>
      </div>

      <div className="story-divider" />

      {view === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="story-textarea"
          value={content}
          onChange={handleContentChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Begin your story here… let the words find you."
          spellCheck
        />
      ) : (
        <>
          <div className="pages-view">
            <div className="page-sheet">
              <div className="page-sheet-text">
                {pages[curPage] || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>This page is empty.</span>}
              </div>
              <div className="page-number">— {curPage + 1} —</div>
            </div>
          </div>
          <div className="pages-nav">
            <button
              className="btn btn-sm"
              onClick={() => setCurPage(p => Math.max(0, p - 1))}
              disabled={curPage === 0}
              style={{ opacity: curPage === 0 ? 0.3 : 1 }}
            >← Prev</button>
            <span className="pages-nav-info">Page {curPage + 1} of {totalPages}</span>
            <button
              className="btn btn-sm"
              onClick={() => setCurPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={curPage >= totalPages - 1}
              style={{ opacity: curPage >= totalPages - 1 ? 0.3 : 1 }}
            >Next →</button>
          </div>
        </>
      )}

      <div className="editor-footer">
        <span className="word-count">
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {chars.toLocaleString()} chars · {pageLabel}
        </span>
        <div style={{ flex: 1 }} />
        <button
          className={`btn btn-sm ${distractionFree ? 'btn-accent' : ''}`}
          onClick={onToggleDistractionFree}
        >
          {distractionFree ? '◈ exit focus' : '◈ focus mode'}
        </button>
      </div>
    </div>
  );
}
