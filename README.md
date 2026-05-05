# ✦ BookSmith

> A minimal, self-hosted book authoring app with a glassmorphism UI. Write your story, build your world, export your manuscript.

BookSmith is a clean, distraction-free writing tool you can run on your own server or home lab. It keeps everything — chapters, characters, world items, plot notes — in one place, and gets out of the way when you write.

---

## Features

**Writing**
- Notion-style sidebar with multi-book library and per-book chapter list
- Full-screen story editor with auto-save (debounced, no interruptions)
- Focus mode — sidebar and chrome blur/dim when you start typing
- Distraction-free mode — hides everything but your words (ESC to exit)
- Pages view — flip through your chapter paginated at 250 words/page
- Live word count, character count, and page estimate in the footer

**Planning**
- Book Plot — high-level story overview and arc notes
- Chapter Plot — per-chapter beat sheet / director's notes, separate from prose
- Characters — cards with name, role, description, and relationship mapping (bidirectional auto-linking)
- World Items — categorised compendium: Key Items, Weapons & Armaments, Artifacts & Relics, Locations & Places, Factions & Groups, Creatures & Beasts

**Export**
- `.docx` — full manuscript document (title page, chapters, Appendix A: Dramatis Personae, Appendix B: Bestiary), opens in Word and LibreOffice
- `.md` — structured Markdown, works with Obsidian, Notion, iA Writer
- `.txt` — plain text, universal
- `.json` — raw data export for backup or reimport
- Selective export — choose exactly which chapters, characters, and item categories to include

**Customisation**
- Dark and Light (parchment) themes
- 6 accent colour palettes — Gold, Sage, Dusk, Rose, Slate, Ember — with matching body text tints
- 8 typefaces — Crimson Pro, EB Garamond, Lora, Merriweather, Source Serif 4, Georgia, Palatino, Inter
- All preferences persist across sessions

**Infrastructure**
- Single-container Docker setup — one `docker-compose.yml` for Portainer or Dockhand
- SQLite database — one file, no external services required
- Built-in `node:sqlite` — no native addon compilation, works on Node 22+

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/booksmith.git
cd booksmith
docker compose up -d
```

Open **http://localhost:3777**

Data is stored in a named Docker volume (`booksmith_data`) and persists across restarts and updates.

### Local (Node.js)

Requires Node.js v22 or later.

```bash
git clone https://github.com/YOUR_USERNAME/booksmith.git
cd booksmith

# Build the frontend
cd frontend && npm install && npm run build && cd ..

# Copy build into backend
cp -r frontend/dist backend/public

# Install backend dependencies and start
cd backend && npm install && node server.js
```

Open **http://localhost:3000**

Your data is saved to `backend/data/booksmith.db`.

---

## Updating

```bash
git pull

cd frontend && npm install && npm run build && cd ..
cp -r frontend/dist backend/public
cd backend && npm install && node server.js
```

For Docker:

```bash
git pull
docker compose up -d --build
```

---

## Configuration

| Variable   | Default  | Description                        |
|------------|----------|------------------------------------|
| `PORT`     | `3000`   | Internal server port               |
| `DATA_DIR` | `/data`  | Directory for the SQLite database  |

The `docker-compose.yml` maps host port **3777 → container 3000**. Change the left side to use a different port.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite                     |
| Backend   | Node.js + Express                   |
| Database  | SQLite via built-in `node:sqlite`   |
| Fonts     | Google Fonts (Crimson Pro, Lora, EB Garamond, Merriweather, Source Serif 4, Inter) |
| Export    | `docx` npm package (server-side)    |
| Container | Docker + Compose (single image, multi-stage build) |

---

## Project Structure

```
booksmith/
├── docker-compose.yml
├── Dockerfile
├── .gitignore
├── backend/
│   ├── server.js          # Express API + SQLite
│   ├── docxExport.js      # DOCX manuscript generator
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── api.js
        ├── index.css
        ├── hooks/
        │   └── useDebounce.js
        └── components/
            ├── Sidebar.jsx
            ├── StoryEditor.jsx
            ├── BookPlot.jsx
            ├── ChapterPlot.jsx
            ├── Characters.jsx
            ├── Items.jsx
            ├── Settings.jsx
            └── Export.jsx
```

---

## Roadmap

- [ ] Drag-to-reorder chapters
- [ ] Per-chapter and total book word count goals / progress bars
- [ ] Scene/tag system within chapters
- [ ] Character portrait image upload
- [ ] PDF export
- [ ] Timeline view
- [ ] Dark/light theme auto-detect from OS preference

Contributions and issues welcome.

---

## License

MIT — do whatever you like with it.
