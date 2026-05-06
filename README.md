# ✦ BookSmith

> A minimal, self-hosted book authoring app with a glassmorphism UI. Write your story, build your world, export your manuscript.

BookSmith is a distraction-free writing tool you can run on your own server or home lab. Everything lives in one place — prose, world-building, characters, lore — and gets out of your way when you write.

---

## Features

### Writing
- **Story editor** — full-screen prose editor with 1.9× line height and your choice of 8 typefaces
- **Focus mode** — sidebar and chrome blur and dim when you type; one click to restore
- **Distraction-free mode** — hides everything but the page; press `ESC` or the button to exit
- **Pages view** — paginated A4-sized sheets at 250 words/page with Prev/Next navigation
- **Auto-save** — debounced save after every keystroke; "Saving… / Saved" indicator in the tab bar
- **Live stats** — word count, character count, and page estimate always visible in the footer
- **Chapter auto-naming** — new chapters are named "Chapter 1", "Chapter 2"… automatically; rename any time

### World Builder
A unified world-building panel with a two-column nav, split into three groups:

**Story Bible**
- Book Overview — title and high-level story arc
- Chapter Notes — per-chapter beat sheet / director's notes (updates per selected chapter)

**World**
- Characters — cards with name, role, description, and bidirectional relationship mapping
- History & Lore
- Locations
- Factions
- Creatures

**Items**
- Key Items, Weapons, Artifacts, Other

Every character and item card can be linked to specific chapters, and filtered to "This Chapter Only" when a chapter is selected. Creating an entry with the chapter filter active auto-links it to that chapter.

### Sidebar
- Collapse toggle per book to show/hide chapters
- Drag-and-drop reordering — books reorder globally; chapters reorder within their own book only
- ⚙ Settings and ↓ Export buttons in the tab bar, always accessible

### Export
Selective export — choose exactly what to include before generating:
- **Document** (`.docx`) — full manuscript: title page → chapters → Appendix A: Dramatis Personae → Appendix B: Bestiary & World Items. Opens in Word, LibreOffice, Pages.
- **Markdown** (`.md`) — structured with headings; works with Obsidian, Notion, iA Writer
- **Plain Text** (`.txt`) — universal, formatting stripped
- **JSON** (`.json`) — full data dump for backup or re-import

Export sections mirror the World Builder layout: Story Bible, Chapters (with chapter notes toggle), World (Characters + world categories), Items.

### Customisation (persists across sessions)
- **Theme** — Dark or Light (warm parchment)
- **Accent colour** — Gold, Sage, Dusk, Rose, Slate, Ember — body text tints to match in both themes
- **Icon style** — Classic (Unicode), Minimal (thin), Wireframe (default), Bold (thick)
- **Text style** — 8 typefaces: Crimson Pro, EB Garamond, Lora, Merriweather, Source Serif 4, Georgia, Palatino, Inter
- **UI scale** — XS (85%) · S (92%) · M (100%) · L (110%) · XL (120%)

---

## Quick Start

### Docker (recommended for home lab / Portainer / Dockhand)

```bash
git clone https://github.com/artech7/booksmith.git
cd booksmith
docker compose up -d
```

Open **http://localhost:3777**

Data is stored in a named Docker volume (`booksmith_data`) and survives container restarts and image rebuilds.

### Local (Node.js)

Requires **Node.js v22 or later** (uses the built-in `node:sqlite` module — no native compilation).

```bash
git clone https://github.com/artech7/booksmith.git
cd booksmith

cd frontend && npm install && npm run build && cd ..
cp -r frontend/dist backend/public
cd backend && npm install && node server.js
```

Open **http://localhost:3000** — data saved to `backend/data/booksmith.db`.

### Using the update script

After cloning once, every future update is one command:

```bash
# Copy new files into the repo folder, then:
./update.sh "describe what changed"
```

The script rebuilds the frontend, wires it into the backend, commits, and pushes to GitHub, then launches the server.

---

## Updating

**Local:**
```bash
git pull
./update.sh "update"
```

**Docker:**
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

The `docker-compose.yml` maps host port **3777 → container 3000**. Change the left-hand side to use a different port on your host.

---

## Tech Stack

| Layer     | Technology                                              |
|-----------|---------------------------------------------------------|
| Frontend  | React 18 + Vite 5                                       |
| Backend   | Node.js 22 + Express 4                                  |
| Database  | SQLite via built-in `node:sqlite` (no native addons)    |
| Fonts     | Google Fonts — Crimson Pro, EB Garamond, Lora, Merriweather, Source Serif 4, Inter |
| DOCX      | `docx` npm package, server-side rendering               |
| Icons     | Hand-crafted inline SVG, 4 style variants               |
| Container | Docker multi-stage build — single image, single volume  |

---

## Project Structure

```
booksmith/
├── update.sh                  # One-command build + push + launch
├── docker-compose.yml
├── Dockerfile
├── backend/
│   ├── server.js              # Express API + SQLite
│   ├── docxExport.js          # DOCX manuscript generator
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx            # Root — state, tabs, preferences
        ├── api.js             # API client
        ├── Icons.jsx          # SVG icon system (4 styles)
        ├── index.css          # Design system — single file, no duplicates
        ├── hooks/
        │   └── useDebounce.js
        └── components/
            ├── Sidebar.jsx        # Library nav with collapse + drag-drop
            ├── StoryEditor.jsx    # Prose editor with focus/pages mode
            ├── WorldBuilder.jsx   # Unified world-building panel
            ├── Settings.jsx       # Theme, scale, accent, icons, font
            └── Export.jsx         # Selective export modal
```

---

## Roadmap

- [ ] Word count goals per chapter with progress bar
- [ ] Character portrait / image upload
- [ ] Timeline view across chapters
- [ ] PDF export
- [ ] Scene / tag system within chapters
- [ ] Dark/light theme auto-detect from OS preference
- [ ] Import from `.docx` or `.md`

Contributions and issues welcome.

---

## License

MIT — do whatever you like with it.
