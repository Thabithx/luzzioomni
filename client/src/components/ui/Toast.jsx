// Global Toast Notification System
// Replaces all browser alert() calls with styled, branded toasts
// Usage: import { useToast } from './Toast'; const { showToast } = useToast();

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
   success: CheckCircle,
   error: XCircle,
   warning: AlertTriangle,
   info: Info,
};

const STYLES = {
   success: 'bg-black text-white border-black',
   error: 'bg-red-600 text-white border-red-700',
   warning: 'bg-amber-500 text-black border-amber-600',
   info: 'bg-white text-black border-black',
};

export function ToastProvider({ children }) {
   const [toasts, setToasts] = useState([]);

   const showToast = useCallback((message, type = 'info', duration = 3500) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
         setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
   }, []);

   const dismiss = useCallback((id) => {
      setToasts(prev => prev.filter(t => t.id !== id));
   }, []);

   return (
      <ToastContext.Provider value={{ showToast }}>
         {children}
         {/* Toast Stack */}
         <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => {
               const Icon = ICONS[toast.type] || Info;
               return (
                  <div
                     key={toast.id}
                     className={`flex items-start gap-3 px-5 py-4 border-2 shadow-xl pointer-events-auto animate-fade-in-up ${STYLES[toast.type]}`}
                     style={{ animation: 'slideInUp 0.25s ease-out' }}
                  >
                     <Icon size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                     <p className="text-xs font-bold tracking-wide leading-relaxed flex-1">{toast.message}</p>
                     <button
                        onClick={() => dismiss(toast.id)}
                        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                     >
                        <X size={14} strokeWidth={2.5} />
                     </button>
                  </div>
               );
            })}
         </div>
         <style>{`
            @keyframes slideInUp {
               from { opacity: 0; transform: translateY(16px); }
               to   { opacity: 1; transform: translateY(0); }
            }
         `}</style>
      </ToastContext.Provider>
   );
}

export function useToast() {
   const ctx = useContext(ToastContext);
   if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
   return ctx;
}
