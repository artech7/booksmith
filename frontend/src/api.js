const BASE = '/api';

const json = (r) => r.json();

const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

const put = (url, body) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

const del = (url) => fetch(url, { method: 'DELETE' }).then(json);

export const api = {
  // Books
  getBooks:     ()         => fetch(`${BASE}/books`).then(json),
  createBook:   (title)    => post(`${BASE}/books`, { title }),
  updateBook:   (id, data) => put(`${BASE}/books/${id}`, data),
  deleteBook:   (id)       => del(`${BASE}/books/${id}`),

  // Chapters
  getChapters:    (bookId)       => fetch(`${BASE}/books/${bookId}/chapters`).then(json),
  createChapter:  (bookId, title) => post(`${BASE}/books/${bookId}/chapters`, { title }),
  updateChapter:  (id, data)      => put(`${BASE}/chapters/${id}`, data),
  deleteChapter:  (id)            => del(`${BASE}/chapters/${id}`),

  // Characters
  getCharacters:   (bookId)      => fetch(`${BASE}/books/${bookId}/characters`).then(json),
  createCharacter: (bookId, name) => post(`${BASE}/books/${bookId}/characters`, { name }),
  updateCharacter: (id, data)     => put(`${BASE}/characters/${id}`, data),
  deleteCharacter: (id)           => del(`${BASE}/characters/${id}`),

  // Items
  getItems:   (bookId)               => fetch(`${BASE}/books/${bookId}/items`).then(json),
  createItem: (bookId, name, cat)    => post(`${BASE}/books/${bookId}/items`, { name, category: cat }),
  updateItem: (id, data)             => put(`${BASE}/items/${id}`, data),
  deleteItem: (id)                   => del(`${BASE}/items/${id}`),
};
