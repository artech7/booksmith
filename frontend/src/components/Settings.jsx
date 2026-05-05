import { useEffect, useRef } from 'react';

const FONTS = [
  { id: 'crimson',      label: 'Crimson Pro',    style: { fontFamily: "'Crimson Pro', Georgia, serif" } },
  { id: 'garamond',     label: 'EB Garamond',    style: { fontFamily: "'EB Garamond', Georgia, serif" } },
  { id: 'lora',         label: 'Lora',           style: { fontFamily: "'Lora', Georgia, serif" } },
  { id: 'merriweather', label: 'Merriweather',   style: { fontFamily: "'Merriweather', Georgia, serif" } },
  { id: 'sourceserif',  label: 'Source Serif 4', style: { fontFamily: "'Source Serif 4', Georgia, serif" } },
  { id: 'georgia',      label: 'Georgia',        style: { fontFamily: "Georgia, 'Times New Roman', serif" } },
  { id: 'palatino',     label: 'Palatino',       style: { fontFamily: "Palatino, 'Palatino Linotype', serif" } },
  { id: 'inter',        label: 'Inter',          style: { fontFamily: "'Inter', system-ui, sans-serif" } },
];

const ACCENTS = [
  { id: 'gold',  label: 'Gold',  color: '#c8a96e' },
  { id: 'sage',  label: 'Sage',  color: '#7a9e7e' },
  { id: 'dusk',  label: 'Dusk',  color: '#9b85c4' },
  { id: 'rose',  label: 'Rose',  color: '#c47a85' },
  { id: 'slate', label: 'Slate', color: '#7aa0b8' },
  { id: 'ember', label: 'Ember', color: '#c47a50' },
];

const SCALES = [
  { id: 0.85, label: 'XS', hint: '85%'  },
  { id: 0.92, label: 'S',  hint: '92%'  },
  { id: 1.00, label: 'M',  hint: '100%' },
  { id: 1.10, label: 'L',  hint: '110%' },
  { id: 1.20, label: 'XL', hint: '120%' },
];

export default function Settings({ theme, font, accent, scale, onTheme, onFont, onAccent, onScale, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="settings-overlay">
      <div className="settings-panel" ref={ref}>

        {/* Theme */}
        <div>
          <div className="settings-group-label">Theme</div>
          <div className="theme-toggle">
            <button className={`theme-btn ${theme === 'dark'  ? 'active' : ''}`} onClick={() => onTheme('dark')}>
              ◐ Dark
            </button>
            <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => onTheme('light')}>
              ○ Light
            </button>
          </div>
        </div>

        <div className="settings-divider" />

        {/* UI Scale */}
        <div>
          <div className="settings-group-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>UI Scale</span>
            <span style={{ color: 'var(--accent)' }}>{Math.round(scale * 100)}%</span>
          </div>
          <div className="scale-row">
            {SCALES.map(s => (
              <button
                key={s.id}
                className={`scale-btn ${scale === s.id ? 'active' : ''}`}
                onClick={() => onScale(s.id)}
                title={s.hint}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-divider" />

        {/* Accent color */}
        <div>
          <div className="settings-group-label">Accent Color</div>
          <div className="color-grid">
            {ACCENTS.map(a => (
              <button
                key={a.id}
                className={`color-swatch ${accent === a.id ? 'active' : ''}`}
                onClick={() => onAccent(a.id)}
              >
                <span className="swatch-dot" style={{ background: a.color }} />
                <span className="swatch-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="settings-divider" />

        {/* Font */}
        <div>
          <div className="settings-group-label">Text Style</div>
          <div className="font-grid">
            {FONTS.map(f => (
              <button
                key={f.id}
                className={`font-option ${font === f.id ? 'active' : ''}`}
                onClick={() => onFont(f.id)}
              >
                <span className="font-option-dot" />
                <span style={f.style}>{f.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '15px', opacity: 0.45, ...f.style }}>Aa</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
