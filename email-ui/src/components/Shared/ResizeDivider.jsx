import React, { useCallback, useEffect, useState, useRef } from "react";

export function ResizeDivider({ onResize, minLeft = 280, minRight = 300 }) {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef(null);
  const rafRef = useRef(null);
  const lastWidthRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      const container = dividerRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;
      const maxLeftWidth = containerRect.width - minRight;

      // Clamp the width between min and max
      const clampedWidth = Math.max(minLeft, Math.min(newLeftWidth, maxLeftWidth));
      
      // Only update if width changed significantly (reduces unnecessary renders)
      if (lastWidthRef.current === null || Math.abs(lastWidthRef.current - clampedWidth) > 1) {
        lastWidthRef.current = clampedWidth;
        onResize(clampedWidth);
      }
    });
  }, [isDragging, onResize, minLeft, minRight]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastWidthRef.current = null;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      
      // Cleanup animation frame on unmount
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dividerRef}
      className={`resize-divider ${isDragging ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
      title="Drag to resize"
    >
      <div className="resize-handle">
        <i className="bi bi-grip-vertical" />
      </div>
    </div>
  );
}

