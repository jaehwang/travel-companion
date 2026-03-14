'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  align?: 'right' | 'left';
}

export function DropdownMenu({ items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen((prev) => !prev); }}
        className="text-tc-warm-mid hover:text-tc-warm-dark p-1 rounded"
        style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
        aria-label="더보기"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="3.5" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="9" cy="14.5" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            zIndex: 100,
            top: '100%',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            background: 'var(--tc-card-bg)',
            border: '1px solid var(--tc-dot)',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(45, 36, 22, 0.14)',
            minWidth: 120,
            overflow: 'hidden',
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                item.onClick();
              }}
              style={{
                display: 'block',
                width: '100%',
                minHeight: 44,
                padding: '0 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 500,
                color: item.variant === 'danger' ? '#EF4444' : 'var(--tc-warm-dark)',
                borderTop: index > 0 ? '1px solid var(--tc-dot)' : 'none',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
