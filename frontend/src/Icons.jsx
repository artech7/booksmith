import { createContext, useContext } from 'react';

export const IconCtx = createContext('wireframe');

// ── Style configs ──────────────────────────────────────────────────────────────
const STYLES = {
  classic:   { sw: 1.5,  lc: 'round',  lj: 'round' },
  minimal:   { sw: 1,    lc: 'square', lj: 'miter'  },
  wireframe: { sw: 1.5,  lc: 'round',  lj: 'round'  },
  bold:      { sw: 2.5,  lc: 'round',  lj: 'round'  },
};

// ── Classic (text/unicode) map ─────────────────────────────────────────────────
const CLASSIC = {
  Book:       '◫',  Chapter:    '§',   Characters: '◎',  History:  '≡',
  Location:   '◉',  Factions:   '⬡',  Creatures:  '❖',  KeyItems: '◆',
  Weapons:    '†',  Artifacts:  '◈',   Other:      '○',  Globe:    '◌',
  Plus:       '+',  Delete:     '×',   Settings:   '⚙',  Download: '↓',
  Drag:       '⣿', Collapse:   '▶',   Edit:       '✎',  Pages:    '⊡',
  Focus:      '⤢', Save:       '✦',   World:      '◐',  Filter:   '≈',
};

// ── SVG paths ──────────────────────────────────────────────────────────────────
function paths(name) {
  switch (name) {
    case 'Book': return <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </>;
    case 'Chapter': return <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </>;
    case 'Characters': return <>
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20a8 8 0 0 1 16 0"/>
    </>;
    case 'History': return <>
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 15.5 15.5"/>
    </>;
    case 'Location': return <>
      <path d="M12 2a7 7 0 0 1 7 7c0 5.5-7 13-7 13S5 14.5 5 9a7 7 0 0 1 7-7z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </>;
    case 'Factions': return <>
      <path d="M12 3L4 7v5c0 5.25 3.5 9.5 8 11.5 4.5-2 8-6.25 8-11.5V7z"/>
      <polyline points="9 12 11 14 15 10"/>
    </>;
    case 'Creatures': return <>
      <path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/>
      <path d="M3 7c2-2 5-3 9-3s7 1 9 3c-1 3-1 6 0 9-2 2-5 3-9 3s-7-1-9-3c1-3 1-6 0-9z"/>
      <circle cx="9" cy="8" r="1" fill="currentColor"/>
      <circle cx="15" cy="8" r="1" fill="currentColor"/>
    </>;
    case 'KeyItems': return <>
      <circle cx="8" cy="15" r="4"/>
      <line x1="11.3" y1="11.7" x2="20" y2="3"/>
      <line x1="17.5" y1="5.5" x2="20.5" y2="8.5"/>
      <line x1="16" y1="10" x2="19" y2="7"/>
    </>;
    case 'Weapons': return <>
      <line x1="5" y1="19" x2="19" y2="5"/>
      <polyline points="15 5 19 5 19 9"/>
      <line x1="5" y1="14" x2="8" y2="14"/>
      <line x1="10" y1="19" x2="10" y2="16"/>
    </>;
    case 'Artifacts': return <>
      <polygon points="12 2 20 8 18 18 6 18 4 8"/>
      <line x1="12" y1="2" x2="12" y2="18"/>
      <line x1="4" y1="8" x2="20" y2="8"/>
    </>;
    case 'Other': return <>
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </>;
    case 'Globe': return <>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </>;
    case 'World': return <>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </>;
    case 'Plus': return <>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </>;
    case 'Delete': return <>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </>;
    case 'Settings': return <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </>;
    case 'Download': return <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </>;
    case 'Drag': return <>
      <circle cx="9"  cy="5"  r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="9"  cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="9"  cy="19" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="5"  r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="19" r="1.2" fill="currentColor" stroke="none"/>
    </>;
    case 'Collapse': return <polyline points="9 18 15 12 9 6"/>;
    case 'Edit': return <>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="M15 5l4 4"/>
    </>;
    case 'Pages': return <>
      <rect x="3" y="7" width="14" height="14" rx="2"/>
      <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>
    </>;
    case 'Focus': return <>
      <polyline points="15 3 21 3 21 9"/>
      <polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/>
      <line x1="3" y1="21" x2="10" y2="14"/>
    </>;
    case 'Save': return <>
      <polyline points="20 6 9 17 4 12"/>
    </>;
    case 'Filter': return <>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </>;
    default: return <circle cx="12" cy="12" r="5"/>;
  }
}

// ── Main Ico component ─────────────────────────────────────────────────────────
export function Ico({ name, size = 16, style: styleProp }) {
  const ctxStyle = useContext(IconCtx);
  const s = styleProp || ctxStyle;

  if (s === 'classic') {
    return (
      <span style={{
        fontSize: Math.round(size * 0.8) + 'px',
        lineHeight: 1,
        display: 'inline-block',
        width: size + 'px',
        textAlign: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        fontStyle: 'normal',
      }}>
        {CLASSIC[name] || '○'}
      </span>
    );
  }

  const { sw, lc, lj } = STYLES[s] || STYLES.wireframe;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap={lc}
      strokeLinejoin={lj}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {paths(name)}
    </svg>
  );
}
