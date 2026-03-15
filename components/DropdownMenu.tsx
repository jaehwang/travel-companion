'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  align?: 'right' | 'left';
  buttonStyle?: React.CSSProperties;
}

export function DropdownMenu({ items, align = 'right', buttonStyle }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; left: number; right: number }>({ left: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calcMenuPos = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = (items.length * 44) + 8; // 아이템당 minHeight 44px + 여유
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

      setMenuPos({
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    }
  }, [items.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClose = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideButton = buttonRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideButton && !insideMenu) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          calcMenuPos();
          setIsOpen((prev) => !prev);
        }}
        className="text-tc-warm-mid hover:text-tc-warm-dark p-1 rounded"
        style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, ...buttonStyle }}
        aria-label="더보기"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
          <circle cx="9" cy="3.5" r="1.5" />
          <circle cx="9" cy="9" r="1.5" />
          <circle cx="9" cy="14.5" r="1.5" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            zIndex: 20000,
            ...(menuPos.top !== undefined ? { top: menuPos.top } : { bottom: menuPos.bottom }),
            ...(align === 'right' ? { right: menuPos.right } : { left: menuPos.left }),
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
                item.onClick();
                setIsOpen(false);
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
        </div>,
        document.body
      )}
    </>
  );
}
