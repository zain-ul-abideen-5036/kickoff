'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Counts up to `value` once, on first view (~900ms, ease-out). Later changes show instantly,
 * and with reduced motion the number is simply shown.
 */
export function useCountUp(value: number): number {
  const [shown, setShown] = useState(value);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) {
      setShown(value);
      return;
    }
    done.current = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return shown;
}
