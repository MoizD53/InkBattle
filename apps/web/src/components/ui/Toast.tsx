import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; message: string; }
interface ToastStore { toasts: Toast[]; addToast: (type: ToastType, message: string) => void; removeToast: (id: string) => void; }

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => set((state) => ({ toasts: [...state.toasts, { id: Math.random().toString(36).substring(7), type, message }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 4000);
    return () => clearTimeout(t);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-slate-800 shadow-lg rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700 max-w-sm"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
      <button onClick={onRemove} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}