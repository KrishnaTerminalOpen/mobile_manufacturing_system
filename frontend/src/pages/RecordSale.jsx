import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  PackageCheck,
  Boxes,
  Printer,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Building2,
  Lock
} from 'lucide-react';

const RecordSale = () => {
  const [searchParams] = useSearchParams();
  const initialBatch = searchParams.get('batch_id') || '';

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatch);
  const [quantity, setQuantity] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const { isManagerOrAdmin, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
      if (!initialBatch && res.data.length > 0) {
        setSelectedBatchId(res.data[0].batch_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedBatch = batches.find(b => b.batch_id === selectedBatchId);
  const numQty = parseInt(quantity) || 0;
  const currentAvail = selectedBatch?.remaining_stock || 0;
  const projectedStock = currentAvail - numQty;
  const isOverselling = numQty > currentAvail;
  const willTriggerReorder = projectedStock >= 0 && projectedStock <= (selectedBatch?.reorder_level || 0);

  // Price calculations
  const unitPrice = selectedBatch ? (selectedBatch.manufacturing_cost / selectedBatch.production_qty * 1.5) : 0; // fallback or list price
  // Better yet, fetch model price:
  const estimatedListPrice = selectedBatch?.list_price || 28999;
  const subtotal = numQty * estimatedListPrice;
  const gstAmount = subtotal * 0.18;
  const grandTotal = subtotal + gstAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !quantity || parseInt(quantity) <= 0) {
      toast.error('Please select a batch and enter a valid quantity.');
      return;
    }

    setSubmitting(true);
    setLastResult(null);

    try {
      const res = await api.post('/sales', {
        batch_id: selectedBatchId,
        quantity: parseInt(quantity),
        sale_date: saleDate,
        sale_id: 'AUTO'
      });

      setLastResult(res.data);

      if (res.data.reorder_alert_fired) {
        toast.warning(
          `Sale Registered! REORDER ALERT: Stock level (${res.data.remaining_stock}) reached or fell below threshold!`,
          7000
        );
      } else {
        toast.success(`Sale ${res.data.sale_id} processed by Oracle Stored Procedure sp_record_batch_sale_and_restock_check!`);
      }

      setQuantity('');
      fetchBatches();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Sale could not be processed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Finished Goods Sales Dispatch & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Oracle Stored Procedure <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-mono">sp_record_batch_sale_and_restock_check</code> with OUT parameters and Compound Trigger validation.
          </p>
        </div>
        <Link
          to="/sales-history"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-max"
        >
          <span>View Invoicing Ledger</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  1. Select Manufacturing Batch Lot
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {batches.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.batch_id}: {b.model_name} ({b.brand_name}) • Available Stock: {b.remaining_stock} units
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    2. Dispatch Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter units to sell (e.g. 50)"
                    className={`w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 ${
                      isOverselling
                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    3. Transaction Date
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Pre-Execution Feedback Strip */}
              {selectedBatch && (
                <div className={`p-4 rounded-xl border transition-all text-xs ${
                  isOverselling
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    : willTriggerReorder
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {isOverselling ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : willTriggerReorder ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>
                      {isOverselling
                        ? `Overselling Detected: Requested ${numQty} exceeds ${currentAvail} available!`
                        : willTriggerReorder
                        ? `Restock Warning: Stock will drop to ${projectedStock} (At or below reorder limit: ${selectedBatch.reorder_level})`
                        : `Stock Healthy: Projected remaining inventory will be ${projectedStock} units.`}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 leading-relaxed">
                    {isOverselling
                      ? 'The Oracle Compound Trigger will execute RAISE_APPLICATION_ERROR(-20001) to safeguard data integrity.'
                      : willTriggerReorder
                      ? 'The stored procedure will flag o_reorder_alert := \'Y\' and record an event in SALE_AUDIT.'
                      : 'Inventory capacity is sufficient to satisfy distributor order.'}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={submitting || !isManagerOrAdmin}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                    isOverselling
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'
                  } disabled:opacity-50`}
                >
                  <PackageCheck className="w-5 h-5" />
                  {submitting
                    ? 'Executing PL/SQL Stored Procedure...'
                    : isOverselling
                    ? 'Submit Sale (Trigger Block Simulation)'
                    : 'Authorize & Record Batch Sale'}
                </button>
                {!isManagerOrAdmin && (
                  <p className="text-center text-xs text-rose-500 mt-2 font-semibold">
                    Read-Only Mode: You must log in as ADMIN or MANAGER to execute sales transactions.
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Last Result Card */}
          {lastResult && (
            <div className={`p-6 rounded-2xl border shadow-xl transition-all animate-slide-up ${
              lastResult.reorder_alert_fired
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-100'
                : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  lastResult.reorder_alert_fired
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                }`}>
                  {lastResult.reorder_alert_fired ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">
                      Sale Registered: <span className="font-mono">{lastResult.sale_id}</span>
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                      OUT Params OK
                    </span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed">
                    {lastResult.status_message}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Invoice Revenue</span>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(lastResult.invoice_revenue)}
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Remaining Units</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {lastResult.remaining_stock} units
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Restock Alert</span>
                      <div className={`text-base font-bold font-mono ${lastResult.reorder_alert_fired ? 'text-rose-600' : 'text-slate-400'}`}>
                        {lastResult.reorder_alert_fired ? 'YES (Below Point)' : 'NO (Healthy)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Real-Time Stock & Telemetry */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Lot Capacity Meter</span>
              <span className="text-blue-600 font-mono">{selectedBatch?.batch_id}</span>
            </h3>

            {selectedBatch ? (
              <div className="space-y-3">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedBatch.model_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedBatch.brand_name} • Lot Run {selectedBatch.production_date}
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Stock Availability</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentAvail} / {selectedBatch.production_qty}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${Math.max(0, (projectedStock / selectedBatch.production_qty) * 100)}%` }}
                    />
                    {numQty > 0 && !isOverselling && (
                      <div
                        className="bg-blue-500 h-full animate-pulse"
                        style={{ width: `${Math.min(100, (numQty / selectedBatch.production_qty) * 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Reorder Point: {selectedBatch.reorder_level}</span>
                    <span>Depletion: {Math.round((selectedBatch.sold_qty / selectedBatch.production_qty) * 100)}%</span>
                  </div>
                </div>

                {/* Estimated Invoicing Summary */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    Estimated Billing Breakdown
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Retail Price per Unit:</span>
                    <span className="font-mono">{formatCurrency(estimatedListPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Requested Subtotal:</span>
                    <span className="font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Applicable GST (18%):</span>
                    <span className="font-mono">{formatCurrency(gstAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Estimated Total:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Select a manufacturing batch to view real-time stock.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordSale;
