import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import QuickSearchModal from './QuickSearchModal';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      <Navbar
        toggleSidebar={() => setSidebarOpen(prev => !prev)}
        openQuickSearch={() => setQuickSearchOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50/50 via-[#f8fafc] to-slate-100/60">
          <Outlet />
        </main>
      </div>

      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
      />
    </div>
  );
};

export default Layout;
