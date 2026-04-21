/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Prank from './pages/Prank';
import Admin from './pages/Admin';
import { useEffect } from 'react';
import { db, doc, getDoc } from './lib/firebase';

function AppContent() {
  const location = useLocation();
  const isPrankPage = location.pathname.startsWith('/p/');

  // Test Connection as per instructions
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDoc(doc(db, 'settings', 'config'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans flex flex-col">
      {!isPrankPage && (
        <nav className="h-[70px] border-b border-white/5 bg-bg/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
          <div className="max-w-4xl mx-auto px-10 h-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-3 h-3 bg-accent rounded-sm shadow-[0_0_8px_rgba(102,252,241,0.5)]" />
              <span className="font-extrabold text-2xl tracking-tighter uppercase">RK PRANKENGINE</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link 
                to="/admin" 
                className="text-sm font-medium text-text-secondary hover:text-accent transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          </div>
        </nav>
      )}

      <main className={!isPrankPage ? "flex-1 max-w-4xl w-full mx-auto px-10 py-12" : "flex-1"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/p/:id" element={<Prank />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      
      {!isPrankPage && (
        <footer className="mt-auto border-t border-white/5 py-10 px-10 shrink-0">
          <div className="max-w-4xl mx-auto flex justify-between text-[11px] text-text-secondary">
            <span>&copy; 2024 RK PrankEngine Systems. For recreational use only.</span>
            <span>Server Latency: 24ms</span>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

