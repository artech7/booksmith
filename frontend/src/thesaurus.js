// ── BookSmith Thesaurus ────────────────────────────────────────────────────────
// Uses the Datamuse API (free, no key, CORS-enabled)
// https://www.datamuse.com/api/
// Falls back to local alternatives.js if the network is unavailable.

import { ALTERNATIVES } from './alternatives.js';

const cache = new Map();

// ── Datamuse fetch ─────────────────────────────────────────────────────────────

async function datamuse(params) {
  const url = `https://api.datamuse.com/words?${new URLSearchParams({ ...params, md: 'pf', max: 30 })}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`Datamuse ${res.status}`);
  return res.json();
}

// ── Part-of-speech helpers ─────────────────────────────────────────────────────

function isAdv(w) { return w.tags?.some(t => t === 'adv'); }
function isVerb(w) { return w.tags?.some(t => t === 'v');   }
function isAdj(w)  { return w.tags?.some(t => t === 'adj'); }
function isNoun(w) { return w.tags?.some(t => t === 'n');   }

// Frequency score (f tag gives log-frequency as string e.g. "4.56")
function freq(w) {
  const f = w.tags?.find(t => /^\d/.test(t));
  return f ? parseFloat(f) : 0;
}

// ── Grade label based on score relative to query word's score ─────────────────

function grade(word, topScore) {
  const ratio = topScore > 0 ? word.score / topScore : 0;
  if (ratio >= 0.7) return 'strong';
  if (ratio >= 0.3) return 'good';
  return 'weaker';
}

// ── Main fetch ─────────────────────────────────────────────────────────────────

export async function getAlternatives(word) {
  const key = word.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key);

  try {
    // Two queries: rel_syn = true synonyms, ml = "means like" (broader)
    const [synData, mlData] = await Promise.all([
      datamuse({ rel_syn: key }),
      datamuse({ ml: key }),
    ]);

    // Merge, deduplicate, drop the original word
    const seen   = new Set([key]);
    const merged = [];
    for (const w of [...synData, ...mlData]) {
      if (!seen.has(w.word)) { seen.add(w.word); merged.push(w); }
    }
    merged.sort((a, b) => b.score - a.score);

    const topScore = merged[0]?.score || 1;

    const swaps = merged
      .filter(w => isAdv(w) || (!isVerb(w) && !isNoun(w) && !isAdj(w)))
      .slice(0, 10)
      .map(w => ({ word: w.word, grade: grade(w, topScore), score: w.score }));

    const verbs = merged
      .filter(isVerb)
      .slice(0, 8)
      .map(w => ({ word: w.word, grade: grade(w, topScore), score: w.score }));

    const adjectives = merged
      .filter(isAdj)
      .slice(0, 6)
      .map(w => ({ word: w.word, grade: grade(w, topScore), score: w.score }));

    const result = {
      swaps,
      verbs,
      adjectives,
      tip: ALTERNATIVES[key]?.tip || null,
      source: 'datamuse',
    };

    cache.set(key, result);
    return result;

  } catch (_) {
    // Network unavailable — fall back to curated list
    const local = ALTERNATIVES[key];
    if (local) {
      const result = {
        swaps:      (local.swap || []).map(w => ({ word: w, grade: 'good', score: 0 })),
        verbs:      (local.verb || []).map(w => ({ word: w, grade: 'good', score: 0 })),
        adjectives: [],
        tip:        local.tip || null,
        source:     'offline',
      };
      cache.set(key, result);
      return result;
    }
    return null;
  }
}

export function clearCache() { cache.clear(); }
