// Global Confirm Modal
// Replaces all browser window.confirm() calls with a styled, branded modal
// Usage: import { useConfirm } from './ConfirmModal';
//        const confirm = useConfirm();
//        const yes = await confirm({ title: '...', message: '...', confirmLabel: 'Delete', danger: true });

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
   const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, danger, resolve }

   const confirm = useCallback(({ title, message, confirmLabel = 'Confirm', danger = false }) => {
      return new Promise(resolve => {
         setDialog({ title, message, confirmLabel, danger, resolve });
      });
   }, []);

   const handleChoice = (result) => {
      if (dialog?.resolve) dialog.resolve(result);
      setDialog(null);
   };

   return (
      <ConfirmContext.Provider value={confirm}>
         {children}
         {dialog && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-4 border-b border-black pb-5">
                     <div className={`w-10 h-10 flex items-center justify-center border-2 ${dialog.danger ? 'bg-red-600 border-red-700 text-white' : 'bg-black border-black text-white'}`}>
                        <AlertTriangle size={18} strokeWidth={2.5} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Confirmation Required</p>
                        <h3 className="text-sm font-black uppercase tracking-tight mt-0.5">{dialog.title}</h3>
                     </div>
                  </div>

                  {/* Message */}
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">{dialog.message}</p>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                     <button
                        onClick={() => handleChoice(false)}
                        className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-wider bg-white border-2 border-black text-black hover:bg-brand-grey transition-colors"
                     >
                        Cancel
                     </button>
                     <button
                        onClick={() => handleChoice(true)}
                        className={`flex-1 px-4 py-3 text-xs font-black uppercase tracking-wider border-2 transition-colors ${
                           dialog.danger
                              ? 'bg-red-600 border-red-700 text-white hover:bg-red-700'
                              : 'bg-black border-black text-white hover:bg-gray-800'
                        }`}
                     >
                        {dialog.confirmLabel}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </ConfirmContext.Provider>
   );
}

export function useConfirm() {
   const ctx = useContext(ConfirmContext);
   if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
   return ctx;
}
