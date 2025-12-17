import { useState } from "react";

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const add = (t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((x) => [...x, { id, ...t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), t.duration ?? 3000);
  };

  const remove = (id) => {
    setToasts((x) => x.filter((y) => y.id !== id));
  };

  return { add, remove, toasts };
}
