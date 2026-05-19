import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useDebounce } from '../hooks/useDebounce.js';
import { splitSentences, sentenceCategory, analyzeText } from '../analysis.js';
import { getDefinition } from '../thesaurus.js';
import Analysis from './Analysis.jsx';

// ── Definition tooltip ─────────────────────────────────────────────────────────

function DefTooltip({ def, pos }) {
  if (!def) return null;
  const flipUp = pos.bottom > window.innerHeight - 200;
  return createPortal(
    <div style={{
      position: 'fixed',
      left:     Math.min(pos.left, window.innerWidth - 280),
      top:      flipUp ? pos.top - 8 : pos.bottom + 8,
      transform:flipUp ? 'translateY(-100%)' : 'none',
      width:    '268px',
      background: 'var(--bg)',
      border:   '1px solid var(--glass-border-hl)',
      borderRadius: '10px',
      boxShadow:'0 10px 36px rgba(0,0,0,0.5)',
      zIndex:   30000,
      pointerEvents: 'none',
      fontFamily: 'var(--font-body)',
      overflow: 'hidden',
    }}>
      {/* Word + phonetic */}
      <div style={{ padding:'9px 12px 7px', borderBottom:'1px solid var(--glass-border)', background:'var(--glass-bg)', display:'flex', alignItems:'baseline', gap:'8px' }}>
        <span style={{ fontSize:'15px', fontWeight:600, fontFamily:'var(--font-head)', color:'var(--text)' }}>{def.word}</span>
        {def.phonetic && <span style={{ fontSize:'11px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>{def.phonetic}</span>}
      </div>
      {/* Meanings */}
      <div style={{ maxHeight:'220px', overflowY:'auto', padding:'8px 0' }}>
        {def.meanings.map((m, mi) => (
          <div key={mi} style={{ padding:'4px 12px 8px', borderBottom: mi < def.meanings.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
            <div style={{ fontSize:'9px', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', fontFamily:'var(--font-ui)', marginBottom:'4px' }}>{m.partOfSpeech}</div>
            {m.definitions.map((d, di) => (
              <div key={di} style={{ marginBottom: d.example ? '4px' : '0' }}>
                <div style={{ fontSize:'12.5px', color:'var(--text-muted)', lineHeight:1.5 }}>{di + 1}. {d.definition}</div>
                {d.example && <div style={{ fontSize:'11px', color:'var(--text-faint)', fontStyle:'italic', marginTop:'2px', lineHeight:1.4 }}>"{d.example}"</div>}
              </div>
            ))}
            {m.synonyms.length > 0 && (
              <div style={{ marginTop:'5px', fontSize:'10.5px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>
                <span style={{ color:'#7a9e7e', marginRight:'4px' }}>≈</span>
                {m.synonyms.join(', ')}
              </div>
            )}
            {m.antonyms.length > 0 && (
              <div style={{ marginTop:'2px', fontSize:'10.5px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>
                <span style={{ color:'#9b85c4', marginRight:'4px' }}>≠</span>
                {m.antonyms.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding:'4px 12px', background:'var(--glass-bg)', borderTop:'1px solid var(--glass-border)', fontSize:'9px', color:'var(--text-faint)', fontFamily:'var(--font-ui)' }}>
        via Free Dictionary API
      </div>
    </div>,
    document.body
  );
}

// ── Word token — hover for definition ─────────────────────────────────────────

function WordToken({ word, isHighlit }) {
  const [def, setDef]   = useState(null);
  const [pos, setPos]   = useState(null);
  const [show, setShow] = useState(false);
  const ref    = useRef(null);
  const timer  = useRef(null);
  const loaded = useRef(false);

  const onEnter = () => {
    timer.current = setTimeout(async () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setPos(r); setShow(true);
      if (!loaded.current) {
        const data = await getDefinition(word);
        loaded.current = true;
        setDef(data);
      }
    }, 380);
  };

  const onLeave = () => {
    clearTimeout(timer.current);
    setShow(false);
  };

  return (
    <>
      <span ref={ref} onMouseEnter={onEnter} onMouseLeave={onLeave}
        style={{
          cursor: 'help',
          background: isHighlit ? 'var(--accent)' : 'none',
          color:      isHighlit ? 'var(--bg)'     : 'inherit',
          borderRadius: '2px',
          padding: isHighlit ? '0 1px' : '0',
          fontWeight: isHighlit ? 500 : 'inherit',
        }}
      >{word}</span>
      {show && <DefTooltip def={def} pos={pos || { left:0, top:0, bottom:0 }} />}
    </>
  );
}

const WORDS_PER_PAGE = 250;

function paginate(text) {
  if (!text.trim()) return [''];
  const tokens = text.split(/(\s+)/);
  const pages = []; let pg = '', count = 0;
  for (const tok of tokens) {
    const isWord = /\S/.test(tok);
    if (isWord) count++;
    pg += tok;
    if (count >= WORDS_PER_PAGE && isWord) { pages.push(pg.trimEnd()); pg = ''; count = 0; }
  }
  if (pg.trim() || pages.length === 0) pages.push(pg.trimEnd());
  return pages;
}

// ── Highlight matching ─────────────────────────────────────────────────────────

function sentenceMatches(s, hl) {
  if (!hl) return false;
  const wc  = s.trim().split(/\s+/).length;
  const cat = sentenceCategory(wc);
  if (hl.type === 'length')   return cat === hl.cat || (hl.cat === 'very-long' && wc > 40);
  if (hl.type === 'sentence') return s.startsWith(hl.text.replace('…','').slice(0, 30));
  if (hl.type === 'word')     return s.toLowerCase().includes(hl.word.toLowerCase());
  return false;
}

function paraMatches(para, hl) {
  if (!hl) return false;
  if (hl.type === 'paragraph-wall') return para.trim().split(/\s+/).length > 120;
  return false;
}

// ── Colors ────────────────────────────────────────────────────────────────────

const CAT_BG     = { short:'rgba(122,158,126,0.18)', medium:'transparent',             long:'rgba(200,160,80,0.14)', 'very-long':'rgba(200,90,70,0.16)' };
const CAT_BORDER = { short:'rgba(122,158,126,0.5)',   medium:'transparent',             long:'rgba(200,160,80,0.5)',  'very-long':'rgba(200,90,70,0.5)'  };
const HL_BG      = { short:'rgba(122,158,126,0.45)', medium:'rgba(200,169,110,0.35)', long:'rgba(200,160,80,0.40)', 'very-long':'rgba(200,90,70,0.40)' };

// ── Sentence renderer — tokenizes words for definition hover ──────────────────

function SentenceContent({ text, highlightWord }) {
  // Split into word and non-word tokens
  const tokens = text.split(/(\b[a-zA-Z']+\b)/);
  return (
    <>
      {tokens.map((tok, i) => {
        if (!/^[a-zA-Z']/.test(tok)) return <span key={i}>{tok}</span>;
        const isHL = highlightWord && tok.toLowerCase() === highlightWord.toLowerCase();
        return <WordToken key={i} word={tok} isHighlit={isHL} />;
      })}
    </>
  );
}

// ── Review view — scoped to current page text ──────────────────────────────────

function ReviewView({ pageText, highlight }) {
  const scrollRef = useRef(null);

  const paragraphs = useMemo(() =>
    (pageText || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      .map(para => ({ raw: para, sentences: splitSentences(para) })),
    [pageText]
  );

  // Auto-scroll to first match
  useEffect(() => {
    const t = setTimeout(() => {
      if (!scrollRef.current) return;
      if (highlight) {
        const el = scrollRef.current.querySelector('[data-match="true"]');
        if (el) { el.scrollIntoView({ behavior:'smooth', block:'center' }); return; }
      }
      scrollRef.current.scrollTop = 0;
    }, 40);
    return () => clearTimeout(t);
  }, [highlight, pageText]);

  if (!pageText?.trim()) return (
    <div style={{ padding:'28px 48px', color:'var(--text-faint)', fontStyle:'italic', fontSize:'18px' }}>
      Nothing on this page yet.
    </div>
  );

  let firstMatch = false;

  return (
    <div ref={scrollRef} style={{ flex:1, minHeight:0, overflowY:'auto', padding:'20px 40px 28px', fontSize:'18px', fontFamily:'var(--font-body)', fontWeight:300, color:'var(--text)', lineHeight:2.0 }}>
      {/* Legend */}
      <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', marginBottom:'16px', paddingBottom:'12px', borderBottom:'1px solid var(--glass-border)', alignItems:'center' }}>
        {[
          { label:'Short (≤8)',      cat:'short'     },
          { label:'Medium (9–18)',   cat:'medium'    },
          { label:'Long (19–30)',    cat:'long'      },
          { label:'Very long (31+)', cat:'very-long' },
        ].map(({ label, cat }) => (
          <span key={cat} style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-ui)' }}>
            <span style={{
              display:'inline-block', width:'22px', height:'8px', borderRadius:'2px',
              background: CAT_BG[cat] === 'transparent' ? 'var(--glass-bg)' : CAT_BG[cat],
              border: `1px solid ${CAT_BORDER[cat] === 'transparent' ? 'var(--glass-border)' : CAT_BORDER[cat]}`,
            }} />{label}
          </span>
        ))}
        {highlight && <span style={{ marginLeft:'auto', fontSize:'10px', color:'var(--accent)', fontFamily:'var(--font-ui)', fontStyle:'italic' }}>● highlighted</span>}
      </div>

      {paragraphs.map(({ raw, sentences }, pi) => {
        const pHl = paraMatches(raw, highlight);
        const isFirstPara = pHl && !firstMatch;
        if (isFirstPara) firstMatch = true;
        return (
          <p key={pi} data-match={isFirstPara ? 'true' : undefined} style={{
            marginBottom:'1.4em',
            background:  pHl ? 'rgba(200,169,110,0.07)' : 'transparent',
            borderLeft:  pHl ? '3px solid var(--accent)' : '3px solid transparent',
            paddingLeft: pHl ? '12px' : '0',
            borderRadius:'2px', transition:'background 0.2s, border-color 0.2s',
          }}>
            {sentences.map((s, si) => {
              const wc = s.trim().split(/\s+/).length;
              const cat = sentenceCategory(wc);
              const isHl = sentenceMatches(s, highlight);
              const isFirst = isHl && !firstMatch;
              if (isFirst) firstMatch = true;
              return (
                <span key={si} data-match={isFirst ? 'true' : undefined}
                  title={`${wc} words — ${cat.replace('-',' ')}`}
                  style={{
                    background:   isHl ? (HL_BG[cat] || 'rgba(200,169,110,0.35)') : CAT_BG[cat],
                    borderBottom: `2px solid ${isHl ? 'var(--accent)' : CAT_BORDER[cat]}`,
                    borderRadius:'2px', padding:'1px 2px', marginRight:'4px', display:'inline',
                    boxShadow: isHl ? '0 0 0 1px rgba(200,169,110,0.3)' : 'none',
                    transition:'background 0.15s, box-shadow 0.15s',
                  }}
                >
                  <SentenceContent
                    text={s}
                    highlightWord={isHl && highlight?.type === 'word' ? highlight.word : null}
                  />
                </span>
              );
            })}
          </p>
        );
      })}
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
  const [highlight,    setHighlight]    = useState(null);
  const [editingGoal,  setEditingGoal]  = useState(false);
  const [goalInput,    setGoalInput]    = useState('');
  const goalRef = useRef(null);

  const save = useDebounce((d) => onSave(chapter.id, d), 1100);

  useEffect(() => {
    setTitle(chapter.title ?? ''); setContent(chapter.content ?? '');
    setEditingGoal(false); setShowAnalysis(false); setHighlight(null); setPage(0);
  }, [chapter.id]);

  const onTitle   = (e) => { setTitle(e.target.value);   setSaveStatus('saving'); save({ title:   e.target.value }); };
  const onContent = (e) => { setContent(e.target.value); setSaveStatus('saving'); save({ content: e.target.value }); };

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape' && distractionFree) onToggleDistractionFree(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [distractionFree, onToggleDistractionFree]);

  // Pagination
  const pages    = paginate(content);
  const total    = pages.length;
  const pageText = pages[Math.min(page, total - 1)] || '';
  const words    = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars    = content.length;
  const pgText   = words === 0 ? '< 1 pg' : `~${total} ${total === 1 ? 'pg' : 'pgs'}`;
  useEffect(() => { if (page >= total) setPage(Math.max(0, total - 1)); }, [total]);

  // When page changes in review+analysis mode, clear highlight
  useEffect(() => { setHighlight(null); }, [page]);

  // Goals
  const wordGoal    = chapter.word_goal || 0;
  const pageGoal    = chapter.page_goal || 0;
  const activeGoal  = pageGoal > 0 ? pageGoal : wordGoal;
  const goalUnit    = pageGoal > 0 ? 'pages' : 'words';
  const goalCurrent = pageGoal > 0 ? total : words;
  const pct         = activeGoal > 0 ? Math.min(100, (goalCurrent / activeGoal) * 100) : 0;
  const goalDone    = activeGoal > 0 && goalCurrent >= activeGoal;

  const openGoalEditor = () => { setGoalInput(activeGoal > 0 ? String(activeGoal) : ''); setEditingGoal(true); setTimeout(() => goalRef.current?.select(), 30); };
  const saveGoal = () => {
    const val = Math.max(0, parseInt(goalInput) || 0);
    setEditingGoal(false); setSaveStatus('saving');
    if (pageGoal > 0) onSave(chapter.id, { page_goal: val });
    else              onSave(chapter.id, { word_goal: val });
    setSaveStatus('saved');
  };
  const clearGoal = (e) => { e.stopPropagation(); setEditingGoal(false); onSave(chapter.id, { word_goal:0, page_goal:0 }); };

  const switchView = (v) => { setView(v); if (v !== 'edit') onFocusChange(false); };

  const handleReplace = (oldWord, newWord, selectedIndices) => {
    const escaped = oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(`\\b${escaped}\\b`, 'gi');

    if (!selectedIndices) {
      // Replace all
      const updated = content.replace(regex, (m) =>
        m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase()
          ? newWord.charAt(0).toUpperCase() + newWord.slice(1)
          : newWord.toLowerCase()
      );
      setContent(updated); setSaveStatus('saving'); save({ content: updated });
      return;
    }

    // Replace only selected occurrences — collect positions, work backwards
    const matches = [];
    let m;
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    while ((m = re.exec(content)) !== null) matches.push({ index: m.index, length: m[0].length, matched: m[0] });

    let result = content;
    // Work backwards so indices stay valid
    [...selectedIndices].sort((a, b) => b - a).forEach(i => {
      const { index, length, matched } = matches[i];
      const rep = matched[0] === matched[0].toUpperCase() && matched[0] !== matched[0].toLowerCase()
        ? newWord.charAt(0).toUpperCase() + newWord.slice(1)
        : newWord.toLowerCase();
      result = result.slice(0, index) + rep + result.slice(index + length);
    });
    setContent(result); setSaveStatus('saving'); save({ content: result });
  };

  const toggleAnalysis = () => {
    if (!showAnalysis) { setShowAnalysis(true); setView('review'); setHighlight(null); }
    else               { setShowAnalysis(false); setHighlight(null); setView('edit'); }
  };

  // Analysis data — scoped to CURRENT PAGE only
  const analysisData = useMemo(() =>
    showAnalysis ? analyzeText(pageText) : null,
    [pageText, showAnalysis]
  );

  const showPageNav = view === 'pages' || view === 'review' || showAnalysis;

  return (
    <div className="editor">

      {/* Header */}
      <div className="editor-header">
        <input className="editor-title" value={title} onChange={onTitle} placeholder="Chapter title…" spellCheck />
        <div className="editor-controls">
          <div className="view-toggle">
            <button className={`view-btn ${view==='edit' && !showAnalysis ? 'active' : ''}`}
              onClick={() => { switchView('edit'); if(showAnalysis){ setShowAnalysis(false); setHighlight(null); } }}>✎ Edit</button>
            <button className={`view-btn ${view==='review' || showAnalysis ? 'active' : ''}`}
              onClick={() => switchView('review')}>◉ Review</button>
            <button className={`view-btn ${view==='pages' && !showAnalysis ? 'active' : ''}`}
              onClick={() => switchView('pages')}>◫ Pages</button>
          </div>
          <button className={`btn btn-sm ${showAnalysis ? 'btn-accent' : ''}`} onClick={toggleAnalysis}>✎ Analysis</button>
          <button className={`btn btn-sm ${distractionFree ? 'btn-accent' : ''}`} onClick={onToggleDistractionFree}>
            {distractionFree ? '◈ Exit Focus' : '◈ Focus'}
          </button>
        </div>
      </div>

      <div className="editor-divider" />

      {/* Body */}
      <div className="editor-body" style={{ flexDirection: showAnalysis ? 'row' : 'column' }}>
        <div style={{ flex:1, minWidth:0, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {(view === 'review' || showAnalysis) ? (
            <ReviewView pageText={pageText} highlight={highlight} />
          ) : view === 'edit' ? (
            <textarea className="story-textarea" value={content} onChange={onContent}
              onFocus={() => onFocusChange(true)} onBlur={() => onFocusChange(false)}
              placeholder="Begin your story here… let the words find you." spellCheck />
          ) : (
            <div className="pages-scroll">
              <div className="page-sheet">
                <div className="page-text">
                  {pageText || <span style={{ color:'var(--text-faint)', fontStyle:'italic' }}>This page is empty.</span>}
                </div>
                <div className="page-num">— {page + 1} —</div>
              </div>
            </div>
          )}
        </div>

        {showAnalysis && (
          <Analysis data={analysisData} content={content} onHighlight={setHighlight} onReplace={handleReplace} onClose={toggleAnalysis} />
        )}
      </div>

      {/* Footer */}
      <div className="editor-footer" style={{ position:'relative' }}>
        {editingGoal ? (
          <div className="goal-edit-row">
            <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-ui)' }}>Goal:</span>
            <input ref={goalRef} className="goal-input" type="number" min="0" value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') saveGoal(); if(e.key==='Escape') setEditingGoal(false); }}
              placeholder="word count" autoFocus />
            <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-ui)' }}>words</span>
            <button className="goal-action-btn goal-confirm" onClick={saveGoal}>✓</button>
            <button className="goal-action-btn goal-cancel" onClick={() => setEditingGoal(false)}>✗</button>
            {activeGoal > 0 && <button className="goal-action-btn goal-clear" onClick={clearGoal}>Clear</button>}
          </div>
        ) : (
          <span className={`stats ${activeGoal>0?'stats-clickable':''}`} onClick={activeGoal>0?openGoalEditor:undefined}>
            {activeGoal > 0 ? (
              <>
                <span style={{ color:goalDone?'var(--accent)':'var(--text-muted)' }}>{goalCurrent.toLocaleString()}</span>
                <span style={{ color:'var(--text-faint)' }}> / {activeGoal.toLocaleString()} {goalUnit}</span>
                {goalDone && <span style={{ color:'var(--accent)', marginLeft:'4px' }}>✦</span>}
              </>
            ) : (
              <>{words.toLocaleString()} {words===1?'word':'words'}</>
            )}
            {' · '}{chars.toLocaleString()} chars · {pgText}
          </span>
        )}

        {/* Page nav — shown in Review, Pages, and Analysis modes */}
        {showPageNav && (
          <>
            <div style={{ width:'1px', height:'13px', background:'var(--glass-border)', margin:'0 4px' }} />
            <button className="btn btn-sm" onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ opacity:page===0?0.3:1 }}>← Prev</button>
            <span style={{ fontSize:'12px', color:'var(--text-muted)', fontFamily:'var(--font-ui)', minWidth:'78px', textAlign:'center' }}>
              Page {page+1} of {total}
            </span>
            <button className="btn btn-sm" onClick={() => setPage(p=>Math.min(total-1,p+1))} disabled={page>=total-1} style={{ opacity:page>=total-1?0.3:1 }}>Next →</button>
          </>
        )}

        <div className="footer-spacer" />

        {activeGoal > 0 && (
          <div style={{
            position:'absolute', bottom:0, left:0, height:'2px', width:`${pct}%`,
            background:goalDone?'#7a9e7e':'var(--accent)', opacity:goalDone?0.9:0.6,
            transition:'width 0.5s ease, background 0.4s', borderRadius:'0 2px 2px 0', pointerEvents:'none',
          }} />
        )}
      </div>
    </div>
  );
}
