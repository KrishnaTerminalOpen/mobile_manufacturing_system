import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  Cpu,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Truck,
  TrendingDown,
  Layers
} from 'lucide-react';

const Components = () => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form
  const [form, setForm] = useState({
    component_name: '',
    description: '',
    unit_cost: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { isManagerOrAdmin, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComponents();
  }, [search]);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/components', {
        params: { search: search || undefined }
      });
      setComponents(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingComp(null);
    setForm({ component_name: '', description: '', unit_cost: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingComp(c);
    setForm({
      component_name: c.component_name,
      description: c.description || '',
      unit_cost: c.unit_cost
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.component_name.trim() || !form.unit_cost) {
      toast.error('Component name and standard cost are required.');
      return;
    }
    try {
      setSubmitting(true);
      if (editingComp) {
        await api.put(`/components/${editingComp.component_id}`, {
          ...form,
          unit_cost: parseFloat(form.unit_cost)
        });
        toast.success(`Component '${form.component_name}' updated.`);
      } else {
        await api.post('/components', {
          ...form,
          unit_cost: parseFloat(form.unit_cost)
        });
        toast.success(`Component '${form.component_name}' registered.`);
      }
      setModalOpen(false);
      fetchComponents();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Error saving component.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/components/${deleteTarget.component_id}`);
      toast.success(`Component '${deleteTarget.component_name}' deleted.`);
      setDeleteTarget(null);
      fetchComponents();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete component.');
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
            <Cpu className="w-6 h-6 text-brand-600" />
            Component Catalog & Sourcing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Table: COMPONENT (component_id PK, component_name, unit_cost CHECK &gt; 0)
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Component
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components or specs..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium ml-auto">
          {components.length} components available
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={6} />
      ) : components.length === 0 ? (
        <EmptyState
          title="No components found"
          description="No hardware parts match your query."
          actionText={isManagerOrAdmin ? "Add Component" : null}
          onAction={isManagerOrAdmin ? handleOpenAdd : null}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Component ID & Name</th>
                  <th className="px-6 py-4">Standard Unit Cost</th>
                  <th className="px-6 py-4">Best Market Quote</th>
                  <th className="px-6 py-4">Supplier & Sourcing</th>
                  <th className="px-6 py-4">Used In Models</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {components.map((c) => (
                  <tr key={c.component_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {c.component_id}
                        </span>
                        <div>
                          <Link
                            to={`/components/${c.component_id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 group"
                          >
                            <span>{c.component_name}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {c.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {c.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(c.unit_cost)}
                    </td>
                    <td className="px-6 py-4">
                      {c.lowest_quote ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(c.lowest_quote)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                            Save {formatCurrency(c.unit_cost - c.lowest_quote)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No quotes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {c.best_supplier_name ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.best_supplier_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                        <div className="text-[11px] text-slate-500">
                          {c.supplier_count} vendor quote{c.supplier_count === 1 ? '' : 's'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <Layers className="w-3.5 h-3.5" />
                        {c.used_in_models_count} models
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/components/${c.component_id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 transition-colors"
                      >
                        Quotes
                      </Link>
                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Component"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Component"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingComp ? `Edit Component (${editingComp.component_id})` : 'Register Hardware Component'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Component Name
                </label>
                <input
                  type="text"
                  required
                  value={form.component_name}
                  onChange={(e) => setForm({ ...form, component_name: e.target.value })}
                  placeholder="e.g. AMOLED Display 6.7''"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. 120Hz FHD+ Flexible AMOLED Panel"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Standard Unit Cost (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  placeholder="e.g. 4200"
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
                  {submitting ? 'Saving...' : 'Save Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Hardware Component"
        message={`Are you sure you want to delete '${deleteTarget?.component_name}' (${deleteTarget?.component_id})? Note: If used in model BOMs, Oracle FK constraints will prevent deletion.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default Components;
