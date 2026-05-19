import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import Sidebar      from './components/Sidebar.jsx';
import StoryEditor  from './components/StoryEditor.jsx';
import WorldBuilder from './components/WorldBuilder.jsx';
import Settings     from './components/Settings.jsx';
import Export       from './components/Export.jsx';
import Goals        from './components/Goals.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import { IconCtx }  from './Icons.jsx';
import { useWritingProgress } from './hooks/useWritingProgress.js';

const countWords = (text) => (text || '').trim() ? (text || '').trim().split(/\s+/).length : 0;

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

const parseChar = (c) => ({ ...c, relationships: parseArr(c.relationships), chapter_ids: parseArr(c.chapter_ids) });
const parseItem = (i) => ({ ...i, associated: parseArr(i.associated), chapter_ids: parseArr(i.chapter_ids) });

const PREFS_KEY = 'booksmith_prefs';
const loadPrefs = () => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } };
const savePrefs = (p) => localStorage.setItem(PREFS_KEY, JSON.stringify(p));

const TABS = [
  { id: 'story',        label: 'Story',         needs: 'chapter' },
  { id: 'worldbuilder', label: 'World Builder',  needs: 'book'    },
];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [books,      setBooks]      = useState([]);
  const [bookId,     setBookId]     = useState(null);
  const [chapters,   setChapters]   = useState([]);
  const [chapterId,  setChapterId]  = useState(null);
  const [characters, setCharacters] = useState([]);
  const [items,      setItems]      = useState([]);
  const [tab,        setTab]        = useState('story');
  const [focusMode,  setFocusMode]  = useState(false);
  const [dfMode,     setDfMode]     = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [showSettings, setShowSettings] = useState(false);
  const [showExport,   setShowExport]   = useState(false);
  const [showGoals,    setShowGoals]    = useState(false);
  const [confirm,      setConfirm]      = useState(null);  // { type, id, name }
  const [undoItem,     setUndoItem]     = useState(null);  // { type, name, restore, timeLeft }
  const undoTimer  = useRef(null);
  const undoTicker = useRef(null);

  const UNDO_SECS = 8;

  const startUndo = (type, name, restoreFn, deleteFn) => {
    // Clear any existing undo
    clearTimeout(undoTimer.current);
    clearInterval(undoTicker.current);
    // If there was a previous pending delete, commit it now
    if (undoItem?._deleteFn) undoItem._deleteFn();

    setUndoItem({ type, name, timeLeft: UNDO_SECS, _deleteFn: deleteFn, _restoreFn: restoreFn });

    undoTicker.current = setInterval(() => {
      setUndoItem(prev => {
        if (!prev) return null;
        const next = prev.timeLeft - 1;
        if (next <= 0) { clearInterval(undoTicker.current); return null; }
        return { ...prev, timeLeft: next };
      });
    }, 1000);

    undoTimer.current = setTimeout(() => {
      deleteFn();
      clearInterval(undoTicker.current);
      setUndoItem(null);
    }, UNDO_SECS * 1000);
  };

  const handleUndo = () => {
    clearTimeout(undoTimer.current);
    clearInterval(undoTicker.current);
    if (undoItem?._restoreFn) undoItem._restoreFn();
    setUndoItem(null);
  };

  const dismissUndo = () => {
    clearTimeout(undoTimer.current);
    clearInterval(undoTicker.current);
    if (undoItem?._deleteFn) undoItem._deleteFn();
    setUndoItem(null);
  };

  const { data: wpData, trackWords, setGoal: setTimeGoal } = useWritingProgress();
  const lastWordCounts = useRef({}); // chapterId → last known word count

  const p = loadPrefs();
  const [theme,     setThemeS]    = useState(p.theme     || 'dark');
  const [font,      setFontS]     = useState(p.font      || 'crimson');
  const [accent,    setAccentS]   = useState(p.accent    || 'gold');
  const [scale,     setScaleS]    = useState(p.scale     || 1.00);
  const [iconStyle, setIconStyleS]= useState(p.iconStyle || 'wireframe');

  useEffect(() => { document.body.className = `theme-${theme} font-${font} accent-${accent}`; }, [theme, font, accent]);
  useEffect(() => { document.getElementById('root').style.zoom = scale; }, [scale]);

  const setTheme     = (v) => { setThemeS(v);     savePrefs({ ...loadPrefs(), theme:     v }); };
  const setFont      = (v) => { setFontS(v);      savePrefs({ ...loadPrefs(), font:      v }); };
  const setAccent    = (v) => { setAccentS(v);    savePrefs({ ...loadPrefs(), accent:    v }); };
  const setScale     = (v) => { setScaleS(v);     savePrefs({ ...loadPrefs(), scale:     v }); };
  const setIconStyle = (v) => { setIconStyleS(v); savePrefs({ ...loadPrefs(), iconStyle: v }); };

  const book    = books.find(b => b.id === bookId)      ?? null;
  const chapter = chapters.find(c => c.id === chapterId) ?? null;

  const availTabs = TABS.filter(t =>
    (t.needs === 'chapter' && chapter) || (t.needs === 'book' && book)
  );

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => { api.getBooks().then(setBooks); }, []);

  useEffect(() => {
    if (!bookId) { setChapters([]); setCharacters([]); setItems([]); setChapterId(null); return; }
    Promise.all([
      api.getChapters(bookId),
      api.getCharacters(bookId),
      api.getItems(bookId),
    ]).then(([chs, chars, its]) => {
      setChapters(chs);
      setCharacters(chars.map(parseChar));
      setItems(its.map(parseItem));
      // Initialize word count baselines for delta tracking
      chs.forEach(ch => {
        if (!(ch.id in lastWordCounts.current)) {
          lastWordCounts.current[ch.id] = countWords(ch.content);
        }
      });
      if (chs.length > 0) setChapterId(chs[0].id);
    });
  }, [bookId]);

  // Keep tab valid
  useEffect(() => {
    if (!availTabs.some(t => t.id === tab) && availTabs.length > 0) setTab(availTabs[0].id);
  }, [bookId, chapterId]);

  // ── Book handlers ─────────────────────────────────────────────────────────
  const selectBook = (id) => {
    setBookId(id);
    setChapterId(null);
    // Only change tab if not already in world builder
    if (tab !== 'worldbuilder') setTab('worldbuilder');
  };

  const selectChapter = (id) => {
    setChapterId(id);
    if (tab !== 'worldbuilder') setTab('story');
  };

  const addBook = async () => {
    const b = await api.createBook('Untitled Book');
    setBooks(prev => [...prev, b]);
    setBookId(b.id); setChapterId(null); setTab('worldbuilder');
  };

  const requestDeleteBook = (id) => {
    const b = books.find(x => x.id === id);
    if (!b) return;
    setConfirm({ type: 'book', id, name: b.title });
  };

  const deleteBook = (id) => {
    const b = books.find(x => x.id === id);
    if (!b) return;
    const wasSelected = bookId === id;
    const savedChapters = wasSelected ? [...chapters] : [];

    // Optimistic remove
    setBooks(prev => prev.filter(x => x.id !== id));
    if (wasSelected) { setBookId(null); setChapterId(null); }

    startUndo(
      'book', b.title,
      // Restore
      () => {
        setBooks(prev => {
          if (prev.some(x => x.id === id)) return prev;
          const inserted = [...prev, b].sort((a, z) => a.order_index - z.order_index);
          return inserted;
        });
        if (wasSelected) {
          setBookId(id);
          setChapters(savedChapters);
          if (savedChapters.length > 0) setChapterId(savedChapters[0].id);
        }
      },
      // Commit delete
      () => api.deleteBook(id)
    );
  };

  const saveBook = useCallback(async (data) => {
    if (!bookId) return;
    setSaveStatus('saving');
    const updated = await api.updateBook(bookId, data);
    setBooks(prev => prev.map(b => b.id === bookId ? updated : b));
    setSaveStatus('saved');
  }, [bookId]);

  const reorderBooks = async (newArr) => {
    setBooks(newArr);
    newArr.forEach((b, i) => api.updateBook(b.id, { order_index: i }));
  };

  // ── Chapter handlers ──────────────────────────────────────────────────────

  const addChapter = async () => {
    if (!bookId) return;
    const ch = await api.createChapter(bookId); // server auto-names "Chapter N"
    setChapters(prev => [...prev, ch]);
    setChapterId(ch.id); setTab('story');
  };

  const requestDeleteChapter = (id) => {
    const ch = chapters.find(x => x.id === id);
    if (!ch) return;
    setConfirm({ type: 'chapter', id, name: ch.title });
  };

  const deleteChapter = (id) => {
    const ch = chapters.find(x => x.id === id);
    if (!ch) return;
    const wasSelected = chapterId === id;

    // Optimistic remove
    setChapters(prev => prev.filter(x => x.id !== id));
    if (wasSelected) setChapterId(null);

    startUndo(
      'chapter', ch.title,
      // Restore
      () => {
        setChapters(prev => {
          if (prev.some(x => x.id === id)) return prev;
          return [...prev, ch].sort((a, z) => a.order_index - z.order_index);
        });
        if (wasSelected) setChapterId(id);
      },
      // Commit delete
      () => api.deleteChapter(id)
    );
  };

  const saveChapter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateChapter(id, data);
    setChapters(prev => prev.map(c => c.id === id ? updated : c));
    setSaveStatus('saved');
    // Track words added for time-based goals
    if (typeof data.content === 'string') {
      const newCount = countWords(data.content);
      const oldCount = lastWordCounts.current[id] ?? newCount;
      const delta    = newCount - oldCount;
      if (delta > 0) trackWords(delta);
      lastWordCounts.current[id] = newCount;
    }
  }, [trackWords]);

  const reorderChapters = async (bId, newArr) => {
    setChapters(newArr);
    newArr.forEach((c, i) => api.updateChapter(c.id, { order_index: i }));
  };

  // ── Character handlers ────────────────────────────────────────────────────
  const addCharacter = async (chapterIds = []) => {
    if (!bookId) return;
    const c = await api.createCharacter(bookId, 'New Character', chapterIds);
    const fresh = await api.getCharacters(bookId);
    setCharacters(fresh.map(parseChar));
  };

  const updateCharacter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    await api.updateCharacter(id, data);
    const fresh = await api.getCharacters(bookId);
    setCharacters(fresh.map(parseChar));
    setSaveStatus('saved');
  }, [bookId]);

  const deleteCharacter = async (id) => {
    await api.deleteCharacter(id);
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // ── Item handlers ─────────────────────────────────────────────────────────
  const addItem = async (name, category, chapterIds = []) => {
    if (!bookId) return;
    const item = await api.createItem(bookId, name, category, chapterIds);
    setItems(prev => [...prev, parseItem(item)]);
  };

  const updateItem = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateItem(id, data);
    setItems(prev => prev.map(i => i.id === id ? parseItem(updated) : i));
    setSaveStatus('saved');
    return updated;
  }, []);

  const deleteItem = async (id) => {
    await api.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const appClass = ['app', focusMode && !dfMode ? 'focus-active' : '', dfMode ? 'df-mode' : ''].filter(Boolean).join(' ');

  return (
    <IconCtx.Provider value={iconStyle}>
    <div className={appClass}>
      <Sidebar
        books={books} selectedBookId={bookId}
        onSelectBook={selectBook} onAddBook={addBook} onDeleteBook={requestDeleteBook}
        chapters={chapters} selectedChapterId={chapterId}
        onSelectChapter={selectChapter} onAddChapter={addChapter} onDeleteChapter={requestDeleteChapter}
        onReorderBooks={reorderBooks} onReorderChapters={reorderChapters}
      />

      <div className="main">
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
              <button className="topbar-btn" onClick={() => setShowExport(true)}>↓ Export</button>
            )}
            <button className="topbar-btn" onClick={() => { setShowGoals(g => !g); setShowSettings(false); }}>◎ Goals</button>
            <button className="topbar-btn" onClick={() => { setShowSettings(s => !s); setShowGoals(false); }}>⚙ Settings</button>
          </div>
        )}

        <div className="content">
          {dfMode && (
            <button className="df-exit" onClick={() => setDfMode(false)}>esc · exit focus</button>
          )}

          {tab === 'story' && chapter ? (
            <StoryEditor
              key={chapter.id}
              bookId={bookId}
              chapter={chapter}
              onSave={saveChapter}
              onFocusChange={setFocusMode}
              distractionFree={dfMode}
              onToggleDistractionFree={() => setDfMode(d => !d)}
              setSaveStatus={setSaveStatus}
            />
          ) : tab === 'worldbuilder' && book ? (
            <WorldBuilder
              key={book.id}
              book={book}
              chapter={chapter}
              chapters={chapters}
              characters={characters}
              items={items}
              onSaveBook={saveBook}
              onSaveChapter={saveChapter}
              onAddCharacter={addCharacter}
              onUpdateCharacter={updateCharacter}
              onDeleteCharacter={deleteCharacter}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              setSaveStatus={setSaveStatus}
            />
          ) : (
            <div className="empty">
              <div className="empty-glyph">✦</div>
              <p>Select a book to begin your story</p>
              <small>or create one from the sidebar</small>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <Settings
          theme={theme} font={font} accent={accent} scale={scale} iconStyle={iconStyle}
          onTheme={setTheme} onFont={setFont} onAccent={setAccent} onScale={setScale} onIconStyle={setIconStyle}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showGoals && (
        <Goals
          book={book}
          chapter={chapter}
          chapters={chapters}
          onSaveBook={saveBook}
          onSaveChapter={saveChapter}
          progress={wpData}
          onSetTimeGoal={setTimeGoal}
          onClose={() => setShowGoals(false)}
        />
      )}
      {showExport && book && (
        <Export
          book={book} chapters={chapters} characters={characters} items={items}
          onClose={() => setShowExport(false)}
        />
      )}
      {/* Confirm delete modal */}
      {confirm && (
        <ConfirmModal
          type={confirm.type}
          name={confirm.name}
          onConfirm={() => {
            const id = confirm.id;
            const type = confirm.type;
            setConfirm(null);
            if (type === 'book')    deleteBook(id);
            else                    deleteChapter(id);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Undo toast */}
      {undoItem && (
        <div className="undo-toast">
          <span className="undo-toast-msg">
            {undoItem.type === 'book' ? '📖' : '§'} <strong>"{undoItem.name}"</strong> deleted
          </span>
          <span className="undo-toast-countdown">{undoItem.timeLeft}s</span>
          <button className="undo-toast-btn" onClick={handleUndo}>Undo</button>
          <button className="undo-toast-dismiss" onClick={dismissUndo} title="Dismiss">×</button>
        </div>
      )}
    </div>
    </IconCtx.Provider>
  );
}
