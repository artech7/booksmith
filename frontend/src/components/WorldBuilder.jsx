import { useState, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const ITEM_CATEGORIES = [
  { id: 'key',      label: 'Key Items',          icon: '✦' },
  { id: 'weapon',   label: 'Weapons',             icon: '⚔' },
  { id: 'artifact', label: 'Artifacts & Relics',  icon: '◈' },
  { id: 'location', label: 'Locations',           icon: '⌖' },
  { id: 'faction',  label: 'Factions',            icon: '⬡' },
  { id: 'creature', label: 'Creatures',           icon: '❧' },
  { id: 'history',  label: 'History & Lore',      icon: '📜' },
  { id: 'other',    label: 'Other',               icon: '○' },
];

const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

// ── Chapter links sub-component ────────────────────────────────────────────────

function ChapterLinks({ entityChapterIds, chapters, onChange }) {
  const linked   = parseArr(entityChapterIds);
  const unlinked = chapters.filter(c => !linked.includes(c.id));

  const addLink = (e) => {
    const id = Number(e.target.value);
    if (!id) return;
    onChange([...linked, id]);
    e.target.value = '';
  };

  const removeLink = (id) => onChange(linked.filter(x => x !== id));

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
              <span className="remove" onClick={() => removeLink(id)} style={{ cursor: 'pointer', marginLeft: '2px' }}>×</span>
            </span>
          ) : null;
        })}
        {unlinked.length > 0 && (
          <select className="chapter-links-select" onChange={addLink} defaultValue="">
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
  const [name, setName] = useState(char.name         ?? '');
  const [role, setRole] = useState(char.role         ?? '');
  const [desc, setDesc] = useState(char.description  ?? '');
  const [rels, setRels] = useState(parseArr(char.relationships));
  const [cids, setCids] = useState(parseArr(char.chapter_ids));
  const [showRelForm, setShowRelForm] = useState(false);
  const [relTarget, setRelTarget]     = useState('');
  const [relType, setRelType]         = useState('');

  const debouncedUpdate = useDebounce((data) => {
    onUpdate(char.id, data).then(() => setSaveStatus('saved'));
  }, 1000);

  const field = (key, val, setter) => {
    setter(val);
    setSaveStatus('saving');
    debouncedUpdate({ [key]: val });
  };

  const saveRels = async (next, addReverse = null) => {
    setRels(next);
    await onUpdate(char.id, { relationships: next });
    if (addReverse) {
      const target = allChars.find(c => c.id === addReverse.targetId);
      if (target) {
        const tRels = parseArr(target.relationships);
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
    const next     = [...rels, { targetId, label }];
    saveRels(next, { targetId, label });
    setRelTarget(''); setRelType(''); setShowRelForm(false);
  };

  const handleChapterLinks = (next) => {
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
        ) : (
          others.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowRelForm(true)}>+ add relationship</button>
          )
        )}
      </div>

      {chapters.length > 0 && (
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
          <ChapterLinks entityChapterIds={cids} chapters={chapters} onChange={handleChapterLinks} />
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

  const debouncedUpdate = useDebounce((data) => {
    onUpdate(item.id, data).then(() => setSaveStatus('saved'));
  }, 1000);

  const field = (key, val, setter) => {
    setter(val);
    setSaveStatus('saving');
    debouncedUpdate({ [key]: val });
  };

  const handleCat = (e) => {
    setCat(e.target.value);
    setSaveStatus('saving');
    onUpdate(item.id, { category: e.target.value }).then(() => setSaveStatus('saved'));
  };

  const addAssoc = (e) => {
    const id = Number(e.target.value);
    if (!id || assoc.includes(id)) return;
    const next = [...assoc, id];
    setAssoc(next);
    onUpdate(item.id, { associated: next }).then(() => setSaveStatus('saved'));
    e.target.value = '';
  };

  const removeAssoc = (id) => {
    const next = assoc.filter(a => a !== id);
    setAssoc(next);
    onUpdate(item.id, { associated: next }).then(() => setSaveStatus('saved'));
  };

  const handleChapterLinks = (next) => {
    setCids(next);
    setSaveStatus('saving');
    onUpdate(item.id, { chapter_ids: next }).then(() => setSaveStatus('saved'));
  };

  const unlinkedChars = characters.filter(c => !assoc.includes(c.id));

  return (
    <div className="item-card">
      <input className="item-name" value={name} onChange={e => field('name', e.target.value, setName)} placeholder="Item name…" />
      <select className="item-cat" value={cat} onChange={handleCat}>
        {ITEM_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <textarea className="item-desc" value={desc} onChange={e => field('description', e.target.value, setDesc)} placeholder="Description — appearance, origin, properties…" />
      <textarea className="item-sig"  value={sig}  onChange={e => field('significance', e.target.value, setSig)}  placeholder="Significance to the story — why it matters…" />

      <div className="item-assoc">
        <div className="item-assoc-label">Associated Characters</div>
        {assoc.length > 0 && (
          <div className="item-tags">
            {assoc.map(id => {
              const ch = characters.find(c => c.id === id);
              return ch ? (
                <span key={id} className="item-tag">
                  {ch.name}
                  <button className="item-tag-del" onClick={() => removeAssoc(id)}>×</button>
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
          <ChapterLinks entityChapterIds={cids} chapters={chapters} onChange={handleChapterLinks} />
        </div>
      )}

      <div className="item-card-foot">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
}

// ── Main WorldBuilder ──────────────────────────────────────────────────────────

export default function WorldBuilder({
  book, chapter, chapters,
  characters, items,
  onSaveBook, onSaveChapter,
  onAddCharacter, onUpdateCharacter, onDeleteCharacter,
  onAddItem, onUpdateItem, onDeleteItem,
  setSaveStatus,
}) {
  const [section, setSection] = useState('bookPlot');
  const [chapterFilter, setChapterFilter] = useState(false); // false = all, true = this chapter only

  // Book plot state
  const [bookTitle, setBookTitle] = useState(book?.title ?? '');
  const [bookPlot,  setBookPlot]  = useState(book?.plot  ?? '');
  const debouncedSaveBook = useDebounce((d) => onSaveBook(d), 1100);

  const onBookTitle = (e) => { setBookTitle(e.target.value); setSaveStatus('saving'); debouncedSaveBook({ title: e.target.value }); };
  const onBookPlot  = (e) => { setBookPlot(e.target.value);  setSaveStatus('saving'); debouncedSaveBook({ plot:  e.target.value }); };

  // Chapter plot state
  const [chPlot, setChPlot] = useState(chapter?.plot ?? '');
  const debouncedSaveCh = useDebounce((d) => onSaveChapter(chapter?.id, d), 1100);
  const onChPlot = (e) => { setChPlot(e.target.value); setSaveStatus('saving'); debouncedSaveCh({ plot: e.target.value }); };

  // Update local state when selection changes
  useState(() => { setBookTitle(book?.title ?? ''); setBookPlot(book?.plot ?? ''); }, [book?.id]);
  useState(() => { setChPlot(chapter?.plot ?? ''); }, [chapter?.id]);

  // Filtered data
  const filterByChapter = (arr) => {
    if (!chapterFilter || !chapter) return arr;
    return arr.filter(x => parseArr(x.chapter_ids).includes(chapter.id));
  };

  const activeCat    = ITEM_CATEGORIES.find(c => c.id === section);
  const filteredItems = activeCat ? filterByChapter(items.filter(i => i.category === section)) : [];
  const filteredChars = section === 'characters' ? filterByChapter(characters) : characters;

  const navGroups = [
    {
      label: 'Story Bible',
      items: [
        { id: 'bookPlot',    label: 'Book Overview',  icon: '📖' },
        { id: 'chapterPlot', label: 'Chapter Notes',  icon: '§',  disabled: !chapter },
      ],
    },
    {
      label: 'World',
      items: [
        { id: 'characters', label: 'Characters',     icon: '◈', count: characters.length },
        { id: 'history',    label: 'History & Lore', icon: '📜', count: items.filter(i => i.category === 'history').length },
      ],
    },
    {
      label: 'Items',
      items: ITEM_CATEGORIES.filter(c => c.id !== 'history').map(c => ({
        id: c.id, label: c.label, icon: c.icon,
        count: items.filter(i => i.category === c.id).length,
      })),
    },
  ];

  const sectionTitle = section === 'bookPlot'    ? 'Book Overview'
    : section === 'chapterPlot'                  ? (chapter?.title || 'Chapter Notes')
    : section === 'characters'                    ? 'Characters'
    : ITEM_CATEGORIES.find(c => c.id === section)?.label || '';

  const showChapterFilter = chapter && ['characters', ...ITEM_CATEGORIES.map(c => c.id)].includes(section);

  return (
    <div className="wb">
      {/* ── Left nav ── */}
      <nav className="wb-nav">
        {navGroups.map(group => (
          <div key={group.label} className="wb-nav-group">
            <div className="wb-nav-group-label">{group.label}</div>
            {group.items.map(item => item.disabled ? null : (
              <button
                key={item.id}
                className={`wb-nav-item ${section === item.id ? 'active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                <span className="wb-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.count > 0 && <span className="wb-nav-count">{item.count}</span>}
              </button>
            ))}
            <div className="wb-nav-divider" />
          </div>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="wb-content">
        {/* Content header */}
        <div className="wb-content-header">
          <div className="wb-content-title">{sectionTitle}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {showChapterFilter && (
              <div className="wb-chapter-filter">
                <span>Filter:</span>
                <div className="wb-filter-toggle">
                  <button className={`wb-filter-btn ${!chapterFilter ? 'active' : ''}`} onClick={() => setChapterFilter(false)}>All</button>
                  <button className={`wb-filter-btn ${chapterFilter  ? 'active' : ''}`} onClick={() => setChapterFilter(true)} title={chapter ? chapter.title : ''}>
                    This Chapter
                  </button>
                </div>
              </div>
            )}

            {/* Add button for relevant sections */}
            {section === 'characters' && (
              <button className="btn btn-accent btn-sm" onClick={() => {
                const chIds = chapterFilter && chapter ? [chapter.id] : [];
                onAddCharacter(chIds);
              }}>＋ Character</button>
            )}
            {activeCat && (
              <button className="btn btn-accent btn-sm" onClick={() => {
                const chIds = chapterFilter && chapter ? [chapter.id] : [];
                onAddItem('New ' + activeCat.label, section, chIds);
              }}>＋ Add</button>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="wb-body">

          {/* ── Book Overview ── */}
          {section === 'bookPlot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                className="wb-plot-title"
                value={bookTitle}
                onChange={onBookTitle}
                placeholder="Book title…"
              />
              <textarea
                className="wb-plot-textarea"
                value={bookPlot}
                onChange={onBookPlot}
                style={{ minHeight: '240px' }}
                placeholder="Describe the overarching story — the central conflict, the world, the themes, what changes by the end, and why it matters."
              />
            </div>
          )}

          {/* ── Chapter Notes ── */}
          {section === 'chapterPlot' && chapter && (
            <div>
              <textarea
                className="wb-plot-textarea"
                value={chPlot}
                onChange={onChPlot}
                style={{ minHeight: '280px' }}
                placeholder="What happens in this chapter? Outline the key beats, character decisions, tension, revelations, and how it moves the story forward."
              />
            </div>
          )}

          {/* ── Characters ── */}
          {section === 'characters' && (
            filteredChars.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph">◈</div>
                <p>{chapterFilter ? 'No characters linked to this chapter' : 'No characters yet'}</p>
                <small>{chapterFilter ? 'Switch to "All" or add one above' : 'Add your first character above'}</small>
              </div>
            ) : (
              <div className="wb-char-grid">
                {filteredChars.map(char => (
                  <CharCard
                    key={char.id}
                    char={char}
                    allChars={characters}
                    chapters={chapters}
                    onUpdate={onUpdateCharacter}
                    onDelete={onDeleteCharacter}
                    setSaveStatus={setSaveStatus}
                  />
                ))}
              </div>
            )
          )}

          {/* ── Item category sections ── */}
          {activeCat && (
            filteredItems.length === 0 ? (
              <div className="empty">
                <div className="empty-glyph">{activeCat.icon}</div>
                <p>{chapterFilter ? `No ${activeCat.label.toLowerCase()} linked to this chapter` : `No ${activeCat.label.toLowerCase()} yet`}</p>
                <small>{chapterFilter ? 'Switch to "All" or add one above' : 'Add one using the button above'}</small>
              </div>
            ) : (
              <div className="wb-item-grid">
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    characters={characters}
                    chapters={chapters}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                    setSaveStatus={setSaveStatus}
                  />
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}
