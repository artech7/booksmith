import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

const IGNORED_KEY = 'bs_ignored_words';
const loadIgnored = () => { try { return new Set(JSON.parse(localStorage.getItem(IGNORED_KEY)) || []); } catch { return new Set(); } };
const saveIgnored = (set) => localStorage.setItem(IGNORED_KEY, JSON.stringify([...set]));

// ── InfoTip ────────────────────────────────────────────────────────────────────

function InfoTip({ text }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const flipDown = r.top < 140;
    setPos({ left: r.left + r.width / 2, top: flipDown ? r.bottom + 8 : r.top - 8, flipDown });
  };
  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:'13px', height:'13px', borderRadius:'50%',
        border:'1px solid var(--text-faint)', color:'var(--text-faint)',
        fontSize:'8px', fontFamily:'var(--font-ui)', cursor:'default',
        flexShrink:0, lineHeight:1, userSelect:'none',
      }}>i</span>
      {pos && createPortal(
        <div style={{
          position:'fixed', top:pos.top, left:pos.left, zIndex:20000, pointerEvents:'none',
          transform: pos.flipDown ? 'translateX(-50%)' : 'translate(-50%,-100%)',
          width:'220px', background:'var(--bg)', border:'1px solid var(--glass-border-hl)',
          borderRadius:'8px', padding:'8px 10px', fontSize:'11.5px', lineHeight:1.55,
          color:'var(--text-muted)', fontFamily:'var(--font-body)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', whiteSpace:'normal',
        }}>{text}</div>,
        document.body
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Meter({ value, max=100, color='var(--accent)' }) {
  const pct = Math.min(100, (value/max)*100);
  return (
    <div style={{ height:'3px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'2px', overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:'2px', transition:'width 0.4s', minWidth:pct>0?'3px':'0' }} />
    </div>
  );
}

function Stat({ label, value, sub, warning=false, good=false }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'8px' }}>
      <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-body)', flex:1 }}>{label}</span>
      <span style={{ fontSize:'12px', fontFamily:'var(--font-ui)', flexShrink:0, color:warning?'rgba(200,120,80,0.9)':good?'#7a9e7e':'var(--text)' }}>
        {value}{sub && <span style={{ color:'var(--text-faint)', marginLeft:'3px', fontSize:'11px' }}>{sub}</span>}
      </span>
    </div>
  );
}

function Section({ label, tip, children, count, countWarning=false, last=false }) {
  return (
    <div style={{ padding:'11px 16px', borderBottom:last?'none':'1px solid var(--glass-border)', display:'flex', flexDirection:'column', gap:'7px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'5px', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>{label}</span>
          {tip && <InfoTip text={tip} />}
        </div>
        {count !== undefined && (
          <span style={{ fontSize:'10px', fontFamily:'var(--font-ui)', color:countWarning&&count>0?'rgba(200,120,80,0.9)':count===0?'#7a9e7e':'var(--text-faint)' }}>
            {count===0?'✓ none':count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Chip({ text, warning=false, onHover, onLeave, onIgnore }) {
  return (
    <span onMouseEnter={onHover} onMouseLeave={onLeave} style={{
      display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 7px 2px 8px',
      borderRadius:'12px',
      border:`1px solid ${warning?'rgba(200,120,80,0.3)':'var(--glass-border)'}`,
      background:warning?'rgba(200,120,80,0.08)':'var(--glass-bg)',
      fontSize:'11px', fontFamily:'var(--font-ui)',
      color:warning?'rgba(200,120,80,0.9)':'var(--text-muted)',
      cursor:'default',
    }}>
      {text}
      {onIgnore && (
        <span onClick={onIgnore} title="Ignore this word"
          style={{ opacity:0.4, fontSize:'12px', lineHeight:1, cursor:'pointer', marginLeft:'1px', transition:'opacity 0.12s' }}
          onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0.4}
        >×</span>
      )}
    </span>
  );
}

function DistBar({ dist, total, onHover, onLeave }) {
  const bars = [
    { key:'short',    label:'Short',     color:'#7a9e7e',              hlType:'short'     },
    { key:'medium',   label:'Medium',    color:'var(--accent)',         hlType:'medium'    },
    { key:'long',     label:'Long',      color:'rgba(200,160,80,0.8)', hlType:'long'      },
    { key:'veryLong', label:'Very long', color:'rgba(200,100,80,0.7)', hlType:'very-long' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      {bars.map(b => {
        const count = dist[b.key] || 0;
        const pct   = total > 0 ? (count/total)*100 : 0;
        return (
          <div key={b.key} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'default' }}
            onMouseEnter={() => onHover({ type:'length', cat:b.hlType })} onMouseLeave={onLeave}>
            <span style={{ width:'52px', fontSize:'10px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', flexShrink:0 }}>{b.label}</span>
            <div style={{ flex:1, height:'5px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'3px', overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:b.color, borderRadius:'3px', transition:'width 0.4s', minWidth:pct>0?'3px':'0' }} />
            </div>
            <span style={{ width:'22px', fontSize:'10px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', textAlign:'right', flexShrink:0 }}>{count}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Analysis sidebar ──────────────────────────────────────────────────────

export default function Analysis({ data, onHighlight, onClose }) {
  const [ignored, setIgnored] = useState(loadIgnored);
  const [addInput, setAddInput] = useState('');
  const inputRef = useRef(null);

  const addIgnored = (word) => {
    if (!word.trim()) return;
    const next = new Set(ignored); next.add(word.toLowerCase().trim());
    setIgnored(next); saveIgnored(next); setAddInput('');
  };
  const removeIgnored = (word) => {
    const next = new Set(ignored); next.delete(word);
    setIgnored(next); saveIgnored(next);
  };
  const ignoreFromChip = (word) => addIgnored(word);

  const hl  = (obj) => onHighlight(obj);
  const clr = ()    => onHighlight(null);

  // Filter adverbs and repeated words against ignored list
  const adverbs  = (data?.adverbs  || []).filter(({ word }) => !ignored.has(word.toLowerCase()));
  const repeated = (data?.repeated || []).filter(({ word }) => !ignored.has(word.toLowerCase()));

  return (
    <div className="analysis-sidebar">
      <div className="analysis-sidebar-head">
        <span className="analysis-sidebar-title">✎ Analysis — this page</span>
        <button className="modal-x" onClick={onClose}>×</button>
      </div>

      {!data ? (
        <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text-faint)', fontSize:'13px', fontStyle:'italic' }}>
          Write at least a few sentences on this page to see analysis.
        </div>
      ) : (
        <div style={{ overflowY:'auto', flex:1, minHeight:0, paddingBottom:'16px' }}>

          {/* Ignored words */}
          {ignored.size > 0 && (
            <Section label="Ignored Words" tip="Words excluded from Adverbs and Overused Words analysis. Click × on any word below to restore it.">
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {[...ignored].map(word => (
                  <span key={word} style={{
                    display:'inline-flex', alignItems:'center', gap:'4px',
                    padding:'2px 7px', borderRadius:'12px', fontSize:'11px',
                    background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                    color:'var(--text-faint)', fontFamily:'var(--font-ui)',
                  }}>
                    {word}
                    <span onClick={() => removeIgnored(word)} style={{ cursor:'pointer', opacity:0.5, fontSize:'12px', lineHeight:1 }}
                      onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=0.5}>×</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Readability */}
          {data.fk && (
            <Section label="Readability" tip="Flesch Reading Ease (0–100, higher = easier). Grade level estimates the US school grade needed. Aim for 60–70 ease for accessible fiction.">
              <Stat label="Flesch reading ease" value={data.fk.ease} sub={`/ 100 · ${data.fk.easeLabel}`} good={data.fk.ease>=60} warning={data.fk.ease<40} />
              <Meter value={data.fk.ease} max={100} color={data.fk.ease>=60?'#7a9e7e':data.fk.ease>=40?'var(--accent)':'rgba(200,100,80,0.7)'} />
              <Stat label="Grade level" value={`Grade ${data.fk.grade}`} good={data.fk.grade<=9} warning={data.fk.grade>=14} />
            </Section>
          )}

          {/* Sentences */}
          {data.sentences && (
            <Section label="Sentences" tip="Tracks sentence length variety. Mix short punchy sentences with medium ones. Run-ons (40+ words) can lose readers.">
              <Stat label="Total" value={data.sentences.count} />
              <Stat label="Average length" value={data.sentences.avg} sub="words" good={data.sentences.avg>=10&&data.sentences.avg<=20} warning={data.sentences.avg>25} />
              <Stat label="Shortest / Longest" value={`${data.sentences.shortest} / ${data.sentences.longest}`} sub="words" />
              {data.sentences.runOns > 0 && (
                <div onMouseEnter={() => hl({ type:'length', cat:'very-long' })} onMouseLeave={clr} style={{ cursor:'default' }}>
                  <Stat label="Run-ons (40+ words)" value={data.sentences.runOns} warning />
                </div>
              )}
              <div style={{ marginTop:'2px' }}>
                <div style={{ fontSize:'10px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', marginBottom:'5px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Distribution</div>
                <DistBar dist={data.sentences.dist} total={data.sentences.count} onHover={hl} onLeave={clr} />
              </div>
            </Section>
          )}

          {/* Paragraphs */}
          {data.paragraphs && (
            <Section label="Paragraphs" tip="Paragraph walls (120+ words) overwhelm readers visually. Breaking them up improves pacing." count={data.paragraphs.walls} countWarning>
              <Stat label="Total" value={data.paragraphs.count} />
              <Stat label="Avg length" value={data.paragraphs.avg} sub="words" />
              {data.paragraphs.walls > 0 && (
                <div onMouseEnter={() => hl({ type:'paragraph-wall' })} onMouseLeave={clr} style={{ cursor:'default' }}>
                  <Stat label="Long paragraphs (120+ words)" value={data.paragraphs.walls} warning />
                </div>
              )}
            </Section>
          )}

          {/* Passive voice */}
          <Section label="Passive Voice" tip="Passive voice (e.g. 'was taken') hides who acts. Active voice usually reads stronger — but obituaries and formal writing use it intentionally." count={data.passive.length} countWarning>
            {data.passive.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                {data.passive.slice(0,4).map((s,i) => (
                  <div key={i} onMouseEnter={() => hl({ type:'sentence', text:s })} onMouseLeave={clr}
                    style={{ fontSize:'11.5px', color:'var(--text-muted)', fontFamily:'var(--font-body)', fontStyle:'italic',
                      padding:'5px 8px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                      borderRadius:'6px', lineHeight:1.5, cursor:'default' }}>"{s}"</div>
                ))}
                {data.passive.length > 4 && <span style={{ fontSize:'11px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>+{data.passive.length-4} more</span>}
              </div>
            ) : <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>None detected</span>}
          </Section>

          {/* Adverbs */}
          <Section label="Adverbs" tip="Adverbs ending in -ly often signal weak verb choices. Click × on a chip to ignore that word globally." count={adverbs.length} countWarning={adverbs.length>5}>
            {adverbs.length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {adverbs.map(({ word, count }) => (
                  <Chip key={word} text={`${word} ×${count}`} warning={count>=3}
                    onHover={() => hl({ type:'word', word })} onLeave={clr}
                    onIgnore={() => ignoreFromChip(word)} />
                ))}
              </div>
            ) : <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>None detected</span>}
          </Section>

          {/* Overused words */}
          <Section label="Overused Words" tip="Words appearing 3+ times (excluding stop words). Click × to ignore a word (e.g. character names, locations)." count={repeated.length} countWarning={repeated.length>4}>
            {repeated.length > 0 ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                {repeated.map(({ word, count }) => (
                  <Chip key={word} text={`${word} ×${count}`} warning={count>=5}
                    onHover={() => hl({ type:'word', word })} onLeave={clr}
                    onIgnore={() => ignoreFromChip(word)} />
                ))}
              </div>
            ) : <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>None detected</span>}
          </Section>

          {/* Punctuation */}
          <Section label="Punctuation & Style" tip="Common issues: dialogue punctuation, double spaces, spaced hyphens, and comma splices." count={data.dialogue.length} countWarning last>
            {data.dialogue.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                {data.dialogue.map((issue,i) => (
                  <div key={i} style={{ fontSize:'11.5px', color:'rgba(200,120,80,0.9)', fontFamily:'var(--font-body)', lineHeight:1.5,
                    padding:'5px 8px', borderRadius:'6px', background:'rgba(200,120,80,0.06)', border:'1px solid rgba(200,120,80,0.18)' }}>
                    {issue}
                  </div>
                ))}
              </div>
            ) : <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>None detected</span>}
          </Section>

          {/* Add to ignore list */}
          <div style={{ padding:'11px 16px 4px', borderTop:'1px solid var(--glass-border)', display:'flex', flexDirection:'column', gap:'7px' }}>
            <span style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>Add to Ignored</span>
            <div style={{ display:'flex', gap:'6px' }}>
              <input
                ref={inputRef}
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter') addIgnored(addInput); }}
                placeholder="word or name…"
                style={{
                  flex:1, background:'var(--input-bg)', border:'1px solid var(--glass-border)',
                  borderRadius:'6px', padding:'5px 9px', fontSize:'12px',
                  color:'var(--text)', fontFamily:'var(--font-body)', outline:'none',
                }}
                onFocus={e => e.target.style.borderColor='var(--glass-border-hl)'}
                onBlur={e  => e.target.style.borderColor='var(--glass-border)'}
              />
              <button className="btn btn-sm btn-accent" onClick={() => addIgnored(addInput)}>Add</button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
