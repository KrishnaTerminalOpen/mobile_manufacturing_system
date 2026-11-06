import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  FileSpreadsheet,
  Download,
  Boxes,
  Smartphone,
  Truck,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventoryData, setInventoryData] = useState([]);
  const [bomMarginData, setBomMarginData] = useState([]);
  const [supplierQuotesData, setSupplierQuotesData] = useState([]);
  const [brandFinanceData, setBrandFinanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const [invRes, bomRes, suppRes, brandRes] = await Promise.all([
        api.get('/reports/inventory'),
        api.get('/reports/bom-margin'),
        api.get('/reports/supplier-quotes'),
        api.get('/reports/brand-finance')
      ]);
      setInventoryData(invRes.data);
      setBomMarginData(bomRes.data);
      setSupplierQuotesData(suppRes.data);
      setBrandFinanceData(brandRes.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  const downloadCSV = (filename, headers, rows) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentReport = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    if (activeTab === 'inventory') {
      const headers = ['Batch ID', 'Brand', 'Model', 'Mfg Date', 'Produced Qty', 'Sold Qty', 'Remaining Stock', 'Reorder Level', 'Status', 'Mfg Cost', 'Inventory Valuation'];
      const rows = inventoryData.map(r => [r.batch_id, `"${r.brand_name}"`, `"${r.model_name}"`, r.production_date, r.production_qty, r.sold_qty, r.remaining_stock, r.reorder_level, `"${r.stock_status}"`, r.manufacturing_cost, r.inventory_valuation]);
      downloadCSV(`inventory_summary_report_${dateStr}.csv`, headers, rows);
    } else if (activeTab === 'bom') {
      const headers = ['Model ID', 'Brand', 'Model Name', 'Launch Year', 'List Price', 'PL/SQL BOM Cost', 'Gross Margin', 'Margin Percent'];
      const rows = bomMarginData.map(r => [r.model_id, `"${r.brand_name}"`, `"${r.model_name}"`, r.launch_year, r.list_price, r.bom_cost, r.gross_margin, r.margin_percent]);
      downloadCSV(`bom_gross_margin_report_${dateStr}.csv`, headers, rows);
    } else if (activeTab === 'suppliers') {
      const headers = ['Component ID', 'Component Name', 'Standard Unit Cost', 'Lowest Market Quote', 'Unit Saving', 'Cheapest Supplier', 'Availability', 'Quotes Count'];
      const rows = supplierQuotesData.map(r => [r.component_id, `"${r.component_name}"`, r.std_unit_cost, r.lowest_quote, r.saving_per_unit, `"${r.cheapest_supplier}"`, `"${r.availability}"`, r.total_quotes_count]);
      downloadCSV(`supplier_quotes_report_${dateStr}.csv`, headers, rows);
    } else if (activeTab === 'brand') {
      const headers = ['Brand ID', 'Brand Name', 'Total Models', 'Total Batches', 'Units Produced', 'Units Sold', 'Total Mfg Cost (CTE)', 'Total Gross Revenue', 'Net Surplus', 'ROI Percent'];
      const rows = brandFinanceData.map(r => [r.brand_id, `"${r.brand_name}"`, r.total_models, r.total_batches, r.total_units_produced, r.total_units_sold, r.total_manufacturing_cost, r.total_gross_revenue, r.net_surplus, r.roi_percent]);
      downloadCSV(`brand_financial_performance_report_${dateStr}.csv`, headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-brand-600" />
            Executive Business Reports & Analytical Queries
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            4 standard DBMS queries with subqueries, CTE aggregations, PL/SQL functions, and data export.
          </p>
        </div>
        <button
          onClick={exportCurrentReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-semibold transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Export Active Report to CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Query 1: Inventory Summary
        </button>

        <button
          onClick={() => setActiveTab('bom')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'bom'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Query 2: Model Gross Margin
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          Query 3: Sourcing Lowest Quotes
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'brand'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Query 4: Brand Financials (CTE Fixed)
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : (
        <div className="space-y-6">
          {/* TAB 1: INVENTORY SUMMARY */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-brand-50/60 dark:bg-slate-800/60 border border-brand-200 dark:border-slate-700 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>DBMS Concept:</strong> Computes finished goods asset valuation by calculating unit production cost (<code className="font-mono">manufacturing_cost / production_qty</code>) multiplied by remaining un-dispatched inventory.
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Batch ID</th>
                        <th className="px-6 py-4">Brand & Model</th>
                        <th className="px-6 py-4">Mfg Date</th>
                        <th className="px-6 py-4">Produced / Sold</th>
                        <th className="px-6 py-4">Remaining Stock</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Unsold Inventory Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {inventoryData.map((r) => {
                        const isReorder = r.stock_status === "REORDER IMMEDIATELY";
                        return (
                          <tr key={r.batch_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                              {r.batch_id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-900 dark:text-white">{r.model_name}</div>
                              <div className="text-xs text-slate-400">{r.brand_name}</div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">{r.production_date}</td>
                            <td className="px-6 py-4 font-mono">
                              {r.sold_qty} / {r.production_qty}
                            </td>
                            <td className="px-6 py-4 font-mono">
                              <span className={`font-black ${isReorder ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                                {r.remaining_stock}
                              </span>
                              <span className="text-xs text-slate-400"> (Limit: {r.reorder_level})</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isReorder
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                {isReorder ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {r.stock_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(r.inventory_valuation)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOM GROSS MARGIN */}
          {activeTab === 'bom' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-brand-50/60 dark:bg-slate-800/60 border border-brand-200 dark:border-slate-700 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>DBMS Concept:</strong> Computes the profit spread between distributor selling price and total hardware bill of materials, calculated via the PL/SQL stored function <code className="font-mono">fn_calculate_model_bom_cost(p_model_id)</code>.
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Model ID & Name</th>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Launch Year</th>
                        <th className="px-6 py-4">Distributor Price</th>
                        <th className="px-6 py-4">PL/SQL BOM Cost</th>
                        <th className="px-6 py-4">Unit Gross Margin</th>
                        <th className="px-6 py-4">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {bomMarginData.map((r) => (
                        <tr key={r.model_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 mr-2">
                              {r.model_id}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{r.model_name}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">{r.brand_name}</td>
                          <td className="px-6 py-4 font-mono text-xs">{r.launch_year}</td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(r.list_price)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatCurrency(r.bom_cost)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(r.gross_margin)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {r.margin_percent}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPLIER LOWEST QUOTES */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-brand-50/60 dark:bg-slate-800/60 border border-brand-200 dark:border-slate-700 p-4 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>DBMS Concept:</strong> Identifies competitive quote variance across certified vendor network in <code className="font-mono">SUPPLIED_BY</code> versus standard internal inventory unit cost.
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Component</th>
                        <th className="px-6 py-4">Standard Cost</th>
                        <th className="px-6 py-4">Lowest Market Quote</th>
                        <th className="px-6 py-4">Procurement Saving</th>
                        <th className="px-6 py-4">Cheapest Supplier</th>
                        <th className="px-6 py-4">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {supplierQuotesData.map((r) => (
                        <tr key={r.component_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 mr-2">
                              {r.component_id}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">{r.component_name}</span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(r.std_unit_cost)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(r.lowest_quote)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(r.saving_per_unit)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {r.cheapest_supplier}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                              {r.availability}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRAND FINANCIALS (CTE FIXED) */}
          {activeTab === 'brand' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                <strong>Corrected DBMS Query (Viva Critical):</strong> The naive implementation used <code className="font-mono">SUM(DISTINCT manufacturing_cost)</code> which collapsed distinct batches that had identical costs (e.g. ₹7,400,000). The corrected query aggregates batch costs inside a <strong>Common Table Expression (CTE)</strong> before performing the brand-level join, ensuring mathematical precision.
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Models / Batches</th>
                        <th className="px-6 py-4">Produced / Sold</th>
                        <th className="px-6 py-4">Total Mfg Cost (CTE)</th>
                        <th className="px-6 py-4">Total Gross Revenue</th>
                        <th className="px-6 py-4">Net Surplus</th>
                        <th className="px-6 py-4">ROI %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {brandFinanceData.map((r) => (
                        <tr key={r.brand_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-xs font-bold text-slate-400 mr-2">{r.brand_id}</span>
                            {r.brand_name}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {r.total_models} models • {r.total_batches} batches
                          </td>
                          <td className="px-6 py-4 font-mono">
                            {r.total_units_sold.toLocaleString()} / {r.total_units_produced.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">
                            {formatCurrency(r.total_manufacturing_cost)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(r.total_gross_revenue)}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            <span className={r.net_surplus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                              {formatCurrency(r.net_surplus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                            {r.roi_percent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
