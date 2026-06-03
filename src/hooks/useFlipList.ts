"use client";

import { useLayoutEffect, useRef } from "react";

/** FLIP animation when list order changes (ranked queue reorder). */
export function useFlipList(itemKey: string) {
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
        if (Math.abs(delta) > 3) {
          el.style.transform = `translateY(${delta}px)`;
          el.style.transition = "transform 0s";
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition =
                "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
              el.style.transform = "";
            });
          });
        }
      }
      positions.current.set(id, top);
    });
  }, [itemKey]);

  return containerRef;
}
