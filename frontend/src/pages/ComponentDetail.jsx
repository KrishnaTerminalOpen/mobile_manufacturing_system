import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Cpu,
  ArrowLeft,
  Truck,
  Plus,
  Trash2,
  TrendingDown,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react';

const ComponentDetail = () => {
  const { componentId } = useParams();
  const [component, setComponent] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Quote Form
  const [selectedSuppId, setSelectedSuppId] = useState('');
  const [supplyCost, setSupplyCost] = useState('');
  const [availability, setAvailability] = useState('In Stock');
  const [adding, setAdding] = useState(false);

  const { isManagerOrAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComponentDetail();
    fetchSuppliers();
  }, [componentId]);

  const fetchComponentDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/components/${componentId}`);
      setComponent(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load component details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers');
      setSuppliers(res.data);
      if (res.data.length > 0) {
        setSelectedSuppId(res.data[0].supplier_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuote = async (e) => {
    e.preventDefault();
    if (!selectedSuppId || !supplyCost) {
      toast.error('Supplier and quote price are required.');
      return;
    }
    try {
      setAdding(true);
      await api.post('/supplied-by', {
        component_id: componentId,
        supplier_id: selectedSuppId,
        supply_cost: parseFloat(supplyCost),
        availability: availability.trim()
      });
      toast.success('Supplier sourcing quote saved in SUPPLIED_BY.');
      fetchComponentDetail();
      setSupplyCost('');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to save quote');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteQuote = async (supplierId) => {
    try {
      await api.delete(`/supplied-by/component/${componentId}/supplier/${supplierId}`);
      toast.success('Supplier quote removed.');
      fetchComponentDetail();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete quote');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading || !component) {
    return <LoadingSkeleton rows={6} cols={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/components"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {component.component_id}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {component.component_name}
              </h1>
            </div>
            {component.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {component.description}
              </p>
            )}
          </div>
        </div>

        <Link
          to="/sourcing-matrix"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <Truck className="w-4 h-4" />
          View Full Sourcing Matrix
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Standard Baseline Cost
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(component.unit_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Internal benchmark standard unit cost
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Lowest Market Quote
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60">
              Rank #1
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {component.lowest_quote ? formatCurrency(component.lowest_quote) : 'N/A'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {component.best_supplier_name || 'No quotes available'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Max Unit Savings
          </div>
          <div className="mt-2 text-2xl font-black text-brand-600 dark:text-brand-400">
            {component.lowest_quote ? formatCurrency(component.unit_cost - component.lowest_quote) : '₹0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Procurement efficiency savings per unit
          </div>
        </div>
      </div>

      {/* Sourcing Quotes Table & Add Quote Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" />
            Supplier Quotes (Ranked by Procurement Cost)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Table: SUPPLIED_BY (component_id FK, supplier_id FK, supply_cost, availability)
          </p>
        </div>

        {/* Add Quote Form */}
        {isManagerOrAdmin && (
          <form
            onSubmit={handleAddQuote}
            className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl flex flex-col md:flex-row items-end gap-3"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Supplier Vendor
              </label>
              <select
                value={selectedSuppId}
                onChange={(e) => setSelectedSuppId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {suppliers.map((s) => (
                  <option key={s.supplier_id} value={s.supplier_id}>
                    {s.supplier_id}: {s.supplier_name} ({s.city}, {s.state})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Quote Price (₹)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={supplyCost}
                onChange={(e) => setSupplyCost(e.target.value)}
                placeholder="e.g. 4050"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="w-full md:w-44">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="In Stock">In Stock (Immediate)</option>
                <option value="Lead Time 3d">Lead Time 3d</option>
                <option value="Lead Time 7d">Lead Time 7d</option>
                <option value="Lead Time 14d">Lead Time 14d</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full md:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Saving...' : 'Save Quote'}
            </button>
          </form>
        )}

        {/* Quotes Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Supplier Vendor</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Quote Price</th>
                <th className="px-5 py-3">Saving vs Std</th>
                <th className="px-5 py-3">Availability</th>
                {isManagerOrAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {component.quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-slate-400">
                    No supplier quotes recorded for this component yet.
                  </td>
                </tr>
              ) : (
                component.quotes.map((q, idx) => (
                  <tr
                    key={q.supplier_id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 ${
                      idx === 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {q.supplier_name}
                      {idx === 0 && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          BEST QUOTE
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {q.city}, {q.state}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(q.supply_cost)}
                    </td>
                    <td className="px-5 py-3.5">
                      {q.saving_vs_std > 0 ? (
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          +{formatCurrency(q.saving_vs_std)}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-400">
                          {formatCurrency(q.saving_vs_std)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        q.availability.toLowerCase().includes('in stock')
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {q.availability.toLowerCase().includes('in stock') ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {q.availability}
                      </span>
                    </td>
                    {isManagerOrAdmin && (
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteQuote(q.supplier_id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove Quote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComponentDetail;
