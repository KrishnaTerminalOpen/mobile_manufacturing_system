import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Smartphone,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

const Models = () => {
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [form, setForm] = useState({
    brand_id: '',
    model_name: '',
    launch_year: new Date().getFullYear(),
    list_price: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { isManagerOrAdmin, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
    fetchBrands();
  }, [search, brandFilter]);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const res = await api.get('/models', {
        params: {
          search: search || undefined,
          brand_id: brandFilter || undefined
        }
      });
      setModels(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load models');
    } finally {
      setLoading(false);
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
    setEditingModel(null);
    setForm({
      brand_id: brands[0]?.brand_id || '',
      model_name: '',
      launch_year: 2026,
      list_price: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingModel(m);
    setForm({
      brand_id: m.brand_id,
      model_name: m.model_name,
      launch_year: m.launch_year,
      list_price: m.list_price
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.brand_id || !form.model_name.trim() || !form.list_price) {
      toast.error('All fields are required.');
      return;
    }
    try {
      setSubmitting(true);
      if (editingModel) {
        await api.put(`/models/${editingModel.model_id}`, {
          ...form,
          list_price: parseFloat(form.list_price),
          launch_year: parseInt(form.launch_year)
        });
        toast.success(`Model '${form.model_name}' updated.`);
      } else {
        await api.post('/models', {
          ...form,
          list_price: parseFloat(form.list_price),
          launch_year: parseInt(form.launch_year)
        });
        toast.success(`Model '${form.model_name}' created.`);
      }
      setModalOpen(false);
      fetchModels();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Error saving model.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/models/${deleteTarget.model_id}`);
      toast.success(`Model '${deleteTarget.model_name}' deleted.`);
      setDeleteTarget(null);
      fetchModels();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete model.');
      setDeleteTarget(null);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Smartphone className="w-5 h-5" />
            </div>
            <span>Mobile Device Models & Bill of Materials</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Oracle Table:</span>
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold border border-slate-200">MOBILE_MODEL</code>
            <span>• Live PL/SQL Function:</span>
            <code className="text-xs bg-amber-50 px-1.5 py-0.5 rounded text-amber-800 font-mono font-bold border border-amber-200">fn_calculate_model_bom_cost</code>
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold shadow-sm shadow-indigo-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Model</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model name or brand..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>
              {b.brand_name}
            </option>
          ))}
        </select>
        <div className="text-xs text-slate-500 font-bold ml-auto hidden sm:block bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          {models.length} model{models.length === 1 ? '' : 's'} registered
        </div>
      </div>

      {/* Models Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={6} />
      ) : models.length === 0 ? (
        <EmptyState
          title="No models found"
          description="Try clearing your search query or brand filter."
          actionText={isManagerOrAdmin ? "Add Model" : null}
          onAction={isManagerOrAdmin ? handleOpenAdd : null}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Model ID & Name</th>
                  <th className="px-6 py-4">Brand Manufacturer</th>
                  <th className="px-6 py-4">Launch Year</th>
                  <th className="px-6 py-4">List Price (MSRP)</th>
                  <th className="px-6 py-4">PL/SQL BOM Cost</th>
                  <th className="px-6 py-4">Gross Margin</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {models.map((m) => (
                  <tr key={m.model_id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {m.model_id}
                        </span>
                        <Link
                          to={`/models/${m.model_id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5 group transition-colors"
                        >
                          <span>{m.model_name}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {m.brand_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">
                      {m.launch_year}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 font-sans">
                      {formatCurrency(m.list_price)}
                    </td>
                    <td className="px-6 py-4 font-mono text-amber-700 font-bold">
                      {formatCurrency(m.bom_cost)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-black text-emerald-600 font-sans">
                            {formatCurrency(m.margin)}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.margin_percent}%
                          </span>
                        </div>
                        <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                            style={{ width: `${Math.min(Math.max(m.margin_percent, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/models/${m.model_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-colors shadow-2xs"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>BOM Specs</span>
                      </Link>
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Model"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Model"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-dropdown">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{editingModel ? `Edit Model (${editingModel.model_id})` : 'Create Mobile Model'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Oracle Sequence
              </span>
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Brand Manufacturer
                </label>
                <select
                  required
                  value={form.brand_id}
                  onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.brand_name} ({b.city})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Model Commercial Name
                </label>
                <input
                  type="text"
                  required
                  value={form.model_name}
                  onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                  placeholder="e.g. Astra Nova 5G"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Launch Year
                  </label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max="2100"
                    value={form.launch_year}
                    onChange={(e) => setForm({ ...form, launch_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    List Price (₹ MSRP)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="1"
                    value={form.list_price}
                    onChange={(e) => setForm({ ...form, list_price: e.target.value })}
                    placeholder="e.g. 28999"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-500/20 transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Mobile Model"
        message={`Are you sure you want to delete model '${deleteTarget?.model_name}' (${deleteTarget?.model_id})? Note: If production batches exist for this model, Oracle FK constraints will prevent deletion.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Models;

