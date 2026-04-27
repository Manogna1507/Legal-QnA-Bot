import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import ChatPage from './pages/ChatPage.jsx';
import CaseSearchPage from './pages/CaseSearchPage.jsx';

let toastIdCounter = 0;

export default function App() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [voiceActive, setVoiceActive] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const showToast = useCallback((toast) => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const toggleVoice = () => {
    setVoiceActive(v => {
      const next = !v;
      showToast({ type: 'info', message: next ? 'Voice output enabled' : 'Voice output disabled' });
      return next;
    });
  };

  const pageProps = { language, voiceActive, showToast };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
        <div className="main-content">
          <Topbar
            theme={theme}
            onThemeToggle={toggleTheme}
            language={language}
            onLanguageChange={setLanguage}
            voiceActive={voiceActive}
            onVoiceToggle={toggleVoice}
          />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="/chat" element={<ChatPage {...pageProps} />} />
              <Route path="/case-search" element={
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <CaseSearchPage {...pageProps} />
                </div>
              } />
            </Routes>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  );
}
