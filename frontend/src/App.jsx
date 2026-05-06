import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import Sidebar    from './components/Sidebar.jsx';
import StoryEditor from './components/StoryEditor.jsx';
import BookPlot   from './components/BookPlot.jsx';
import ChapterPlot from './components/ChapterPlot.jsx';
import Characters  from './components/Characters.jsx';
import Items       from './components/Items.jsx';
import Settings    from './components/Settings.jsx';
import Export      from './components/Export.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseRels = (c) => ({
  ...c,
  relationships: typeof c.relationships === 'string'
    ? JSON.parse(c.relationships || '[]')
    : (c.relationships ?? []),
});

const PREFS_KEY = 'booksmith_prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } };
const savePrefs = (p) => localStorage.setItem(PREFS_KEY, JSON.stringify(p));

const TABS = [
  { id: 'story',      label: 'Story',        needs: 'chapter' },
  { id: 'chapterPlot',label: 'Chapter Plot',  needs: 'chapter' },
  { id: 'bookPlot',   label: 'Book Plot',     needs: 'book'    },
  { id: 'characters', label: 'Characters',    needs: 'book'    },
  { id: 'items',      label: 'World Builder', needs: 'book'    },
];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [books,       setBooks]       = useState([]);
  const [bookId,      setBookId]      = useState(null);
  const [chapters,    setChapters]    = useState([]);
  const [chapterId,   setChapterId]   = useState(null);
  const [characters,  setCharacters]  = useState([]);
  const [items,       setItems]       = useState([]);
  const [tab,         setTab]         = useState('story');
  const [focusMode,   setFocusMode]   = useState(false);
  const [dfMode,      setDfMode]      = useState(false);
  const [saveStatus,  setSaveStatus]  = useState('saved');
  const [showSettings,setShowSettings]= useState(false);
  const [showExport,  setShowExport]  = useState(false);

  const p = loadPrefs();
  const [theme,  setThemeS]  = useState(p.theme  || 'dark');
  const [font,   setFontS]   = useState(p.font   || 'crimson');
  const [accent, setAccentS] = useState(p.accent || 'gold');
  const [scale,  setScaleS]  = useState(p.scale  || 1.00);

  // Apply preferences to DOM
  useEffect(() => {
    document.body.className = `theme-${theme} font-${font} accent-${accent}`;
  }, [theme, font, accent]);

  useEffect(() => {
    document.getElementById('root').style.zoom = scale;
  }, [scale]);

  const setTheme  = (v) => { setThemeS(v);  savePrefs({ ...loadPrefs(), theme:  v }); };
  const setFont   = (v) => { setFontS(v);   savePrefs({ ...loadPrefs(), font:   v }); };
  const setAccent = (v) => { setAccentS(v); savePrefs({ ...loadPrefs(), accent: v }); };
  const setScale  = (v) => { setScaleS(v);  savePrefs({ ...loadPrefs(), scale:  v }); };

  const book    = books.find(b => b.id === bookId)      ?? null;
  const chapter = chapters.find(c => c.id === chapterId) ?? null;

  const availTabs = TABS.filter(t =>
    (t.needs === 'chapter' && chapter) || (t.needs === 'book' && book)
  );

  // Load books
  useEffect(() => { api.getBooks().then(setBooks); }, []);

  // Load book data
  useEffect(() => {
    if (!bookId) { setChapters([]); setCharacters([]); setItems([]); setChapterId(null); return; }
    Promise.all([
      api.getChapters(bookId),
      api.getCharacters(bookId),
      api.getItems(bookId),
    ]).then(([chs, chars, its]) => {
      setChapters(chs);
      setCharacters(chars.map(parseRels));
      setItems(its);
      if (chs.length > 0) setChapterId(chs[0].id);
    });
  }, [bookId]);

  // Keep tab valid
  useEffect(() => {
    if (!availTabs.some(t => t.id === tab) && availTabs.length > 0) setTab(availTabs[0].id);
  }, [bookId, chapterId]);

  // ── Book handlers ────────────────────────────────────────────────────────
  const selectBook = (id) => { setBookId(id); setChapterId(null); setTab('story'); };
  const addBook    = async () => {
    const b = await api.createBook('Untitled Book');
    setBooks(prev => [b, ...prev]);
    setBookId(b.id); setChapterId(null); setTab('bookPlot');
  };
  const deleteBook = async (id) => {
    await api.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    if (bookId === id) { setBookId(null); setChapterId(null); }
  };
  const saveBook = useCallback(async (data) => {
    if (!bookId) return;
    setSaveStatus('saving');
    const updated = await api.updateBook(bookId, data);
    setBooks(prev => prev.map(b => b.id === bookId ? updated : b));
    setSaveStatus('saved');
  }, [bookId]);

  // ── Chapter handlers ─────────────────────────────────────────────────────
  const selectChapter = (id) => { setChapterId(id); setTab('story'); };
  const addChapter    = async () => {
    if (!bookId) return;
    const ch = await api.createChapter(bookId, 'New Chapter');
    setChapters(prev => [...prev, ch]);
    setChapterId(ch.id); setTab('story');
  };
  const deleteChapter = async (id) => {
    await api.deleteChapter(id);
    setChapters(prev => prev.filter(c => c.id !== id));
    if (chapterId === id) setChapterId(null);
  };
  const saveChapter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateChapter(id, data);
    setChapters(prev => prev.map(c => c.id === id ? updated : c));
    setSaveStatus('saved');
  }, []);

  // ── Character handlers ───────────────────────────────────────────────────
  const addCharacter = async () => {
    if (!bookId) return;
    const c = await api.createCharacter(bookId, 'New Character');
    setCharacters(prev => [...prev, parseRels(c)]);
  };
  const updateCharacter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    await api.updateCharacter(id, data);
    const fresh = await api.getCharacters(bookId);
    setCharacters(fresh.map(parseRels));
    setSaveStatus('saved');
  }, [bookId]);
  const deleteCharacter = async (id) => {
    await api.deleteCharacter(id);
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // ── Item handlers ────────────────────────────────────────────────────────
  const addItem = async (name, category) => {
    if (!bookId) return;
    const item = await api.createItem(bookId, name, category);
    setItems(prev => [...prev, item]);
  };
  const updateItem = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateItem(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    setSaveStatus('saved');
    return updated;
  }, []);
  const deleteItem = async (id) => {
    await api.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const appClass = ['app', focusMode && !dfMode ? 'focus-active' : '', dfMode ? 'df-mode' : ''].filter(Boolean).join(' ');

  return (
    <div className={appClass}>
      <Sidebar
        books={books} selectedBookId={bookId}
        onSelectBook={selectBook} onAddBook={addBook} onDeleteBook={deleteBook}
        chapters={chapters} selectedChapterId={chapterId}
        onSelectChapter={selectChapter} onAddChapter={addChapter} onDeleteChapter={deleteChapter}
      />

      <div className="main">
        {/* Tab bar */}
        {!dfMode && (
          <div className="tabbar">
            {availTabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <div className="tabbar-spacer" />
            <span className={`save-pill ${saveStatus}`}>
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
            {book && (
              <button className="topbar-btn" onClick={() => setShowExport(true)}>
                ↓ Export
              </button>
            )}
            <button className="topbar-btn" onClick={() => setShowSettings(s => !s)}>
              ⚙ Settings
            </button>
          </div>
        )}

        {/* Content */}
        <div className="content">
          {dfMode && (
            <button className="df-exit" onClick={() => setDfMode(false)}>esc · exit focus</button>
          )}

          {tab === 'story' && chapter ? (
            <StoryEditor
              key={chapter.id}
              chapter={chapter}
              onSave={saveChapter}
              onFocusChange={setFocusMode}
              distractionFree={dfMode}
              onToggleDistractionFree={() => setDfMode(d => !d)}
              setSaveStatus={setSaveStatus}
            />
          ) : tab === 'bookPlot' && book ? (
            <BookPlot key={book.id} book={book} onSave={saveBook} setSaveStatus={setSaveStatus} />
          ) : tab === 'chapterPlot' && chapter ? (
            <ChapterPlot key={chapter.id} chapter={chapter} onSave={saveChapter} setSaveStatus={setSaveStatus} />
          ) : tab === 'characters' && book ? (
            <Characters characters={characters} onAdd={addCharacter} onUpdate={updateCharacter} onDelete={deleteCharacter} setSaveStatus={setSaveStatus} />
          ) : tab === 'items' && book ? (
            <Items items={items} characters={characters} onAdd={addItem} onUpdate={updateItem} onDelete={deleteItem} setSaveStatus={setSaveStatus} />
          ) : (
            <div className="empty">
              <div className="empty-glyph">✦</div>
              <p>Select a book to begin your story</p>
              <small>or create one from the sidebar</small>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {showSettings && (
        <Settings
          theme={theme} font={font} accent={accent} scale={scale}
          onTheme={setTheme} onFont={setFont} onAccent={setAccent} onScale={setScale}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showExport && book && (
        <Export
          book={book} chapters={chapters} characters={characters} items={items}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
