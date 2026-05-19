import { useEffect, useRef } from 'react';

export default function ConfirmModal({ type, name, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  // Focus cancel by default so accidental Enter doesn't confirm
  useEffect(() => { cancelRef.current?.focus(); }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:5000,
      background:'rgba(0,0,0,0.5)',
      backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      animation:'fadeIn 0.14s ease',
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--sidebar-bg)',
        backdropFilter:'blur(40px)',
        border:'1px solid var(--glass-border)',
        borderRadius:'14px',
        boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
        padding:'28px 32px 24px',
        width:'360px',
        maxWidth:'92vw',
        display:'flex', flexDirection:'column', gap:'16px',
        animation:'slideDown 0.16s ease',
      }}>
        {/* Icon */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <span style={{
            width:'36px', height:'36px', borderRadius:'50%',
            background:'rgba(200,70,70,0.12)',
            border:'1px solid rgba(200,70,70,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'16px', flexShrink:0,
          }}>⚠</span>
          <div>
            <div style={{ fontSize:'15px', fontWeight:600, fontFamily:'var(--font-head)', color:'var(--text)' }}>
              Delete {type === 'book' ? 'Book' : 'Chapter'}?
            </div>
            <div style={{ fontSize:'12px', color:'var(--text-faint)', fontFamily:'var(--font-ui)', marginTop:'2px' }}>
              You can undo this for a few seconds after.
            </div>
          </div>
        </div>

        {/* Name */}
        <div style={{
          background:'var(--glass-bg)',
          border:'1px solid var(--glass-border)',
          borderRadius:'8px',
          padding:'10px 14px',
          fontSize:'14px',
          fontFamily:'var(--font-body)',
          color:'var(--text-muted)',
          fontStyle:'italic',
        }}>
          "{name}"
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            style={{
              padding:'7px 20px', borderRadius:'8px',
              border:'1px solid var(--glass-border)',
              background:'var(--glass-bg)', color:'var(--text-muted)',
              fontSize:'13px', fontFamily:'var(--font-ui)', cursor:'pointer',
              transition:'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--glass-hover)'; e.currentTarget.style.color='var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--glass-bg)';   e.currentTarget.style.color='var(--text-muted)'; }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              padding:'7px 20px', borderRadius:'8px',
              border:'1px solid rgba(200,70,70,0.35)',
              background:'rgba(200,70,70,0.10)', color:'rgba(220,80,80,0.9)',
              fontSize:'13px', fontFamily:'var(--font-ui)', cursor:'pointer',
              transition:'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(200,70,70,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(200,70,70,0.10)'; }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}
