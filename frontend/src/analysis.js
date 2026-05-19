// ── BookSmith Writing Analysis Engine ─────────────────────────────────────────
// All analysis runs client-side, instant, no data leaves the browser.

// ── Sentence splitting ─────────────────────────────────────────────────────────

export function splitSentences(text) {
  if (!text.trim()) return [];
  // Split on . ! ? — respect common abbreviations
  const raw = text
    .replace(/([.!?])\s+(?=[A-Z"'])/g, '$1\n')
    .replace(/([.!?])(\n|$)/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  return raw;
}

export function splitParagraphs(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

export function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

// ── Sentence length categories ─────────────────────────────────────────────────

export function sentenceCategory(wordLen) {
  if (wordLen <= 8)  return 'short';   // punchy
  if (wordLen <= 18) return 'medium';  // comfortable
  if (wordLen <= 30) return 'long';    // getting complex
  return 'very-long';                  // flag
}

// ── Flesch-Kincaid ─────────────────────────────────────────────────────────────

function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

export function fleschKincaid(text) {
  const sentences = splitSentences(text);
  const words     = text.trim().split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return null;

  const totalSyllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const asl = words.length / sentences.length;          // avg sentence length
  const asw = totalSyllables / words.length;            // avg syllables per word

  const ease  = Math.round(206.835 - (1.015 * asl) - (84.6 * asw));
  const grade = Math.round((0.39 * asl) + (11.8 * asw) - 15.59);

  const easeLabel =
    ease >= 90 ? 'Very Easy'    :
    ease >= 80 ? 'Easy'         :
    ease >= 70 ? 'Fairly Easy'  :
    ease >= 60 ? 'Standard'     :
    ease >= 50 ? 'Fairly Hard'  :
    ease >= 30 ? 'Difficult'    : 'Very Difficult';

  return {
    ease:       Math.max(0, Math.min(100, ease)),
    easeLabel,
    grade:      Math.max(1, Math.min(18, grade)),
  };
}

// ── Passive voice ──────────────────────────────────────────────────────────────

const PASSIVE_RE = /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|built|bought|brought|caught|done|felt|found|got|given|gone|had|heard|held|kept|known|left|lost|made|meant|met|paid|put|read|said|seen|sent|shown|shut|slept|sold|spent|stood|taught|told|thought|understood|won|written)\b/gi;

export function detectPassive(text) {
  const sentences = splitSentences(text);
  const flagged = [];
  for (const s of sentences) {
    if (PASSIVE_RE.test(s)) flagged.push(s.length > 80 ? s.slice(0, 80) + '…' : s);
    PASSIVE_RE.lastIndex = 0;
  }
  return flagged;
}

// ── Adverbs ────────────────────────────────────────────────────────────────────

import { WEAK_ADVERBS } from './alternatives.js';

export function detectAdverbs(text) {
  // Match -ly words AND known weak adverbs
  const words = text.match(/\b\w+\b/gi) || [];
  const counts = {};
  for (const w of words) {
    const lower = w.toLowerCase();
    const isLy   = lower.endsWith('ly') && lower.length > 3;
    const isWeak = WEAK_ADVERBS.has(lower);
    if (isLy || isWeak) counts[lower] = (counts[lower] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, count]) => ({ word, count }));
}

// ── Repeated / overused words ──────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'as','by','from','up','about','into','through','during','is','are','was',
  'were','be','been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','must','shall','can','need','dare',
  'that','this','these','those','i','he','she','it','we','they','you','me',
  'him','her','us','them','my','his','her','its','our','your','their','mine',
  'said','not','so','if','then','than','when','where','who','which','what',
  'how','all','each','every','both','few','more','most','other','some','such',
  'no','nor','only','own','same','too','very','just','because','while','after',
  'before','since','also','still','back','down','out','over','again','well',
  'way','even','new','want','look','use','make','like','time','see','know',
  'take','come','think','go','get','much','good','little','world','life',
  'hand','old','great','high','long','big','man','woman','day','year',
]);

export function repeatedWords(text) {
  const words  = (text.match(/\b[a-z]{4,}\b/gi) || []).map(w => w.toLowerCase());
  const counts = {};
  for (const w of words) {
    if (!STOP_WORDS.has(w)) counts[w] = (counts[w] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

// ── Dialogue punctuation ───────────────────────────────────────────────────────

export function dialogueIssues(text) {
  const issues = [];
  // Period before closing quote instead of comma: ." he said
  if (/\."[ \t]+(?:he|she|they|it|i|we|[A-Z][a-z]+)\s+(?:said|asked|replied|whispered|shouted|called|muttered|added|continued|explained|answered)/g.test(text)) {
    issues.push('Period before closing quote followed by attribution — use a comma instead: …word," he said');
  }
  // No punctuation before closing quote in dialogue
  if (/[a-z]"[ \t]+(?:said|asked|replied|whispered|shouted)/g.test(text)) {
    issues.push('Missing punctuation before closing quote in dialogue');
  }
  // Double space
  if (/  /.test(text)) {
    issues.push('Double spaces detected');
  }
  // Em dash used as hyphen with spaces: word - word
  if (/ - /.test(text)) {
    issues.push('Spaced hyphens found — consider using an em dash (—) instead');
  }
  // Comma splice detector (very simple)
  const commaSplice = text.match(/[a-z], (I|he|she|they|we|it) (am|is|are|was|were|have|had|do|did|will|would|could|should)/g);
  if (commaSplice && commaSplice.length > 1) {
    issues.push(`Possible comma splices (${commaSplice.length} found) — consider splitting into separate sentences`);
  }
  return issues;
}

// ── Paragraph analysis ─────────────────────────────────────────────────────────

export function paragraphAnalysis(text) {
  const paras  = splitParagraphs(text);
  if (paras.length === 0) return null;
  const lengths = paras.map(p => wordCount(p));
  const walls   = paras.filter(p => wordCount(p) > 120).length;
  const singles = paras.filter(p => wordCount(p) <= 20).length;
  return {
    count:   paras.length,
    avg:     Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length),
    longest: Math.max(...lengths),
    walls,
    singles,
  };
}

// ── Sentence stats ─────────────────────────────────────────────────────────────

export function sentenceStats(text) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return null;
  const lengths = sentences.map(s => wordCount(s));
  const avg     = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const runOns  = lengths.filter(l => l > 40).length;
  const frags   = lengths.filter(l => l < 3).length;
  return {
    count:   sentences.length,
    avg:     Math.round(avg * 10) / 10,
    shortest:Math.min(...lengths),
    longest: Math.max(...lengths),
    runOns,
    frags,
    dist: {
      short:     lengths.filter(l => l <= 8).length,
      medium:    lengths.filter(l => l > 8 && l <= 18).length,
      long:      lengths.filter(l => l > 18 && l <= 30).length,
      veryLong:  lengths.filter(l => l > 30).length,
    },
  };
}

// ── Full analysis ──────────────────────────────────────────────────────────────

export function analyzeText(text) {
  if (!text || wordCount(text) < 10) return null;
  return {
    fk:        fleschKincaid(text),
    sentences: sentenceStats(text),
    passive:   detectPassive(text),
    adverbs:   detectAdverbs(text),
    repeated:  repeatedWords(text),
    dialogue:  dialogueIssues(text),
    paragraphs:paragraphAnalysis(text),
  };
}
