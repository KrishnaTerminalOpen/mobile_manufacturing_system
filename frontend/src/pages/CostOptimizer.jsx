import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Calculator,
  TrendingDown,
  Sparkles,
  Smartphone,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight
} from 'lucide-react';

const CostOptimizer = () => {
  const [searchParams] = useSearchParams();
  const initialModelId = searchParams.get('model_id') || 'MD101';

  const [models, setModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);
  const [targetBatchQty, setTargetBatchQty] = useState(500);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    if (selectedModelId) {
      runOptimization();
    }
  }, [selectedModelId, targetBatchQty]);

  const fetchModels = async () => {
    try {
      const res = await api.get('/models');
      setModels(res.data);
      if (!searchParams.get('model_id') && res.data.length > 0) {
        setSelectedModelId(res.data[0].model_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runOptimization = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sourcing/optimizer', {
        params: {
          model_id: selectedModelId,
          target_batch_qty: targetBatchQty || 500
        }
      });
      setOptimization(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to compute sourcing optimization');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-6 h-6 text-brand-600" />
          Sourcing Cost Optimizer & Margin Engineering
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Analyzes Model Bill of Materials (BOM) against competitive vendor quotes in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-brand-600">SUPPLIED_BY</code> to engineer maximum procurement savings per batch.
        </p>
      </div>

      {/* Control Panel: Select Model & Target Batch Run */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Choose Target Mobile Model
          </label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {models.map((m) => (
              <option key={m.model_id} value={m.model_id}>
                {m.model_id}: {m.model_name} ({m.brand_name}) • Retail: {formatCurrency(m.list_price)}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/3">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
            Target Batch Production Quantity
          </label>
          <input
            type="number"
            min="10"
            step="10"
            value={targetBatchQty}
            onChange={(e) => setTargetBatchQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="w-full md:w-auto pt-4 md:pt-0">
          <button
            onClick={runOptimization}
            className="w-full px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Recalculate
          </button>
        </div>
      </div>

      {loading || !optimization ? (
        <LoadingSkeleton rows={5} cols={4} />
      ) : (
        <>
          {/* Optimization Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Standard Baseline BOM</span>
              <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(optimization.std_bom_cost_per_unit)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Standard cost per mobile unit</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Optimized Sourcing BOM</span>
              <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(optimization.optimized_bom_cost_per_unit)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Best vendor quote allocation</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Unit Savings</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {optimization.saving_percentage}%
                </span>
              </div>
              <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {formatCurrency(optimization.saving_per_unit)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Margin uplift per manufactured phone</div>
            </div>

            <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white p-5 rounded-2xl shadow-lg shadow-brand-500/20">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Total Batch Run Savings</span>
              <div className="mt-2 text-2xl font-black text-white">
                {formatCurrency(optimization.total_savings_for_batch)}
              </div>
              <div className="text-xs text-white/80 mt-1">
                For lot run of {optimization.target_batch_qty.toLocaleString()} units
              </div>
            </div>
          </div>

          {/* Component Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Optimal Procurement Allocation Table
            </h3>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Component & Qty Req</th>
                    <th className="px-5 py-3.5">Standard Cost</th>
                    <th className="px-5 py-3.5">Cheapest Supplier Vendor</th>
                    <th className="px-5 py-3.5">Optimized Cost</th>
                    <th className="px-5 py-3.5">Unit Savings</th>
                    <th className="px-5 py-3.5">Availability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {optimization.breakdown.map((item) => (
                    <tr key={item.component_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {item.component_name}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {item.component_id} • Qty: {item.qty_req}x
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <div>{formatCurrency(item.std_unit_cost)} / unit</div>
                        <div className="text-xs text-slate-400">Total: {formatCurrency(item.std_total_cost)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-brand-500 shrink-0" />
                          <span>{item.best_supplier_name}</span>
                        </div>
                        {item.best_supplier_id && (
                          <div className="text-xs font-mono text-slate-400">
                            ID: {item.best_supplier_id}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.best_supply_cost)} / unit
                        </div>
                        <div className="text-xs text-slate-400">Total: {formatCurrency(item.optimized_total_cost)}</div>
                      </td>
                      <td className="px-5 py-4">
                        {item.unit_savings > 0 ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(item.unit_savings)}
                          </span>
                        ) : (
                          <span className="font-mono text-slate-400">₹0 (Standard)</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.availability.toLowerCase().includes('in stock')
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {item.availability.toLowerCase().includes('in stock') ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {item.availability}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CostOptimizer;

