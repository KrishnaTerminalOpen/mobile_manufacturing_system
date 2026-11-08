import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Smartphone,
  ArrowLeft,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Cpu,
  Info
} from 'lucide-react';

const ModelDetail = () => {
  const { modelId } = useParams();
  const [model, setModel] = useState(null);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Component to BOM Form State
  const [selectedCompId, setSelectedCompId] = useState('');
  const [qtyReq, setQtyReq] = useState(1);
  const [adding, setAdding] = useState(false);

  const { isManagerOrAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchModelDetail();
    fetchComponents();
  }, [modelId]);

  const fetchModelDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/models/${modelId}`);
      setModel(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load model details');
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await api.get('/components');
      setAvailableComponents(res.data);
      if (res.data.length > 0) {
        setSelectedCompId(res.data[0].component_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComponent = async (e) => {
    e.preventDefault();
    if (!selectedCompId || qtyReq <= 0) {
      toast.error('Please select a component and enter a valid quantity.');
      return;
    }
    try {
      setAdding(true);
      await api.post('/requires', {
        model_id: modelId,
        component_id: selectedCompId,
        qty_req: parseInt(qtyReq)
      });
      toast.success('BOM updated! Oracle PL/SQL function recalculated unit BOM cost.');
      fetchModelDetail();
      setQtyReq(1);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to add component to BOM');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveComponent = async (componentId) => {
    try {
      await api.delete(`/requires/model/${modelId}/component/${componentId}`);
      toast.success('Component removed from BOM. Recalculated BOM cost.');
      fetchModelDetail();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to remove component from BOM');
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading || !model) {
    return <LoadingSkeleton rows={6} cols={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/models"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {model.model_id}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {model.model_name}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Brand: <strong className="text-slate-800 dark:text-slate-200">{model.brand_name}</strong> • Launch Year: {model.launch_year}
            </p>
          </div>
        </div>

        <Link
          to={`/cost-optimizer?model_id=${model.model_id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <TrendingUp className="w-4 h-4" />
          Run Sourcing Cost Optimizer
        </Link>
      </div>

      {/* Financial & BOM Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Retail List Price */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Distributor List Price
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(model.list_price)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Per-unit selling price to retail channels
          </div>
        </div>

        {/* Live BOM Cost */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Live BOM Unit Cost
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 rounded">
              fn_calculate_model_bom_cost
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(model.bom_cost)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Computed sum: SUM(qty_req * unit_cost)
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Unit Gross Margin
            </span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
              {model.margin_percent}%
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(model.margin)}
          </div>
          <div className="mt-2 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(Math.max(model.margin_percent, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* BOM Editor Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              Bill of Materials (BOM) Editor
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Table: REQUIRES (model_id, component_id, qty_req) • Changes instantly invoke PL/SQL function
            </p>
          </div>
        </div>

        {/* Add Component Form */}
        {isManagerOrAdmin && (
          <form
            onSubmit={handleAddComponent}
            className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl flex flex-col md:flex-row items-end gap-3"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Select Hardware Component
              </label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {availableComponents.map((c) => (
                  <option key={c.component_id} value={c.component_id}>
                    {c.component_id}: {c.component_name} (Std Cost: {formatCurrency(c.unit_cost)})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Qty Required
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={qtyReq}
                onChange={(e) => setQtyReq(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full md:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Updating...' : 'Add / Update BOM'}
            </button>
          </form>
        )}

        {/* BOM Items Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Component ID</th>
                <th className="px-5 py-3">Component Name & Specs</th>
                <th className="px-5 py-3">Std Unit Cost</th>
                <th className="px-5 py-3">Qty Req</th>
                <th className="px-5 py-3">Total Subcost</th>
                {isManagerOrAdmin && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {model.components.map((item) => (
                <tr key={item.component_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                    {item.component_id}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {item.component_name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-500">{item.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    {formatCurrency(item.unit_cost)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                      × {item.qty_req}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(item.line_cost)}
                  </td>
                  {isManagerOrAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveComponent(item.component_id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove from BOM"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-right uppercase text-xs tracking-wider">
                  Total Bill of Materials (BOM) Cost:
                </td>
                <td className="px-5 py-3 font-mono text-amber-600 dark:text-amber-400 text-base">
                  {formatCurrency(model.bom_cost)}
                </td>
                {isManagerOrAdmin && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelDetail;

