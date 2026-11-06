import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Smartphone,
  Cpu,
  Truck,
  Grid,
  Calculator,
  Factory,
  Boxes,
  ShoppingCart,
  History,
  FileSpreadsheet,
  Binary,
  ShieldAlert,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isAdmin } = useAuth();

  const navSections = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", path: "/", icon: LayoutDashboard },
      ]
    },
    {
      title: "MODULE 1: MASTER DATA",
      items: [
        { label: "Brands", path: "/brands", icon: Building2 },
        { label: "Mobile Models & BOM", path: "/models", icon: Smartphone },
        { label: "Components", path: "/components", icon: Cpu },
      ]
    },
    {
      title: "MODULE 2: SOURCING",
      items: [
        { label: "Suppliers", path: "/suppliers", icon: Truck },
        { label: "Sourcing Matrix", path: "/sourcing-matrix", icon: Grid },
        { label: "Cost Optimizer", path: "/cost-optimizer", icon: Calculator },
      ]
    },
    {
      title: "MODULE 3: MANUFACTURING",
      items: [
        { label: "Production Batches", path: "/batches", icon: Factory },
        { label: "Inventory Summary", path: "/inventory", icon: Boxes },
      ]
    },
    {
      title: "MODULE 4: SALES & ANALYTICS",
      items: [
        { label: "Record Batch Sale", path: "/record-sale", icon: ShoppingCart },
        { label: "Sales History", path: "/sales-history", icon: History },
        { label: "Reports & Analytics", path: "/reports", icon: FileSpreadsheet },
      ]
    },
    {
      title: "DBMS VIVA TOOLS",
      items: [
        { label: "DB Explorer & PL/SQL", path: "/db-explorer", icon: Binary },
        ...(isAdmin ? [{ label: "Audit Trail (Admin)", path: "/audit-log", icon: ShieldAlert }] : [])
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="font-bold text-slate-800 dark:text-white">Menu Navigation</span>
            <button
              onClick={closeSidebar}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                {sec.title}
              </div>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-semibold shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>MCA MIT Mini Project</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">v1.0</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
