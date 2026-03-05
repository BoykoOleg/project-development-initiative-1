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
        const delta = ev.clientX - dragging.current.startX;
        const newWidth = Math.max(40, dragging.current.startWidth + delta);
        setWidths((prev) => {
          const next = [...prev];
          next[dragging.current!.index] = newWidth;
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
