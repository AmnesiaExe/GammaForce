"use client";

import { useLayoutEffect, useRef } from "react";

/** FLIP animation when list order changes (ranked queue reorder). */
export function useFlipList(itemKey: string, animate = true) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    root.querySelectorAll("[data-flip-id]").forEach((node) => {
      const el = node as HTMLElement;
      const id = el.getAttribute("data-flip-id");
      if (!id) return;

      const top = el.getBoundingClientRect().top;
      const prev = positions.current.get(id);
      if (prev != null) {
        const delta = prev - top;
        if (animate && Math.abs(delta) > 6) {
          el.style.transform = `translateY(${delta}px)`;
          el.style.transition = "transform 0s";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = "transform 0.32s ease-out";
              el.style.transform = "";
            });
          });
        }
      }
      positions.current.set(id, top);
    });
  }, [itemKey, animate]);

  return containerRef;
}
