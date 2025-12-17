import React from "react";

export function SkeletonLoader({ count = 5 }) {
  return (
    <div className="d-flex flex-column gap-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="d-flex gap-3 align-items-center">
          <div className="skeleton rounded-circle" style={{ width: 24, height: 24 }} />
          <div className="flex-grow-1 d-flex flex-column gap-2">
            <div className="skeleton rounded" style={{ width: "30%", height: 16 }} />
            <div className="skeleton rounded" style={{ width: "80%", height: 14 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
