import { useState, useEffect, useRef } from 'react';

const WORDS_PER_PAGE = 250;
const wc = (text) => (text || '').trim() ? (text || '').trim().split(/\s+/).length : 0;
const done = (cur, tgt) => tgt > 0 && cur >= tgt;
const pct  = (cur, tgt) => tgt > 0 ? Math.min(100, (cur / tgt) * 100) : 0;

// ── Reusable mini progress bar ─────────────────────────────────────────────────
function Bar({ current, target }) {
  const p   = pct(current, target);
  const fin = done(current, target);
  return (
    <div className="gp-track">
      <div
        className="gp-fill"
        style={{
          width:      `${p}%`,
          background: fin ? '#7a9e7e' : 'var(--accent)',
          opacity:    fin ? 0.9 : 0.65,
        }}
      />
    </div>
  );
}

// ── Inline editable target ─────────────────────────────────────────────────────
function GoalRow({ label, current, target, unit = 'words', onSet, dim = false }) {
  const [editing, setEditing] = useState(false);
  const [inp,     setInp]     = useState('');
  const inputRef = useRef(null);
  const fin = done(current, target);

  const open = () => { setInp(target > 0 ? String(target) : ''); setEditing(true); setTimeout(() => inputRef.current?.select(), 20); };
  const commit = () => { onSet(Math.max(0, parseInt(inp) || 0)); setEditing(false); };

  return (
    <div className={`gp-row ${dim ? 'gp-row-dim' : ''}`}>
      <div className="gp-row-head">
        <span className="gp-label">{label}</span>
        {editing ? (
          <span className="gp-input-wrap">
            <input
              ref={inputRef}
              className="gp-input"
              type="number"
              min="0"
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
              onBlur={commit}
              autoFocus
            />
            <span className="gp-unit">{unit}</span>
          </span>
        ) : (
          <span
            className="gp-count"
            onClick={open}
            title="Click to set goal"
          >
            {current.toLocaleString()}
            {target > 0 && <> / <span style={{ color: 'var(--text-faint)' }}>{target.toLocaleString()}</span></>}
            {' '}{unit}
            {fin && <span style={{ color: 'var(--accent)', marginLeft: '3px' }}>✦</span>}
          </span>
        )}
      </div>
      {target > 0 && <Bar current={current} target={target} />}
    </div>
  );
}

// ── Small toggle between two types ─────────────────────────────────────────────
function TypeToggle({ options, value, onChange }) {
  return (
    <div className="gp-type-toggle">
      {options.map(o => (
        <button
          key={o.id}
          className={`gp-type-btn ${value === o.id ? 'active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ label, children }) {
  return (
    <div className="gp-section">
      <div className="gp-section-label">{label}</div>
      {children}
    </div>
  );
}

// ── Main Goals panel ───────────────────────────────────────────────────────────
export default function Goals({
  book, chapter, chapters,
  onSaveBook, onSaveChapter,
  progress,     // from useWritingProgress
  onSetTimeGoal,
  onClose,
}) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  // Chapter goal type
  const [chType, setChType] = useState(
    (chapter?.page_goal || 0) > 0 ? 'pages' : 'words'
  );
  useEffect(() => {
    setChType((chapter?.page_goal || 0) > 0 ? 'pages' : 'words');
  }, [chapter?.id]);

  // Book goal type
  const [bookType, setBookType] = useState(
    (book?.chapter_goal || 0) > 0 ? 'chapters' : 'words'
  );
  useEffect(() => {
    setBookType((book?.chapter_goal || 0) > 0 ? 'chapters' : 'words');
  }, [book?.id]);

  // Derived chapter stats
  const chWords  = wc(chapter?.content);
  const chPages  = Math.max(1, Math.ceil(chWords / WORDS_PER_PAGE));
  const chWGoal  = chapter?.word_goal || 0;
  const chPGoal  = chapter?.page_goal || 0;

  // Derived book stats
  const totalWords    = chapters.reduce((s, c) => s + wc(c.content), 0);
  const doneChapters  = chapters.filter(c => wc(c.content) > 0).length;
  const bkWGoal       = book?.word_goal    || 0;
  const bkCGoal       = book?.chapter_goal || 0;

  const { goals = {}, sessionWords = 0, dayWords = 0, weekWords = 0, monthWords = 0 } = progress || {};

  const saveChGoal = (type, val) => {
    if (!chapter) return;
    if (type === 'words') onSaveChapter(chapter.id, { word_goal: val, page_goal: 0 });
    else                  onSaveChapter(chapter.id, { page_goal: val, word_goal: 0 });
  };

  const saveBookGoal = (type, val) => {
    if (!book) return;
    if (type === 'words')    onSaveBook({ word_goal: val,    chapter_goal: 0 });
    else                     onSaveBook({ chapter_goal: val, word_goal:    0 });
  };

  return (
    <div className="settings-overlay">
      <div className="goals-panel" ref={ref}>

        <div className="gp-header">
          <span className="gp-title">Writing Goals</span>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        {/* ── Chapter ── */}
        {chapter && (
          <Section label="This Chapter">
            <TypeToggle
              options={[{ id: 'words', label: 'Words' }, { id: 'pages', label: 'Pages' }]}
              value={chType}
              onChange={t => { setChType(t); saveChGoal(t, 0); }}
            />
            {chType === 'words' ? (
              <GoalRow label={chapter.title || 'Chapter'} current={chWords} target={chWGoal} unit="words" onSet={v => saveChGoal('words', v)} />
            ) : (
              <GoalRow label={chapter.title || 'Chapter'} current={chPages} target={chPGoal} unit="pages" onSet={v => saveChGoal('pages', v)} />
            )}
          </Section>
        )}

        {/* ── Book ── */}
        {book && (
          <Section label="This Book">
            <TypeToggle
              options={[{ id: 'words', label: 'Total Words' }, { id: 'chapters', label: 'Chapters' }]}
              value={bookType}
              onChange={t => { setBookType(t); saveBookGoal(t, 0); }}
            />
            {bookType === 'words' ? (
              <GoalRow label="Total across all chapters" current={totalWords} target={bkWGoal} unit="words" onSet={v => saveBookGoal('words', v)} />
            ) : (
              <GoalRow label={`${doneChapters} of ${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} have content`} current={doneChapters} target={bkCGoal} unit="chapters" onSet={v => saveBookGoal('chapters', v)} />
            )}
          </Section>
        )}

        {/* ── Time-based ── */}
        <Section label="Time-Based">
          <GoalRow label="This Session"  current={sessionWords} target={goals.session  || 0} unit="words" onSet={v => onSetTimeGoal('session',  v)} />
          <GoalRow label="Today"         current={dayWords}     target={goals.daily    || 0} unit="words" onSet={v => onSetTimeGoal('daily',    v)} />
          <GoalRow label="This Week"     current={weekWords}    target={goals.weekly   || 0} unit="words" onSet={v => onSetTimeGoal('weekly',   v)} />
          <GoalRow label="This Month"    current={monthWords}   target={goals.monthly  || 0} unit="words" onSet={v => onSetTimeGoal('monthly',  v)} />
        </Section>

      </div>
    </div>
  );
}
