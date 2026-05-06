import { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';
import { Ico } from '../Icons.jsx';

// ── Constants ──────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  { id: 'key',      label: 'Key Items',      icon: 'KeyItems',   group: 'items' },
  { id: 'weapon',   label: 'Weapons',         icon: 'Weapons',    group: 'items' },
  { id: 'artifact', label: 'Artifacts',       icon: 'Artifacts',  group: 'items' },
  { id: 'location', label: 'Locations',       icon: 'Location',   group: 'world' },
  { id: 'faction',  label: 'Factions',        icon: 'Factions',   group: 'world' },
  { id: 'creature', label: 'Creatures',       icon: 'Creatures',  group: 'world' },
  { id: 'history',  label: 'History & Lore',  icon: 'History',    group: 'world' },
  { id: 'other',    label: 'Other',           icon: 'Other',      group: 'items' },
];

const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

// ── Chapter links ──────────────────────────────────────────────────────────────

function ChapterLinks({ entityChapterIds, chapters, onChange }) {
  const linked   = parseArr(entityChapterIds);
  const unlinked = chapters.filter(c => !linked.includes(c.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', fontFamily: 'var(--font-ui)' }}>
        Chapter Links
      </div>
      <div className="chapter-links-row">
        {linked.map(id => {
          const ch = chapters.find(c => c.id === id);
          return ch ? (
            <span key={id} className="chapter-link-badge">
              {ch.title}
              <span style={{ cursor: 'pointer', marginLeft: '3px', opacity: 0.6 }}
                    onClick={() => onChange(linked.filter(x => x !== id))}>×</span>
            </span>
          ) : null;
        })}
        {unlinked.length > 0 && (
          <select className="chapter-links-select"
            onChange={e => { const id = Number(e.target.value); if (id) onChange([...linked, id]); e.target.value = ''; }}
            defaultValue="">
            <option value="">+ link chapter…</option>
            {unlinked.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// ── Character card ─────────────────────────────────────────────────────────────

function CharCard({ char, allChars, chapters, onUpdate, onDelete, setSaveStatus }) {
  const [name, setName] = useState(char.name        ?? '');
  const [role, setRole] = useState(char.role        ?? '');
  const [desc, setDesc] = useState(char.description ?? '');
  const [rels, setRels] = useState(parseArr(char.relationships));
  const [cids, setCids] = useState(parseArr(char.chapter_ids));
  const [showRelForm, setShowRelForm] = useState(false);
  const [relTarget,   setRelTarget]   = useState('');
  const [relType,     setRelType]     = useState('');

  // Sync when char prop changes (e.g. after bidirectional update)
  useEffect(() => { setRels(parseArr(char.relationships)); }, [char.relationships]);
  useEffect(() => { setCids(parseArr(char.chapter_ids)); },  [char.chapter_ids]);

  const debounced = useDebounce((data) => onUpdate(char.id, data).then(() => setSaveStatus('saved')), 1000);
  const field = (key, val, setter) => { setter(val); setSaveStatus('saving'); debounced({ [key]: val }); };

  const saveRels = async (next, addReverse = null) => {
    setRels(next);
    await onUpdate(char.id, { relationships: next });
    if (addReverse) {
      const t = allChars.find(c => c.id === addReverse.targetId);
      if (t) {
        const tRels = parseArr(t.relationships);
        if (!tRels.some(r => r.targetId === char.id)) {
          await onUpdate(addReverse.targetId, { relationships: [...tRels, { targetId: char.id, label: addReverse.label }] });
        }
      }
    }
  };

  const addRel = () => {
    if (!relTarget) return;
    const targetId = Number(relTarget);
    const label    = relType.trim() || 'related to';
    saveRels([...rels, { targetId, label }], { targetId, label });
    setRelTarget(''); setRelType(''); setShowRelForm(false);
  };

  const handleCids = (next) => {
    setCids(next);
    setSaveStatus('saving');
    onUpdate(char.id, { chapter_ids: next }).then(() => setSaveStatus('saved'));
  };

  const others = allChars.filter(c => c.id !== char.id);

  return (
    <div className="char-card">
      <input className="char-name" value={name} onChange={e => field('name', e.target.value, setName)} placeholder="Character name…" />
      <input className="char-role" value={role} onChange={e => field('role', e.target.value, setRole)} placeholder="Role / archetype…" />
      <textarea className="char-desc" value={desc} onChange={e => field('description', e.target.value, setDesc)} placeholder="Backstory, motivations, appearance…" />

      <div className="char-rels">
        <div className="char-rels-label">Relationships</div>
        {rels.map((rel, i) => {
          const target = allChars.find(c => c.id === rel.targetId);
          return target ? (
            <div key={i} className="char-rel">
              <span className="char-rel-arrow">→</span>
              <span className="char-rel-type">{rel.label}</span>
              <span>{target.name}</span>
              <button className="char-rel-del" onClick={() => saveRels(rels.filter((_, j) => j !== i))}>×</button>
            </div>
          ) : null;
        })}
        {showRelForm ? (
          <div className="rel-form">
            <div className="rel-row">
              <select className="rel-select" value={relTarget} onChange={e => setRelTarget(e.target.value)}>
                <option value="">Choose character…</option>
                {others.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="rel-row">
              <input className="rel-input" value={relType} onChange={e => setRelType(e.target.value)} placeholder="ally, rival, sibling…" onKeyDown={e => e.key === 'Enter' && addRel()} />
            </div>
            <div className="rel-row" style={{ gap: '6px' }}>
              <button className="btn btn-accent btn-sm" onClick={addRel}>Add</button>
              <button className="btn btn-sm" onClick={() => { setShowRelForm(false); setRelTarget(''); setRelType(''); }}>Cancel</button>
            </div>
          </div>
        ) : others.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowRelForm(true)}>
            + add relationship
          </button>
        )}
      </div>

      {chapters.length > 0 && (
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
          <ChapterLinks entityChapterIds={cids} chapters={chapters} onChange={handleCids} />
        </div>
      )}

      <div className="char-card-foot">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(char.id)}>Delete</button>
      </div>
    </div>
  );
}

// ── Item card ──────────────────────────────────────────────────────────────────

function ItemCard({ item, characters, chapters, onUpdate, onDelete, setSaveStatus }) {
  const [name,  setName]  = useState(item.name         ?? '');
  const [cat,   setCat]   = useState(item.category     ?? 'key');
  const [desc,  setDesc]  = useState(item.description  ?? '');
  const [sig,   setSig]   = useState(item.significance ?? '');
  const [assoc, setAssoc] = useState(parseArr(item.associated));
  const [cids,  setCids]  = useState(parseArr(item.chapter_ids));

  const debounced = useDebounce((data) => onUpdate(item.id, data).then(() => setSaveStatus('saved')), 1000);
  const field = (key, val, setter) => { setter(val); setSaveStatus('saving'); debounced({ [key]: val }); };

  const handleCat = (e) => {
    setCat(e.target.value); setSaveStatus('saving');
    onUpdate(item.id, { category: e.target.value }).then(() => setSaveStatus('saved'));
  };

  const addAssoc = (e) => {
    const id = Number(e.target.value);
    if (!id || assoc.includes(id)) return;
    const next = [...assoc, id]; setAssoc(next);
    onUpdate(item.id, { associated: next }).then(() => setSaveStatus('saved'));
    e.target.value = '';
  };

  const removeAssoc = (id) => {
    const next = assoc.filter(a => a !== id); setAssoc(next);
    onUpdate(item.id, { associated: next }).then(() => setSaveStatus('saved'));
  };

  const handleCids = (next) => {
    setCids(next); setSaveStatus('saving');
    onUpdate(item.id, { chapter_ids: next }).then(() => setSaveStatus('saved'));
  };

  const unlinkedChars = characters.filter(c => !assoc.includes(c.id));

  return (
    <div className="item-card">
      <input className="item-name" value={name} onChange={e => field('name', e.target.value, setName)} placeholder="Name…" />
      <select className="item-cat" value={cat} onChange={handleCat}>
        {ALL_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <textarea className="item-desc" value={desc} onChange={e => field('description', e.target.value, setDesc)} placeholder="Description…" />
      <textarea className="item-sig"  value={sig}  onChange={e => field('significance', e.target.value, setSig)}  placeholder="Story significance…" />

      <div className="item-assoc">
        <div className="item-assoc-label">Associated Characters</div>
        {assoc.length > 0 && (
          <div className="item-tags">
            {assoc.map(id => {
              const ch = characters.find(c => c.id === id);
              return ch ? (
                <span key={id} className="item-tag">
                  {ch.name}<button className="item-tag-del" onClick={() => removeAssoc(id)}>×</button>
                </span>
              ) : null;
            })}
          </div>
        )}
        {unlinkedChars.length > 0 && (
          <select className="item-assoc-sel" onChange={addAssoc} defaultValue="">
            <option value="">+ link character…</option>
            {unlinkedChars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {chapters.length > 0 && (
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
          <ChapterLinks entityChapterIds={cids} chapters={chapters} onChange={handleCids} />
        </div>
      )}

      <div className="item-card-foot">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
}

// ── WorldBuilder ───────────────────────────────────────────────────────────────

export default function WorldBuilder({
  book, chapter, chapters,
  characters, items,
  onSaveBook, onSaveChapter,
  onAddCharacter, onUpdateCharacter, onDeleteCharacter,
  onAddItem, onUpdateItem, onDeleteItem,
  setSaveStatus,
}) {
  const [section,       setSection]       = useState('bookPlot');
  const [chapterFilter, setChapterFilter] = useState(false);

  // ── Book plot local state (syncs when book changes) ──────────────────────
  const [bookTitle, setBookTitle] = useState(book?.title ?? '');
  const [bookPlot,  setBookPlot]  = useState(book?.plot  ?? '');
  useEffect(() => { setBookTitle(book?.title ?? ''); setBookPlot(book?.plot ?? ''); }, [book?.id]);

  const dbBook = useDebounce((d) => onSaveBook(d), 1100);
  const onBookTitle = (e) => { setBookTitle(e.target.value); setSaveStatus('saving'); dbBook({ title: e.target.value }); };
  const onBookPlot  = (e) => { setBookPlot(e.target.value);  setSaveStatus('saving'); dbBook({ plot:  e.target.value }); };

  // ── Chapter plot local state (syncs when chapter changes) ────────────────
  const [chPlot, setChPlot] = useState(chapter?.plot ?? '');
  useEffect(() => { setChPlot(chapter?.plot ?? ''); }, [chapter?.id]);

  const dbChapter = useDebounce((d) => { if (chapter?.id) onSaveChapter(chapter.id, d); }, 1100);
  const onChPlot  = (e) => { setChPlot(e.target.value); setSaveStatus('saving'); dbChapter({ plot: e.target.value }); };

  // ── Ensure section stays valid when chapter changes ───────────────────────
  useEffect(() => {
    if (section === 'chapterPlot' && !chapter) setSection('bookPlot');
  }, [chapter?.id]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeCat = ALL_CATEGORIES.find(c => c.id === section);

  const filterByChapter = (arr) => {
    if (!chapterFilter || !chapter) return arr;
    return arr.filter(x => parseArr(x.chapter_ids).includes(chapter.id));
  };

  const catCount = (id) => items.filter(i => i.category === id).length;

  // ── Nav groups ────────────────────────────────────────────────────────────
  const navGroups = [
    {
      label: 'Story Bible',
      items: [
        { id: 'bookPlot',    label: 'Book Overview', icon: 'Book',    disabled: false },
        { id: 'chapterPlot', label: 'Chapter Notes', icon: 'Chapter', disabled: !chapter },
      ],
    },
    {
      label: 'World',
      items: [
        { id: 'characters', label: 'Characters',    icon: 'Characters', count: characters.length },
        { id: 'history',    label: 'History & Lore',icon: 'History',    count: catCount('history') },
        { id: 'location',   label: 'Locations',     icon: 'Location',   count: catCount('location') },
        { id: 'faction',    label: 'Factions',      icon: 'Factions',   count: catCount('faction') },
        { id: 'creature',   label: 'Creatures',     icon: 'Creatures',  count: catCount('creature') },
      ],
    },
    {
      label: 'Items',
      items: [
        { id: 'key',      label: 'Key Items', icon: 'KeyItems',  count: catCount('key') },
        { id: 'weapon',   label: 'Weapons',   icon: 'Weapons',   count: catCount('weapon') },
        { id: 'artifact', label: 'Artifacts', icon: 'Artifacts', count: catCount('artifact') },
        { id: 'other',    label: 'Other',     icon: 'Other',     count: catCount('other') },
      ],
    },
  ];

  const sectionTitle =
    section === 'bookPlot'    ? 'Book Overview'
    : section === 'chapterPlot' ? (chapter?.title || 'Chapter Notes')
    : section === 'characters'  ? 'Characters'
    : ALL_CATEGORIES.find(c => c.id === section)?.label || '';

  const showFilter = chapter && ['characters', ...ALL_CATEGORIES.map(c => c.id)].includes(section);

  const filteredItems = activeCat ? filterByChapter(items.filter(i => i.category === section)) : [];
  const filteredChars = section === 'characters' ? filterByChapter(characters) : [];

  return (
    <div className="wb">
      {/* ── Left nav ── */}
      <nav className="wb-nav">
        {navGroups.map(group => (
          <div key={group.label} className="wb-nav-group">
            <div className="wb-nav-group-label">{group.label}</div>
            {group.items.filter(it => !it.disabled).map(it => (
              <button
                key={it.id}
                className={`wb-nav-item ${section === it.id ? 'active' : ''}`}
                onClick={() => setSection(it.id)}
              >
                <span className="wb-nav-icon">
                  <Ico name={it.icon} size={14} />
                </span>
                <span>{it.label}</span>
                {it.count > 0 && <span className="wb-nav-count">{it.count}</span>}
              </button>
            ))}
            <div className="wb-nav-divider" />
          </div>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="wb-content">
        <div className="wb-content-header">
          <div className="wb-content-title">{sectionTitle}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {showFilter && (
              <div className="wb-chapter-filter">
                <span>Filter:</span>
                <div className="wb-filter-toggle">
                  <button className={`wb-filter-btn ${!chapterFilter ? 'active' : ''}`} onClick={() => setChapterFilter(false)}>All</button>
                  <button className={`wb-filter-btn ${chapterFilter  ? 'active' : ''}`} onClick={() => setChapterFilter(true)}>
                    This Chapter
                  </button>
                </div>
              </div>
            )}
            {section === 'characters' && (
              <button className="btn btn-accent btn-sm" onClick={() => {
                const chIds = chapterFilter && chapter ? [chapter.id] : [];
                onAddCharacter(chIds);
              }}>
                <Ico name="Plus" size={12} /> Character
              </button>
            )}
            {activeCat && (
              <button className="btn btn-accent btn-sm" onClick={() => {
                const chIds = chapterFilter && chapter ? [chapter.id] : [];
                onAddItem('New ' + activeCat.label, section, chIds);
              }}>
                <Ico name="Plus" size={12} /> Add
              </button>
            )}
          </div>
        </div>

        <div className="wb-body">

          {/* Book Overview */}
          {section === 'bookPlot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="wb-plot-title" value={bookTitle} onChange={onBookTitle} placeholder="Book title…" />
              <textarea className="wb-plot-textarea" value={bookPlot} onChange={onBookPlot} style={{ minHeight: '260px' }}
                placeholder="Describe the overarching story — the central conflict, the world, the themes, what changes by the end, and why it matters." />
            </div>
          )}

          {/* Chapter Notes */}
          {section === 'chapterPlot' && (
            chapter ? (
              <textarea className="wb-plot-textarea" value={chPlot} onChange={onChPlot} style={{ minHeight: '300px' }}
                placeholder="What happens in this chapter? Outline the key beats, character decisions, tension, revelations, and how it moves the story forward." />
            ) : (
              <div className="empty">
                <div className="empty-glyph"><Ico name="Chapter" size={36} /></div>
                <p>No chapter selected</p>
                <small>Select a chapter from the sidebar</small>
              </div>
            )
          )}

          {/* Characters */}
          {section === 'characters' && (
            filteredChars.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph"><Ico name="Characters" size={36} /></div>
                <p>{chapterFilter ? 'No characters linked to this chapter' : 'No characters yet'}</p>
                <small>{chapterFilter ? 'Switch to All or add one above' : 'Add your first character above'}</small>
              </div>
            ) : (
              <div className="wb-char-grid">
                {filteredChars.map(char => (
                  <CharCard key={char.id} char={char} allChars={characters} chapters={chapters}
                    onUpdate={onUpdateCharacter} onDelete={onDeleteCharacter} setSaveStatus={setSaveStatus} />
                ))}
              </div>
            )
          )}

          {/* Item categories */}
          {activeCat && (
            filteredItems.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph"><Ico name={activeCat.icon} size={36} /></div>
                <p>{chapterFilter ? `No ${activeCat.label.toLowerCase()} linked to this chapter` : `No ${activeCat.label.toLowerCase()} yet`}</p>
                <small>{chapterFilter ? 'Switch to All or add one above' : 'Add one using the button above'}</small>
              </div>
            ) : (
              <div className="wb-item-grid">
                {filteredItems.map(item => (
                  <ItemCard key={item.id} item={item} characters={characters} chapters={chapters}
                    onUpdate={onUpdateItem} onDelete={onDeleteItem} setSaveStatus={setSaveStatus} />
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
