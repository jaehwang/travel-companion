'use client';

import { useState, useEffect } from 'react';

export function useKeyboardHeight(): number {
  const [toolbarBottom, setToolbarBottom] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      const kbHeight = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setToolbarBottom(kbHeight);
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    handler();
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  return toolbarBottom;
}
