// ── BookSmith Thesaurus + Dictionary ──────────────────────────────────────────
// Datamuse API  — synonyms, antonyms (free, no key, CORS-enabled)
// Free Dictionary API — definitions (free, no key, CORS-enabled)
//
// Both fall back gracefully if offline.

import { ALTERNATIVES } from './alternatives.js';

const synCache = new Map();
const defCache = new Map();

// ── Datamuse fetch ─────────────────────────────────────────────────────────────

async function datamuse(params) {
  const url = `https://api.datamuse.com/words?${new URLSearchParams({ ...params, md: 'pf', max: 25 })}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status}`);
  return res.json();
}

// ── Part-of-speech helpers ─────────────────────────────────────────────────────

const isAdv  = (w) => w.tags?.some(t => t === 'adv');
const isVerb = (w) => w.tags?.some(t => t === 'v');
const isAdj  = (w) => w.tags?.some(t => t === 'adj');

function grade(word, topScore) {
  const ratio = topScore > 0 ? word.score / topScore : 0;
  return ratio >= 0.7 ? 'strong' : ratio >= 0.3 ? 'good' : 'weaker';
}

// ── Synonyms + antonyms ────────────────────────────────────────────────────────

export async function getAlternatives(word) {
  const key = word.toLowerCase().trim();
  if (synCache.has(key)) return synCache.get(key);

  try {
    const [synData, mlData, antData] = await Promise.all([
      datamuse({ rel_syn: key }),
      datamuse({ ml: key }),
      datamuse({ rel_ant: key }),
    ]);

    // Synonyms — merge rel_syn + ml, deduplicate
    const seen   = new Set([key]);
    const merged = [];
    for (const w of [...synData, ...mlData]) {
      if (!seen.has(w.word)) { seen.add(w.word); merged.push(w); }
    }
    merged.sort((a, b) => b.score - a.score);
    const topScore = merged[0]?.score || 1;

    const swaps     = merged.filter(w => isAdv(w) || (!isVerb(w) && !isAdj(w))).slice(0, 10).map(w => ({ word: w.word, grade: grade(w, topScore) }));
    const verbs     = merged.filter(isVerb).slice(0, 8).map(w => ({ word: w.word, grade: grade(w, topScore) }));

    // Antonyms from rel_ant
    const antTop    = antData[0]?.score || 1;
    const antonyms  = antData.slice(0, 8).map(w => ({ word: w.word, grade: grade(w, antTop) }));

    const result = {
      swaps, verbs, antonyms,
      tip:    ALTERNATIVES[key]?.tip || null,
      source: 'datamuse',
    };

    synCache.set(key, result);
    return result;

  } catch (_) {
    // Offline fallback
    const local = ALTERNATIVES[key];
    if (local) {
      const result = {
        swaps:    (local.swap || []).map(w => ({ word: w, grade: 'good' })),
        verbs:    (local.verb || []).map(w => ({ word: w, grade: 'good' })),
        antonyms: [],
        tip:      local.tip || null,
        source:   'offline',
      };
      synCache.set(key, result);
      return result;
    }
    return null;
  }
}

// ── Dictionary definition ──────────────────────────────────────────────────────

export async function getDefinition(word) {
  const key = word.toLowerCase().trim();
  if (defCache.has(key)) return defCache.get(key);

  try {
    const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) { defCache.set(key, null); return null; }
    const data = await res.json();
    const entry = data[0];
    if (!entry) { defCache.set(key, null); return null; }

    // Collect all meanings
    const meanings = (entry.meanings || []).map(m => ({
      partOfSpeech: m.partOfSpeech,
      definitions:  (m.definitions || []).slice(0, 2).map(d => ({
        definition: d.definition,
        example:    d.example || null,
      })),
      synonyms: (m.synonyms || []).slice(0, 4),
      antonyms: (m.antonyms || []).slice(0, 4),
    }));

    const result = {
      word:     entry.word,
      phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || null,
      meanings: meanings.slice(0, 3),
    };

    defCache.set(key, result);
    return result;

  } catch (_) {
    defCache.set(key, null);
    return null;
  }
}

export function clearCache() { synCache.clear(); defCache.clear(); }

