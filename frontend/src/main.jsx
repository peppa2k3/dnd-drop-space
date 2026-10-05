import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { applyAppearance, DEFAULT_APPEARANCE, readAppearance } from './config/themes.js';
import { LanguageProvider } from './context/LanguageContext.jsx';
import i18n, { i18nReady } from './i18n/config.js';
import App from './App.jsx';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
  },
});

applyAppearance(readAppearance('dnd-drop-space:appearance:last') || DEFAULT_APPEARANCE);

i18nReady.then(() => {
  document.documentElement.lang = i18n.language;
  ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <LanguageProvider><ThemeProvider><App /></ThemeProvider></LanguageProvider>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
  );
});
