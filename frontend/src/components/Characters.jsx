import { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce.js';

function CharCard({ character, allChars, onUpdate, onDelete, setSaveStatus }) {
  const [name, setName] = useState(character.name        ?? '');
  const [role, setRole] = useState(character.role        ?? '');
  const [desc, setDesc] = useState(character.description ?? '');
  const [rels, setRels] = useState(character.relationships ?? []);

  const [showRelForm, setShowRelForm] = useState(false);
  const [relTarget,   setRelTarget]   = useState('');
  const [relType,     setRelType]     = useState('');

  const debouncedUpdate = useDebounce((data) => {
    onUpdate(character.id, data).then(() => setSaveStatus('saved'));
  }, 1000);

  const field = (key, val, setter) => {
    setter(val);
    setSaveStatus('saving');
    debouncedUpdate({ [key]: val });
  };

  // Save this char's rels AND optionally add the reverse on the target
  const saveRels = async (next, addReverse = null) => {
    setRels(next);
    await onUpdate(character.id, { relationships: next });

    // Bidirectional: add reverse link on target if requested
    if (addReverse) {
      const target = allChars.find(c => c.id === addReverse.targetId);
      if (target) {
        const targetRels = Array.isArray(target.relationships) ? target.relationships : [];
        const alreadyLinked = targetRels.some(r => r.targetId === character.id);
        if (!alreadyLinked) {
          await onUpdate(addReverse.targetId, {
            relationships: [...targetRels, { targetId: character.id, label: addReverse.label }],
          });
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

  const removeRel = (i) => saveRels(rels.filter((_, idx) => idx !== i));

  const others = allChars.filter(c => c.id !== character.id);

  return (
    <div className="char-card">
      <input
        className="char-name"
        value={name}
        onChange={e => field('name', e.target.value, setName)}
        placeholder="Character name…"
      />
      <input
        className="char-role"
        value={role}
        onChange={e => field('role', e.target.value, setRole)}
        placeholder="Role / archetype (e.g. protagonist)"
      />
      <textarea
        className="char-desc"
        value={desc}
        onChange={e => field('description', e.target.value, setDesc)}
        placeholder="Backstory, motivations, appearance, voice…"
      />

      <div className="char-rels">
        <div className="char-rels-label">Relationships</div>

        {rels.map((rel, i) => {
          const target = allChars.find(c => c.id === rel.targetId);
          return target ? (
            <div key={i} className="char-rel">
              <span className="char-rel-arrow">→</span>
              <span className="char-rel-type">{rel.label}</span>
              <span>{target.name}</span>
              <button className="char-rel-del" onClick={() => removeRel(i)}>×</button>
            </div>
          ) : null;
        })}

        {showRelForm ? (
          <div className="rel-form">
            <div className="rel-row">
              <select
                className="rel-select"
                value={relTarget}
                onChange={e => setRelTarget(e.target.value)}
              >
                <option value="">Choose character…</option>
                {others.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="rel-row">
              <input
                className="rel-input"
                value={relType}
                onChange={e => setRelType(e.target.value)}
                placeholder="Relationship type (ally, rival, sibling…)"
                onKeyDown={e => e.key === 'Enter' && addRel()}
              />
            </div>
            <div className="rel-row" style={{ gap: '6px' }}>
              <button className="btn btn-accent btn-sm" onClick={addRel}>Add</button>
              <button className="btn btn-sm" onClick={() => { setShowRelForm(false); setRelTarget(''); setRelType(''); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          others.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: '2px' }}
              onClick={() => setShowRelForm(true)}
            >
              + add relationship
            </button>
          )
        )}
      </div>

      <div className="char-card-foot">
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(character.id)}>Delete</button>
      </div>
    </div>
  );
}

export default function Characters({ characters, onAdd, onUpdate, onDelete, setSaveStatus }) {
  return (
    <div className="chars-panel">
      <div className="chars-head">
        <div>
          <div className="panel-eyebrow">Book</div>
          <div className="panel-heading">Cast of Characters</div>
        </div>
        <button className="btn btn-accent" onClick={onAdd}>＋ New Character</button>
      </div>

      {characters.length === 0 ? (
        <div className="empty">
          <div className="empty-glyph">◈</div>
          <p>No characters yet</p>
          <small>Add your first character above</small>
        </div>
      ) : (
        <div className="chars-grid">
          {characters.map(char => (
            <CharCard
              key={char.id}
              character={char}
              allChars={characters}
              onUpdate={onUpdate}
              onDelete={onDelete}
              setSaveStatus={setSaveStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
