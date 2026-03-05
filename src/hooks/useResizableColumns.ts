import { useRef, useState, useCallback } from "react";

export function useResizableColumns(initialWidths: number[]) {
  const [widths, setWidths] = useState(initialWidths);
  const dragging = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

  const onMouseDown = useCallback(
    (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = { index, startX: e.clientX, startWidth: widths[index] };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const { index: dragIndex, startX, startWidth } = dragging.current;
        const delta = ev.clientX - startX;
        const newWidth = Math.max(40, startWidth + delta);
        setWidths((prev) => {
          const next = [...prev];
          next[dragIndex] = newWidth;
          return next;
        });
      };

      const onMouseUp = () => {
        dragging.current = null;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [widths]
  );

  return { widths, onMouseDown };
}