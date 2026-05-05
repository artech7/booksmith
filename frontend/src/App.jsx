import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import StoryEditor from './components/StoryEditor.jsx';
import BookPlot from './components/BookPlot.jsx';
import ChapterPlot from './components/ChapterPlot.jsx';
import Characters from './components/Characters.jsx';
import Items from './components/Items.jsx';
import Settings from './components/Settings.jsx';
import Export from './components/Export.jsx';

const parseRels = (c) => ({
  ...c,
  relationships: typeof c.relationships === 'string'
    ? JSON.parse(c.relationships || '[]')
    : (c.relationships ?? []),
});

const TABS = [
  { id: 'story',       label: 'Story',       needs: 'chapter' },
  { id: 'chapterPlot', label: 'Chapter Plot', needs: 'chapter' },
  { id: 'bookPlot',    label: 'Book Plot',    needs: 'book'    },
  { id: 'characters',  label: 'Characters',   needs: 'book'    },
  { id: 'items',       label: 'Items',        needs: 'book'    },
];

const PREFS_KEY = 'booksmith_prefs';
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; } }
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

export default function App() {
  const [books,             setBooks]             = useState([]);
  const [selectedBookId,    setSelectedBookId]    = useState(null);
  const [chapters,          setChapters]          = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [characters,        setCharacters]        = useState([]);
  const [items,             setItems]             = useState([]);
  const [activeTab,         setActiveTab]         = useState('story');
  const [focusMode,         setFocusMode]         = useState(false);
  const [distractionFree,   setDistractionFree]   = useState(false);
  const [saveStatus,        setSaveStatus]        = useState('saved');
  const [showSettings,      setShowSettings]      = useState(false);
  const [showExport,        setShowExport]        = useState(false);

  const prefs = loadPrefs();
  const [theme,  setThemeState]  = useState(prefs.theme  || 'dark');
  const [font,   setFontState]   = useState(prefs.font   || 'crimson');
  const [accent, setAccentState] = useState(prefs.accent || 'gold');
  const [scale,  setScaleState]  = useState(prefs.scale  || 1.00);

  useEffect(() => {
    document.body.className = `theme-${theme} font-${font} accent-${accent}`;
  }, [theme, font, accent]);

  // Apply zoom scale to the root element
  useEffect(() => {
    document.getElementById('root').style.zoom = scale;
  }, [scale]);

  const setTheme  = (t) => { setThemeState(t);  savePrefs({ ...loadPrefs(), theme:  t }); };
  const setFont   = (f) => { setFontState(f);   savePrefs({ ...loadPrefs(), font:   f }); };
  const setAccent = (a) => { setAccentState(a); savePrefs({ ...loadPrefs(), accent: a }); };
  const setScale  = (s) => { setScaleState(s);  savePrefs({ ...loadPrefs(), scale:  s }); };

  const selectedBook    = books.find(b => b.id === selectedBookId) ?? null;
  const selectedChapter = chapters.find(c => c.id === selectedChapterId) ?? null;

  const availableTabs = TABS.filter(t =>
    (t.needs === 'chapter' && selectedChapter) ||
    (t.needs === 'book'    && selectedBook)
  );

  useEffect(() => { api.getBooks().then(setBooks); }, []);

  useEffect(() => {
    if (!selectedBookId) {
      setChapters([]); setCharacters([]); setItems([]); setSelectedChapterId(null);
      return;
    }
    Promise.all([
      api.getChapters(selectedBookId),
      api.getCharacters(selectedBookId),
      api.getItems(selectedBookId),
    ]).then(([chs, chars, its]) => {
      setChapters(chs);
      setCharacters(chars.map(parseRels));
      setItems(its);
      if (chs.length > 0) setSelectedChapterId(chs[0].id);
    });
  }, [selectedBookId]);

  useEffect(() => {
    const valid = availableTabs.some(t => t.id === activeTab);
    if (!valid && availableTabs.length > 0) setActiveTab(availableTabs[0].id);
  }, [selectedBookId, selectedChapterId]);

  // ── Books ────────────────────────────────────────────────────────────────
  const handleSelectBook = (id) => { setSelectedBookId(id); setSelectedChapterId(null); setActiveTab('story'); };

  const handleAddBook = async () => {
    const book = await api.createBook('Untitled Book');
    setBooks(prev => [book, ...prev]);
    setSelectedBookId(book.id);
    setSelectedChapterId(null);
    setActiveTab('bookPlot');
  };

  const handleDeleteBook = async (id) => {
    await api.deleteBook(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    if (selectedBookId === id) { setSelectedBookId(null); setSelectedChapterId(null); }
  };

  const handleSaveBook = useCallback(async (data) => {
    if (!selectedBookId) return;
    setSaveStatus('saving');
    const updated = await api.updateBook(selectedBookId, data);
    setBooks(prev => prev.map(b => b.id === selectedBookId ? updated : b));
    setSaveStatus('saved');
  }, [selectedBookId]);

  // ── Chapters ─────────────────────────────────────────────────────────────
  const handleSelectChapter = (id) => { setSelectedChapterId(id); setActiveTab('story'); };

  const handleAddChapter = async () => {
    if (!selectedBookId) return;
    const ch = await api.createChapter(selectedBookId, 'New Chapter');
    setChapters(prev => [...prev, ch]);
    setSelectedChapterId(ch.id);
    setActiveTab('story');
  };

  const handleDeleteChapter = async (id) => {
    await api.deleteChapter(id);
    setChapters(prev => prev.filter(c => c.id !== id));
    if (selectedChapterId === id) setSelectedChapterId(null);
  };

  const handleSaveChapter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateChapter(id, data);
    setChapters(prev => prev.map(c => c.id === id ? updated : c));
    setSaveStatus('saved');
  }, []);

  // ── Characters ───────────────────────────────────────────────────────────
  const handleAddCharacter = async () => {
    if (!selectedBookId) return;
    const char = await api.createCharacter(selectedBookId, 'New Character');
    setCharacters(prev => [...prev, parseRels(char)]);
  };

  const handleUpdateCharacter = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateCharacter(id, data);
    // Refresh all characters so bidirectional links reflect immediately
    const fresh = await api.getCharacters(selectedBookId);
    setCharacters(fresh.map(parseRels));
    setSaveStatus('saved');
    return updated;
  }, [selectedBookId]);

  const handleDeleteCharacter = async (id) => {
    await api.deleteCharacter(id);
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // ── Items ─────────────────────────────────────────────────────────────────
  const handleAddItem = async (name, category) => {
    if (!selectedBookId) return;
    const item = await api.createItem(selectedBookId, name, category);
    setItems(prev => [...prev, item]);
  };

  const handleUpdateItem = useCallback(async (id, data) => {
    setSaveStatus('saving');
    const updated = await api.updateItem(id, data);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    setSaveStatus('saved');
    return updated;
  }, []);

  const handleDeleteItem = async (id) => {
    await api.deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const appClass = ['app', focusMode ? 'focus-mode' : '', distractionFree ? 'distraction-free' : ''].join(' ').trim();

  return (
    <div className={appClass}>
      <Sidebar
        books={books}
        selectedBookId={selectedBookId}
        onSelectBook={handleSelectBook}
        onAddBook={handleAddBook}
        onDeleteBook={handleDeleteBook}
        chapters={chapters}
        selectedChapterId={selectedChapterId}
        onSelectChapter={handleSelectChapter}
        onAddChapter={handleAddChapter}
        onDeleteChapter={handleDeleteChapter}
      />

      {showSettings && (
        <Settings
          theme={theme} font={font} accent={accent} scale={scale}
          onTheme={setTheme} onFont={setFont} onAccent={setAccent} onScale={setScale}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showExport && selectedBook && (
        <Export
          book={selectedBook}
          chapters={chapters}
          characters={characters}
          items={items}
          onClose={() => setShowExport(false)}
        />
      )}

      <main className="main-panel">
        {!distractionFree && (
          <div className="tab-bar">
            {availableTabs.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >{t.label}</button>
            ))}
            <div className="tab-spacer" />
            <span className={`save-badge ${saveStatus}`}>
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
            {selectedBook && (
              <button
                className="tab-bar-icon-btn"
                onClick={() => setShowExport(true)}
                title="Export book"
              >↓ Export</button>
            )}
            <button
              className="tab-bar-icon-btn"
              onClick={() => setShowSettings(s => !s)}
              title="Settings"
            >⚙ Settings</button>
          </div>
        )}

        <div className="tab-content">
          {distractionFree && (
            <button className="df-exit" onClick={() => setDistractionFree(false)}>esc · exit focus</button>
          )}

          {activeTab === 'story' && selectedChapter ? (
            <StoryEditor
              key={selectedChapter.id}
              chapter={selectedChapter}
              onSave={handleSaveChapter}
              onFocusChange={setFocusMode}
              distractionFree={distractionFree}
              onToggleDistractionFree={() => setDistractionFree(d => !d)}
              setSaveStatus={setSaveStatus}
            />
          ) : activeTab === 'bookPlot' && selectedBook ? (
            <BookPlot key={selectedBook.id} book={selectedBook} onSave={handleSaveBook} setSaveStatus={setSaveStatus} />
          ) : activeTab === 'chapterPlot' && selectedChapter ? (
            <ChapterPlot key={selectedChapter.id} chapter={selectedChapter} onSave={handleSaveChapter} setSaveStatus={setSaveStatus} />
          ) : activeTab === 'characters' && selectedBook ? (
            <Characters
              characters={characters}
              onAdd={handleAddCharacter}
              onUpdate={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
              setSaveStatus={setSaveStatus}
            />
          ) : activeTab === 'items' && selectedBook ? (
            <Items
              items={items}
              characters={characters}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              setSaveStatus={setSaveStatus}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-glyph">✦</div>
              <p>Select a book to begin your story</p>
              <small>or create one from the sidebar</small>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
