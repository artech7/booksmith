import { useEffect, useRef } from 'react';
import { Ico } from '../Icons.jsx';

const FONTS = [
  { id: 'crimson',      label: 'Crimson Pro',    style: { fontFamily: "'Crimson Pro', Georgia, serif" } },
  { id: 'garamond',     label: 'EB Garamond',    style: { fontFamily: "'EB Garamond', Georgia, serif" } },
  { id: 'lora',         label: 'Lora',           style: { fontFamily: "'Lora', Georgia, serif" } },
  { id: 'merriweather', label: 'Merriweather',   style: { fontFamily: "'Merriweather', Georgia, serif" } },
  { id: 'sourceserif',  label: 'Source Serif 4', style: { fontFamily: "'Source Serif 4', Georgia, serif" } },
  { id: 'georgia',      label: 'Georgia',        style: { fontFamily: 'Georgia, serif' } },
  { id: 'palatino',     label: 'Palatino',       style: { fontFamily: 'Palatino, serif' } },
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
  { id: 0.85, label: 'XS' },
  { id: 0.92, label: 'S'  },
  { id: 1.00, label: 'M'  },
  { id: 1.10, label: 'L'  },
  { id: 1.20, label: 'XL' },
];

const ICON_STYLES = [
  { id: 'classic',   label: 'Classic',   preview: '◈ ○ ◆' },
  { id: 'minimal',   label: 'Minimal',   previewIcon: true  },
  { id: 'wireframe', label: 'Wireframe', previewIcon: true  },
  { id: 'bold',      label: 'Bold',      previewIcon: true  },
];

export default function Settings({ theme, font, accent, scale, iconStyle, onTheme, onFont, onAccent, onScale, onIconStyle, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  return (
    <div className="settings-overlay">
      <div className="settings-panel" ref={ref}>

        {/* Theme */}
        <div>
          <div className="s-label">Theme</div>
          <div className="theme-row">
            <button className={`theme-btn ${theme === 'dark'  ? 'active' : ''}`} onClick={() => onTheme('dark')}>◐ Dark</button>
            <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => onTheme('light')}>○ Light</button>
          </div>
        </div>

        <div className="s-divider" />

        {/* UI Scale */}
        <div>
          <div className="s-label">
            <span>UI Scale</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <div className="scale-row">
            {SCALES.map(s => (
              <button key={s.id} className={`scale-btn ${scale === s.id ? 'active' : ''}`} onClick={() => onScale(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="s-divider" />

        {/* Icon Style */}
        <div>
          <div className="s-label">Icon Style</div>
          <div className="icon-style-grid">
            {ICON_STYLES.map(is => (
              <button
                key={is.id}
                className={`icon-style-btn ${iconStyle === is.id ? 'active' : ''}`}
                onClick={() => onIconStyle(is.id)}
              >
                <span className="icon-style-preview">
                  {is.id === 'classic'
                    ? <span style={{ fontSize: '12px', letterSpacing: '2px' }}>◈ ○</span>
                    : <>
                        <Ico name="Location" size={14} style={is.id} />
                        <Ico name="Characters" size={14} style={is.id} />
                      </>
                  }
                </span>
                <span className="icon-style-label">{is.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="s-divider" />

        {/* Accent color */}
        <div>
          <div className="s-label">Accent Color</div>
          <div className="color-grid">
            {ACCENTS.map(a => (
              <button key={a.id} className={`color-swatch ${accent === a.id ? 'active' : ''}`} onClick={() => onAccent(a.id)}>
                <span className="swatch-dot" style={{ background: a.color }} />
                <span className="swatch-label">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="s-divider" />

        {/* Font */}
        <div>
          <div className="s-label">Text Style</div>
          <div className="font-list">
            {FONTS.map(f => (
              <button key={f.id} className={`font-opt ${font === f.id ? 'active' : ''}`} onClick={() => onFont(f.id)}>
                <span className="font-dot" />
                <span style={f.style}>{f.label}</span>
                <span className="font-aa" style={f.style}>Aa</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
