import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Database, Download, Upload, RefreshCw, X, Check, AlertTriangle } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const { exportDatabaseJSON, importDatabaseJSON, resetToDefaults } = useApp();
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UniGrade_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    const jsonStr = exportDatabaseJSON();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) return;
    const success = importDatabaseJSON(importJsonText);
    if (success) {
      setImportStatus('success');
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setImportStatus('error');
    }
  };

  const handleReset = () => {
    if (
      confirm(
        '¿Está seguro de restablecer todos los datos a la demostración inicial? Se restaurarán los estudiantes, notas y materias de prueba.'
      )
    ) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Copia de Seguridad y Restauración</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export section */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-white block">
            Exportar Datos del Semestre (Respaldo)
          </span>
          <p className="text-xs text-slate-400">
            Descargue un archivo JSON con todas sus materias, secciones, horarios, alumnos con
            fotos y registro de calificaciones para guardar en su computadora.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo JSON</span>
            </button>
            <button
              onClick={handleCopyClipboard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
            >
              {copied ? '¡Copiado!' : 'Copiar al Portapapeles'}
            </button>
          </div>
        </div>

        {/* Import section */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
          <span className="text-xs font-bold text-white block">Restaurar desde JSON</span>
          <textarea
            rows={4}
            placeholder="Pegue aquí el contenido JSON exportado previamente..."
            value={importJsonText}
            onChange={(e) => {
              setImportJsonText(e.target.value);
              setImportStatus(null);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          />

          {importStatus === 'success' && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> ¡Datos restaurados exitosamente!
            </p>
          )}

          {importStatus === 'error' && (
            <p className="text-xs text-rose-400 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" /> El formato JSON no es válido.
            </p>
          )}

          <button
            onClick={handleImport}
            disabled={!importJsonText.trim()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar Copia</span>
          </button>
        </div>

        {/* Reset to defaults */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Demostración</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
