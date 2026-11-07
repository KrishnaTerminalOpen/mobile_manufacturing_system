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
  ShieldAlert,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  Download,
  Filter
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
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currencyUnit, setCurrencyUnit] = useState('full'); // 'full' or 'millions'
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

  const { kpis, revenue_by_brand, sales_trend_monthly, batch_stock_status, bom_vs_price, reorder_alerts, database_engine } = data;

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    if (currencyUnit === 'millions') {
      return `₹${(num / 1000000).toFixed(2)}M`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const depletionRate = Math.round((kpis.total_units_sold / (kpis.total_units_produced || 1)) * 100);
  const roi = Math.round((kpis.net_surplus / (kpis.gross_revenue - kpis.net_surplus || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Executive Manufacturing Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Oracle 21c Database Connection: <strong className="text-slate-700 dark:text-slate-300">{database_engine}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrencyUnit('full')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyUnit === 'full'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Exact (₹)
            </button>
            <button
              onClick={() => setCurrencyUnit('millions')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currencyUnit === 'millions'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Millions (M)
            </button>
          </div>

          <Link
            to="/record-sale"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Record Sale
          </Link>
          <Link
            to="/batches"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-all"
          >
            <Factory className="w-4 h-4" />
            New Batch
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (4 Top Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(kpis.gross_revenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% Invoiced</span>
            </span>
            <span className="text-slate-400 text-[11px]">Across 4 Brands</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* Net Operating Surplus */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Net Operating Surplus</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatCurrency(kpis.net_surplus)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              +{roi}% Profit Margin
            </span>
            <span className="text-slate-400 text-[11px]">Gross Less Mfg Cost</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {/* Depletion Ratio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Inventory Depletion</span>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {kpis.total_units_sold.toLocaleString()} <span className="text-sm font-normal text-slate-400 font-sans">/ {kpis.total_units_produced.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${depletionRate}%` }} />
            </div>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{depletionRate}% Dispatched</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>

        {/* Critical Reorder Alert */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          kpis.low_stock_batches_count > 0
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Reorder Point Limit</span>
            <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {kpis.low_stock_batches_count} Batches
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              Trigger Monitored
            </span>
            <Link to="/batches" className="text-xs text-rose-700 dark:text-rose-300 font-bold hover:underline flex items-center gap-0.5">
              <span>View Lots</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </div>
      </div>

      {/* Critical Reorder Action Center Banner */}
      {reorder_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border-2 border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-300 font-bold text-sm sm:text-base">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>FACTORY RESTOCK ACTION REQUIRED: {reorder_alerts.length} Batches At or Below Safety Threshold</span>
            </div>
            <Link
              to="/batches"
              className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 w-max"
            >
              <span>Schedule New Factory Batch</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {reorder_alerts.map((alert) => (
              <div
                key={alert.batch_id}
                className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/80 rounded-xl p-3.5 flex flex-col justify-between shadow-xs hover:border-rose-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{alert.batch_id}</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-black px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950 rounded">
                      CRITICAL
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-1 truncate">
                    {alert.model_name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {alert.brand_name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Avail: <strong className="text-rose-600">{alert.remaining_stock}</strong></span>
                  <span className="text-slate-400 text-[10px]">Min: {alert.reorder_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytical Charts Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue by Brand (Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Gross Distributor Revenue by Brand
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggregated sales invoicing across licensed brand accounts
              </p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View Q4 Report
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue_by_brand}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="brand_name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000000}M`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Sales Depletion Trend (Area) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Finished Goods Shipment Velocity (Monthly)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly volume dispatched to distributor channels
              </p>
            </div>
            <Link to="/sales-history" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Sales Ledger
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend_monthly}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'units_sold' ? 'Dispatched Units' : name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="units_sold" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Status per Batch (Stacked Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Manufacturing Lot Depletion (Sold vs Remaining)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Capacity ratio per manufacturing batch run
              </p>
            </div>
            <Link to="/inventory" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Inventory Report
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batch_stock_status}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="batch_id" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sold_qty" name="Sold Units" stackId="a" fill="#10b981" />
                <Bar dataKey="remaining_stock" name="Remaining Units" stackId="a" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: BOM Cost vs List Price (Grouped Bar) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Hardware BOM Cost vs Retail List Price
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluated live by Oracle Stored Function <code className="font-mono text-amber-500">fn_calculate_model_bom_cost</code>
              </p>
            </div>
            <Link to="/cost-optimizer" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Optimizer
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bom_vs_price}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="model_name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value)]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bom_cost" name="BOM Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="list_price" name="Retail List Price" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
