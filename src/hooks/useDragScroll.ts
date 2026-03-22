import { useRef, useCallback, useEffect } from "react";

/**
 * useDragScroll — Spotify/Netflix-like drag-to-scroll with inertia
 *
 * Usage:
 *   const { containerRef, handlers } = useDragScroll();
 *   <div ref={containerRef} {...handlers}> ... </div>
 */
export default function useDragScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animId = useRef(0);

  // ─── Inertia loop ───
  const inertia = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Friction
    velocity.current *= 0.92;

    if (Math.abs(velocity.current) < 0.5) {
      velocity.current = 0;
      return;
    }

    el.scrollLeft -= velocity.current;
    animId.current = requestAnimationFrame(inertia);
  }, []);

  // ─── Pointer Down ───
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;

      cancelAnimationFrame(animId.current);
      isDragging.current = true;
      startX.current = e.clientX;
      scrollStart.current = el.scrollLeft;
      lastX.current = e.clientX;
      lastTime.current = Date.now();
      velocity.current = 0;

      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      el.setPointerCapture(e.pointerId);
    },
    []
  );

  // ─── Pointer Move ───
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const el = containerRef.current;
      if (!el) return;

      const dx = e.clientX - startX.current;
      el.scrollLeft = scrollStart.current - dx;

      // Track velocity
      const now = Date.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (e.clientX - lastX.current) / dt * 16; // normalize to ~60fps
      }
      lastX.current = e.clientX;
      lastTime.current = now;
    },
    []
  );

  // ─── Pointer Up ───
  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const el = containerRef.current;
      if (el) {
        el.style.cursor = "grab";
        el.style.userSelect = "";
        el.releasePointerCapture(e.pointerId);
      }

      // Start inertia
      if (Math.abs(velocity.current) > 1) {
        animId.current = requestAnimationFrame(inertia);
      }
    },
    [inertia]
  );

  // Cleanup
  useEffect(() => {
    return () => cancelAnimationFrame(animId.current);
  }, []);

  // Prevent link clicks after drag
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    // If user just dragged, prevent the click
    if (Math.abs(velocity.current) > 2) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  return {
    containerRef,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onClickCapture,
    },
  };
}
