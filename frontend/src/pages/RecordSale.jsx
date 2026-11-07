import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Boxes
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

  const { isManagerOrAdmin } = useAuth();
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
        toast.warning(`Sale Recorded! CRITICAL ALERT: Remaining stock (${res.data.remaining_stock}) reached or fell below reorder threshold!`, 7000);
      } else {
        toast.success(`Sale ${res.data.sale_id} logged via Oracle PL/SQL Stored Procedure!`);
      }

      setQuantity('');
      fetchBatches();
    } catch (err) {
      // Catch ORA-20001 friendly error
      toast.error(err.friendlyMessage || 'Sale could not be processed.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-brand-600" />
          Record Batch Sale & Inventory Restock Check
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Executes Oracle Stored Procedure <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-brand-600">sp_record_batch_sale_and_restock_check</code> with OUT parameters. Validates stock in real time; blocks overselling with Oracle Trigger <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-600">ORA-20001</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Select Manufacturing Lot Batch
              </label>
              <select
                required
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_id}: {b.model_name} ({b.brand_name}) • Avail: {b.remaining_stock} units
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sale Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sale Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !isManagerOrAdmin}
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <PackageCheck className="w-5 h-5" />
                {submitting ? 'Executing PL/SQL Procedure...' : 'Record Batch Sale'}
              </button>
              {!isManagerOrAdmin && (
                <p className="text-center text-xs text-rose-500 mt-2">
                  Read-only mode: Only Manager or Admin can record sales.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Live Batch Stock Telemetry Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Selected Batch Live Stock
            </h3>
            {selectedBatch ? (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedBatch.model_name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {selectedBatch.brand_name}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Available Stock:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base">
                      {selectedBatch.remaining_stock} units
                    </strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Reorder Level:</span>
                    <strong className="text-rose-500">
                      {selectedBatch.reorder_level} units
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Attempting to sell more than <strong className="text-slate-800 dark:text-slate-200">{selectedBatch.remaining_stock}</strong> units will trigger an Oracle PL/SQL exception (<code className="text-rose-600">ORA-20001</code>).
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Loading batch details...</div>
            )}
          </div>
        </div>
      </div>

      {/* Result Notification Card */}
      {lastResult && (
        <div className={`p-6 rounded-2xl border shadow-lg transition-all animate-fade-in ${
          lastResult.reorder_alert_fired
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-100'
            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
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
                <h3 className="text-lg font-bold">
                  Sale Recorded: {lastResult.sale_id}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                  PL/SQL OUT Params Captured
                </span>
              </div>
              <p className="text-sm font-medium">
                {lastResult.status_message}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Invoice Revenue</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(lastResult.invoice_revenue)}
                  </div>
                </div>

                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Remaining Batch Stock</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                    {lastResult.remaining_stock} units
                  </div>
                </div>

                <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Restock Alert Fired</span>
                  <div className={`text-lg font-bold font-mono ${lastResult.reorder_alert_fired ? 'text-rose-600' : 'text-slate-400'}`}>
                    {lastResult.reorder_alert_fired ? 'YES (Below Reorder)' : 'NO (Healthy)'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => navigate('/sales-history')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <span>View in Sales History</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordSale;

