import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css'
import App from './App.tsx'
import { AuthProvider } from './context/auth';
import { WalletProvider } from './context/wallet';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter>
    <AuthProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </AuthProvider>
  </BrowserRouter>
  </StrictMode>,
);