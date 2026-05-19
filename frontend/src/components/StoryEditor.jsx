import { useState, useEffect, useRef, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { splitSentences, sentenceCategory, wordCount } from '../analysis.js';
import Analysis from './Analysis.jsx';

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

// ── Review mode — colour-coded sentence length ─────────────────────────────────

const CAT_COLORS = {
  'short':     'rgba(122,158,126,0.18)',  // green tint — punchy
  'medium':    'transparent',             // neutral
  'long':      'rgba(200,160,80,0.14)',   // amber — getting complex
  'very-long': 'rgba(200,90,70,0.16)',    // red — flag
};

const CAT_BORDER = {
  'short':     'rgba(122,158,126,0.5)',
  'medium':    'transparent',
  'long':      'rgba(200,160,80,0.5)',
  'very-long': 'rgba(200,90,70,0.5)',
};

function ReviewView({ content }) {
  const sentences = useMemo(() => splitSentences(content), [content]);

  if (!content.trim()) {
    return (
      <div style={{ padding: '28px 48px', color: 'var(--text-faint)', fontStyle: 'italic', fontSize: '18px' }}>
        Nothing to review yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '18px 48px 28px', overflowY: 'auto', flex: 1, lineHeight: 2.1, fontSize: '18px', fontFamily: 'var(--font-body)', fontWeight: 300, color: 'var(--text)' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
        {[
          { label: 'Short (≤8 words)',      cat: 'short'     },
          { label: 'Medium (9–18)',          cat: 'medium'    },
          { label: 'Long (19–30)',           cat: 'long'      },
          { label: 'Very long (31+)',        cat: 'very-long' },
        ].map(({ label, cat }) => (
          <span key={cat} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
          }}>
            <span style={{
              display: 'inline-block', width: '28px', height: '11px',
              borderRadius: '2px',
              background: CAT_COLORS[cat] === 'transparent' ? 'var(--glass-bg)' : CAT_COLORS[cat],
              border: `1px solid ${CAT_BORDER[cat] === 'transparent' ? 'var(--glass-border)' : CAT_BORDER[cat]}`,
            }} />
            {label}
          </span>
        ))}
      </div>
      {/* Sentences */}
      <div>
        {sentences.map((s, i) => {
          const wc  = s.trim().split(/\s+/).length;
          const cat = sentenceCategory(wc);
          return (
            <span
              key={i}
              title={`${wc} words — ${cat.replace('-', ' ')}`}
              style={{
                background:   CAT_COLORS[cat],
                borderBottom: `2px solid ${CAT_BORDER[cat]}`,
                borderRadius: '2px',
                padding:      '1px 2px',
                marginRight:  '4px',
                display:      'inline',
              }}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────

export default function StoryEditor({ chapter, onSave, onFocusChange, distractionFree, onToggleDistractionFree, setSaveStatus }) {
  const [title,        setTitle]        = useState(chapter.title   ?? '');
  const [content,      setContent]      = useState(chapter.content ?? '');
  const [view,         setView]         = useState('edit');
  const [page,         setPage]         = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [editingGoal,  setEditingGoal]  = useState(false);
  const [goalInput,    setGoalInput]    = useState('');
  const goalRef = useRef(null);

  const save = useDebounce((d) => onSave(chapter.id, d), 1100);

  useEffect(() => {
    setTitle(chapter.title     ?? '');
    setContent(chapter.content ?? '');
    setEditingGoal(false);
    setShowAnalysis(false);
  }, [chapter.id]);

  const onTitle   = (e) => { setTitle(e.target.value);   setSaveStatus('saving'); save({ title:   e.target.value }); };
  const onContent = (e) => { setContent(e.target.value); setSaveStatus('saving'); save({ content: e.target.value }); };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && distractionFree) onToggleDistractionFree(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [distractionFree, onToggleDistractionFree]);

  // Stats
  const words  = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars  = content.length;
  const pages  = paginate(content);
  const total  = pages.length;
  const pgText = words === 0 ? '< 1 pg' : `~${total} ${total === 1 ? 'pg' : 'pgs'}`;

  useEffect(() => { if (page >= total) setPage(Math.max(0, total - 1)); }, [total]);

  // Goals
  const wordGoal   = chapter.word_goal || 0;
  const pageGoal   = chapter.page_goal || 0;
  const activeGoal = pageGoal > 0 ? pageGoal : wordGoal;
  const goalUnit   = pageGoal > 0 ? 'pages' : 'words';
  const goalCurrent= pageGoal > 0 ? total : words;
  const pct        = activeGoal > 0 ? Math.min(100, (goalCurrent / activeGoal) * 100) : 0;
  const goalDone   = activeGoal > 0 && goalCurrent >= activeGoal;

  const openGoalEditor = () => {
    setGoalInput(activeGoal > 0 ? String(activeGoal) : '');
    setEditingGoal(true);
    setTimeout(() => goalRef.current?.select(), 30);
  };

  const saveGoal = () => {
    const val = Math.max(0, parseInt(goalInput) || 0);
    setEditingGoal(false);
    setSaveStatus('saving');
    if (pageGoal > 0) onSave(chapter.id, { page_goal: val });
    else              onSave(chapter.id, { word_goal: val });
    setSaveStatus('saved');
  };

  const clearGoal = (e) => {
    e.stopPropagation();
    setEditingGoal(false);
    onSave(chapter.id, { word_goal: 0, page_goal: 0 });
  };

  const switchView = (v) => {
    setView(v);
    if (v === 'pages') setPage(0);
    if (v !== 'edit') onFocusChange(false);
  };

  return (
    <div className="editor">

      {/* Title row */}
      <div className="editor-header">
        <input className="editor-title" value={title} onChange={onTitle} placeholder="Chapter title…" spellCheck />
        <div className="editor-controls">
          <div className="view-toggle">
            <button className={`view-btn ${view === 'edit'   ? 'active' : ''}`} onClick={() => switchView('edit')}>✎ Edit</button>
            <button className={`view-btn ${view === 'review' ? 'active' : ''}`} onClick={() => switchView('review')}>◉ Review</button>
            <button className={`view-btn ${view === 'pages'  ? 'active' : ''}`} onClick={() => switchView('pages')}>◫ Pages</button>
          </div>
          <button
            className={`btn btn-sm ${showAnalysis ? 'btn-accent' : ''}`}
            onClick={() => setShowAnalysis(a => !a)}
            title="Writing analysis"
          >
            ✎ Analysis
          </button>
          <button className={`btn btn-sm ${distractionFree ? 'btn-accent' : ''}`} onClick={onToggleDistractionFree}>
            {distractionFree ? '◈ Exit Focus' : '◈ Focus'}
          </button>
        </div>
      </div>

      <div className="editor-divider" />

      {/* Body */}
      <div className="editor-body">
        {view === 'edit' ? (
          <textarea
            className="story-textarea"
            value={content}
            onChange={onContent}
            onFocus={() => onFocusChange(true)}
            onBlur={() => onFocusChange(false)}
            placeholder="Begin your story here… let the words find you."
            spellCheck
          />
        ) : view === 'review' ? (
          <ReviewView content={content} />
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

      {/* Footer */}
      <div className="editor-footer" style={{ position: 'relative' }}>

        {editingGoal ? (
          <div className="goal-edit-row">
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>Goal:</span>
            <input
              ref={goalRef}
              className="goal-input"
              type="number" min="0"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
              placeholder="word count"
              autoFocus
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>words</span>
            <button className="goal-action-btn goal-confirm" onClick={saveGoal}>✓</button>
            <button className="goal-action-btn goal-cancel"  onClick={() => setEditingGoal(false)}>✗</button>
            {activeGoal > 0 && <button className="goal-action-btn goal-clear" onClick={clearGoal}>Clear</button>}
          </div>
        ) : (
          <span
            className={`stats ${activeGoal > 0 ? 'stats-clickable' : ''}`}
            onClick={activeGoal > 0 ? openGoalEditor : undefined}
            title={activeGoal > 0 ? 'Click to edit goal' : undefined}
          >
            {activeGoal > 0 ? (
              <>
                <span style={{ color: goalDone ? 'var(--accent)' : 'var(--text-muted)' }}>{goalCurrent.toLocaleString()}</span>
                <span style={{ color: 'var(--text-faint)' }}> / {activeGoal.toLocaleString()} {goalUnit}</span>
                {goalDone && <span style={{ color: 'var(--accent)', marginLeft: '4px' }}>✦</span>}
              </>
            ) : (
              <>{words.toLocaleString()} {words === 1 ? 'word' : 'words'}</>
            )}
            {' · '}{chars.toLocaleString()} chars · {pgText}
          </span>
        )}

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

        {activeGoal > 0 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0,
            height: '2px', width: `${pct}%`,
            background: goalDone ? '#7a9e7e' : 'var(--accent)',
            opacity: goalDone ? 0.9 : 0.6,
            transition: 'width 0.5s ease, background 0.4s',
            borderRadius: '0 2px 2px 0', pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Analysis panel — absolute positioned relative to .content */}
      {showAnalysis && (
        <Analysis text={content} onClose={() => setShowAnalysis(false)} />
      )}

    </div>
  );
}
