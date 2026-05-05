const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { DatabaseSync } = require('node:sqlite');
const { generateDocx }  = require('./docxExport.js');

const app      = express();
const PORT     = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'booksmith.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL DEFAULT 'Untitled Book',
    plot       TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id     INTEGER NOT NULL,
    title       TEXT    NOT NULL DEFAULT 'New Chapter',
    plot        TEXT    NOT NULL DEFAULT '',
    content     TEXT    NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS characters (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id       INTEGER NOT NULL,
    name          TEXT    NOT NULL DEFAULT 'New Character',
    role          TEXT    NOT NULL DEFAULT '',
    description   TEXT    NOT NULL DEFAULT '',
    relationships TEXT    NOT NULL DEFAULT '[]',
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id      INTEGER NOT NULL,
    name         TEXT    NOT NULL DEFAULT 'New Item',
    category     TEXT    NOT NULL DEFAULT 'key',
    description  TEXT    NOT NULL DEFAULT '',
    significance TEXT    NOT NULL DEFAULT '',
    associated   TEXT    NOT NULL DEFAULT '[]',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(allowed, body) {
  const out = {};
  for (const k of allowed) if (k in body) out[k] = body[k];
  return out;
}

// ── Books ─────────────────────────────────────────────────────────────────────

app.get('/api/books', (req, res) => {
  res.json(db.prepare('SELECT * FROM books ORDER BY created_at DESC').all());
});

app.post('/api/books', (req, res) => {
  const { title = 'Untitled Book' } = req.body;
  const r = db.prepare('INSERT INTO books (title) VALUES (?)').run(title);
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/books/:id', (req, res) => {
  const fields = pick(['title', 'plot'], req.body);
  if (Object.keys(fields).length) {
    const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE books SET ${sets}, updated_at = datetime('now') WHERE id = @id`)
      .run({ ...fields, id: Number(req.params.id) });
  }
  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(Number(req.params.id)));
});

app.delete('/api/books/:id', (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── Chapters ──────────────────────────────────────────────────────────────────

app.get('/api/books/:bookId/chapters', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index ASC, created_at ASC')
      .all(Number(req.params.bookId))
  );
});

app.post('/api/books/:bookId/chapters', (req, res) => {
  const { title = 'New Chapter' } = req.body;
  const bookId = Number(req.params.bookId);
  const row    = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM chapters WHERE book_id = ?').get(bookId);
  const r      = db.prepare('INSERT INTO chapters (book_id, title, order_index) VALUES (?, ?, ?)').run(bookId, title, row.m + 1);
  res.json(db.prepare('SELECT * FROM chapters WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/chapters/:id', (req, res) => {
  const id     = Number(req.params.id);
  const fields = pick(['title', 'plot', 'content'], req.body);
  if (Object.keys(fields).length) {
    const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE chapters SET ${sets}, updated_at = datetime('now') WHERE id = @id`).run({ ...fields, id });
  }
  res.json(db.prepare('SELECT * FROM chapters WHERE id = ?').get(id));
});

app.delete('/api/chapters/:id', (req, res) => {
  db.prepare('DELETE FROM chapters WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── Characters ────────────────────────────────────────────────────────────────

app.get('/api/books/:bookId/characters', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM characters WHERE book_id = ? ORDER BY created_at ASC')
      .all(Number(req.params.bookId))
  );
});

app.post('/api/books/:bookId/characters', (req, res) => {
  const { name = 'New Character' } = req.body;
  const r = db.prepare('INSERT INTO characters (book_id, name) VALUES (?, ?)').run(Number(req.params.bookId), name);
  res.json(db.prepare('SELECT * FROM characters WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/characters/:id', (req, res) => {
  const id  = Number(req.params.id);
  const raw = { ...req.body };
  if (Array.isArray(raw.relationships)) raw.relationships = JSON.stringify(raw.relationships);
  const fields = pick(['name', 'role', 'description', 'relationships'], raw);
  if (Object.keys(fields).length) {
    const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE characters SET ${sets} WHERE id = @id`).run({ ...fields, id });
  }
  res.json(db.prepare('SELECT * FROM characters WHERE id = ?').get(id));
});

app.delete('/api/characters/:id', (req, res) => {
  db.prepare('DELETE FROM characters WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── Items ─────────────────────────────────────────────────────────────────────

app.get('/api/books/:bookId/items', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM items WHERE book_id = ? ORDER BY category ASC, created_at ASC')
      .all(Number(req.params.bookId))
  );
});

app.post('/api/books/:bookId/items', (req, res) => {
  const { name = 'New Item', category = 'key' } = req.body;
  const r = db.prepare('INSERT INTO items (book_id, name, category) VALUES (?, ?, ?)').run(Number(req.params.bookId), name, category);
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(r.lastInsertRowid));
});

app.put('/api/items/:id', (req, res) => {
  const id  = Number(req.params.id);
  const raw = { ...req.body };
  if (Array.isArray(raw.associated)) raw.associated = JSON.stringify(raw.associated);
  const fields = pick(['name', 'category', 'description', 'significance', 'associated'], raw);
  if (Object.keys(fields).length) {
    const sets = Object.keys(fields).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE items SET ${sets} WHERE id = @id`).run({ ...fields, id });
  }
  res.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── DOCX Export ───────────────────────────────────────────────────────────────

app.post('/api/books/:bookId/export/docx', async (req, res) => {
  const bookId = Number(req.params.bookId);
  try {
    const book       = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    const chapters   = db.prepare('SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index ASC, created_at ASC').all(bookId);
    const characters = db.prepare('SELECT * FROM characters WHERE book_id = ? ORDER BY created_at ASC').all(bookId);
    const items      = db.prepare('SELECT * FROM items WHERE book_id = ? ORDER BY category ASC, created_at ASC').all(bookId);

    if (!book) return res.status(404).json({ error: 'Book not found' });

    const buffer = await generateDocx({
      book, chapters, characters, items,
      options: req.body || {},
    });

    const slug = (book.title || 'book').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${slug}.docx"`);
    res.send(buffer);
  } catch (err) {
    console.error('DOCX export error:', err);
    res.status(500).json({ error: 'Export failed', detail: err.message });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✦ BookSmith running → http://localhost:${PORT}`));
