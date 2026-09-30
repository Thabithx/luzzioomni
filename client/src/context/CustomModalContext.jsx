import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomModal } from '../components/ui/CustomModal';

const CustomModalContext = createContext();

export function CustomModalProvider({ children }) {
   const [modalState, setModalState] = useState({
      isOpen: false,
      title: '',
      message: '',
      type: 'info',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isConfirm: false,
      onConfirm: null
   });

   const showAlert = (message, title = 'Notification', type = 'info') => {
      setModalState({
         isOpen: true,
         title,
         message: typeof message === 'string' ? message : JSON.stringify(message),
         type,
         isConfirm: false,
         confirmText: 'Acknowledge',
         cancelText: 'Cancel',
         onConfirm: null
      });
   };

   const showConfirm = (message, onConfirmCallback, title = 'Confirmation Protocol', options = {}) => {
      setModalState({
         isOpen: true,
         title,
         message: typeof message === 'string' ? message : JSON.stringify(message),
         type: options.type || 'confirm',
         isConfirm: true,
         confirmText: options.confirmText || 'Confirm',
         cancelText: options.cancelText || 'Cancel',
         onConfirm: () => {
            if (onConfirmCallback) onConfirmCallback();
         }
      });
   };

   const closeModal = () => {
      setModalState(prev => ({ ...prev, isOpen: false }));
   };

   // Optional global monkey-patch of window.alert to render our custom modal
   useEffect(() => {
      const originalAlert = window.alert;
      window.alert = (msg) => {
         showAlert(msg, 'System Notification', 'info');
      };
      return () => {
         window.alert = originalAlert;
      };
   }, []);

   return (
      <CustomModalContext.Provider value={{ showAlert, showConfirm, closeModal }}>
         {children}
         <CustomModal
            isOpen={modalState.isOpen}
            title={modalState.title}
            message={modalState.message}
            type={modalState.type}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            isConfirm={modalState.isConfirm}
            onConfirm={modalState.onConfirm}
            onClose={closeModal}
         />
      </CustomModalContext.Provider>
   );
}

export function useCustomModal() {
   const context = useContext(CustomModalContext);
   if (!context) {
      // Fallback if rendered outside provider
      return {
         showAlert: (msg, title) => window.alert(`${title ? `${title}: ` : ''}${msg}`),
         showConfirm: (msg, onConfirm) => { if (window.confirm(msg)) onConfirm(); },
         closeModal: () => {}
      };
   }
   return context;
}
