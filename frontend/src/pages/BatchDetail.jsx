import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Factory,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  PlusCircle,
  History
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const BatchDetail = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatchDetail();
  }, [batchId]);

  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/batches/${batchId}`);
      setBatch(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load batch details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading || !batch) {
    return <LoadingSkeleton rows={6} cols={4} />;
  }

  const isReorder = batch.stock_status === "REORDER IMMEDIATELY";

  // Build timeline data for inventory depletion chart
  let runningStock = batch.production_qty;
  const timelineData = [
    { date: batch.production_date, remaining: batch.production_qty, event: 'Production Run' }
  ];
  batch.sales.forEach(s => {
    runningStock -= s.quantity;
    timelineData.push({
      date: s.sale_date,
      remaining: runningStock,
      sale_id: s.sale_id,
      quantity: s.quantity
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/batches"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {batch.batch_id}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {batch.model_name}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isReorder
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {isReorder ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {batch.stock_status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Brand: {batch.brand_name} • Produced On: {batch.production_date}
            </p>
          </div>
        </div>

        <Link
          to={`/record-sale?batch_id=${batch.batch_id}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Record Sale from this Batch
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lot Production Qty</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {batch.production_qty.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Initial manufactured units</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining Stock</span>
          <div className={`mt-2 text-2xl font-black ${isReorder ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {batch.remaining_stock.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Threshold: {batch.reorder_level} units</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Cost / Unit</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(batch.cost_per_unit)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Actual lot run allocation</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Model BOM Cost</span>
          <div className="mt-2 text-2xl font-black text-amber-500">
            {formatCurrency(batch.bom_cost)}
          </div>
          <div className="text-xs text-slate-500 mt-1">fn_calculate_model_bom_cost</div>
        </div>
      </div>

      {/* Depletion Timeline Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Inventory Stock Depletion Timeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live step-down curve tracking sales against batch capacity
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, batch.production_qty]} />
              <Tooltip formatter={(value) => [`${value} units remaining`]} />
              <Line type="stepAfter" dataKey="remaining" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-brand-600" />
          Batch Sales & Distribution History
        </h3>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Sale ID</th>
                <th className="px-5 py-3.5">Sale Date</th>
                <th className="px-5 py-3.5">Quantity Sold</th>
                <th className="px-5 py-3.5">Distributor Invoice Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {batch.sales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    No sales recorded for this batch yet.
                  </td>
                </tr>
              ) : (
                batch.sales.map((s) => (
                  <tr key={s.sale_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {s.sale_id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      {s.sale_date}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                      {s.quantity.toLocaleString()} units
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.revenue)}
                    </td>
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

export default BatchDetail;
