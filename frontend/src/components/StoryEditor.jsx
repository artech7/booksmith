import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

const WORDS_PER_PAGE = 250;

function paginate(text) {
  if (!text.trim()) return [''];
  const tokens = text.split(/(\s+)/);
  const pages = [];
  let page = '', count = 0;
  for (const tok of tokens) {
    const isWord = /\S/.test(tok);
    if (isWord) count++;
    page += tok;
    if (count >= WORDS_PER_PAGE && isWord) {
      pages.push(page.trimEnd());
      page = ''; count = 0;
    }
  }
  if (page.trim() || pages.length === 0) pages.push(page.trimEnd());
  return pages;
}

export default function StoryEditor({ chapter, onSave, onFocusChange, distractionFree, onToggleDistractionFree, setSaveStatus }) {
  const [title,   setTitle]   = useState(chapter.title   ?? '');
  const [content, setContent] = useState(chapter.content ?? '');
  const [view,    setView]    = useState('edit');
  const [page,    setPage]    = useState(0);
  const ref = useRef(null);

  const save = useDebounce((d) => onSave(chapter.id, d), 1100);

  const onTitle   = (e) => { setTitle(e.target.value);   setSaveStatus('saving'); save({ title: e.target.value }); };
  const onContent = (e) => { setContent(e.target.value); setSaveStatus('saving'); save({ content: e.target.value }); };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && distractionFree) onToggleDistractionFree(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [distractionFree, onToggleDistractionFree]);

  const words  = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars  = content.length;
  const pages  = paginate(content);
  const total  = pages.length;
  const pgText = words === 0 ? '< 1 pg' : `~${total} ${total === 1 ? 'pg' : 'pgs'}`;

  useEffect(() => { if (page >= total) setPage(Math.max(0, total - 1)); }, [total]);

  const switchView = (v) => { setView(v); if (v === 'pages') setPage(0); onFocusChange(false); };

  return (
    <div className="editor">

      {/* Title row */}
      <div className="editor-header">
        <input
          className="editor-title"
          value={title}
          onChange={onTitle}
          placeholder="Chapter title…"
          spellCheck
        />
        <div className="view-toggle">
          <button className={`view-btn ${view === 'edit'  ? 'active' : ''}`} onClick={() => switchView('edit')}>✎ Edit</button>
          <button className={`view-btn ${view === 'pages' ? 'active' : ''}`} onClick={() => switchView('pages')}>◫ Pages</button>
        </div>
      </div>

      <div className="editor-divider" />

      {/* Body */}
      <div className="editor-body">
        {view === 'edit' ? (
          <textarea
            ref={ref}
            className="story-textarea"
            value={content}
            onChange={onContent}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Begin your story here… let the words find you."
            spellCheck
          />
        ) : (
          <div className="pages-scroll">
            <div className="page-sheet">
              <div className="page-text">
                {pages[page] || <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>This page is empty.</span>}
              </div>
              <div className="page-num">— {page + 1} —</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer — always visible */}
      <div className="editor-footer">
        <span className="stats">
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {chars.toLocaleString()} chars · {pgText}
        </span>

        {view === 'pages' && (
          <>
            <div style={{ width: '1px', height: '13px', background: 'var(--glass-border)', margin: '0 2px' }} />
            <button className="btn btn-sm" onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0} style={{ opacity: page === 0 ? 0.3 : 1 }}>← Prev</button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', minWidth: '78px', textAlign: 'center' }}>
              Page {page + 1} of {total}
            </span>
            <button className="btn btn-sm" onClick={() => setPage(p => Math.min(total-1, p+1))} disabled={page >= total-1} style={{ opacity: page >= total-1 ? 0.3 : 1 }}>Next →</button>
          </>
        )}

        <div className="footer-spacer" />

        <button className={`btn btn-sm ${distractionFree ? 'btn-accent' : ''}`} onClick={onToggleDistractionFree}>
          {distractionFree ? '◈ exit focus' : '◈ focus mode'}
        </button>
      </div>

    </div>
  );
}
