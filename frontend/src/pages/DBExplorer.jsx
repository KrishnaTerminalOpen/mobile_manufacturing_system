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
  Table as TableIcon,
  GitBranch,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';

const DBExplorer = () => {
  const [activeSection, setActiveSection] = useState('erd'); // 'erd', 'plsql', 'trigger-demo', 'sql-runner', 'schema'
  const [plsqlSources, setPlsqlSources] = useState({});
  const [selectedPlsqlKey, setSelectedPlsqlKey] = useState('trg_validate_and_audit_batch_sale');
  const [copiedCode, setCopiedCode] = useState(false);
  const [schemaMetadata, setSchemaMetadata] = useState(null);
  const [selectedTableForInspect, setSelectedTableForInspect] = useState('MOBILE_MODEL');

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

  const setCannedQuery = (sql) => {
    setSqlInput(sql);
    toast.info('Query loaded into SQL console. Click "Run Query" to execute.');
  };

  const activePlsql = plsqlSources[selectedPlsqlKey];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Oracle 21c XE DBMS Architecture & Viva Inspector
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
              SQL / PL-SQL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore normalized relational schema diagrams, examine compiled PL/SQL packages, test mutating-table-safe triggers, and execute read-only queries.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('erd')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'erd'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Interactive ER Diagram (ERD)
        </button>

        <button
          onClick={() => setActiveSection('plsql')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'plsql'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          PL/SQL Stored Objects
        </button>

        <button
          onClick={() => setActiveSection('trigger-demo')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'trigger-demo'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          Trigger Live Tester (ORA-20001)
        </button>

        <button
          onClick={() => setActiveSection('sql-runner')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'sql-runner'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          SQL Runner & Snippets
        </button>

        <button
          onClick={() => setActiveSection('schema')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeSection === 'schema'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          Schema & Constraints Catalog
        </button>
      </div>

      {/* SECTION 0: INTERACTIVE VISUAL ER DIAGRAM */}
      {activeSection === 'erd' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-600" />
                  Relational Entity-Relationship Diagram (BCNF Normalized)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any entity to inspect its relational attributes, primary keys, and foreign key dependencies.
                </p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold w-max">
                8 Normalized Relational Tables
              </span>
            </div>

            {/* Visual Diagram Canvas */}
            <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto text-white">
              <div className="min-w-[800px] grid grid-cols-4 gap-6 py-4">
                {/* Column 1: Brands & Suppliers */}
                <div className="space-y-12">
                  {/* BRAND */}
                  <div
                    onClick={() => setSelectedTableForInspect('BRAND')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'BRAND'
                        ? 'border-blue-500 bg-blue-950/40 shadow-lg shadow-blue-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-400">
                      <span>BRAND</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300">1</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 brand_id (PK)</div>
                      <div>brand_name (UQ)</div>
                      <div>state, city</div>
                    </div>
                  </div>

                  {/* SUPPLIER */}
                  <div
                    onClick={() => setSelectedTableForInspect('SUPPLIER')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'SUPPLIER'
                        ? 'border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
                      <span>SUPPLIER</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300">1</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 supplier_id (PK)</div>
                      <div>supplier_name</div>
                      <div>contact_no (UQ)</div>
                      <div>city, state</div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Mobile Model & Component */}
                <div className="space-y-12">
                  {/* MOBILE_MODEL */}
                  <div
                    onClick={() => setSelectedTableForInspect('MOBILE_MODEL')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'MOBILE_MODEL'
                        ? 'border-purple-500 bg-purple-950/40 shadow-lg shadow-purple-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-400">
                      <span>MOBILE_MODEL</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300">N / 1</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 model_id (PK)</div>
                      <div className="text-blue-400 font-semibold">🔗 brand_id (FK)</div>
                      <div>model_name</div>
                      <div>launch_year</div>
                      <div>list_price &gt; 0</div>
                    </div>
                  </div>

                  {/* COMPONENT */}
                  <div
                    onClick={() => setSelectedTableForInspect('COMPONENT')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'COMPONENT'
                        ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                      <span>COMPONENT</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">M:N</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 component_id (PK)</div>
                      <div>component_name</div>
                      <div>description</div>
                      <div>unit_cost &gt; 0</div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Associative Entities (REQUIRES & SUPPLIED_BY) */}
                <div className="space-y-12">
                  {/* REQUIRES (BOM) */}
                  <div
                    onClick={() => setSelectedTableForInspect('REQUIRES')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'REQUIRES'
                        ? 'border-pink-500 bg-pink-950/40 shadow-lg shadow-pink-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-pink-400">
                      <span>REQUIRES (BOM)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-900/60 text-pink-300">M:N Link</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 model_id (PK, FK)</div>
                      <div className="font-bold text-amber-400">🔑 component_id (PK, FK)</div>
                      <div>qty_req &gt; 0</div>
                    </div>
                  </div>

                  {/* SUPPLIED_BY */}
                  <div
                    onClick={() => setSelectedTableForInspect('SUPPLIED_BY')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'SUPPLIED_BY'
                        ? 'border-teal-500 bg-teal-950/40 shadow-lg shadow-teal-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-teal-400">
                      <span>SUPPLIED_BY</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-900/60 text-teal-300">M:N Link</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 component_id (PK, FK)</div>
                      <div className="font-bold text-amber-400">🔑 supplier_id (PK, FK)</div>
                      <div>supply_cost &gt; 0</div>
                      <div>availability</div>
                    </div>
                  </div>
                </div>

                {/* Column 4: Manufacturing Batches & Sales */}
                <div className="space-y-12">
                  {/* MANUFACTURING_BATCH */}
                  <div
                    onClick={() => setSelectedTableForInspect('MANUFACTURING_BATCH')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'MANUFACTURING_BATCH'
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-indigo-400">
                      <span>MANUFACTURING_BATCH</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300">1:N</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 batch_id (PK)</div>
                      <div className="text-purple-400 font-semibold">🔗 model_id (FK)</div>
                      <div>production_date</div>
                      <div>production_qty &gt; 0</div>
                      <div>manufacturing_cost &gt; 0</div>
                      <div>reorder_level &gt;= 0</div>
                    </div>
                  </div>

                  {/* SALE */}
                  <div
                    onClick={() => setSelectedTableForInspect('SALE')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedTableForInspect === 'SALE'
                        ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-500/20'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                      <span>SALE</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900/60 text-emerald-300">Trigger Monitored</span>
                    </div>
                    <div className="mt-2 text-xs space-y-1 font-mono text-slate-300">
                      <div className="font-bold text-amber-400">🔑 sale_id (PK)</div>
                      <div className="text-indigo-400 font-semibold">🔗 batch_id (FK)</div>
                      <div>quantity &gt; 0</div>
                      <div>sale_date</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Table Deep Inspector Card */}
            {selectedTableForInspect && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                    Relational Entity Inspector:
                  </span>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTableForInspect}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {schemaMetadata?.tables.find(t => t.name === selectedTableForInspect)?.purpose}
                  </p>
                </div>
                <div className="font-mono text-[11px] space-y-0.5 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
                  {schemaMetadata?.tables.find(t => t.name === selectedTableForInspect)?.columns.map((c, i) => (
                    <div key={i}>• {c}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {obj.type}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
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
                    <span className="text-xs font-bold text-blue-400 font-mono">
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
                  <span>{copiedCode ? 'Copied' : 'Copy PL/SQL'}</span>
                </button>
              </div>

              <pre className="p-5 text-xs font-mono overflow-x-auto leading-relaxed text-emerald-400/90 selection:bg-blue-500 selection:text-white">
                <code>{activePlsql.code}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: TRIGGER LIVE TESTER (ORA-20001 DEMO & EXECUTION TRACE) */}
      {activeSection === 'trigger-demo' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/30 border border-rose-200 dark:border-rose-900 rounded-3xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 rounded-2xl shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Interactive Trigger Validation Bench & Mutating Table Prevention
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  During your viva exam, examiners frequently ask: <em>"Demonstrate how your Oracle trigger blocks overselling without throwing mutating-table errors (ORA-04091)."</em>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Click the button below to deliberately fire an insert statement requesting <strong>500 units</strong> on batch <strong>BCH504</strong> (which has only 45 units remaining). Watch the Oracle Compound Trigger <code className="font-mono text-rose-600 font-bold">trg_validate_and_audit_batch_sale</code> intercept the transaction and raise <code className="font-mono text-rose-600 font-bold">RAISE_APPLICATION_ERROR(-20001)</code>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-rose-200/60 dark:border-rose-900/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Batch:</span>
                <input
                  type="text"
                  value={demoBatchId}
                  onChange={(e) => setDemoBatchId(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold w-28"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Attempted Sale Qty:</span>
                <input
                  type="number"
                  value={excessQty}
                  onChange={(e) => setExcessQty(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold w-28"
                />
              </div>

              <button
                onClick={handleRunTriggerDemo}
                disabled={demoRunning}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 flex items-center gap-2 transition-all ml-auto"
              >
                <Play className="w-4 h-4 fill-white" />
                {demoRunning ? 'Testing Trigger...' : 'Execute Oversell Attempt (Test Bench)'}
              </button>
            </div>
          </div>

          {/* Trigger Result Banner */}
          {demoResult && (
            <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 shadow-xl space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono text-xs font-black">
                    {demoResult.oracle_error_code} INTERCEPTED
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    Trigger Intercepted Transaction Safely
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

              {/* Execution Trace Timeline */}
              <div className="p-4 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Oracle Execution Lifecycle Trace</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">Step 1:</span>
                    <span>Client issues POST /api/sales with quantity {demoResult.attempted_quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">Step 2:</span>
                    <span>FastAPI calls Oracle Stored Procedure sp_record_batch_sale_and_restock_check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">Step 3:</span>
                    <span>Compound Trigger trg_validate_and_audit_batch_sale runs BEFORE EACH ROW</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold">Step 4:</span>
                    <span>Evaluation: {demoResult.attempted_quantity} &gt; {demoResult.available_stock} =&gt; RAISE_APPLICATION_ERROR(-20001)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">Step 5:</span>
                    <span>Transaction cleanly rolled back in Oracle. No table mutation occurred.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: READ-ONLY SQL RUNNER & PRE-CANNED SNIPPETS */}
      {activeSection === 'sql-runner' && (
        <div className="space-y-4 animate-fade-in">
          {/* Quick Pre-canned Query Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] shrink-0">
              Viva Snippets:
            </span>
            <button
              onClick={() => setCannedQuery(`SELECT mm.model_id, mm.model_name, br.brand_name, mm.list_price,
       fn_calculate_model_bom_cost(mm.model_id) AS bom_cost,
       (mm.list_price - fn_calculate_model_bom_cost(mm.model_id)) AS unit_margin
FROM MOBILE_MODEL mm
JOIN BRAND br ON mm.brand_id = br.brand_id
ORDER BY unit_margin DESC;`)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap"
            >
              Models Profit Margin
            </button>
            <button
              onClick={() => setCannedQuery(`SELECT mb.batch_id, mm.model_name, mb.production_qty,
       COALESCE(SUM(s.quantity), 0) AS total_sold,
       (mb.production_qty - COALESCE(SUM(s.quantity), 0)) AS remaining_stock,
       mb.reorder_level
FROM MANUFACTURING_BATCH mb
JOIN MOBILE_MODEL mm ON mb.model_id = mm.model_id
LEFT JOIN SALE s ON mb.batch_id = s.batch_id
GROUP BY mb.batch_id, mm.model_name, mb.production_qty, mb.reorder_level
HAVING (mb.production_qty - COALESCE(SUM(s.quantity), 0)) <= mb.reorder_level;`)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap"
            >
              Critical Reorder Batches
            </button>
            <button
              onClick={() => setCannedQuery(`SELECT c.component_name, s.supplier_name, sb.supply_cost, c.unit_cost,
       (c.unit_cost - sb.supply_cost) AS unit_saving
FROM SUPPLIED_BY sb
JOIN COMPONENT c ON sb.component_id = c.component_id
JOIN SUPPLIER s ON sb.supplier_id = s.supplier_id
WHERE (c.unit_cost - sb.supply_cost) > 0
ORDER BY unit_saving DESC;`)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap"
            >
              Vendor Quotes with Savings
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <Terminal className="w-4 h-4 text-blue-400" />
                Read-Only SQL Query Console (SELECT only)
              </span>
              <span>Sanitized via query keyword allowlist</span>
            </div>

            <textarea
              rows={6}
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />

            <div className="flex justify-between items-center pt-2">
              <div className="text-[11px] text-slate-500">
                Executes directly against Oracle Database 21c XE connection pool with microsecond telemetry.
              </div>
              <button
                onClick={handleRunSql}
                disabled={sqlRunning}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                {sqlRunning ? 'Executing...' : 'Run Query'}
              </button>
            </div>
          </div>

          {/* SQL Execution Output Table */}
          {sqlResult && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 animate-slide-up">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">
                  Query Results: <span className="font-mono text-blue-600">{sqlResult.row_count} rows</span>
                </span>
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {sqlResult.execution_time_ms} ms execution latency
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
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                    {t.name}
                  </h4>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                    PK: {t.primary_key}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.purpose}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {t.columns.map((col, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
