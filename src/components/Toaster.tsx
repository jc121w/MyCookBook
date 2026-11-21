"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Small notifications at the bottom of the screen, e.g.
//   "Pad Thai is on your shelf   [Open book]"
// Use anywhere:  const toast = useToast();  toast({ message, action })
type Toast = {
  id: number;
  message: ReactNode;
  action?: { label: string; href: string };
};
type ShowToast = (toast: Omit<Toast, "id">) => void;

const ToastContext = createContext<ShowToast>(() => {});
export const useToast = () => useContext(ToastContext);

const SHOW_FOR_MS = 6000;

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback(
    (id: number) => setToasts((all) => all.filter((t) => t.id !== id)),
    [],
  );
  const show = useCallback<ShowToast>((toast) => {
    const id = nextId.current++;
    // Newest last; at most 3 on screen
    setToasts((all) => [...all, { ...toast, id }].slice(-3));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {/* aria-live: screen readers announce each new toast */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  // Disappears on its own, but not while you're hovering or focused on it
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), SHOW_FOR_MS);
    return () => clearTimeout(timer);
  }, [paused, toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="bg-base-content text-base-100 pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl py-2.5 pr-2 pl-4 shadow-2xl"
    >
      <p className="min-w-0 flex-1 text-sm">{toast.message}</p>
      {toast.action && (
        <Link
          href={toast.action.href}
          onClick={() => onDismiss(toast.id)}
          className="btn btn-sm btn-primary shrink-0 font-serif"
        >
          {toast.action.label}
        </Link>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="btn btn-ghost btn-sm btn-circle shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
