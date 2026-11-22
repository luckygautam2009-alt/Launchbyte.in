"use client";

import React, { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        success: (msg) => addToast("success", msg),
        error: (msg) => addToast("error", msg),
        info: (msg) => addToast("info", msg),
        showToast: (msg, type = "info") =>
          addToast(type === "warning" ? "info" : type, msg),
      }}
    >
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto flex items-start p-3.5 rounded-xl shadow-lg border text-sm backdrop-blur-md ${
                toast.type === "success"
                  ? "bg-emerald-950/90 text-emerald-100 border-emerald-800"
                  : toast.type === "error"
                  ? "bg-rose-950/90 text-rose-100 border-rose-800"
                  : "bg-slate-900/90 text-slate-100 border-slate-700"
              }`}
            >
              <span className="mr-2.5 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                {toast.type === "info" && (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
              </span>
              <p className="flex-1 pr-2 leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
