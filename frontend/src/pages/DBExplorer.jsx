import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  Binary,
  Code2,
  Database,
  Play,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Terminal,
  HelpCircle,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Table as TableIcon
} from 'lucide-react';

const DBExplorer = () => {
  const [activeSection, setActiveSection] = useState('plsql'); // 'plsql', 'trigger-demo', 'sql-runner', 'schema'
  const [plsqlSources, setPlsqlSources] = useState({});
  const [selectedPlsqlKey, setSelectedPlsqlKey] = useState('trg_validate_and_audit_batch_sale');
  const [copiedCode, setCopiedCode] = useState(false);
  const [schemaMetadata, setSchemaMetadata] = useState(null);

  // Trigger Demo State
  const [demoBatchId, setDemoBatchId] = useState('BCH504');
  const [excessQty, setExcessQty] = useState(500);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  // SQL Runner State
  const [sqlInput, setSqlInput] = useState(`SELECT br.brand_name, mm.model_name, mb.batch_id, mb.production_qty,
       COALESCE(SUM(s.quantity), 0) AS total_sold,
       (mb.production_qty - COALESCE(SUM(s.quantity), 0)) AS remaining_stock
FROM BRAND br
JOIN MOBILE_MODEL mm ON br.brand_id = mm.brand_id
JOIN MANUFACTURING_BATCH mb ON mm.model_id = mb.model_id
LEFT JOIN SALE s ON mb.batch_id = s.batch_id
GROUP BY br.brand_name, mm.model_name, mb.batch_id, mb.production_qty
ORDER BY remaining_stock ASC;`);
  const [sqlRunning, setSqlRunning] = useState(false);
  const [sqlResult, setSqlResult] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchPlsqlSources();
    fetchSchemaMetadata();
  }, []);

  const fetchPlsqlSources = async () => {
    try {
      const res = await api.get('/db-explorer/plsql-sources');
      setPlsqlSources(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchemaMetadata = async () => {
    try {
      const res = await api.get('/db-explorer/schema-metadata');
      setSchemaMetadata(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success('PL/SQL code copied to clipboard!');
  };

  const handleRunTriggerDemo = async () => {
    try {
      setDemoRunning(true);
      setDemoResult(null);
      const res = await api.post('/db-explorer/demo-oversell', {
        batch_id: demoBatchId,
        excess_quantity: parseInt(excessQty)
      });
      setDemoResult(res.data);
      toast.warning('Overselling was blocked by Oracle Trigger ORA-20001 as expected!');
    } catch (err) {
      toast.error(err.friendlyMessage || 'Trigger demo failed');
    } finally {
      setDemoRunning(false);
    }
  };

  const handleRunSql = async () => {
    if (!sqlInput.trim()) return;
    try {
      setSqlRunning(true);
      setSqlResult(null);
      const res = await api.post('/db-explorer/run-select', { sql: sqlInput });
      setSqlResult(res.data);
      toast.success(`Query executed in ${res.data.execution_time_ms}ms (${res.data.row_count} rows).`);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Query execution error');
    } finally {
      setSqlRunning(false);
    }
  };

  const activePlsql = plsqlSources[selectedPlsqlKey];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Binary className="w-6 h-6 text-brand-600" />
          Oracle 21c XE DBMS Explorer & Viva Inspector
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Inspect relational schema definitions, review compiled PL/SQL source code, test mutating-table-safe triggers, and execute read-only queries with live timing.
        </p>
      </div>

      {/* Navigation Pills */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('plsql')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'plsql'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          PL/SQL Stored Objects
        </button>

        <button
          onClick={() => setActiveSection('trigger-demo')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'trigger-demo'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Trigger Live Tester (ORA-20001 Demo)
        </button>

        <button
          onClick={() => setActiveSection('sql-runner')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'sql-runner'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Read-Only SQL Runner
        </button>

        <button
          onClick={() => setActiveSection('schema')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'schema'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          Relational Schema & Constraints
        </button>
      </div>

      {/* SECTION 1: PL/SQL CODE VIEWER */}
      {activeSection === 'plsql' && (
        <div className="space-y-4 animate-fade-in">
          {/* Object Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.keys(plsqlSources).map((key) => {
              const obj = plsqlSources[key];
              const isSelected = selectedPlsqlKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedPlsqlKey(key)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-brand-50/90 dark:bg-brand-950/60 border-brand-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {obj.type}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-2 truncate">
                    {key}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          {activePlsql && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-400 font-mono">
                      {activePlsql.type}
                    </span>
                    <h3 className="font-mono text-sm font-bold text-white">
                      {selectedPlsqlKey}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activePlsql.description}
                  </p>
                </div>
                <button
                  onClick={() => handleCopyCode(activePlsql.code)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed text-emerald-400/90 selection:bg-brand-500 selection:text-white">
                <code>{activePlsql.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TRIGGER LIVE TESTER (ORA-20001 DEMO) */}
      {activeSection === 'trigger-demo' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-2xl shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Interactive Trigger Validation Demonstration
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  During your viva exam, examiners frequently ask: <em>"Show me how your Oracle trigger blocks overselling without throwing mutating-table errors."</em>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the button below to deliberately fire an insert statement requesting <strong>500 units</strong> on batch <strong>BCH504</strong> (which has only 45 units remaining). Watch the Oracle Compound Trigger <code className="font-mono text-rose-600 font-bold">trg_validate_and_audit_batch_sale</code> intercept the transaction and raise <code className="font-mono text-rose-600 font-bold">RAISE_APPLICATION_ERROR(-20001)</code>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Test Batch:</span>
                <input
                  type="text"
                  value={demoBatchId}
                  onChange={(e) => setDemoBatchId(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold w-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Attempted Qty:</span>
                <input
                  type="number"
                  value={excessQty}
                  onChange={(e) => setExcessQty(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold w-28"
                />
              </div>

              <button
                onClick={handleRunTriggerDemo}
                disabled={demoRunning}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all ml-auto"
              >
                <Play className="w-4 h-4 fill-white" />
                {demoRunning ? 'Testing Trigger...' : 'Execute Oversell Attempt'}
              </button>
            </div>
          </div>

          {/* Trigger Result Banner */}
          {demoResult && (
            <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 shadow-xl space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono text-xs font-black">
                    {demoResult.oracle_error_code} INTERCEPTED
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    Trigger Successfully Blocked Oversell
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  HTTP 400 Mapped
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Batch Lot</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {demoResult.batch_id} ({demoResult.model_name})
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Produced Qty</span>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {demoResult.production_qty} units
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Available Stock</span>
                  <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    {demoResult.available_stock} units
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Attempted Sale</span>
                  <div className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                    {demoResult.attempted_quantity} units
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200 uppercase">
                  Captured Exception Message:
                </span>
                <p className="font-mono text-xs text-rose-700 dark:text-rose-300 mt-1">
                  {demoResult.caught_exception_message}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Viva Note:</strong> {demoResult.viva_explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: READ-ONLY SQL RUNNER */}
      {activeSection === 'sql-runner' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Terminal className="w-4 h-4 text-brand-400" />
                Read-Only SQL Query Console (SELECT only)
              </span>
              <span>Security enforced via keyword filter allowlist</span>
            </div>

            <textarea
              rows={6}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />

            <div className="flex justify-between items-center pt-2">
              <div className="text-[11px] text-slate-500">
                Tip: Try running joins across BRAND, MOBILE_MODEL, and MANUFACTURING_BATCH.
              </div>
              <button
                onClick={handleRunSql}
                disabled={sqlRunning}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                {sqlRunning ? 'Executing...' : 'Run Query'}
              </button>
            </div>
          </div>

          {/* SQL Execution Output Table */}
          {sqlResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 animate-slide-up">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">
                  Query Results: <span className="font-mono text-brand-600">{sqlResult.row_count} rows</span>
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {sqlResult.execution_time_ms} ms
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-96">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      {sqlResult.columns.map((c) => (
                        <th key={c} className="px-4 py-2.5 font-bold whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {sqlResult.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        {sqlResult.columns.map((c) => (
                          <td key={c} className="px-4 py-2 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {row[c] !== null && row[c] !== undefined ? String(row[c]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: SCHEMA METADATA */}
      {activeSection === 'schema' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemaMetadata?.tables.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                    {t.name}
                  </h4>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    PK: {t.primary_key}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.purpose}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {t.columns.map((col, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DBExplorer;
