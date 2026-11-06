import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { ShieldAlert, User, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Only administrators with the ADMIN role can view the transaction audit trail.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-600" />
          Regulatory Sales Audit Trail & Telemetry
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Table: SALE_AUDIT • Populated automatically upon transaction commit by Oracle Stored Procedure & Trigger to audit user attribution, timestamping, and threshold events.
        </p>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit entries"
          description="No sales events have been audited yet."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Audit ID</th>
                  <th className="px-6 py-4">Sale ID</th>
                  <th className="px-6 py-4">Batch Lot</th>
                  <th className="px-6 py-4">Dispatched Qty</th>
                  <th className="px-6 py-4">Remaining Post-Sale</th>
                  <th className="px-6 py-4">Recorded By</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Reorder Fired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {logs.map((log) => {
                  const alertFired = log.reorder_alert_fired === 'Y';
                  return (
                    <tr key={log.audit_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                        {log.audit_id}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-brand-600">
                        {log.sale_id}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                        {log.batch_id}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {log.quantity} units
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {log.remaining_stock !== null ? `${log.remaining_stock} units` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <User className="w-3.5 h-3.5" />
                          {log.recorded_by}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {log.recorded_at}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          alertFired
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {alertFired ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {alertFired ? 'YES (Critical)' : 'NO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
