import React, { useState, useEffect } from 'react';
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
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import api from '../../services/api';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { isAdmin } = useAuth();
  const [badgeCounts, setBadgeCounts] = useState({ lowStock: 0, models: 0, batches: 0 });

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(res => {
        setBadgeCounts({
          lowStock: res.data.kpis?.low_stock_batches_count || 0,
          models: res.data.kpis?.total_models || 5,
          batches: res.data.kpis?.active_batches || 5
        });
      })
      .catch(() => {});
  }, []);

  const navSections = [
    {
      title: "EXECUTIVE SUITE",
      items: [
        { label: "Executive Dashboard", path: "/", icon: LayoutDashboard },
      ]
    },
    {
      title: "MODULE 1: MASTER REPOSITORY",
      items: [
        { label: "Brand Manufacturers", path: "/brands", icon: Building2 },
        {
          label: "Mobile Models & BOM",
          path: "/models",
          icon: Smartphone,
          badge: `${badgeCounts.models} Models`,
          badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
        },
        { label: "Hardware Components", path: "/components", icon: Cpu },
      ]
    },
    {
      title: "MODULE 2: SOURCING & PROCUREMENT",
      items: [
        { label: "Certified Suppliers", path: "/suppliers", icon: Truck },
        { label: "2D Sourcing Matrix", path: "/sourcing-matrix", icon: Grid },
        {
          label: "Sourcing Cost Optimizer",
          path: "/cost-optimizer",
          icon: Calculator,
          badge: "Save 3%",
          badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        },
      ]
    },
    {
      title: "MODULE 3: MANUFACTURING & INVENTORY",
      items: [
        {
          label: "Production Batches",
          path: "/batches",
          icon: Factory,
          badge: badgeCounts.lowStock > 0 ? `${badgeCounts.lowStock} Alert` : null,
          badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse"
        },
        { label: "Inventory Valuation (Q1)", path: "/inventory", icon: Boxes },
      ]
    },
    {
      title: "MODULE 4: SALES & BUSINESS ANALYSIS",
      items: [
        { label: "Record Batch Sale (SP)", path: "/record-sale", icon: ShoppingCart },
        { label: "Sales & Invoicing Ledger", path: "/sales-history", icon: History },
        { label: "Analytical Reports (Q1-Q4)", path: "/reports", icon: FileSpreadsheet },
      ]
    },
    {
      title: "ORACLE 21c DBMS TOOLS (VIVA)",
      items: [
        {
          label: "DB Explorer & PL/SQL",
          path: "/db-explorer",
          icon: Binary,
          badge: "Interactive",
          badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        },
        ...(isAdmin ? [{ label: "Regulatory Audit Trail", path: "/audit-log", icon: ShieldAlert }] : [])
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 lg:hidden">
            <span className="font-bold text-slate-800 dark:text-white text-sm">Navigation Menu</span>
            <button
              onClick={closeSidebar}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-2.5 mb-2 text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                        `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-tight shrink-0 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>DBMS Production</span>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px] font-bold">
            v2.4
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
