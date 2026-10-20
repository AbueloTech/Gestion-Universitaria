import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getSQLiteDB,
  syncAppStateToSQLite,
  downloadSQLiteFile,
  executeSQLQuery,
  getSQLiteStats,
} from '../services/sqliteService';
import { QueryExecResult } from 'sql.js';
import {
  Database,
  Download,
  Play,
  RefreshCw,
  Table,
  CheckCircle2,
  AlertTriangle,
  X,
  Code,
  Terminal,
  FileCode,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface SQLiteModalProps {
  onClose: () => void;
}

export const SQLiteModal: React.FC<SQLiteModalProps> = ({ onClose }) => {
  const {
    professor,
    materias,
    secciones,
    students,
    gradeRecords,
    asistencias,
    calculatedStudents,
  } = useApp();

  const [stats, setStats] = useState<Array<{ table: string; count: number }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // SQL Query console state
  const [queryText, setQueryText] = useState(
    'SELECT a.matricula, a.apellido, a.nombre, m.codigo AS materia, s.codigo_seccion AS seccion, a.status FROM alumnos a JOIN materias m ON a.materia_id = m.id JOIN secciones s ON a.seccion_id = s.id ORDER BY a.apellido ASC;'
  );
  const [queryResult, setQueryResult] = useState<QueryExecResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryExecutionTime, setQueryExecutionTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Auto-sync on open
  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      const db = await syncAppStateToSQLite({
        professor,
        materias,
        secciones,
        students,
        gradeRecords,
        asistencias,
        calculatedStudents,
      });
      const tableStats = await getSQLiteStats();
      setStats(tableStats);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error al sincronizar SQLite:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadDB = async () => {
    const db = await getSQLiteDB();
    const cleanDate = new Date().toISOString().split('T')[0];
    const filename = `UniGrade_Docente_${cleanDate}.sqlite`;
    await downloadSQLiteFile(db, filename);
  };

  const handleRunQuery = async () => {
    if (!queryText.trim()) return;
    setIsExecuting(true);
    setQueryError(null);
    setQueryResult(null);

    const startTime = performance.now();
    try {
      const results = await executeSQLQuery(queryText);
      const endTime = performance.now();
      setQueryExecutionTime(Number((endTime - startTime).toFixed(2)));

      if (results.length > 0) {
        setQueryResult(results[0]);
      } else {
        setQueryResult({ columns: ['Mensaje'], values: [['Consulta ejecutada con éxito (0 filas devueltas)']] });
      }
    } catch (err: any) {
      setQueryError(err.message || 'Error en la sintaxis SQL');
    } finally {
      setIsExecuting(false);
    }
  };

  const sampleQueries = [
    {
      label: 'Alumnos por Sección',
      sql: 'SELECT a.matricula, a.apellido, a.nombre, m.codigo AS materia, s.codigo_seccion AS seccion, a.status FROM alumnos a JOIN materias m ON a.materia_id = m.id JOIN secciones s ON a.seccion_id = s.id ORDER BY a.apellido ASC;',
    },
    {
      label: 'Calificaciones con Riesgo (<10)',
      sql: 'SELECT a.apellido, a.nombre, c.parcial_id, c.subtotal_20, c.examen FROM alumnos a JOIN calificaciones c ON a.id = c.alumno_id WHERE c.subtotal_20 < 10 ORDER BY c.subtotal_20 ASC;',
    },
    {
      label: 'Conteo de Alumnos por Materia',
      sql: 'SELECT m.codigo, m.nombre, COUNT(a.id) as total_alumnos FROM materias m LEFT JOIN alumnos a ON m.id = a.materia_id GROUP BY m.id;',
    },
    {
      label: 'Horario Semanal Completo',
      sql: 'SELECT h.dia, h.hora_inicio, h.hora_fin, h.aula, s.codigo_seccion, m.nombre FROM horarios h JOIN secciones s ON h.seccion_id = s.id JOIN materias m ON s.materia_id = m.id ORDER BY h.dia, h.hora_inicio;',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 relative animate-in fade-in my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-md shadow-cyan-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Base de Datos SQLite</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SQLite 3 • Relacional
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Almacenamiento relacional en archivo binario portable (.sqlite / .db)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Top Action & Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Download File Card */}
            <div className="md:col-span-2 p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Descargar Archivo Físico (.sqlite)</span>
                </span>
                <p className="text-xs text-slate-400">
                  Descargue el archivo de base de datos SQLite real para abrirlo en su PC con{' '}
                  <strong className="text-slate-300">DB Browser for SQLite</strong>, DBeaver, o
                  conectarlo con scripts de <strong className="text-slate-300">Python</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={handleDownloadDB}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/25 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar unigrade.sqlite</span>
                </button>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncSuccess ? '¡Sincronizado!' : 'Refrescar Tablas'}</span>
                </button>
              </div>
            </div>

            {/* Quick Engine Info Card */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-white block">Esquema Relacional</span>
              <div className="space-y-1 text-xs">
                {stats.slice(0, 5).map((s) => (
                  <div key={s.table} className="flex justify-between text-slate-400">
                    <span className="font-mono text-[11px] text-indigo-300">{s.table}</span>
                    <span className="font-bold text-white">{s.count} filas</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive SQL Query Console */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Consola de Consultas SQL (Query Runner)</span>
              </div>

              {queryExecutionTime !== null && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Ejecutado en <strong className="text-emerald-400">{queryExecutionTime} ms</strong>
                </span>
              )}
            </div>

            {/* Sample Query Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              <span className="text-slate-500 font-medium whitespace-nowrap">Ejemplos:</span>
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQueryText(q.sql)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 whitespace-nowrap transition cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* SQL Input Area */}
            <div className="relative">
              <textarea
                rows={3}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Escriba su consulta SQL aquí (ej. SELECT * FROM alumnos;)..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                Soporta SELECT, JOIN, GROUP BY, WHERE, COUNT, AVG, etc.
              </span>

              <button
                onClick={handleRunQuery}
                disabled={isExecuting || !queryText.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Ejecutar SQL</span>
              </button>
            </div>

            {/* Query Error */}
            {queryError && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-mono">{queryError}</span>
              </div>
            )}

            {/* Query Result Grid */}
            {queryResult && (
              <div className="mt-3 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        {queryResult.columns.map((col, idx) => (
                          <th key={idx} className="py-2 px-3 font-mono">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {queryResult.values.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/40">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 text-slate-200">
                              {val !== null && val !== undefined ? String(val) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 text-right">
                  {queryResult.values.length} filas devueltas
                </div>
              </div>
            )}
          </div>

          {/* Guide Box on how to open with external tools */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Cómo abrir este archivo SQLite en su computadora?</span>
            </span>
            <p className="text-[11px] leading-relaxed">
              1. Descargue el archivo <strong className="text-white">.sqlite</strong> con el botón
              superior.<br />
              2. Abra <strong>DB Browser for SQLite</strong> (descarga gratis en{' '}
              <span className="text-cyan-400 underline">sqlitebrowser.org</span>) y haga clic en "Abrir
              Base de Datos".<br />
              3. O en <strong>Python</strong>: <code>import sqlite3; conn = sqlite3.connect('unigrade.sqlite')</code>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
