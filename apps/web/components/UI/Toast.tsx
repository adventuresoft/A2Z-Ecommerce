"use client";

import React from "react";
import { CheckCircle2, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  desc?: string;
  type?: "success" | "info" | "warning";
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start space-x-3 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-white">{toast.title}</h4>
            {toast.desc && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {toast.desc}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1.5 -mr-1 -mt-1 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
