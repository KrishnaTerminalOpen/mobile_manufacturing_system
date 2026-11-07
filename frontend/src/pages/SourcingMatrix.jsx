import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Grid, Sparkles, CheckCircle2, Clock, MapPin } from 'lucide-react';

const SourcingMatrix = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sourcing/matrix');
      setData(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load sourcing matrix');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

  if (loading || !data) {
    return <LoadingSkeleton rows={6} cols={5} />;
  }

  const { suppliers, rows } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Grid className="w-6 h-6 text-brand-600" />
          Component Sourcing Matrix (2D Cross-Tab)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Relational M:N mapping: COMPONENT × SUPPLIER via <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-brand-600">SUPPLIED_BY</code>. Green cells indicate the lowest market quotes with savings calculated against internal standard cost.
        </p>
      </div>

      {/* Sourcing Matrix Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 min-w-[200px]">
                  Hardware Component (Standard Baseline)
                </th>
                {suppliers.map((s) => (
                  <th key={s.supplier_id} className="px-6 py-4 min-w-[180px]">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {s.supplier_name}
                    </div>
                    <div className="text-[10px] font-normal text-slate-400 normal-case flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {s.city}, {s.state}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {rows.map((r) => (
                <tr key={r.component_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Row Header: Component */}
                  <td className="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/20">
                    <div className="font-mono text-xs font-bold text-slate-400">
                      {r.component_id}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {r.component_name}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      Std Baseline: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(r.unit_cost)}</strong>
                    </div>
                  </td>

                  {/* Supplier Quotes */}
                  {suppliers.map((s) => {
                    const quote = r.quotes[s.supplier_id];
                    if (!quote) {
                      return (
                        <td key={s.supplier_id} className="px-6 py-4 text-center">
                          <span className="text-xs text-slate-300 dark:text-slate-700 font-mono">—</span>
                        </td>
                      );
                    }

                    const isLowest = quote.is_lowest;
                    return (
                      <td
                        key={s.supplier_id}
                        className={`px-6 py-4 transition-colors ${
                          isLowest
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-x-2 border-emerald-500/40'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-sm font-black ${
                            isLowest ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                          }`}>
                            {formatCurrency(quote.supply_cost)}
                          </span>
                          {isLowest && (
                            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                              <Sparkles className="w-3 h-3" />
                              BEST
                            </span>
                          )}
                        </div>

                        {/* Savings Badge */}
                        <div className="mt-1 flex items-center justify-between text-xs">
                          {quote.saving_vs_std > 0 ? (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              Save {formatCurrency(quote.saving_vs_std)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Premium {formatCurrency(Math.abs(quote.saving_vs_std))}
                            </span>
                          )}

                          <span className={`text-[10px] flex items-center gap-1 font-semibold ${
                            quote.availability.toLowerCase().includes('in stock')
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {quote.availability.toLowerCase().includes('in stock') ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {quote.availability}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SourcingMatrix;

