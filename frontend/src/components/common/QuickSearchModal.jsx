import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Search,
  X,
  Smartphone,
  Factory,
  Building2,
  Cpu,
  Truck,
  ArrowRight,
  Calculator,
  Grid,
  FileSpreadsheet,
  Binary
} from 'lucide-react';

const QuickSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ models: [], batches: [], brands: [], suppliers: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadIndex();
      setQuery('');
    }
  }, [isOpen]);

  const loadIndex = async () => {
    try {
      setLoading(true);
      const [mRes, bRes, brRes, sRes] = await Promise.all([
        api.get('/models'),
        api.get('/batches'),
        api.get('/brands'),
        api.get('/suppliers')
      ]);
      setData({
        models: mRes.data,
        batches: bRes.data,
        brands: brRes.data,
        suppliers: sRes.data
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredModels = data.models.filter(
    m => m.model_name.toLowerCase().includes(q) || m.model_id.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredBatches = data.batches.filter(
    b => b.batch_id.toLowerCase().includes(q) || b.model_name?.toLowerCase().includes(q)
  ).slice(0, 4);

  const filteredBrands = data.brands.filter(
    br => br.brand_name.toLowerCase().includes(q) || br.city.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredSuppliers = data.suppliers.filter(
    s => s.supplier_name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)
  ).slice(0, 3);

  const quickPages = [
    { title: "Record Batch Sale", path: "/record-sale", icon: Smartphone },
    { title: "Sourcing Matrix Grid", path: "/sourcing-matrix", icon: Grid },
    { title: "BOM Cost Optimizer", path: "/cost-optimizer", icon: Calculator },
    { title: "Analytical Reports", path: "/reports", icon: FileSpreadsheet },
    { title: "Oracle DB Explorer & PL/SQL", path: "/db-explorer", icon: Binary },
  ].filter(p => !q || p.title.toLowerCase().includes(q));

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a model name, batch ID, supplier, or page..."
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Models */}
          {filteredModels.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
                Mobile Models
              </span>
              <div className="space-y-1">
                {filteredModels.map(m => (
                  <button
                    key={m.model_id}
                    onClick={() => handleSelect(`/models/${m.model_id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-slate-900 dark:text-white">{m.model_name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{m.model_id}</span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{m.list_price.toLocaleString('en-IN')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Batches */}
          {filteredBatches.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
                Production Batches
              </span>
              <div className="space-y-1">
                {filteredBatches.map(b => (
                  <button
                    key={b.batch_id}
                    onClick={() => handleSelect(`/batches/${b.batch_id}`)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Factory className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{b.batch_id}</span>
                      <span className="text-slate-500 truncate">{b.model_name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {b.remaining_stock} units left
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {filteredSuppliers.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
                Suppliers & Vendors
              </span>
              <div className="space-y-1">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.supplier_id}
                    onClick={() => handleSelect('/suppliers')}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-900 dark:text-white">{s.supplier_name}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{s.city}, {s.state}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Pages */}
          {quickPages.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
                Core Applications & Navigation
              </span>
              <div className="space-y-1">
                {quickPages.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(p.path)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span>Navigation Shortcut</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border text-[10px] font-mono">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;
