import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TableProperties,
  Printer,
  Download,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileDown,
  Check,
  ChevronDown,
  X,
  FileText,
} from 'lucide-react';
import { getNivelColor } from '../utils/gradeCalculations';
import { exportGradeSheetPDF } from '../utils/pdfExport';
import { GoogleSheetsModal } from './GoogleSheetsModal';

interface SabanaNotasViewProps {
  onOpenActaModal: () => void;
}

export const SabanaNotasView: React.FC<SabanaNotasViewProps> = ({ onOpenActaModal }) => {
  const {
    professor,
    materias,
    secciones,
    configuraciones,
    students,
    gradeRecords,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
    updateStudentParcialGrade,
    calculatedStudents,
  } = useApp();

  // Active Materia and Seccion for the gradebook
  const activeMateria = useMemo(() => {
    if (selectedMateriaId !== 'all') {
      return materias.find((m) => m.id === selectedMateriaId) || materias[0];
    }
    return materias[0];
  }, [materias, selectedMateriaId]);

  const activeSecciones = useMemo(() => {
    return secciones.filter((s) => s.materiaId === activeMateria?.id);
  }, [secciones, activeMateria]);

  const activeSeccion = useMemo(() => {
    if (selectedSeccionId !== 'all') {
      const found = activeSecciones.find((s) => s.id === selectedSeccionId);
      if (found) return found;
    }
    return activeSecciones[0];
  }, [activeSecciones, selectedSeccionId]);

  // Active configuration for this subject
  const currentConfig = useMemo(() => {
    return (
      configuraciones.find((c) => c.materiaId === activeMateria?.id) ||
      configuraciones[0]
    );
  }, [configuraciones, activeMateria]);

  // Selected Parcial view (p1, p2, p3 or 'resumen')
  const [selectedParcialId, setSelectedParcialId] = useState<string>('p1');

  // Students in this active section
  const sectionStudents = useMemo(() => {
    if (!activeSeccion) return [];
    return calculatedStudents.filter((s) => s.seccion.id === activeSeccion.id);
  }, [calculatedStudents, activeSeccion]);

  // Current Parcial config
  const currentParcialConfig = useMemo(() => {
    return (
      currentConfig?.parciales.find((p) => p.id === selectedParcialId) ||
      currentConfig?.parciales[0]
    );
  }, [currentConfig, selectedParcialId]);

  // Handler for grade changes
  const handleGradeChange = (
    studentId: string,
    field: 'quiz' | 'tarea' | 'examen' | 'asistencia',
    index: number,
    value: string
  ) => {
    if (!activeSeccion || !activeMateria || !currentParcialConfig) return;

    const numVal = Math.max(0, Math.min(20, parseFloat(value) || 0));
    const currentRecord = gradeRecords.find(
      (g) => g.studentId === studentId && g.seccionId === activeSeccion.id
    );
    const existingParcial = currentRecord?.parciales?.[currentParcialConfig.id] || {
      quizzes: Array(currentParcialConfig.quizzesCount).fill(0),
      tareas: Array(currentParcialConfig.tareasCount).fill(0),
      examen: 0,
      asistencia: 20,
    };

    if (field === 'quiz') {
      const newQuizzes = [...(existingParcial.quizzes || [])];
      while (newQuizzes.length <= index) newQuizzes.push(0);
      newQuizzes[index] = numVal;
      updateStudentParcialGrade(
        studentId,
        activeSeccion.id,
        activeMateria.id,
        currentParcialConfig.id,
        { quizzes: newQuizzes }
      );
    } else if (field === 'tarea') {
      const newTareas = [...(existingParcial.tareas || [])];
      while (newTareas.length <= index) newTareas.push(0);
      newTareas[index] = numVal;
      updateStudentParcialGrade(
        studentId,
        activeSeccion.id,
        activeMateria.id,
        currentParcialConfig.id,
        { tareas: newTareas }
      );
    } else if (field === 'examen') {
      updateStudentParcialGrade(
        studentId,
        activeSeccion.id,
        activeMateria.id,
        currentParcialConfig.id,
        { examen: numVal }
      );
    } else if (field === 'asistencia') {
      updateStudentParcialGrade(
        studentId,
        activeSeccion.id,
        activeMateria.id,
        currentParcialConfig.id,
        { asistencia: numVal }
      );
    }
  };

  // Bulk action: Fill attendance with 20 for this parcial
  const handleBulkAttendance = () => {
    if (!activeSeccion || !activeMateria || !currentParcialConfig) return;
    sectionStudents.forEach((cs) => {
      updateStudentParcialGrade(
        cs.student.id,
        activeSeccion.id,
        activeMateria.id,
        currentParcialConfig.id,
        { asistencia: 20 }
      );
    });
  };

  // State for export feedback and options
  const [csvExportSuccess, setCsvExportSuccess] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [csvDelimiter, setCsvDelimiter] = useState<',' | ';'>(',');
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Helper to format values for CSV escaping
  const escapeCSV = (value: any, delimiter: string = ','): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export current active sheet as CSV (for external processing in Excel, Sheets, Python, etc.)
  const handleExportCSV = (scope: 'current' | 'all_parciales' = 'current') => {
    if (!activeMateria || !activeSeccion) return;

    const d = csvDelimiter;
    const lines: string[] = [];

    // Header metadata comments for external audit/processing
    lines.push(`# UNIVERSIDAD / MATERIA: ${activeMateria.codigo} - ${activeMateria.nombre}`);
    lines.push(`# SECCION: ${activeSeccion.codigoSeccion} | AULA: ${activeSeccion.aulaPrincipal}`);
    lines.push(`# PERIODO: ${activeSeccion.periodo} | FECHA DE EXPORTACION: ${new Date().toISOString()}`);
    lines.push(`# ESCALA: ${currentConfig.escala} | NOTA MINIMA APROBATORIA: ${currentConfig.notaMinimaAprobatoria}`);

    if (scope === 'current' && selectedParcialId !== 'resumen' && currentParcialConfig) {
      // 1. Export active Parcial sheet
      lines.push(`# VISTA: ${currentParcialConfig.nombre} (PESO SEMESTRAL: ${currentParcialConfig.pesoParcial}%)`);

      const headers = [
        'No',
        'ID_Estudiante',
        'Cedula',
        'Matricula',
        'Apellidos_Nombres',
        'Email',
        'Estatus',
      ];

      // Add Quiz headers
      for (let q = 0; q < currentParcialConfig.quizzesCount; q++) {
        headers.push(`Quiz_${q + 1}_Nota`);
      }
      headers.push(`Promedio_Quizzes_Peso_${currentParcialConfig.quizzesWeight}pct`);

      // Add Tarea headers
      for (let t = 0; t < currentParcialConfig.tareasCount; t++) {
        headers.push(`Tarea_${t + 1}_Nota`);
      }
      headers.push(`Promedio_Tareas_Peso_${currentParcialConfig.tareasWeight}pct`);

      // Examen, Asistencia, Subtotal, Aporte, Estado
      headers.push(`Examen_Parcial_Peso_${currentParcialConfig.examenWeight}pct`);
      headers.push(`Asistencia_Nota_Peso_${currentParcialConfig.asistenciaWeight}pct`);
      headers.push('Subtotal_Parcial_Sobre_20');
      headers.push(`Aporte_Ponderado_Definitiva_Pts`);
      headers.push('Estado_Parcial');

      lines.push(headers.map((h) => escapeCSV(h, d)).join(d));

      // Student rows
      sectionStudents.forEach((item, idx) => {
        const s = item.student;
        const record = gradeRecords.find(
          (g) => g.studentId === s.id && g.seccionId === activeSeccion.id
        );
        const pData = record?.parciales?.[currentParcialConfig.id];
        const pSub = item.parcialSubtotals[currentParcialConfig.id] || {
          quizzesAvg: 0,
          tareasAvg: 0,
          examen: 0,
          asistenciaNota: 0,
          subtotalSobreEscala: 0,
          subtotalPonderado: 0,
        };

        const row = [
          idx + 1,
          s.id,
          s.cedula,
          s.matricula,
          `${s.apellido}, ${s.nombre}`,
          s.email,
          s.status,
        ];

        // Quizzes
        for (let q = 0; q < currentParcialConfig.quizzesCount; q++) {
          row.push(pData?.quizzes?.[q] ?? 0);
        }
        row.push(pSub.quizzesAvg);

        // Tareas
        for (let t = 0; t < currentParcialConfig.tareasCount; t++) {
          row.push(pData?.tareas?.[t] ?? 0);
        }
        row.push(pSub.tareasAvg);

        // Examen, Asist, Subtotal, Aporte, Estado
        row.push(pData?.examen ?? 0);
        row.push(pData?.asistencia ?? 20);
        row.push(pSub.subtotalSobreEscala);
        row.push(pSub.subtotalPonderado);
        row.push(item.nivel);

        lines.push(row.map((val) => escapeCSV(val, d)).join(d));
      });

      // Summary averages row
      const summaryRow: (string | number)[] = [
        'PROMEDIO_SECCION',
        '',
        '',
        '',
        `${sectionStudents.length} Estudiantes`,
        '',
        '',
      ];
      for (let q = 0; q < currentParcialConfig.quizzesCount; q++) {
        summaryRow.push('');
      }
      summaryRow.push(sectionAverages.quizzesAvg);
      for (let t = 0; t < currentParcialConfig.tareasCount; t++) {
        summaryRow.push('');
      }
      summaryRow.push(sectionAverages.tareasAvg);
      summaryRow.push(sectionAverages.examenAvg);
      summaryRow.push(20);
      summaryRow.push(sectionAverages.subtotalAvg);
      summaryRow.push('');
      summaryRow.push('');
      lines.push(summaryRow.map((val) => escapeCSV(val, d)).join(d));

    } else if (scope === 'all_parciales') {
      // 2. Export Complete detailed semester sheet with all parciales
      lines.push('# VISTA: SABANA COMPLETA DETALLADA (TODOS LOS PARCIALES Y DEFINITIVA)');

      const headers = [
        'No',
        'ID_Estudiante',
        'Cedula',
        'Matricula',
        'Apellidos_Nombres',
        'Email',
        'Estatus',
      ];

      // Add all parciales breakdown
      currentConfig.parciales.forEach((p, pIdx) => {
        for (let q = 0; q < p.quizzesCount; q++) {
          headers.push(`P${pIdx + 1}_Q${q + 1}`);
        }
        headers.push(`P${pIdx + 1}_Quizzes_Prom`);
        for (let t = 0; t < p.tareasCount; t++) {
          headers.push(`P${pIdx + 1}_T${t + 1}`);
        }
        headers.push(`P${pIdx + 1}_Tareas_Prom`);
        headers.push(`P${pIdx + 1}_Examen`);
        headers.push(`P${pIdx + 1}_Asistencia`);
        headers.push(`P${pIdx + 1}_Subtotal_20`);
        headers.push(`P${pIdx + 1}_Aporte_${p.pesoParcial}pct`);
      });

      headers.push('Asistencia_Semestral_Pct');
      headers.push('Nota_Definitiva_20');
      headers.push('Condicion_Final');
      headers.push('Nivel_Academico');

      lines.push(headers.map((h) => escapeCSV(h, d)).join(d));

      sectionStudents.forEach((item, idx) => {
        const s = item.student;
        const record = gradeRecords.find(
          (g) => g.studentId === s.id && g.seccionId === activeSeccion.id
        );

        const row = [
          idx + 1,
          s.id,
          s.cedula,
          s.matricula,
          `${s.apellido}, ${s.nombre}`,
          s.email,
          s.status,
        ];

        currentConfig.parciales.forEach((p) => {
          const pData = record?.parciales?.[p.id];
          const pSub = item.parcialSubtotals[p.id] || {
            quizzesAvg: 0,
            tareasAvg: 0,
            examen: 0,
            asistenciaNota: 0,
            subtotalSobreEscala: 0,
            subtotalPonderado: 0,
          };

          for (let q = 0; q < p.quizzesCount; q++) {
            row.push(pData?.quizzes?.[q] ?? 0);
          }
          row.push(pSub.quizzesAvg);

          for (let t = 0; t < p.tareasCount; t++) {
            row.push(pData?.tareas?.[t] ?? 0);
          }
          row.push(pSub.tareasAvg);

          row.push(pData?.examen ?? 0);
          row.push(pData?.asistencia ?? 20);
          row.push(pSub.subtotalSobreEscala);
          row.push(pSub.subtotalPonderado);
        });

        row.push(`${item.asistenciaPorcentaje}%`);
        row.push(item.notaDefinitiva);
        row.push(item.isAprobado ? 'APROBADO' : 'REPROBADO');
        row.push(item.nivel);

        lines.push(row.map((val) => escapeCSV(val, d)).join(d));
      });

    } else {
      // 3. Consolidated Semester Summary
      lines.push('# VISTA: RESUMEN SEMESTRAL CONSOLIDADO DE CALIFICACIONES');

      const headers = [
        'No',
        'ID_Estudiante',
        'Cedula',
        'Matricula',
        'Apellidos_Nombres',
        'Email',
        'Estatus',
      ];

      currentConfig.parciales.forEach((p, pIdx) => {
        headers.push(`Parcial_${pIdx + 1}_Subtotal_20`);
        headers.push(`Parcial_${pIdx + 1}_Aporte_${p.pesoParcial}pct`);
      });

      headers.push('Asistencia_Semestral_Pct');
      headers.push('Nota_Definitiva_20');
      headers.push('Condicion_Final');
      headers.push('Nivel_Academico');

      lines.push(headers.map((h) => escapeCSV(h, d)).join(d));

      sectionStudents.forEach((item, idx) => {
        const s = item.student;
        const row = [
          idx + 1,
          s.id,
          s.cedula,
          s.matricula,
          `${s.apellido}, ${s.nombre}`,
          s.email,
          s.status,
        ];

        currentConfig.parciales.forEach((p) => {
          const sub = item.parcialSubtotals[p.id];
          row.push(sub?.subtotalSobreEscala ?? 0);
          row.push(sub?.subtotalPonderado ?? 0);
        });

        row.push(`${item.asistenciaPorcentaje}%`);
        row.push(item.notaDefinitiva);
        row.push(item.isAprobado ? 'APROBADO' : 'REPROBADO');
        row.push(item.nivel);

        lines.push(row.map((val) => escapeCSV(val, d)).join(d));
      });
    }

    // Build CSV with UTF-8 BOM (\uFEFF) to ensure Microsoft Excel and other external tools
    // render accents and Spanish characters cleanly without encoding glitches
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;

    const cleanDate = new Date().toISOString().split('T')[0];
    const sheetTag =
      scope === 'all_parciales'
        ? 'SemestreCompleto'
        : selectedParcialId === 'resumen'
        ? 'ResumenSemestral'
        : `Parcial_${selectedParcialId}`;

    const filename = `SabanaNotas_${activeMateria.codigo}_${activeSeccion.codigoSeccion}_${sheetTag}_${cleanDate}.csv`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvExportSuccess(filename);
    setShowExportMenu(false);
    setTimeout(() => setCsvExportSuccess(null), 4000);
  };

  // Section averages in current view
  const sectionAverages = useMemo(() => {
    if (sectionStudents.length === 0 || !currentParcialConfig) {
      return { quizzesAvg: 0, tareasAvg: 0, examenAvg: 0, subtotalAvg: 0 };
    }

    let sumQ = 0;
    let sumT = 0;
    let sumE = 0;
    let sumSub = 0;

    sectionStudents.forEach((cs) => {
      const pSub = cs.parcialSubtotals[currentParcialConfig.id];
      if (pSub) {
        sumQ += pSub.quizzesAvg;
        sumT += pSub.tareasAvg;
        sumE += pSub.examen;
        sumSub += pSub.subtotalSobreEscala;
      }
    });

    const total = sectionStudents.length;
    return {
      quizzesAvg: Number((sumQ / total).toFixed(2)),
      tareasAvg: Number((sumT / total).toFixed(2)),
      examenAvg: Number((sumE / total).toFixed(2)),
      subtotalAvg: Number((sumSub / total).toFixed(2)),
    };
  }, [sectionStudents, currentParcialConfig]);

  // State for PDF export feedback
  const [pdfExportSuccess, setPdfExportSuccess] = useState<string | null>(null);

  // Export current grade sheet as formatted PDF using jsPDF
  const handleExportPDF = () => {
    if (!activeMateria || !activeSeccion) return;
    try {
      const filename = exportGradeSheetPDF({
        materia: activeMateria,
        seccion: activeSeccion,
        config: currentConfig,
        selectedParcialId,
        currentParcialConfig,
        sectionStudents,
        gradeRecords,
        professor,
        sectionAverages,
      });
      setPdfExportSuccess(filename);
      setTimeout(() => setPdfExportSuccess(null), 4000);
    } catch (err) {
      console.error('Error al generar el PDF de la sábana de notas:', err);
    }
  };

  if (!activeMateria || !activeSeccion) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
        No hay materias o secciones disponibles. Por favor cree una en el módulo de Materias.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Selectors */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TableProperties className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Sábana de Calificaciones
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">Vaciado de Notas Semestrales</h1>
            <p className="text-xs text-slate-400">
              Edición en matriz directa de Quizzes, Tareas, Examen Parcial y Asistencia con recálculo
              automático de definitivas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleBulkAttendance}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Llenar asistencia del parcial con 20 a todos los alumnos"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Autollenar Asistencia</span>
            </button>

            {/* CSV Export split button & dropdown */}
            <div className="relative">
              <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shadow-sm">
                <button
                  onClick={() => handleExportCSV('current')}
                  title="Exportar la sábana actual como archivo CSV compatible con Excel"
                  className="px-3 py-1.5 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  title="Opciones de exportación CSV"
                  className="px-2 py-1.5 hover:bg-slate-700 border-l border-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showExportMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <span className="font-bold text-white block">Exportar Sábana de Notas</span>
                    <span className="text-[11px] text-slate-400">
                      Archivo .csv con codificación UTF-8 para Excel / Python / R
                    </span>
                  </div>

                  <button
                    onClick={() => handleExportCSV('current')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold block">Sábana Actual</span>
                      <span className="text-[10px] text-slate-400">
                        {selectedParcialId === 'resumen'
                          ? 'Resumen Semestral Consolidado'
                          : `${currentParcialConfig?.nombre}`}
                      </span>
                    </div>
                    <FileDown className="w-4 h-4 text-cyan-400 shrink-0" />
                  </button>

                  <button
                    onClick={() => handleExportCSV('all_parciales')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between transition cursor-pointer mt-1"
                  >
                    <div>
                      <span className="font-semibold block">Semestre Completo Detallado</span>
                      <span className="text-[10px] text-slate-400">
                        Todos los quizzes, tareas, exámenes y definitivas
                      </span>
                    </div>
                    <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                  </button>

                  <div className="mt-2 pt-2 border-t border-slate-800 px-3 py-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Separador:</span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setCsvDelimiter(',')}
                        className={`px-2 py-0.5 rounded ${
                          csvDelimiter === ','
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Coma (Estándar internacional)"
                      >
                        , Coma
                      </button>
                      <button
                        onClick={() => setCsvDelimiter(';')}
                        className={`px-2 py-0.5 rounded ${
                          csvDelimiter === ';'
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Punto y coma (Recomendado para Excel en español)"
                      >
                        ; Punto y coma
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Download formatted PDF button using jsPDF */}
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Descargar la sábana de notas actual como archivo PDF oficial en formato apaisado"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Descargar PDF</span>
            </button>

            {/* Google Sheets Cloud Sync & Export */}
            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white text-xs font-medium rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Conectar con Google Sheets para exportar o sincronizar calificaciones en la nube de Google Drive"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            <button
              onClick={onOpenActaModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Acta Oficial</span>
            </button>
          </div>
        </div>

        {/* CSV Export Success Banner */}
        {csvExportSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                Sábana exportada con éxito como <strong className="text-white font-mono">{csvExportSuccess}</strong> (UTF-8 con soporte para Excel, Google Sheets y sistemas externos).
              </span>
            </div>
            <button
              onClick={() => setCsvExportSuccess(null)}
              className="text-emerald-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PDF Export Success Banner */}
        {pdfExportSuccess && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <Check className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="truncate">
                Sábana de notas descargada en PDF: <strong className="text-white font-mono">{pdfExportSuccess}</strong> (Formato apaisado de alta resolución con firmas institucionales).
              </span>
            </div>
            <button
              onClick={() => setPdfExportSuccess(null)}
              className="text-rose-400 hover:text-white ml-2 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Course & Section Pills Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-medium">Asignatura:</span>
            {materias.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setSelectedMateriaId(m.id);
                  const firstSec = secciones.find((s) => s.materiaId === m.id);
                  if (firstSec) setSelectedSeccionId(firstSec.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeMateria.id === m.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {m.codigo} - {m.nombre}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Sección:</span>
            {activeSecciones.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setSelectedSeccionId(sec.id)}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  activeSeccion.id === sec.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {sec.codigoSeccion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs for Parciales */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {currentConfig.parciales.map((p, idx) => {
          const isSelected = selectedParcialId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedParcialId(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Parcial {idx + 1}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-950 text-indigo-400 border border-slate-800">
                {p.pesoParcial}%
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setSelectedParcialId('resumen')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
            selectedParcialId === 'resumen'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>Resumen Semestral Consolidado</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-200">
            Definitiva
          </span>
        </button>
      </div>

      {/* Active Parcial Info Bar */}
      {selectedParcialId !== 'resumen' && currentParcialConfig && (
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{currentParcialConfig.nombre}</span>
            <span className="text-slate-400">• Peso Semestral: {currentParcialConfig.pesoParcial}%</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>
              Quizzes ({currentParcialConfig.quizzesCount}): <strong className="text-cyan-400">{currentParcialConfig.quizzesWeight}%</strong>
            </span>
            <span>•</span>
            <span>
              Tareas ({currentParcialConfig.tareasCount}): <strong className="text-cyan-400">{currentParcialConfig.tareasWeight}%</strong>
            </span>
            <span>•</span>
            <span>
              Examen Parcial: <strong className="text-indigo-400">{currentParcialConfig.examenWeight}%</strong>
            </span>
            <span>•</span>
            <span>
              Asistencia: <strong className="text-amber-400">{currentParcialConfig.asistenciaWeight}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Interactive Grade Matrix Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {selectedParcialId !== 'resumen' && currentParcialConfig ? (
            /* Matrix for specific Parcial */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">N°</th>
                  <th className="py-3 px-3">Estudiante</th>
                  <th className="py-3 px-3 font-mono">Cédula</th>

                  {/* Quizzes headers */}
                  {Array.from({ length: currentParcialConfig.quizzesCount }).map((_, qIdx) => (
                    <th key={qIdx} className="py-3 px-2 text-center w-18">
                      Q{qIdx + 1}
                    </th>
                  ))}

                  {/* Tareas headers */}
                  {Array.from({ length: currentParcialConfig.tareasCount }).map((_, tIdx) => (
                    <th key={tIdx} className="py-3 px-2 text-center w-18">
                      T{tIdx + 1}
                    </th>
                  ))}

                  <th className="py-3 px-2 text-center w-20">Examen</th>
                  <th className="py-3 px-2 text-center w-18">Asist.</th>
                  <th className="py-3 px-3 text-right w-24">Subtotal /20</th>
                  <th className="py-3 px-3 text-right w-24">Aporte P1</th>
                  <th className="py-3 px-3 text-center w-24">Estado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {sectionStudents.map((item, idx) => {
                  const s = item.student;
                  const record = gradeRecords.find(
                    (g) => g.studentId === s.id && g.seccionId === activeSeccion.id
                  );
                  const pData = record?.parciales?.[currentParcialConfig.id];
                  const pSub = item.parcialSubtotals[currentParcialConfig.id] || {
                    quizzesAvg: 0,
                    tareasAvg: 0,
                    examen: 0,
                    asistenciaNota: 0,
                    subtotalSobreEscala: 0,
                    subtotalPonderado: 0,
                  };
                  const nivel = getNivelColor(item.nivel);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.fotoUrl}
                            alt={s.nombre}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                          />
                          <span className="font-semibold text-white whitespace-nowrap">
                            {s.nombre} {s.apellido}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {s.cedula}
                      </td>

                      {/* Quizzes Inputs */}
                      {Array.from({ length: currentParcialConfig.quizzesCount }).map((_, qIdx) => {
                        const val = pData?.quizzes?.[qIdx] ?? 0;
                        return (
                          <td key={qIdx} className="py-2 px-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={val}
                              onChange={(e) =>
                                handleGradeChange(s.id, 'quiz', qIdx, e.target.value)
                              }
                              className={`w-14 text-center py-1 bg-slate-950 border rounded-lg font-mono font-medium text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                val >= 10
                                  ? 'text-emerald-400 border-slate-800'
                                  : 'text-rose-400 border-rose-500/40 bg-rose-500/5'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Tareas Inputs */}
                      {Array.from({ length: currentParcialConfig.tareasCount }).map((_, tIdx) => {
                        const val = pData?.tareas?.[tIdx] ?? 0;
                        return (
                          <td key={tIdx} className="py-2 px-1 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={val}
                              onChange={(e) =>
                                handleGradeChange(s.id, 'tarea', tIdx, e.target.value)
                              }
                              className={`w-14 text-center py-1 bg-slate-950 border rounded-lg font-mono font-medium text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                val >= 10
                                  ? 'text-emerald-400 border-slate-800'
                                  : 'text-rose-400 border-rose-500/40 bg-rose-500/5'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Examen Input */}
                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={pData?.examen ?? 0}
                          onChange={(e) =>
                            handleGradeChange(s.id, 'examen', 0, e.target.value)
                          }
                          className={`w-16 text-center py-1 bg-slate-950 border rounded-lg font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            (pData?.examen ?? 0) >= 10
                              ? 'text-indigo-300 border-indigo-500/40'
                              : 'text-rose-400 border-rose-500/40 bg-rose-500/5'
                          }`}
                        />
                      </td>

                      {/* Asistencia Input */}
                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={pData?.asistencia ?? 20}
                          onChange={(e) =>
                            handleGradeChange(s.id, 'asistencia', 0, e.target.value)
                          }
                          className="w-14 text-center py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-amber-400 text-xs focus:outline-none"
                        />
                      </td>

                      {/* Subtotal Sobre Escala */}
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`font-bold font-mono text-sm ${
                            pSub.subtotalSobreEscala >= 10 ? 'text-white' : 'text-rose-400'
                          }`}
                        >
                          {pSub.subtotalSobreEscala}
                        </span>
                      </td>

                      {/* Aporte Ponderado */}
                      <td className="py-2.5 px-3 text-right">
                        <span className="font-mono text-cyan-400 font-semibold">
                          +{pSub.subtotalPonderado} pts
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold ${nivel.bg} ${nivel.text} ${nivel.border}`}
                        >
                          {nivel.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Bottom Averages Footer */}
              <tfoot>
                <tr className="bg-slate-950 border-t-2 border-slate-800 text-slate-300 font-bold text-xs">
                  <td colSpan={3} className="py-3 px-4 uppercase tracking-wider text-[11px]">
                    Promedio de Sección ({sectionStudents.length} Alumnos):
                  </td>
                  <td
                    colSpan={currentParcialConfig.quizzesCount}
                    className="py-3 px-2 text-center text-cyan-400 font-mono"
                  >
                    Quizzes: {sectionAverages.quizzesAvg}
                  </td>
                  <td
                    colSpan={currentParcialConfig.tareasCount}
                    className="py-3 px-2 text-center text-cyan-400 font-mono"
                  >
                    Tareas: {sectionAverages.tareasAvg}
                  </td>
                  <td className="py-3 px-2 text-center text-indigo-400 font-mono">
                    {sectionAverages.examenAvg}
                  </td>
                  <td className="py-3 px-2 text-center text-amber-400 font-mono">20</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-mono text-sm">
                    {sectionAverages.subtotalAvg}
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-[10px] text-slate-400">
                    Autoguardado activado
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            /* Consolidated Semester Summary Table */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">N°</th>
                  <th className="py-3 px-3">Estudiante</th>
                  <th className="py-3 px-3 font-mono">Cédula</th>
                  {currentConfig.parciales.map((p, idx) => (
                    <th key={p.id} className="py-3 px-3 text-center">
                      Parcial {idx + 1} ({p.pesoParcial}%)
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center">Asist. %</th>
                  <th className="py-3 px-3 text-right">Nota Definitiva</th>
                  <th className="py-3 px-3 text-center">Condición Final</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {sectionStudents.map((item, idx) => {
                  const s = item.student;
                  const nivel = getNivelColor(item.nivel);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={s.fotoUrl}
                            alt={s.nombre}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <span className="font-semibold text-white block">
                              {s.nombre} {s.apellido}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Mat: {s.matricula}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                        {s.cedula}
                      </td>

                      {currentConfig.parciales.map((p) => {
                        const sub = item.parcialSubtotals[p.id];
                        const val = sub?.subtotalSobreEscala ?? 0;
                        return (
                          <td key={p.id} className="py-3 px-3 text-center font-mono">
                            <span
                              className={`font-semibold ${
                                val >= 10 ? 'text-white' : 'text-rose-400'
                              }`}
                            >
                              {val}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              (+{sub?.subtotalPonderado ?? 0})
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-amber-400 font-mono">
                          {item.asistenciaPorcentaje}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-base font-bold font-mono ${
                            item.isAprobado ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.notaDefinitiva}
                        </span>
                        <span className="text-[10px] text-slate-400"> /20</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] px-2.5 py-0.5 rounded border uppercase font-bold ${nivel.bg} ${nivel.text} ${nivel.border}`}
                        >
                          {item.isAprobado ? 'Aprobado' : 'Reprobado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Google Sheets Modal */}
      {isGoogleSheetsModalOpen && (
        <GoogleSheetsModal
          onClose={() => setIsGoogleSheetsModalOpen(false)}
          selectedParcialId={selectedParcialId}
        />
      )}
    </div>
  );
};
