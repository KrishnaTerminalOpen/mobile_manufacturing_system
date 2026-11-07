import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  History,
  Search,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  Boxes,
  FileSpreadsheet,
  Printer,
  FileText,
  X,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';

const SalesHistory = () => {
  const [sales, setSales] = useState([]);
  const [batches, setBatches] = useState([]);
  const [models, setModels] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [batchFilter, setBatchFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState(null);

  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
    fetchFilterOptions();
  }, [batchFilter, modelFilter, brandFilter, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales', {
        params: {
          batch_id: batchFilter || undefined,
          model_id: modelFilter || undefined,
          brand_id: brandFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      });
      setSales(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load sales ledger');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [bRes, mRes, brRes] = await Promise.all([
        api.get('/batches'),
        api.get('/models'),
        api.get('/brands')
      ]);
      setBatches(bRes.data);
      setModels(mRes.data);
      setBrands(brRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/sales/${deleteTarget.sale_id}`);
      toast.success(`Sale transaction '${deleteTarget.sale_id}' deleted.`);
      setDeleteTarget(null);
      fetchSales();
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to delete sale.');
      setDeleteTarget(null);
    }
  };

  const exportCSV = () => {
    if (sales.length === 0) return;
    const headers = ['Sale ID', 'Batch ID', 'Model Name', 'Brand Name', 'Quantity', 'Sale Date', 'Unit Price', 'Total Revenue'];
    const rows = sales.map(s => [
      s.sale_id,
      s.batch_id,
      `"${s.model_name}"`,
      `"${s.brand_name}"`,
      s.quantity,
      s.sale_date,
      s.unit_price,
      s.total_revenue
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const totalRevenue = sales.reduce((acc, s) => acc + s.total_revenue, 0);
  const totalUnits = sales.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <History className="w-6 h-6 text-blue-600" />
            Distributor Sales Ledger & Invoicing History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Table: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">SALE</code> • Verified against Oracle database triggers and stored procedures.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Ledger (CSV)
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Filtered Revenue</span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total invoiced across filtered batches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Dispatched Units</span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalUnits.toLocaleString()} units
          </div>
          <div className="text-xs text-slate-500 mt-1">Cumulative distributor shipments</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Transaction Records</span>
          <div className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {sales.length} transactions
          </div>
          <div className="text-xs text-slate-500 mt-1">Logged with sequential keys (SL901+)</div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
          ))}
        </select>

        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Models</option>
          {models.map((m) => (
            <option key={m.model_id} value={m.model_id}>{m.model_name}</option>
          ))}
        </select>

        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.model_name})</option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Start Date"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="End Date"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={7} />
      ) : sales.length === 0 ? (
        <EmptyState
          title="No sales transactions found"
          description="Try broadening your filter criteria or recording a new sale."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Sale ID</th>
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Model & Brand</th>
                  <th className="px-6 py-4">Sale Date</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Unit List Price</th>
                  <th className="px-6 py-4">Invoice Total</th>
                  <th className="px-6 py-4 text-right">Invoice & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sales.map((s) => (
                  <tr key={s.sale_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                      {s.sale_id}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {s.batch_id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {s.model_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.brand_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {s.sale_date}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white font-mono">
                      {s.quantity.toLocaleString()} units
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.unit_price)}
                    </td>
                    <td className="px-6 py-4 font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(s.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInvoiceSale(s)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-xs font-bold transition-colors"
                        title="View Official Tax Invoice"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tax Invoice</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Transaction"
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

      {/* Official Tax Invoice Modal */}
      {selectedInvoiceSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative border border-slate-200">
            {/* Modal Controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Document */}
            <div className="space-y-6 text-xs" id="printable-invoice">
              {/* Header */}
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                      ⚡
                    </span>
                    <span className="font-black text-lg text-slate-900">
                      Apex Mobile Manufacturing Corp.
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Plot 44, Electronics City Phase 1, Bengaluru, Karnataka - 560100
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    GSTIN: 29AAACA1234F1Z5 • MCA Mini Project Verification
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-blue-600 font-mono">
                    TAX INVOICE
                  </div>
                  <div className="font-mono text-slate-600 font-bold mt-1">
                    Invoice No: {selectedInvoiceSale.sale_id}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Date: {selectedInvoiceSale.sale_date}
                  </div>
                </div>
              </div>

              {/* Billed To / Shipment Details */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Billed To Distributor:
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    Authorized National Distributor Network
                  </div>
                  <div className="text-slate-600">
                    Retail Channel Partner Code: RET-IN-{selectedInvoiceSale.brand_name.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dispatched from Batch: {selectedInvoiceSale.batch_id}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Manufacturing Provenance:
                  </span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedInvoiceSale.brand_name}
                  </div>
                  <div className="text-slate-500">
                    Model: {selectedInvoiceSale.model_name}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Oracle 21c XE Transaction Trace: Committed
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200 font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">HSN Code</th>
                    <th className="py-2.5 px-3">Batch Lot</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-bold">{selectedInvoiceSale.model_name}</div>
                      <div className="text-[10px] text-slate-500">{selectedInvoiceSale.brand_name} Finished Mobile Device</div>
                    </td>
                    <td className="py-3 px-3 font-mono">85171300</td>
                    <td className="py-3 px-3 font-mono">{selectedInvoiceSale.batch_id}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">{selectedInvoiceSale.quantity}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatCurrency(selectedInvoiceSale.unit_price)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(selectedInvoiceSale.total_revenue)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoiceSale.total_revenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (9.0%):</span>
                    <span className="font-mono">{formatCurrency(selectedInvoiceSale.total_revenue * 0.09)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (9.0%):</span>
                    <span className="font-mono">{formatCurrency(selectedInvoiceSale.total_revenue * 0.09)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-300">
                    <span>Total Invoiced:</span>
                    <span className="font-mono text-blue-600">
                      {formatCurrency(selectedInvoiceSale.total_revenue * 1.18)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-slate-400 text-[10px]">
                <div>
                  <p>Certified Genuine Transaction</p>
                  <p>Oracle DBMS Compound Trigger Validated (No Mutating Table Error)</p>
                </div>
                <div className="text-right">
                  <div className="h-8 border-b border-dashed border-slate-300 w-44 ml-auto mb-1" />
                  <p className="font-bold text-slate-700">Authorized Plant Signatory</p>
                  <p>Manipal Institute of Technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Sale Transaction"
        message={`Are you sure you want to delete sale record '${deleteTarget?.sale_id}'?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SalesHistory;
