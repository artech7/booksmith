import { useState, useCallback } from 'react';

const KEY = 'bs_writing_progress';

function todayStr()  { return new Date().toISOString().slice(0, 10); }
function monthStr()  { return new Date().toISOString().slice(0, 7); }
function weekStr() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const y   = d.getFullYear();
  const jan = new Date(y, 0, 1);
  const w   = Math.ceil((((d - jan) / 86400000) + jan.getDay() + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function init() {
  const s     = load();
  const today = todayStr();
  const week  = weekStr();
  const month = monthStr();

  return {
    goals:        s.goals        || { session: 0, daily: 0, weekly: 0, monthly: 0 },
    sessionWords: s.sessionWords || 0,          // resets on each page load (fresh start)
    dayWords:     s.dayDate  === today ? (s.dayWords  || 0) : 0,
    weekWords:    s.weekKey  === week  ? (s.weekWords || 0) : 0,
    monthWords:   s.monthKey === month ? (s.monthWords|| 0) : 0,
    dayDate:      today,
    weekKey:      week,
    monthKey:     month,
  };
}

export function useWritingProgress() {
  const [data, setData] = useState(init);

  const persist = (next) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    setData(next);
  };

  /** Call with positive delta whenever words are added */
  const trackWords = useCallback((delta) => {
    if (delta <= 0) return;
    setData(prev => {
      const next = {
        ...prev,
        sessionWords: prev.sessionWords + delta,
        dayWords:     prev.dayWords     + delta,
        weekWords:    prev.weekWords    + delta,
        monthWords:   prev.monthWords   + delta,
      };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Set a time-based goal target */
  const setGoal = useCallback((period, value) => {
    setData(prev => {
      const next = { ...prev, goals: { ...prev.goals, [period]: Math.max(0, value) } };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { data, trackWords, setGoal };
}
