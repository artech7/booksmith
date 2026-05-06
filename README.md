# ✦ BookSmith

> A minimal, self-hosted book authoring app with a glassmorphism UI. Write your story, build your world, export your manuscript.

BookSmith is a distraction-free writing tool you can run on your own server or home lab. Everything lives in one place — prose, world-building, characters, lore, writing goals — and gets out of your way when you write.

---

## Features

### Writing
- **Story editor** — full-screen prose editor with auto-save, your choice of 8 typefaces
- **Auto-increment chapters** — new chapters named "Chapter 1", "Chapter 2"… automatically; rename any time
- **Focus mode** — sidebar and chrome blur and dim when you start typing; button lives inline with the Edit/Pages toggle
- **Distraction-free mode** — hides everything but the page; press `ESC` or the Focus button to exit
- **Pages view** — paginated A4-sized sheets at 250 words/page with Prev/Next navigation
- **Live stats** — word count, character count, and page estimate always in the footer

### Writing Goals
Click the stats line in the editor footer, or open **◎ Goals** in the tab bar.

**Chapter goals** — target by word count or page count; a 2px accent-colored bar fills the bottom edge of the footer as you write

**Book goals** — total word count across all chapters, or chapter completion count (chapters with content)

**Time-based goals** — all tracked as words *added* (deletions never count against you):
- **Session** — resets each time the app opens
- **Daily** — resets at midnight
- **Weekly** — resets Monday
- **Monthly** — resets on the 1st

All goals show a compact progress bar and a quiet `✦` when reached. Set any target by clicking its number inline — no modals.

### Sidebar
- Collapse toggle per book — show or hide its chapters
- Drag-and-drop reordering — books reorder globally; chapters stay within their own book and cannot cross into another
- Clicking a book or chapter while in World Builder stays in World Builder (chapter/book context updates silently)

### World Builder
A unified two-column panel with a persistent left nav:

**Story Bible**
- *Book Overview* — book title and high-level story arc
- *Chapter Notes* — per-chapter beat sheet (syncs when you select a different chapter)

**World**
- *Characters* — cards with name, role, description, and bidirectional relationship mapping
- *History & Lore*
- *Locations*
- *Factions*
- *Creatures*

**Items**
- *Key Items · Weapons · Artifacts · Other*

Every character and item card can be linked to specific chapters. A **This Chapter / All** filter shows only entries tagged to the current chapter. Creating an entry while the chapter filter is active auto-links it to that chapter.

### Export
Open **↓ Export** from the tab bar. The export menu mirrors the World Builder layout exactly — Story Bible, Chapters, World, Items — with per-section "Select all" toggles and custom checkboxes styled to your accent color.

| Format | Description |
|--------|-------------|
| `.docx` | Full manuscript — title page, chapters, appendices. Opens in Word, LibreOffice, Pages. |
| `.md` | Structured Markdown — works with Obsidian, Notion, iA Writer |
| `.txt` | Plain text, universal |
| `.json` | Full data backup |

### Customisation (all settings persist across sessions)
- **Theme** — Dark or Light (warm parchment)
- **Accent colour** — Gold · Sage · Dusk · Rose · Slate · Ember
- **Icon style** — Classic (Unicode) · Minimal (thin) · Wireframe (default) · Bold (thick)
- **Text style** — 8 typefaces: Crimson Pro, EB Garamond, Lora, Merriweather, Source Serif 4, Georgia, Palatino, Inter
- **UI scale** — XS (85%) · S (92%) · M (100%) · L (110%) · XL (120%)

---

## Quick Start

### Docker (recommended for home lab / Portainer)

```bash
git clone https://github.com/artech7/booksmith.git
cd booksmith
docker compose up -d
```

Open **http://localhost:3777**

Data is stored in a named Docker volume (`booksmith_data`) and survives restarts and rebuilds.

### Local (Node.js)

Requires **Node.js v22 or later** (uses the built-in `node:sqlite` — no native compilation needed).

```bash
git clone https://github.com/artech7/booksmith.git
cd booksmith
./update.sh "first run"
```

Open **http://localhost:3000** — data saved to `backend/data/booksmith.db`.

---

## Getting Updates

```bash
# 1. Download and unzip — you get a booksmith/ folder
# 2. Copy new files into your repo:
cp -r ~/Downloads/booksmith/* /Users/yourusername/Documents/booksmith/

# 3. Build, commit, and launch:
cd /Users/yourusername/Documents/booksmith
./update.sh "describe what changed"
```

The script rebuilds the frontend, shows you what changed, commits and pushes to GitHub, then launches at http://localhost:3000.

If the push fails it will tell you exactly why and show the command to fix it.

### One-time credential setup

```bash
git config --global credential.helper osxkeychain
```

Run once, then push manually once to cache your token — future pushes are automatic.

### Docker update

```bash
git pull
docker compose up -d --build
```

---

## Configuration

| Variable   | Default | Description                       |
|------------|---------|-----------------------------------|
| `PORT`     | `3000`  | Internal server port              |
| `DATA_DIR` | `/data` | Directory for the SQLite database |

`docker-compose.yml` maps host port **3777 → container 3000**. Change the left number to use a different host port.

---

## Tech Stack

| Layer      | Technology                                                |
|------------|-----------------------------------------------------------|
| Frontend   | React 18 + Vite 5                                         |
| Backend    | Node.js 22 + Express 4                                    |
| Database   | SQLite via built-in `node:sqlite` (no native addons)      |
| Fonts      | Google Fonts — Crimson Pro, EB Garamond, Lora, Merriweather, Source Serif 4, Inter |
| DOCX       | `docx` npm package, server-side                           |
| Icons      | Hand-crafted SVG, 4 style variants via React context      |
| Container  | Docker multi-stage build, single image, single volume     |

---

## Project Structure

```
booksmith/
├── update.sh                       # Build + commit + push + launch
├── docker-compose.yml
├── Dockerfile
├── backend/
│   ├── server.js                   # Express REST API + SQLite
│   ├── docxExport.js               # DOCX manuscript generator
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx                 # Root — state, tabs, prefs, word delta tracking
        ├── api.js
        ├── Icons.jsx               # SVG icon system, 4 styles, React context
        ├── index.css               # Design system — one file, no duplicates
        ├── hooks/
        │   ├── useDebounce.js
        │   └── useWritingProgress.js   # Session/daily/weekly/monthly tracking
        └── components/
            ├── Sidebar.jsx         # Library nav — collapse + drag-drop reorder
            ├── StoryEditor.jsx     # Prose editor — focus, pages, chapter goals
            ├── WorldBuilder.jsx    # Unified world-building panel
            ├── Goals.jsx           # All goal types — chapter, book, time-based
            ├── Settings.jsx        # Theme, scale, accent, icons, font
            └── Export.jsx          # Selective export modal
```

---

## Roadmap

- [ ] Character portrait / image upload
- [ ] Timeline view across chapters
- [ ] PDF export
- [ ] Scene / tag system within chapters
- [ ] Import from `.docx` or `.md`
- [ ] OS-level dark/light theme detection
- [ ] Collaborative editing

---

## License

MIT — do whatever you like with it.
