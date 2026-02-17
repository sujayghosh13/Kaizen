import { useRef, useCallback, useState } from 'react';

/**
 * useSwipe — Horizontal drag/swipe with visual feedback.
 *
 * Uses React's onMouseDown/onTouchStart as entry points,
 * then document-level listeners for move/end so drags are never lost.
 *
 * Returns an object with:
 *  - handlers: { onMouseDown, onTouchStart } — spread on container element
 *  - style:    inline style with transform for visual drag feedback
 */
export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 80) {
    const startX = useRef(null);
    const startY = useRef(null);
    const locked = useRef(false);
    const cancelled = useRef(false);
    const containerEl = useRef(null);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);

    // Keep latest callbacks in refs
    const leftRef = useRef(onSwipeLeft);
    const rightRef = useRef(onSwipeRight);
    leftRef.current = onSwipeLeft;
    rightRef.current = onSwipeRight;

    const handleMove = useCallback((e) => {
        if (startX.current === null || cancelled.current) return;

        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = cx - startX.current;
        const dy = cy - startY.current;

        // Decide axis after small movement
        if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
            if (Math.abs(dy) > Math.abs(dx)) {
                cancelled.current = true;
                setOffset(0);
                setDragging(false);
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('touchmove', handleMove);
                return;
            }
            locked.current = true;
        }

        if (locked.current) {
            e.preventDefault?.();
            setOffset(dx * 0.4);
        }
    }, []);

    const handleEnd = useCallback((e) => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
        document.removeEventListener('touchcancel', handleEnd);

        if (startX.current === null) {
            setOffset(0);
            setDragging(false);
            return;
        }

        const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const dx = cx - startX.current;
        const wasDrag = locked.current;

        if (wasDrag && Math.abs(dx) > threshold) {
            if (dx < 0) leftRef.current?.();
            else rightRef.current?.();
        }

        // Suppress click after drag so buttons don't fire
        if (wasDrag && containerEl.current) {
            const suppress = (evt) => { evt.stopPropagation(); evt.preventDefault(); };
            containerEl.current.addEventListener('click', suppress, { capture: true, once: true });
            setTimeout(() => containerEl.current?.removeEventListener('click', suppress, { capture: true }), 200);
        }

        startX.current = null;
        startY.current = null;
        locked.current = false;
        cancelled.current = false;
        setOffset(0);
        setDragging(false);
    }, [threshold, handleMove]);

    const startDrag = useCallback((clientX, clientY, target) => {
        // Skip form inputs
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

        // Skip specific UI buttons that should NOT initiate drag
        if (target.closest('.task-chip, .category-action-btn, .nav-arrow, .today-btn, .mini-cal-nav, .view-switcher, .theme-picker, .alert-toggle-btn, .create-task-btn, .smart-decompose-trigger')) {
            return;
        }

        startX.current = clientX;
        startY.current = clientY;
        locked.current = false;
        cancelled.current = false;
        setDragging(true);

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
    }, [handleMove, handleEnd]);

    const onMouseDown = useCallback((e) => {
        if (e.button !== 0) return;
        containerEl.current = e.currentTarget;
        startDrag(e.clientX, e.clientY, e.target);
    }, [startDrag]);

    const onTouchStart = useCallback((e) => {
        containerEl.current = e.currentTarget;
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, [startDrag]);

    const handlers = { onMouseDown, onTouchStart };

    const style = {
        transform: offset !== 0 ? `translateX(${offset}px)` : undefined,
        transition: dragging ? 'none' : 'transform 0.25s ease-out',
        touchAction: 'pan-y',
        cursor: dragging ? 'grabbing' : undefined,
        userSelect: dragging ? 'none' : undefined,
    };

    return { handlers, style };
}
