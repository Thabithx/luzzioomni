import React from 'react';
import AdminFinance from './pages/admin/AdminFinance';
import { CustomModalProvider } from './context/CustomModalContext';

function App() {
  return (
    <CustomModalProvider>
      <AdminFinance />
    </CustomModalProvider>
  );
}

export default App;