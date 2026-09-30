import React from 'react';
import { AlertCircle, CheckCircle, Info, HelpCircle, X } from 'lucide-react';

export function CustomModal({ isOpen, title, message, type = 'info', confirmText = 'Confirm', cancelText = 'Cancel', isConfirm = false, onConfirm, onClose }) {
   if (!isOpen) return null;

   const getIcon = () => {
      switch (type) {
         case 'success':
            return <CheckCircle className="text-green-600 w-8 h-8 shrink-0" />;
         case 'error':
            return <AlertCircle className="text-red-600 w-8 h-8 shrink-0" />;
         case 'warning':
            return <AlertCircle className="text-amber-600 w-8 h-8 shrink-0" />;
         case 'confirm':
            return <HelpCircle className="text-black w-8 h-8 shrink-0" />;
         default:
            return <Info className="text-black w-8 h-8 shrink-0" />;
      }
   };

   return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-white border-2 border-black max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-4">
               {getIcon()}
               <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block">
                     System Notification
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight text-black leading-tight">
                     {title || (isConfirm ? 'Confirmation Protocol' : 'Alert')}
                  </h3>
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors p-1">
                  <X size={18} />
               </button>
            </div>

            {/* Message Body */}
            <div className="text-xs font-mono text-gray-700 leading-relaxed bg-gray-50 border border-gray-200 p-4">
               {message}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
               {isConfirm ? (
                  <>
                     <button
                        onClick={() => {
                           if (onConfirm) onConfirm();
                           onClose();
                        }}
                        className="flex-1 bg-black text-white text-xs font-black uppercase py-3 px-4 hover:bg-stone-800 transition-colors"
                     >
                        {confirmText}
                     </button>
                     <button
                        onClick={onClose}
                        className="bg-gray-100 border border-black text-black text-xs font-black uppercase px-5 py-3 hover:bg-gray-200 transition-colors"
                     >
                        {cancelText}
                     </button>
                  </>
               ) : (
                  <button
                     onClick={onClose}
                     className="w-full bg-black text-white text-xs font-black uppercase py-3 px-4 hover:bg-stone-800 transition-colors"
                  >
                     Acknowledge
                  </button>
               )}
            </div>
         </div>
      </div>
   );
}
