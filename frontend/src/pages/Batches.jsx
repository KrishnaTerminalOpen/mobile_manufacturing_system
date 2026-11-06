import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Factory,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // "OPTIMAL" or "REORDER"

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [form, setForm] = useState({
    model_id: '',
    production_date: new Date().toISOString().slice(0, 10),
    production_qty: '',
    manufacturing_cost: '',
    reorder_level: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { isManagerOrAdmin, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
    fetchModels();
    fetchBrands();
  }, [brandFilter, modelFilter, statusFilter]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batches', {
        params: {
          brand_id: brandFilter || undefined,
          model_id: modelFilter || undefined,
          status_filter: statusFilter || undefined
        }
      });
      setBatches(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load manufacturing batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await api.get('/models');
      setModels(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get('/brands');
      setBrands(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setForm({
      model_id: models[0]?.model_id || '',
      production_date: new Date().toISOString().slice(0, 10),
      production_qty: '500',
      manufacturing_cost: '7000000',
      reorder_level: '100'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBatch(b);
    setForm({
      model_id: b.model_id,
      production_date: b.production_date,
      production_qty: b.production_qty,
      manufacturing_cost: b.manufacturing_cost,
      reorder_level: b.reorder_level
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.model_id || !form.production_qty || !form.manufacturing_cost || form.reorder_level === '') {
      toast.error('All fields are required.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        model_id: form.model_id,
        production_date: form.production_date,
        production_qty: parseInt(form.production_qty),
        manufacturing_cost: parseFloat(form.manufacturing_cost),
        reorder_level: parseInt(form.reorder_level)
      };

      if (editingBatch) {
        await api.put(`/batches/${editingBatch.batch_id}`, payload);
        toast.success(`Batch '${editingBatch.batch_id}' updated successfully.`);
      } else {
        await api.post('/batches', payload);
        toast.success(`Manufacturing batch scheduled and logged.`);
      }
      setModalOpen(false);
      fetchBatches();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to save batch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/batches/${deleteTarget.batch_id}`);
      toast.success(`Batch '${deleteTarget.batch_id}' deleted.`);
      setDeleteTarget(null);
      fetchBatches();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete batch.');
      setDeleteTarget(null);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-brand-600" />
            Manufacturing Batches & Inventory Runs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Table: MANUFACTURING_BATCH (batch_id PK, model_id FK, production_qty, manufacturing_cost, reorder_level)
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Production Batch
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>
              {b.brand_name}
            </option>
          ))}
        </select>

        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Mobile Models</option>
          {models.map((m) => (
            <option key={m.model_id} value={m.model_id}>
              {m.model_id}: {m.model_name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Stock Statuses</option>
          <option value="OPTIMAL">Optimal Stock</option>
          <option value="REORDER">Reorder Immediately</option>
        </select>

        <div className="text-xs text-slate-500 font-medium ml-auto">
          {batches.length} batch{batches.length === 1 ? '' : 'es'} listed
        </div>
      </div>

      {/* Batches Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={7} />
      ) : batches.length === 0 ? (
        <EmptyState
          title="No batches found"
          description="No manufacturing runs match the filter parameters."
          actionText={isManagerOrAdmin ? "Create Batch" : null}
          onAction={isManagerOrAdmin ? handleOpenAdd : null}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Model & Brand</th>
                  <th className="px-6 py-4">Mfg Date</th>
                  <th className="px-6 py-4 min-w-[200px]">Inventory Depletion (Sold / Produced)</th>
                  <th className="px-6 py-4">Remaining Stock</th>
                  <th className="px-6 py-4">Batch Cost / Unit Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {batches.map((b) => {
                  const percentSold = Math.round((b.sold_qty / b.production_qty) * 100);
                  const isReorder = b.stock_status === "REORDER IMMEDIATELY";

                  return (
                    <tr key={b.batch_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/batches/${b.batch_id}`}
                          className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 w-max group"
                        >
                          <span>{b.batch_id}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {b.model_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {b.brand_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {b.production_date}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {b.sold_qty} / {b.production_qty}
                            </span>
                            <span className="text-slate-500 font-semibold">{percentSold}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isReorder ? 'bg-rose-500' : 'bg-brand-500'}`}
                              style={{ width: `${Math.min(percentSold, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        <span className={`text-base font-black ${isReorder ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                          {b.remaining_stock}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Reorder Point: {b.reorder_level}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(b.manufacturing_cost)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          Unit: {formatCurrency(b.cost_per_unit)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isReorder
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {isReorder ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {b.stock_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/batches/${b.batch_id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 inline-block transition-colors"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {isManagerOrAdmin && (
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Batch"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(b)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Batch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingBatch ? `Edit Batch (${editingBatch.batch_id})` : 'Schedule Production Batch'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Target Mobile Model
                </label>
                <select
                  required
                  value={form.model_id}
                  onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {models.map((m) => (
                    <option key={m.model_id} value={m.model_id}>
                      {m.model_id}: {m.model_name} ({m.brand_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Production Date
                </label>
                <input
                  type="date"
                  required
                  value={form.production_date}
                  onChange={(e) => setForm({ ...form, production_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Lot Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.production_qty}
                    onChange={(e) => setForm({ ...form, production_qty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.reorder_level}
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Total Manufacturing Cost (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={form.manufacturing_cost}
                  onChange={(e) => setForm({ ...form, manufacturing_cost: e.target.value })}
                  placeholder="e.g. 7400000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                  {submitting ? 'Scheduling...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Manufacturing Batch"
        message={`Are you sure you want to delete Batch '${deleteTarget?.batch_id}'? If sales have been recorded against this batch, Oracle FK constraints will prevent deletion.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Batches;
