import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './App.css'; 

import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx'; // --- IMPORT ANG AUTHPROVIDER ---

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* --- PUTSA ANG APP SA AUTHPROVIDER --- */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);