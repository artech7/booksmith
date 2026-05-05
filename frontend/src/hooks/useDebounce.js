import { useRef, useCallback } from 'react';

/**
 * Returns a debounced version of `callback` that fires after `delay` ms of
 * inactivity.  The latest `callback` reference is always used, so it is safe
 * to pass inline functions without wrapping in useCallback.
 */
export function useDebounce(callback, delay = 1200) {
  const timerRef = useRef(null);
  const cbRef    = useRef(callback);
  cbRef.current  = callback;

  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => cbRef.current(...args), delay);
  }, [delay]);
}
