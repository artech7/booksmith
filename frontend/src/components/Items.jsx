import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

export const CATEGORIES = [
  { id: 'key',      label: 'Key Items',           icon: '✦' },
  { id: 'weapon',   label: 'Weapons & Armaments',  icon: '⚔' },
  { id: 'artifact', label: 'Artifacts & Relics',   icon: '◈' },
  { id: 'location', label: 'Locations & Places',   icon: '⌖' },
  { id: 'faction',  label: 'Factions & Groups',    icon: '⬡' },
  { id: 'creature', label: 'Creatures & Beasts',   icon: '❧' },
  { id: 'other',    label: 'Other',                icon: '○' },
];

function ItemCard({ item, characters, onUpdate, onDelete, setSaveStatus }) {
  const [name,  setName]  = useState(item.name         ?? '');
  const [cat,   setCat]   = useState(item.category     ?? 'key');
  const [desc,  setDesc]  = useState(item.description  ?? '');
  const [sig,   setSig]   = useState(item.significance ?? '');
  const [assoc, setAssoc] = useState(
    typeof item.associated === 'string' ? JSON.parse(item.associated || '[]') : (item.associated ?? [])
  );

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

  const unlinked = characters.filter(c => !assoc.includes(c.id));

  return (
    <div className="item-card">
      <input
        className="item-name"
        value={name}
        onChange={e => field('name', e.target.value, setName)}
        placeholder="Item name…"
      />
      <select className="item-cat-select" value={cat} onChange={handleCat}>
        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <textarea
        className="item-desc"
        value={desc}
        onChange={e => field('description', e.target.value, setDesc)}
        placeholder="Description — appearance, origin, properties…"
      />
      <textarea
        className="item-sig"
        value={sig}
        onChange={e => field('significance', e.target.value, setSig)}
        placeholder="Significance to the story — why it matters…"
      />

      <div className="item-assoc">
        <div className="item-assoc-label">Associated Characters</div>
        {assoc.length > 0 && (
          <div className="item-assoc-list">
            {assoc.map(id => {
              const char = characters.find(c => c.id === id);
              return char ? (
                <span key={id} className="item-tag">
                  {char.name}
                  <button className="item-tag-del" onClick={() => removeAssoc(id)}>×</button>
                </span>
              ) : null;
            })}
          </div>
        )}
        {unlinked.length > 0 && (
          <select className="item-assoc-sel" onChange={addAssoc} defaultValue="">
            <option value="">+ link character…</option>
            {unlinked.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="item-card-foot">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(item.id)}>Delete</button>
      </div>
    </div>
  );
}

export default function Items({ items, characters, onAdd, onUpdate, onDelete, setSaveStatus }) {
  const [newCat, setNewCat] = useState('key');

  const grouped = CATEGORIES
    .map(cat => ({ ...cat, items: items.filter(i => i.category === cat.id) }))
    .filter(g => g.items.length > 0);

  return (
    <div className="items-panel">
      {/* ── Sticky toolbar ── */}
      <div className="items-toolbar">
        <div>
          <div className="panel-eyebrow">Book</div>
          <div className="panel-heading" style={{ fontSize: '20px', marginTop: '1px' }}>World Items</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="rel-select"
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            style={{ fontSize: '12px' }}
          >
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button className="btn btn-accent" onClick={() => onAdd('New Item', newCat)}>
            ＋ Add Item
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="items-scroll">
        {items.length === 0 ? (
          <div className="empty" style={{ flex: 1 }}>
            <div className="empty-glyph">◈</div>
            <p>No items yet</p>
            <small>Choose a category above and click Add Item</small>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.id} className="items-cat-group">
              <div className="items-cat-label">
                <span>{group.icon}</span>
                <span>{group.label}</span>
              </div>
              <div className="items-grid">
                {group.items.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    characters={characters}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    setSaveStatus={setSaveStatus}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
