import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Building2,
  Smartphone,
  Factory,
  Boxes,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <LoadingSkeleton rows={8} cols={4} />;
  }

  const { kpis, revenue_by_brand, sales_trend_monthly, batch_stock_status, bom_vs_price, reorder_alerts } = data;

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manufacturing & Sales Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry connected to Oracle Database 21c XE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/record-sale"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm shadow-brand-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Record Batch Sale
          </Link>
          <Link
            to="/batches"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold transition-all"
          >
            <Factory className="w-4 h-4" />
            New Batch
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(kpis.gross_revenue)}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cumulative distributor billing</span>
          </div>
        </div>

        {/* Net Surplus */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Operating Surplus</span>
            <div className={`p-2 rounded-xl ${kpis.net_surplus >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className={`mt-3 text-2xl font-black ${kpis.net_surplus >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
            {formatCurrency(kpis.net_surplus)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Revenue minus Batch Mfg Costs
          </div>
        </div>

        {/* Production & Sales Units */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Units Sold / Produced</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
            {kpis.total_units_sold.toLocaleString()} / <span className="text-slate-400 text-lg">{kpis.total_units_produced.toLocaleString()}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {Math.round((kpis.total_units_sold / (kpis.total_units_produced || 1)) * 100)}% inventory depletion rate
          </div>
        </div>

        {/* Low Stock Reorder Alerts */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          kpis.low_stock_batches_count > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Low Stock Batches</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400">
            {kpis.low_stock_batches_count} <span className="text-sm font-normal text-slate-500">at reorder limit</span>
          </div>
          <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
            Requires factory replenishment
          </div>
        </div>
      </div>

      {/* Reorder Alerts Banner */}
      {reorder_alerts.length > 0 && (
        <div className="bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>CRITICAL REORDER ALERTS (Trigger-Monitored Thresholds)</span>
            </div>
            <Link
              to="/batches"
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1"
            >
              <span>Create New Batch</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reorder_alerts.map((alert) => (
              <div
                key={alert.batch_id}
                className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {alert.batch_id} • {alert.model_name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {alert.brand_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400">
                    {alert.remaining_stock} units left
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Limit: {alert.reorder_level}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row of Charts (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue by Brand (Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Gross Revenue by Brand
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated sales revenue across mobile brands
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue_by_brand}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="brand_name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000000}M`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Sales Trend (Line) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Units Sold per Month
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly finished goods delivery run
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales_trend_monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => [value, name === 'units_sold' ? 'Units Sold' : name]} />
                <Line type="monotone" dataKey="units_sold" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Status per Batch (Stacked Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Batch Stock Status (Sold vs Remaining)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stack ratio showing depleted vs available units per lot
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batch_stock_status}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="batch_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sold_qty" name="Sold Units" stackId="a" fill="#10b981" />
                <Bar dataKey="remaining_stock" name="Remaining Units" stackId="a" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: BOM Cost vs List Price per Model (Grouped Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              BOM Cost vs List Price (fn_calculate_model_bom_cost)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hardware component cost compared to retail price per unit
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bom_vs_price}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="model_name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatCurrency(value)]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bom_cost" name="BOM Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="list_price" name="List Price" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

