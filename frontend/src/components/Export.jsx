import { useState, useEffect, useRef } from 'react';
import { Ico } from '../Icons.jsx';

// ── Category definitions — mirrors WorldBuilder nav exactly ──────────────────

const WORLD_CATS = [
  { id: 'history',  label: 'History & Lore', icon: 'History'   },
  { id: 'location', label: 'Locations',       icon: 'Location'  },
  { id: 'faction',  label: 'Factions',        icon: 'Factions'  },
  { id: 'creature', label: 'Creatures',       icon: 'Creatures' },
];

const ITEM_CATS = [
  { id: 'key',      label: 'Key Items',  icon: 'KeyItems'  },
  { id: 'weapon',   label: 'Weapons',    icon: 'Weapons'   },
  { id: 'artifact', label: 'Artifacts',  icon: 'Artifacts' },
  { id: 'other',    label: 'Other',      icon: 'Other'     },
];

const ALL_CATS = [...WORLD_CATS, ...ITEM_CATS];

const FORMATS = [
  { id: 'docx', label: 'Document',   ext: '.docx' },
  { id: 'md',   label: 'Markdown',   ext: '.md'   },
  { id: 'txt',  label: 'Plain Text', ext: '.txt'  },
  { id: 'json', label: 'JSON Data',  ext: '.json' },
];

// ── Generators ────────────────────────────────────────────────────────────────

function toMarkdown(sel, book, chapters, characters, items) {
  const lines = [];

  // Story Bible
  if (sel.bookTitle) lines.push(`# ${book.title}`, '');
  if (sel.bookPlot && book.plot) lines.push('## Story Overview', '', book.plot, '');

  // Chapters
  if (sel.chapters.length > 0) {
    for (const ch of chapters) {
      if (!sel.chapters.includes(ch.id)) continue;
      lines.push(`## ${ch.title}`, '');
      if (sel.chapterPlots && ch.plot) lines.push('*Chapter Notes:*', '', ch.plot, '', '---', '');
      if (ch.content) lines.push(ch.content, '');
    }
  }

  // World — Characters
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

  // World + Items by category
  const catOrder = [...WORLD_CATS, ...ITEM_CATS];
  for (const cat of catOrder) {
    if (!sel.cats.includes(cat.id)) continue;
    const catItems = items.filter(i => i.category === cat.id);
    if (catItems.length === 0) continue;
    lines.push(`## ${cat.label}`, '');
    for (const it of catItems) {
      lines.push(`### ${it.name}`);
      if (it.description)  lines.push('', it.description);
      if (it.significance) lines.push('', `*Significance:* ${it.significance}`);
      const assoc = Array.isArray(it.associated) ? it.associated : JSON.parse(it.associated || '[]');
      const assocNames = assoc.map(id => characters.find(c => c.id === id)?.name).filter(Boolean);
      if (assocNames.length) lines.push('', `*Associated:* ${assocNames.join(', ')}`);
      lines.push('');
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
      .map(c => ({ title: c.title, content: c.content, ...(sel.chapterPlots ? { plot: c.plot } : {}) }));
  }
  if (sel.characters) out.characters = characters;
  if (sel.cats.length > 0) out.worldItems = items.filter(i => sel.cats.includes(i.category));
  return JSON.stringify(out, null, 2);
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Custom checkbox ───────────────────────────────────────────────────────────

function CheckItem({ label, sub, icon, checked, onChange, indent = false }) {
  return (
    <label
      className={`ex-check ${checked ? 'on' : ''}`}
      style={{ cursor: 'pointer', paddingLeft: indent ? '22px' : undefined }}
      onClick={() => onChange(!checked)}
    >
      <span style={{
        flexShrink: 0,
        width: '14px', height: '14px',
        borderRadius: '3px',
        border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--glass-border-hl)'}`,
        background: checked ? 'var(--accent)' : 'var(--input-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s, border-color 0.15s',
        marginRight: '2px',
      }}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5 5 4 7.5 8.5 2"/>
          </svg>
        )}
      </span>
      {icon && (
        <span style={{ color: 'var(--accent)', opacity: checked ? 1 : 0.5, flexShrink: 0 }}>
          <Ico name={icon} size={13} />
        </span>
      )}
      <span className="ex-check-label">
        {label}
        {sub && <span className="ex-check-sub"> — {sub}</span>}
      </span>
    </label>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function ExSection({ label, onSelectAll, allSelected }) {
  return (
    <div className="ex-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{label}</span>
      {onSelectAll && (
        <button className="ex-selall" onClick={onSelectAll}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      )}
    </div>
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
  const [selWorldCats, setSelWorldCats] = useState(WORLD_CATS.map(c => c.id));
  const [selItemCats,  setSelItemCats]  = useState(ITEM_CATS.map(c => c.id));
  const [exporting,    setExporting]    = useState(false);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  const toggleChapter  = (id) => setSelChapters(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleWorldCat = (id) => setSelWorldCats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleItemCat  = (id) => setSelItemCats(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const allChapters  = selChapters.length  === chapters.length;
  const allWorldCats = selWorldCats.length === WORLD_CATS.length;
  const allItemCats  = selItemCats.length  === ITEM_CATS.length;

  const catCount = (id) => items.filter(i => i.category === id).length;

  const handleExport = async () => {
    const allSelectedCats = [...selWorldCats, ...selItemCats];
    const sel = { bookTitle, bookPlot, chapters: selChapters, chapterPlots, characters: incChars, cats: allSelectedCats };
    const slug = book.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const fmt  = FORMATS.find(f => f.id === format);

    if (format === 'docx') {
      setExporting(true);
      try {
        const res = await fetch(`/api/books/${book.id}/export/docx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle, bookPlot,
            chapterIds:     selChapters,
            chapterPlots,
            includeChars:   incChars,
            itemCategories: allSelectedCats,
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

  const nothingSelected = !bookTitle && !bookPlot && selChapters.length === 0 && !incChars && selWorldCats.length === 0 && selItemCats.length === 0;

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

          {/* ── Story Bible ── */}
          <div>
            <ExSection label="Story Bible" />
            <div className="ex-checks">
              <CheckItem label="Book title"          checked={bookTitle} onChange={setBookTitle} />
              <CheckItem label="Book overview / plot" sub={book.plot ? `${book.plot.slice(0, 55)}…` : 'empty'} checked={bookPlot} onChange={setBookPlot} />
            </div>
          </div>

          <div className="ex-div" />

          {/* ── Chapters ── */}
          <div>
            <ExSection
              label="Chapters"
              onSelectAll={() => setSelChapters(allChapters ? [] : chapters.map(c => c.id))}
              allSelected={allChapters}
            />
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
                    label="Include chapter notes"
                    checked={chapterPlots}
                    onChange={setChapterPlots}
                    indent
                  />
                )}
              </div>
            )}
          </div>

          <div className="ex-div" />

          {/* ── World ── */}
          <div>
            <ExSection
              label="World"
              onSelectAll={() => {
                const worldOn = allWorldCats;
                setSelWorldCats(worldOn ? [] : WORLD_CATS.map(c => c.id));
                if (!worldOn) setIncChars(true);
              }}
              allSelected={allWorldCats && incChars}
            />
            <div className="ex-checks">
              <CheckItem
                icon="Characters"
                label="Characters"
                sub={`${characters.length} character${characters.length !== 1 ? 's' : ''}`}
                checked={incChars}
                onChange={setIncChars}
              />
              {WORLD_CATS.map(cat => (
                <CheckItem
                  key={cat.id}
                  icon={cat.icon}
                  label={cat.label}
                  sub={`${catCount(cat.id)} entr${catCount(cat.id) !== 1 ? 'ies' : 'y'}`}
                  checked={selWorldCats.includes(cat.id)}
                  onChange={() => toggleWorldCat(cat.id)}
                />
              ))}
            </div>
          </div>

          <div className="ex-div" />

          {/* ── Items ── */}
          <div>
            <ExSection
              label="Items"
              onSelectAll={() => setSelItemCats(allItemCats ? [] : ITEM_CATS.map(c => c.id))}
              allSelected={allItemCats}
            />
            <div className="ex-checks">
              {ITEM_CATS.map(cat => (
                <CheckItem
                  key={cat.id}
                  icon={cat.icon}
                  label={cat.label}
                  sub={`${catCount(cat.id)} item${catCount(cat.id) !== 1 ? 's' : ''}`}
                  checked={selItemCats.includes(cat.id)}
                  onChange={() => toggleItemCat(cat.id)}
                />
              ))}
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="modal-foot">
          <div className="fmt-row">
            {FORMATS.map(f => (
              <button key={f.id} className={`fmt-btn ${format === f.id ? 'active' : ''}`} onClick={() => setFormat(f.id)}>
                {f.label}
                <span className="fmt-ext">{f.ext}</span>
              </button>
            ))}
          </div>
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
