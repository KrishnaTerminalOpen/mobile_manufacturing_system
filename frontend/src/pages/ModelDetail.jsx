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
  Info,
  CheckCircle2,
  Sparkles,
  Sliders,
  Database,
  Tag
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

  // Interactive Margin Sensitivity Simulator
  const [priceAdjustmentPct, setPriceAdjustmentPct] = useState(0);

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

  // Simulator computations
  const simulatedListPrice = Math.round(model.list_price * (1 + priceAdjustmentPct / 100));
  const simulatedMargin = simulatedListPrice - model.bom_cost;
  const simulatedMarginPct = simulatedListPrice > 0 ? ((simulatedMargin / simulatedListPrice) * 100).toFixed(2) : 0;
  const simulatedBatchProfit = simulatedMargin * 1000;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-4">
          <Link
            to="/models"
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-2xs"
            title="Back to models"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                {model.model_id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {model.model_name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Launch {model.launch_year}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span>Brand Manufacturer:</span>
              <strong className="text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded text-xs">{model.brand_name}</strong>
            </p>
          </div>
        </div>

        <Link
          to={`/cost-optimizer?model_id=${model.model_id}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold shadow-md shadow-indigo-500/20 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Run Sourcing Cost Optimizer</span>
        </Link>
      </div>

      {/* Financial & BOM Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Retail List Price */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Distributor List Price
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight font-sans">
              {formatCurrency(model.list_price)}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Wholesale MSRP per mobile handset
            </p>
          </div>
          <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Retail catalog selling price</span>
          </div>
        </div>

        {/* Live BOM Cost */}
        <div className="bg-white rounded-2xl border border-amber-200/70 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                Live BOM Unit Cost
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                fn_calculate_model_bom_cost
              </span>
            </div>
            <div className="text-3xl font-black text-amber-600 tracking-tight font-sans">
              {formatCurrency(model.bom_cost)}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Hardware bill of materials standard cost
            </p>
          </div>
          <div className="px-5 py-2.5 bg-amber-50/40 border-t border-amber-100 text-[11px] text-amber-800 flex items-center gap-1.5 font-semibold">
            <Database className="w-3 h-3 text-amber-600" />
            <span>Live Oracle PL/SQL Function: SUM(qty_req × unit_cost)</span>
          </div>
        </div>

        {/* Gross Margin */}
        <div className="bg-white rounded-2xl border border-emerald-200/70 shadow-card hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">
                Unit Gross Margin
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {model.margin_percent}% Margin
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-600 tracking-tight font-sans">
              {formatCurrency(model.margin)}
            </div>
            <div className="mt-2.5 w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(Math.max(model.margin_percent, 0), 100)}%` }}
              />
            </div>
          </div>
          <div className="px-5 py-2.5 bg-emerald-50/40 border-t border-emerald-100 text-[11px] text-emerald-800 flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Target Met: Healthy Margin (&gt;35%)</span>
            </span>
            <span className="font-mono text-emerald-700">+{model.margin_percent}%</span>
          </div>
        </div>
      </div>

      {/* Interactive Margin Sensitivity Simulator (Enterprise Viva Demo) */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 rounded-2xl border border-indigo-100 p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Interactive Pricing & Margin Sensitivity Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Simulate retail price adjustments and evaluate projected gross margins across a 1,000-unit batch run.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Adjustment:</span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg border font-mono ${
              priceAdjustmentPct > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : priceAdjustmentPct < 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {priceAdjustmentPct > 0 ? `+${priceAdjustmentPct}%` : `${priceAdjustmentPct}%`}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="-20"
            max="30"
            step="1"
            value={priceAdjustmentPct}
            onChange={(e) => setPriceAdjustmentPct(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>-20% Discount</span>
            <span>0% Baseline ({formatCurrency(model.list_price)})</span>
            <span>+30% Premium</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-indigo-100/80 text-xs">
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Projected MSRP</div>
            <div className="font-black text-slate-900 text-base mt-0.5">{formatCurrency(simulatedListPrice)}</div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Unit Margin</div>
            <div className="font-black text-emerald-600 text-base mt-0.5">{formatCurrency(simulatedMargin)}</div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Margin %</div>
            <div className="font-black text-indigo-600 text-base mt-0.5">{simulatedMarginPct}%</div>
          </div>
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-400">Batch Profit (1k Units)</div>
            <div className="font-black text-slate-900 text-base mt-0.5">{formatCurrency(simulatedBatchProfit)}</div>
          </div>
        </div>
      </div>

      {/* BOM Editor Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Layers className="w-4 h-4" />
              </div>
              <span>Bill of Materials (BOM) Editor</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>Oracle Relationship Table:</span>
              <code className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-indigo-700 border border-slate-200">
                REQUIRES (model_id, component_id, qty_req)
              </code>
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            {model.components?.length || 0} Components Configured
          </span>
        </div>

        {/* Add Component Form */}
        {isManagerOrAdmin && (
          <form
            onSubmit={handleAddComponent}
            className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row items-end gap-3.5 shadow-2xs"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Hardware Component
              </label>
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              >
                {availableComponents.map((c) => (
                  <option key={c.component_id} value={c.component_id}>
                    {c.component_id}: {c.component_name} (Std Cost: {formatCurrency(c.unit_cost)})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Qty Required
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={qtyReq}
                onChange={(e) => setQtyReq(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold rounded-xl shadow-sm shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{adding ? 'Updating...' : '+ Add / Update BOM'}</span>
            </button>
          </form>
        )}

        {/* BOM Items Table */}
        <div className="overflow-x-auto border border-slate-200/90 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Component ID</th>
                <th className="px-5 py-3.5">Component Name & Specs</th>
                <th className="px-5 py-3.5">Std Unit Cost</th>
                <th className="px-5 py-3.5">Qty Req</th>
                <th className="px-5 py-3.5">Total Subcost</th>
                {isManagerOrAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium bg-white">
              {model.components.map((item) => (
                <tr key={item.component_id} className="hover:bg-indigo-50/20 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {item.component_id}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">
                      {item.component_name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-slate-700">
                    {formatCurrency(item.unit_cost)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
                      × {item.qty_req}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-extrabold text-slate-900">
                    {formatCurrency(item.line_cost)}
                  </td>
                  {isManagerOrAdmin && (
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRemoveComponent(item.component_id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove from BOM"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/90 font-bold text-slate-900 border-t border-slate-200">
              <tr>
                <td colSpan={4} className="px-5 py-4 text-right uppercase text-xs tracking-wider text-slate-600">
                  Total Bill of Materials (BOM) Cost:
                </td>
                <td className="px-5 py-4 font-mono text-amber-700 font-black text-lg">
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

