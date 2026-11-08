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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-2xl max-w-xl w-full shadow-dropdown overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a model name, batch ID, supplier, or page..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
          {/* Models */}
          {filteredModels.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 block mb-1.5">
                Mobile Models
              </span>
              <div className="space-y-1">
                {filteredModels.map(m => (
                  <button
                    key={m.model_id}
                    onClick={() => handleSelect(`/models/${m.model_id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <Smartphone className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{m.model_name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">{m.model_id}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">
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
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 block mb-1.5">
                Production Batches
              </span>
              <div className="space-y-1">
                {filteredBatches.map(b => (
                  <button
                    key={b.batch_id}
                    onClick={() => handleSelect(`/batches/${b.batch_id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                        <Factory className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 font-mono group-hover:text-indigo-600 transition-colors">{b.batch_id}</span>
                      <span className="text-slate-500 truncate text-[11px]">{b.model_name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded">
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
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 block mb-1.5">
                Suppliers & Vendors
              </span>
              <div className="space-y-1">
                {filteredSuppliers.map(s => (
                  <button
                    key={s.supplier_id}
                    onClick={() => handleSelect('/suppliers')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{s.supplier_name}</span>
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
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 px-2 block mb-1.5">
                Core Applications & Navigation
              </span>
              <div className="space-y-1">
                {quickPages.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(p.path)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-50/50 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.title}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between px-4">
          <span className="font-medium text-slate-500">Global Command Search</span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-600 shadow-2xs font-bold">ESC</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};

export default QuickSearchModal;

