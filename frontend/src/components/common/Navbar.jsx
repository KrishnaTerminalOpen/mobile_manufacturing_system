import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Database,
  LogOut,
  User,
  Menu,
  Bell,
  Search,
  PlusCircle,
  Factory,
  ShoppingCart,
  Smartphone,
  ChevronDown,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';

const Navbar = ({ toggleSidebar, openQuickSearch }) => {
  const { user, logout, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dbStatus, setDbStatus] = useState({ engine: 'Checking Oracle XE...', isOracle: false });
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const notifRef = useRef(null);
  const actionsRef = useRef(null);
  const roleRef = useRef(null);

  useEffect(() => {
    // Health check
    api.get('/health')
      .then(res => {
        setDbStatus({
          engine: res.data.database_engine,
          isOracle: res.data.oracle_connected
        });
      })
      .catch(() => {
        setDbStatus({ engine: 'Oracle XE Service Offline', isOracle: false });
      });

    // Fetch dashboard summary for real-time notification alerts
    api.get('/dashboard/summary')
      .then(res => {
        setReorderAlerts(res.data.reorder_alerts || []);
      })
      .catch(() => {});

    // Click outside handler
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowQuickActions(false);
      if (roleRef.current && !roleRef.current.contains(e.target)) setShowRoleSwitcher(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchRole = async (u, p) => {
    try {
      await login(u, p);
      setShowRoleSwitcher(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between transition-colors shadow-xs">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Apex<span className="text-blue-600 dark:text-blue-400">MES</span>
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Enterprise 21c
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">
              Mobile Manufacturing Execution System • Enterprise Edition
            </p>
          </div>
        </Link>
      </div>

      {/* Center: Global Search shortcut */}
      <div className="hidden md:flex items-center">
        <button
          onClick={openQuickSearch}
          className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 transition-all w-64 justify-between"
        >
          <span className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search models, batches, suppliers...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Button */}
        <div className="relative" ref={actionsRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Action</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showQuickActions && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fade-in text-xs font-semibold">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Fast Creation
              </div>
              <Link
                to="/record-sale"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-500" />
                <span>Record Batch Sale</span>
              </Link>
              <Link
                to="/batches"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Factory className="w-4 h-4 text-blue-500" />
                <span>New Production Batch</span>
              </Link>
              <Link
                to="/models"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-purple-500" />
                <span>Add Phone Model</span>
              </Link>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <Link
                to="/cost-optimizer"
                onClick={() => setShowQuickActions(false)}
                className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span>⚡ Run Cost Optimizer</span>
              </Link>
            </div>
          )}
        </div>

        {/* Database Status Indicator */}
        <div
          title={dbStatus.engine}
          className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            dbStatus.isOracle
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${dbStatus.isOracle ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <Database className="w-3.5 h-3.5" />
          <span className="truncate max-w-[150px] font-semibold">
            {dbStatus.isOracle ? 'Oracle 21c (Thin Pool)' : 'Oracle Shadow Engine'}
          </span>
        </div>

        {/* Reorder Alerts Notification Center */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {reorderAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-bounce">
                {reorderAlerts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Restock Notifications
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {reorderAlerts.length} Critical
                </span>
              </div>

              {reorderAlerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  All manufacturing batch stocks healthy.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reorderAlerts.map((a) => (
                    <div
                      key={a.batch_id}
                      className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {a.batch_id} • {a.model_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {a.brand_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                          {a.remaining_stock} left
                        </span>
                        <div className="text-[9px] text-slate-400">
                          Min: {a.reorder_level}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                to="/batches"
                onClick={() => setShowNotifications(false)}
                className="block text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2 border-t border-slate-100 dark:border-slate-800"
              >
                Inspect All Batches →
              </Link>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Badge & Fast Role Switcher */}
        {user && (
          <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={roleRef}>
            <button
              onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
              className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user.username.slice(0, 2)}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.full_name}
                </span>
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border w-max ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block" />
            </button>

            {showRoleSwitcher && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400">@{user.username}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </div>

                {/* Viva Demo Role Switcher */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    ⚡ Viva Demo: Switch Role Instant
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      onClick={() => switchRole('admin', 'admin123')}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => switchRole('manager', 'manager123')}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        user.role === 'MANAGER'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-blue-50'
                      }`}
                    >
                      Manager
                    </button>
                    <button
                      onClick={() => switchRole('viewer', 'viewer123')}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                        user.role === 'VIEWER'
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Viewer
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
