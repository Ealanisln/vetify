import { useEffect } from 'react';

/**
 * Calls `onEscape` when the Escape key is pressed, so modals can be closed
 * from the keyboard. Pass `enabled = false` to ignore the key (e.g. while a
 * request is in flight).
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, enabled]);
}
