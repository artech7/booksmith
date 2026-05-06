import { useState, useEffect, useRef } from 'react';
import { CATEGORIES } from './Items.jsx';

const FORMATS = [
  { id: 'docx', label: 'Document', ext: '.docx', hint: 'Word / LibreOffice' },
  { id: 'md',   label: 'Markdown', ext: '.md',   hint: 'Obsidian, Notion…' },
  { id: 'txt',  label: 'Plain Text', ext: '.txt', hint: 'Universal'        },
  { id: 'json', label: 'JSON Data',  ext: '.json', hint: 'Backup / import' },
];

// ── Generators ────────────────────────────────────────────────────────────────

function toMarkdown(sel, book, chapters, characters, items) {
  const lines = [];

  if (sel.bookTitle || sel.bookPlot) {
    if (sel.bookTitle) lines.push(`# ${book.title}`, '');
    if (sel.bookPlot && book.plot) lines.push('## Story Overview', '', book.plot, '');
  }

  if (sel.chapters.length > 0) {
    for (const ch of chapters) {
      if (!sel.chapters.includes(ch.id)) continue;
      lines.push(`## ${ch.title}`, '');
      if (sel.chapterPlots && ch.plot) lines.push('*Chapter Notes:*', '', ch.plot, '', '---', '');
      if (ch.content) lines.push(ch.content, '');
    }
  }

  if (sel.characters && characters.length > 0) {
    lines.push('## Cast of Characters', '');
    for (const c of characters) {
      lines.push(`### ${c.name}`);
      if (c.role) lines.push(`*${c.role}*`);
      if (c.description) lines.push('', c.description);
      const rels = Array.isArray(c.relationships) ? c.relationships : JSON.parse(c.relationships || '[]');
      if (rels.length > 0) {
        lines.push('', '**Relationships:**');
        for (const r of rels) {
          const target = characters.find(x => x.id === r.targetId);
          if (target) lines.push(`- ${r.label} ${target.name}`);
        }
      }
      lines.push('');
    }
  }

  if (sel.items.length > 0) {
    const filtered = items.filter(i => sel.items.includes(i.category));
    if (filtered.length > 0) {
      lines.push('## World Items', '');
      for (const cat of CATEGORIES) {
        const catItems = filtered.filter(i => i.category === cat.id);
        if (catItems.length === 0) continue;
        lines.push(`### ${cat.label}`, '');
        for (const it of catItems) {
          lines.push(`#### ${it.name}`);
          if (it.description) lines.push('', it.description);
          if (it.significance) lines.push('', `*Story significance:* ${it.significance}`);
          const assoc = typeof it.associated === 'string' ? JSON.parse(it.associated || '[]') : (it.associated ?? []);
          if (assoc.length > 0) {
            const names = assoc.map(id => characters.find(c => c.id === id)?.name).filter(Boolean);
            if (names.length > 0) lines.push('', `*Associated characters:* ${names.join(', ')}`);
          }
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n');
}

function toPlainText(sel, book, chapters, characters, items) {
  return toMarkdown(sel, book, chapters, characters, items)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/^---$/gm, '──────────────────────');
}

function toJSON(sel, book, chapters, characters, items) {
  const out = {};
  if (sel.bookTitle || sel.bookPlot) {
    out.book = {};
    if (sel.bookTitle) out.book.title = book.title;
    if (sel.bookPlot)  out.book.plot  = book.plot;
  }
  if (sel.chapters.length > 0) {
    out.chapters = chapters
      .filter(c => sel.chapters.includes(c.id))
      .map(c => ({
        title:   c.title,
        content: c.content,
        ...(sel.chapterPlots ? { plot: c.plot } : {}),
      }));
  }
  if (sel.characters) out.characters = characters;
  if (sel.items.length > 0) {
    out.items = items.filter(i => sel.items.includes(i.category));
  }
  return JSON.stringify(out, null, 2);
}

// ── Download helper ───────────────────────────────────────────────────────────

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CheckItem ─────────────────────────────────────────────────────────────────

function CheckItem({ label, sub, checked, onChange }) {
  return (
    <label
      className={`ex-check ${checked ? 'on' : ''}`}
      style={{ cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
    >
      {/* Custom checkbox */}
      <span style={{
        flexShrink: 0,
        width: '14px',
        height: '14px',
        borderRadius: '3px',
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--glass-border-hl)'}`,
        background: checked ? 'var(--accent)' : 'var(--input-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, border-color 0.15s',
        marginRight: '2px',
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2"/>
          </svg>
        )}
      </span>
      <span className="ex-check-label">
        {label}
        {sub && <span className="ex-check-sub"> — {sub}</span>}
      </span>
    </label>
  );
}

// ── Export Modal ──────────────────────────────────────────────────────────────

export default function Export({ book, chapters, characters, items, onClose }) {
  const ref = useRef(null);

  const [format,       setFormat]       = useState('md');
  const [bookTitle,    setBookTitle]    = useState(true);
  const [bookPlot,     setBookPlot]     = useState(true);
  const [selChapters,  setSelChapters]  = useState(chapters.map(c => c.id));
  const [chapterPlots, setChapterPlots] = useState(true);
  const [incChars,     setIncChars]     = useState(true);
  const [selItemCats,  setSelItemCats]  = useState(CATEGORIES.map(c => c.id));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const toggleChapter = (id) =>
    setSelChapters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleCat = (id) =>
    setSelItemCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allChapters  = selChapters.length === chapters.length;
  const allCats      = selItemCats.length === CATEGORIES.length;

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const sel = {
      bookTitle, bookPlot,
      chapters:     selChapters,
      chapterPlots,
      characters:   incChars,
      items:        selItemCats,
    };
    const slug = book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const fmt  = FORMATS.find(f => f.id === format);

    if (format === 'docx') {
      setExporting(true);
      try {
        const res = await fetch(`/api/books/${book.id}/export/docx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle,
            bookPlot,
            chapterIds:    selChapters,
            chapterPlots,
            includeChars:  incChars,
            itemCategories: selItemCats,
          }),
        });
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${slug}.docx`; a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        alert('Export failed: ' + e.message);
      } finally {
        setExporting(false);
      }
      onClose();
      return;
    }

    let content = '';
    if (format === 'md')   content = toMarkdown(sel, book, chapters, characters, items);
    if (format === 'txt')  content = toPlainText(sel, book, chapters, characters, items);
    if (format === 'json') content = toJSON(sel, book, chapters, characters, items);

    download(`${slug}${fmt.ext}`, content);
    onClose();
  };

  const nothingSelected = !bookTitle && !bookPlot && selChapters.length === 0 && !incChars && selItemCats.length === 0;

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={ref}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Export Book</div>
            <div className="modal-sub">{book.title}</div>
          </div>
          <button className="modal-x" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">

          {/* ── Book overview ── */}
          <div>
            <div className="ex-label">Book Overview</div>
            <div className="ex-checks">
              <CheckItem label="Book title" checked={bookTitle} onChange={setBookTitle} />
              <CheckItem label="Story overview / plot" sub={book.plot ? `${book.plot.slice(0,60)}…` : 'empty'} checked={bookPlot} onChange={setBookPlot} />
            </div>
          </div>

          <div className="ex-div" />

          {/* ── Chapters ── */}
          <div>
            <div className="ex-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Chapters</span>
              <button className="ex-selall" onClick={() =>
                setSelChapters(allChapters ? [] : chapters.map(c => c.id))
              }>{allChapters ? 'Deselect all' : 'Select all'}</button>
            </div>
            {chapters.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic', padding: '4px 10px' }}>No chapters yet</div>
            ) : (
              <div className="ex-checks">
                {chapters.map(ch => (
                  <CheckItem
                    key={ch.id}
                    label={ch.title}
                    sub={`${ch.content ? ch.content.trim().split(/\s+/).length : 0} words`}
                    checked={selChapters.includes(ch.id)}
                    onChange={() => toggleChapter(ch.id)}
                  />
                ))}
                {selChapters.length > 0 && (
                  <CheckItem
                    label="Include chapter plot notes"
                    checked={chapterPlots}
                    onChange={setChapterPlots}
                  />
                )}
              </div>
            )}
          </div>

          <div className="ex-div" />

          {/* ── Characters ── */}
          <div>
            <div className="ex-label">Characters</div>
            <div className="ex-checks">
              <CheckItem
                label="Cast of Characters"
                sub={`${characters.length} character${characters.length !== 1 ? 's' : ''}`}
                checked={incChars}
                onChange={setIncChars}
              />
            </div>
          </div>

          <div className="ex-div" />

          {/* ── Items ── */}
          <div>
            <div className="ex-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>World Items</span>
              <button className="ex-selall" onClick={() =>
                setSelItemCats(allCats ? [] : CATEGORIES.map(c => c.id))
              }>{allCats ? 'Deselect all' : 'Select all'}</button>
            </div>
            <div className="ex-checks">
              {CATEGORIES.map(cat => {
                const count = items.filter(i => i.category === cat.id).length;
                return (
                  <CheckItem
                    key={cat.id}
                    label={`${cat.icon} ${cat.label}`}
                    sub={`${count} item${count !== 1 ? 's' : ''}`}
                    checked={selItemCats.includes(cat.id)}
                    onChange={() => toggleCat(cat.id)}
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="modal-foot">
          {/* Format picker — full width row */}
          <div className="fmt-row">
            {FORMATS.map(f => (
              <button
                key={f.id}
                className={`fmt-btn ${format === f.id ? 'active' : ''}`}
                onClick={() => setFormat(f.id)}
              >
                {f.label}
                <span className="fmt-ext">{f.ext}</span>
              </button>
            ))}
          </div>
          {/* Action buttons row */}
          <div className="modal-foot-actions">
            <button className="btn" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-accent"
              onClick={handleExport}
              disabled={nothingSelected || exporting}
              style={{ opacity: (nothingSelected || exporting) ? 0.5 : 1, minWidth: '90px' }}
            >
              {exporting ? '…Generating' : '↓ Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
