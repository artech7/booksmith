import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

// ── InfoTip — portal-based, flips when near top ────────────────────────────────

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

// ── Shared sub-components ──────────────────────────────────────────────────────

function Meter({ value, max = 100, color = 'var(--accent)' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height:'3px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'2px', overflow:'hidden' }}>
      <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:'2px', transition:'width 0.4s ease', minWidth:pct>0?'3px':'0' }} />
    </div>
  );
}

function Stat({ label, value, sub, warning=false, good=false }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:'8px' }}>
      <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-body)', flex:1 }}>{label}</span>
      <span style={{ fontSize:'12px', fontFamily:'var(--font-ui)', flexShrink:0, color: warning?'rgba(200,120,80,0.9)':good?'#7a9e7e':'var(--text)' }}>
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
          <span style={{ fontSize:'10px', fontFamily:'var(--font-ui)', color: countWarning&&count>0?'rgba(200,120,80,0.9)':count===0?'#7a9e7e':'var(--text-faint)' }}>
            {count === 0 ? '✓ none' : count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Chip({ text, warning=false, onHover, onLeave }) {
  return (
    <span
      onMouseEnter={onHover} onMouseLeave={onLeave}
      style={{
        display:'inline-flex', padding:'2px 8px', borderRadius:'12px',
        border:`1px solid ${warning?'rgba(200,120,80,0.3)':'var(--glass-border)'}`,
        background: warning?'rgba(200,120,80,0.08)':'var(--glass-bg)',
        fontSize:'11px', fontFamily:'var(--font-ui)',
        color: warning?'rgba(200,120,80,0.9)':'var(--text-muted)',
        cursor:'default', transition:'background 0.12s, border-color 0.12s',
      }}
    >{text}</span>
  );
}

function DistBar({ dist, total, onHover, onLeave }) {
  const bars = [
    { key:'short',    label:'Short',     color:'#7a9e7e',              hlType:'short'    },
    { key:'medium',   label:'Medium',    color:'var(--accent)',         hlType:'medium'   },
    { key:'long',     label:'Long',      color:'rgba(200,160,80,0.8)', hlType:'long'     },
    { key:'veryLong', label:'Very long', color:'rgba(200,100,80,0.7)', hlType:'very-long'},
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
      {bars.map(b => {
        const count = dist[b.key] || 0;
        const pct   = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={b.key} style={{ display:'flex', alignItems:'center', gap:'6px' }}
            onMouseEnter={() => onHover({ type:'length', cat: b.hlType })}
            onMouseLeave={onLeave}
          >
            <span style={{ width:'52px', fontSize:'10px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', flexShrink:0 }}>{b.label}</span>
            <div style={{ flex:1, height:'5px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)', borderRadius:'3px', overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:b.color, borderRadius:'3px', transition:'width 0.4s ease', minWidth:pct>0?'3px':'0' }} />
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
  if (!data) return (
    <div className="analysis-sidebar">
      <div className="analysis-sidebar-head">
        <span className="analysis-sidebar-title">✎ Analysis</span>
        <button className="modal-x" onClick={onClose}>×</button>
      </div>
      <div style={{ padding:'24px 16px', textAlign:'center', color:'var(--text-faint)', fontSize:'13px', fontStyle:'italic' }}>
        Write at least a few sentences to see analysis.
      </div>
    </div>
  );

  const { fk, sentences, passive, adverbs, repeated, dialogue, paragraphs } = data;
  const hl  = (obj) => onHighlight(obj);
  const clr = ()    => onHighlight(null);

  return (
    <div className="analysis-sidebar">
      <div className="analysis-sidebar-head">
        <span className="analysis-sidebar-title">✎ Analysis</span>
        <button className="modal-x" onClick={onClose}>×</button>
      </div>

      <div style={{ overflowY:'auto', flex:1, minHeight:0, paddingBottom:'16px' }}>

        {/* Readability */}
        {fk && (
          <Section label="Readability" tip="Flesch Reading Ease measures how easy your text is to read (0–100, higher = easier). Grade level estimates the US school grade needed to understand it. Aim for 60–70 ease for accessible fiction.">
            <Stat label="Flesch reading ease" value={fk.ease} sub={`/ 100 · ${fk.easeLabel}`} good={fk.ease>=60} warning={fk.ease<40} />
            <Meter value={fk.ease} max={100} color={fk.ease>=60?'#7a9e7e':fk.ease>=40?'var(--accent)':'rgba(200,100,80,0.7)'} />
            <Stat label="Grade level" value={`Grade ${fk.grade}`} good={fk.grade<=9} warning={fk.grade>=14} />
          </Section>
        )}

        {/* Sentences */}
        {sentences && (
          <Section label="Sentences" tip="Tracks sentence length variety. Good prose mixes short punchy sentences with medium ones. Run-ons (40+ words) can lose readers. Fragments (under 3 words) are fine for effect but flag accidental ones.">
            <Stat label="Total sentences" value={sentences.count} />
            <Stat label="Average length" value={sentences.avg} sub="words" good={sentences.avg>=10&&sentences.avg<=20} warning={sentences.avg>25} />
            <Stat label="Shortest / Longest" value={`${sentences.shortest} / ${sentences.longest}`} sub="words" />
            {sentences.runOns > 0 && (
              <div onMouseEnter={() => hl({ type:'length', cat:'very-long' })} onMouseLeave={clr} style={{ cursor:'default' }}>
                <Stat label="Possible run-ons (40+ words)" value={sentences.runOns} warning />
              </div>
            )}
            {sentences.frags > 0 && (
              <div onMouseEnter={() => hl({ type:'length', cat:'short' })} onMouseLeave={clr} style={{ cursor:'default' }}>
                <Stat label="Fragments (< 3 words)" value={sentences.frags} warning={sentences.frags>2} />
              </div>
            )}
            <div style={{ marginTop:'2px' }}>
              <div style={{ fontSize:'10px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', marginBottom:'5px', letterSpacing:'0.1em', textTransform:'uppercase' }}>Length distribution</div>
              <DistBar dist={sentences.dist} total={sentences.count} onHover={hl} onLeave={clr} />
            </div>
          </Section>
        )}

        {/* Paragraphs */}
        {paragraphs && (
          <Section label="Paragraphs" tip="Paragraph walls (120+ words) can overwhelm readers visually. Breaking them up improves pacing and white space." count={paragraphs.walls} countWarning>
            <Stat label="Total paragraphs" value={paragraphs.count} />
            <Stat label="Avg length" value={paragraphs.avg} sub="words" />
            {paragraphs.walls > 0 && (
              <div onMouseEnter={() => hl({ type:'paragraph-wall' })} onMouseLeave={clr} style={{ cursor:'default' }}>
                <Stat label="Long paragraphs (120+ words)" value={paragraphs.walls} warning />
              </div>
            )}
          </Section>
        )}

        {/* Passive voice */}
        <Section label="Passive Voice" tip="Passive voice (e.g. 'was taken') can weaken prose by hiding who acts. In fiction, active voice usually reads stronger — but obituaries and formal writing often use it intentionally." count={passive.length} countWarning>
          {passive.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {passive.slice(0,4).map((s,i) => (
                <div key={i}
                  onMouseEnter={() => hl({ type:'sentence', text: s })}
                  onMouseLeave={clr}
                  style={{ fontSize:'11.5px', color:'var(--text-muted)', fontFamily:'var(--font-body)', fontStyle:'italic',
                    padding:'5px 8px', background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                    borderRadius:'6px', lineHeight:1.5, cursor:'default', transition:'border-color 0.12s',
                  }}
                >"{s}"</div>
              ))}
              {passive.length > 4 && <span style={{ fontSize:'11px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>+{passive.length-4} more</span>}
            </div>
          ) : (
            <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>No passive voice detected</span>
          )}
        </Section>

        {/* Adverbs */}
        <Section label="Adverbs" tip="Adverbs ending in -ly often signal weak verb choices. 'She ran quickly' becomes stronger as 'She sprinted'. A few are fine — it's the pattern of relying on them that dulls prose." count={adverbs.length} countWarning={adverbs.length>5}>
          {adverbs.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
              {adverbs.map(({ word, count }) => (
                <Chip key={word} text={`${word} ×${count}`} warning={count>=3}
                  onHover={() => hl({ type:'word', word })} onLeave={clr} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>No adverbs detected</span>
          )}
        </Section>

        {/* Repeated words */}
        <Section label="Overused Words" tip="Words appearing 3+ times (excluding common stop words). Names are usually fine — focus on descriptive words and verbs worth varying." count={repeated.length} countWarning={repeated.length>4}>
          {repeated.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
              {repeated.map(({ word, count }) => (
                <Chip key={word} text={`${word} ×${count}`} warning={count>=5}
                  onHover={() => hl({ type:'word', word })} onLeave={clr} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>No overused words detected</span>
          )}
        </Section>

        {/* Punctuation */}
        <Section label="Punctuation & Style" tip="Common issues: dialogue comma vs period before closing quotes, double spaces, spaced hyphens that should be em dashes (—), and comma splices." count={dialogue.length} countWarning last>
          {dialogue.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
              {dialogue.map((issue,i) => (
                <div key={i} style={{ fontSize:'11.5px', color:'rgba(200,120,80,0.9)', fontFamily:'var(--font-body)', lineHeight:1.5,
                  padding:'5px 8px', borderRadius:'6px', background:'rgba(200,120,80,0.06)', border:'1px solid rgba(200,120,80,0.18)' }}>
                  {issue}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize:'12px', color:'#7a9e7e', fontFamily:'var(--font-ui)' }}>No issues detected</span>
          )}
        </Section>

      </div>
    </div>
  );
}
