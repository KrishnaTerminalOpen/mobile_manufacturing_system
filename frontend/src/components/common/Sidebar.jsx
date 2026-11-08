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
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
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
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
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
          badgeColor: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold"
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
          badgeColor: "bg-blue-50 text-blue-700 border-blue-200 font-bold"
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
        className={`fixed lg:sticky top-0 lg:top-16 left-0 z-40 h-full lg:h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-[1px_0_4px_0_rgba(15,23,42,0.02)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 lg:hidden">
            <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
            <button
              onClick={closeSidebar}
              className="p-1 rounded text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {navSections.map((sec, idx) => (
            <div key={idx}>
              <div className="px-2.5 mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">
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
                        `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/60 to-blue-50/40 text-indigo-700 font-bold border-l-4 border-indigo-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-medium'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0 transition-colors" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tight shrink-0 border ${item.badgeColor}`}>
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
        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/60 text-[11px] text-slate-500 flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">Oracle 21c XE Online</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] font-bold text-slate-600 shadow-2xs">
              v2.4 Pro
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-tight">
            Manipal Institute of Technology (MCA DBMS)
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
