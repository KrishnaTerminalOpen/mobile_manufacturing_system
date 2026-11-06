import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  History,
  Search,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  Boxes,
  FileSpreadsheet
} from 'lucide-react';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [batches, setBatches] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [batchFilter, setBatchFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
    fetchFilterOptions();
  }, [batchFilter, modelFilter, brandFilter, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales', {
        params: {
          batch_id: batchFilter || undefined,
          model_id: modelFilter || undefined,
          brand_id: brandFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      });
      setSales(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [bRes, mRes, brRes] = await Promise.all([
        api.get('/batches'),
        api.get('/models'),
        api.get('/brands')
      ]);
      setBatches(bRes.data);
      setModels(mRes.data);
      setBrands(brRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/sales/${deleteTarget.sale_id}`);
      toast.success(`Sale transaction '${deleteTarget.sale_id}' deleted.`);
      setDeleteTarget(null);
      fetchSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete sale.');
      setDeleteTarget(null);
    }
  };

  const exportCSV = () => {
    if (sales.length === 0) return;
    const headers = ['Sale ID', 'Batch ID', 'Model Name', 'Brand Name', 'Quantity', 'Sale Date', 'Unit Price', 'Total Revenue'];
    const rows = sales.map(s => [
      s.sale_id,
      s.batch_id,
      `"${s.model_name}"`,
      `"${s.brand_name}"`,
      s.quantity,
      s.sale_date,
      s.unit_price,
      s.total_revenue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalUnits = sales.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            Sales Ledger & Invoicing History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Table: SALE (sale_id PK, batch_id FK, quantity, sale_date)
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold transition-all shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Export CSV
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtered Invoiced Revenue</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units Dispatched</span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalUnits.toLocaleString()} units
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Records</span>
          <div className="mt-1 text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
            {sales.length} sales
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
          ))}
        </select>

        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Models</option>
          {models.map((m) => (
            <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
          ))}
        </select>

        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.model_name})</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={7} />
      ) : sales.length === 0 ? (
        <EmptyState
          title="No sales transactions found"
          description="Try broadening your date range or filters."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Sale ID</th>
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Model & Brand</th>
                  <th className="px-6 py-4">Sale Date</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Unit List Price</th>
                  <th className="px-6 py-4">Invoice Total</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sales.map((s) => (
                  <tr key={s.sale_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {s.sale_id}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-brand-600 font-semibold">
                      {s.batch_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.model_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.brand_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {s.sale_date}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {s.quantity.toLocaleString()} units
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.unit_price)}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.total_revenue)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Sale Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Sale Transaction"
        message={`Are you sure you want to delete sale record '${deleteTarget?.sale_id}'?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SalesHistory;
