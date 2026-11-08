import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Factory,
  Boxes,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
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

  const kpis = data?.kpis || {
    total_brands: 0,
    total_models: 0,
    active_batches: 0,
    total_units_produced: 0,
    total_units_sold: 0,
    gross_revenue: 0,
    net_surplus: 0,
    low_stock_batches_count: 0
  };
  const revenue_by_brand = data?.revenue_by_brand || [];
  const sales_trend_monthly = data?.sales_trend_monthly || [];
  const batch_stock_status = data?.batch_stock_status || [];
  const bom_vs_price = data?.bom_vs_price || [];
  const reorder_alerts = data?.reorder_alerts || [];
  const database_engine = data?.database_engine || 'Oracle Database 21c XE';

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    if (currencyUnit === 'millions') {
      return `₹${(num / 1000000).toFixed(2)}M`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const totalProduced = kpis.total_units_produced || 1;
  const depletionRate = Math.round(((kpis.total_units_sold || 0) / totalProduced) * 100);
  const costBasis = (kpis.gross_revenue || 0) - (kpis.net_surplus || 0);
  const roi = costBasis > 0 ? Math.round(((kpis.net_surplus || 0) / costBasis) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Executive Manufacturing Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono">
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Oracle 21c Database Connection:</span>
            <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{database_engine}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Currency Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold border border-slate-200 shadow-2xs">
            <button
              onClick={() => setCurrencyUnit('full')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currencyUnit === 'full'
                  ? 'bg-white text-indigo-700 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Exact (₹)
            </button>
            <button
              onClick={() => setCurrencyUnit('millions')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                currencyUnit === 'millions'
                  ? 'bg-white text-indigo-700 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Millions (M)
            </button>
          </div>

          <Link
            to="/record-sale"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Sale</span>
          </Link>
          <Link
            to="/batches"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-all"
          >
            <Factory className="w-4 h-4 text-indigo-600" />
            <span>New Batch</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (4 Top Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 font-sans tracking-tight">
            {formatCurrency(kpis.gross_revenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>100% Invoiced</span>
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Across 4 Brands</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* Net Operating Surplus */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Net Operating Surplus</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 font-sans tracking-tight">
            {formatCurrency(kpis.net_surplus)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-indigo-600 font-bold">
              +{roi}% Profit Margin
            </span>
            <span className="text-slate-400 text-[11px] font-medium">Gross Less Mfg Cost</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
        </div>

        {/* Depletion Ratio */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Inventory Depletion</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 font-sans tracking-tight">
            {kpis.total_units_sold.toLocaleString()} <span className="text-sm font-normal text-slate-400 font-sans">/ {kpis.total_units_produced.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${depletionRate}%` }} />
            </div>
            <span className="font-mono font-bold text-slate-700">{depletionRate}% Dispatched</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>

        {/* Critical Reorder Alert */}
        <div className={`p-5 rounded-2xl border shadow-card hover:shadow-card-hover transition-all relative overflow-hidden ${
          kpis.low_stock_batches_count > 0
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Reorder Point Limit</span>
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-rose-600 font-sans tracking-tight">
            {kpis.low_stock_batches_count} Batches
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-bold">
              Trigger Monitored
            </span>
            <Link to="/batches" className="text-xs text-rose-700 font-bold hover:underline flex items-center gap-0.5">
              <span>View Lots</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </div>
      </div>

      {/* Critical Reorder Action Center Banner */}
      {reorder_alerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50/40 to-white border-2 border-rose-200 rounded-2xl p-5 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5 text-rose-800 font-extrabold text-sm sm:text-base">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>FACTORY RESTOCK ACTION REQUIRED: {reorder_alerts.length} Batches At or Below Safety Threshold</span>
            </div>
            <Link
              to="/batches"
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 w-max"
            >
              <span>Schedule New Factory Batch</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {reorder_alerts.map((alert) => (
              <div
                key={alert.batch_id}
                className="bg-white border border-rose-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-rose-400 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900">{alert.batch_id}</span>
                    <span className="text-[10px] text-rose-700 font-black px-1.5 py-0.2 bg-rose-50 border border-rose-200 rounded">
                      CRITICAL
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-1 truncate">
                    {alert.model_name}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {alert.brand_name}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Avail: <strong className="text-rose-700 font-bold">{alert.remaining_stock}</strong></span>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Gross Distributor Revenue by Brand
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated sales invoicing across licensed brand accounts
              </p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-indigo-600 hover:underline">
              View Q4 Report
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue_by_brand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="brand_name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000000}M`} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 14px 0 rgba(15,23,42,0.08)', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Sales Depletion Trend (Area) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Finished Goods Shipment Velocity (Monthly)
              </h3>
              <p className="text-xs text-slate-500">
                Monthly volume dispatched to distributor channels
              </p>
            </div>
            <Link to="/sales-history" className="text-xs font-bold text-indigo-600 hover:underline">
              Sales Ledger
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales_trend_monthly}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value, name) => [value, name === 'units_sold' ? 'Dispatched Units' : name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 14px 0 rgba(15,23,42,0.08)', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="units_sold" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Stock Status per Batch (Stacked Bar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Manufacturing Lot Depletion (Sold vs Remaining)
              </h3>
              <p className="text-xs text-slate-500">
                Capacity ratio per manufacturing batch run
              </p>
            </div>
            <Link to="/inventory" className="text-xs font-bold text-indigo-600 hover:underline">
              Inventory Report
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batch_stock_status}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="batch_id" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 14px 0 rgba(15,23,42,0.08)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sold_qty" name="Sold Units" stackId="a" fill="#10b981" />
                <Bar dataKey="remaining_stock" name="Remaining Units" stackId="a" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: BOM Cost vs List Price (Grouped Bar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card flex flex-col justify-between hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Hardware BOM Cost vs Retail List Price
              </h3>
              <p className="text-xs text-slate-500">
                Evaluated live by Oracle Stored Function <code className="font-mono text-amber-700 font-bold">fn_calculate_model_bom_cost</code>
              </p>
            </div>
            <Link to="/cost-optimizer" className="text-xs font-bold text-indigo-600 hover:underline">
              Optimizer
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bom_vs_price}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="model_name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value)]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 14px 0 rgba(15,23,42,0.08)', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="bom_cost" name="BOM Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="list_price" name="Retail List Price" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
