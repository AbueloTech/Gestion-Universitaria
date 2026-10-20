import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateSectionStats,
  getNivelColor,
} from '../utils/gradeCalculations';
import {
  BarChart3,
  TrendingUp,
  User,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Calculator,
  Search,
  BookOpen,
} from 'lucide-react';

export const EstadisticasView: React.FC = () => {
  const {
    materias,
    secciones,
    configuraciones,
    calculatedStudents,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
  } = useApp();

  // Mode: grupal vs individual
  const [statMode, setStatMode] = useState<'grupal' | 'individual'>('grupal');

  // Selected student for individual mode
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Active materia and seccion for group view
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

  const currentConfig = useMemo(() => {
    return (
      configuraciones.find((c) => c.materiaId === activeMateria?.id) ||
      configuraciones[0]
    );
  }, [configuraciones, activeMateria]);

  // Students in group
  const groupStudents = useMemo(() => {
    if (!activeSeccion) return [];
    return calculatedStudents.filter((s) => s.seccion.id === activeSeccion.id);
  }, [calculatedStudents, activeSeccion]);

  const groupStats = useMemo(() => {
    return calculateSectionStats(groupStudents);
  }, [groupStudents]);

  // Averages per parcial
  const parcialAverages = useMemo(() => {
    if (!currentConfig || groupStudents.length === 0) return [];
    return currentConfig.parciales.map((p) => {
      let sum = 0;
      groupStudents.forEach((st) => {
        sum += st.parcialSubtotals[p.id]?.subtotalSobreEscala || 0;
      });
      return {
        id: p.id,
        nombre: p.nombre,
        peso: p.pesoParcial,
        promedio: Number((sum / groupStudents.length).toFixed(2)),
      };
    });
  }, [currentConfig, groupStudents]);

  // Component breakdown average (Quizzes, Tareas, Examen, Asistencia)
  const componentAverages = useMemo(() => {
    if (groupStudents.length === 0) {
      return { quizzes: 0, tareas: 0, examen: 0, asistencia: 0 };
    }
    let totalQ = 0;
    let totalT = 0;
    let totalE = 0;
    let count = 0;

    groupStudents.forEach((st) => {
      Object.values(st.parcialSubtotals).forEach((sub) => {
        totalQ += sub.quizzesAvg;
        totalT += sub.tareasAvg;
        totalE += sub.examen;
        count++;
      });
    });

    const divisor = count || 1;
    return {
      quizzes: Number((totalQ / divisor).toFixed(2)),
      tareas: Number((totalT / divisor).toFixed(2)),
      examen: Number((totalE / divisor).toFixed(2)),
      asistencia: groupStats.asistenciaPromedio,
    };
  }, [groupStudents, groupStats]);

  // Individual mode student
  const activeStudentCalc = useMemo(() => {
    if (selectedStudentId) {
      const found = calculatedStudents.find((s) => s.student.id === selectedStudentId);
      if (found) return found;
    }
    return groupStudents[0] || calculatedStudents[0];
  }, [selectedStudentId, calculatedStudents, groupStudents]);

  // Filter students for individual picker
  const filteredStudentList = useMemo(() => {
    return calculatedStudents.filter((st) => {
      const fullName = `${st.student.nombre} ${st.student.apellido}`.toLowerCase();
      const matchSearch =
        fullName.includes(studentSearch.toLowerCase()) ||
        st.student.matricula.toLowerCase().includes(studentSearch.toLowerCase());
      return matchSearch;
    });
  }, [calculatedStudents, studentSearch]);

  // Calculate prediction for selected student
  const prediction = useMemo(() => {
    if (!activeStudentCalc || !currentConfig) return null;
    const notaMinima = currentConfig.notaMinimaAprobatoria || 10;
    const accumulated = activeStudentCalc.notaDefinitiva; // Points already accumulated
    const pointsNeeded = Math.max(0, notaMinima - accumulated);

    // Assuming Parcial 3 has weight 35%
    const p3Config = currentConfig.parciales[2] || currentConfig.parciales[currentConfig.parciales.length - 1];
    const p3Weight = p3Config?.pesoParcial || 35;
    const requiredInP3 = Number(((pointsNeeded / p3Weight) * 100).toFixed(1));

    return {
      pointsNeeded: Number(pointsNeeded.toFixed(2)),
      requiredInP3,
      isAlreadyPassing: accumulated >= notaMinima,
      isPossible: requiredInP3 <= 20,
    };
  }, [activeStudentCalc, currentConfig]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Analíticas y Rendimiento
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Estadísticas Académicas del Curso</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Análisis comparativo del desempeño grupal por sección e inspección del progreso
            individual con simulador de aprobación.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatMode('grupal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              statMode === 'grupal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Análisis Grupal</span>
          </button>
          <button
            onClick={() => setStatMode('individual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              statMode === 'individual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Análisis Individual</span>
          </button>
        </div>
      </div>

      {statMode === 'grupal' ? (
        /* ================= GRUPAL VIEW ================= */
        <div className="space-y-6">
          {/* Selectors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    activeMateria?.id === m.id
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
                    activeSeccion?.id === sec.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sec.codigoSeccion} ({sec.aulaPrincipal})
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">Promedio de la Sección</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white">{groupStats.promedioGeneral}</span>
                <span className="text-xs text-slate-500">/ 20</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {groupStats.totalEstudiantes} alumnos evaluados
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">Tasa de Aprobación</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">
                  {groupStats.tasaAprobacion}%
                </span>
                <span className="text-xs text-slate-500">
                  ({groupStats.aprobadosCount} aprobados)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Nota mínima: 10 pts</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">Rango de Calificaciones</span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">
                  {groupStats.notaMaxima}
                </span>
                <span className="text-xs text-slate-500">a</span>
                <span className="text-lg font-bold text-rose-400">
                  {groupStats.notaMinima}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Máxima y Mínima obtenidas</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1">Asistencia Promedio</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-amber-400">
                  {groupStats.asistenciaPromedio}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Asistencia presencial al aula</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Promedio Comparativo por Parcial */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white">
                Rendimiento Promedio por Parcial / Corte
              </h3>

              <div className="space-y-4 pt-2">
                {parcialAverages.map((p, idx) => {
                  const pct = (p.promedio / 20) * 100;
                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-semibold">
                          {p.nombre} ({p.peso}%)
                        </span>
                        <span className="font-mono font-bold text-white">
                          {p.promedio} <span className="text-[10px] text-slate-400">/ 20</span>
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Comparación del promedio ponderado obtenido por la sección en cada uno de los
                parciales configurados.
              </p>
            </div>

            {/* Chart 2: Desglose por Componente de Evaluación */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white">
                Rendimiento por Componente Evaluativo
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block">Quizzes / Pruebas</span>
                  <span className="text-xl font-bold text-cyan-400">
                    {componentAverages.quizzes} <span className="text-xs text-slate-500">/ 20</span>
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-cyan-500 h-full rounded-full"
                      style={{ width: `${(componentAverages.quizzes / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block">Tareas / Trabajos</span>
                  <span className="text-xl font-bold text-indigo-400">
                    {componentAverages.tareas} <span className="text-xs text-slate-500">/ 20</span>
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{ width: `${(componentAverages.tareas / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block">Exámenes Parciales</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {componentAverages.examen} <span className="text-xs text-slate-500">/ 20</span>
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(componentAverages.examen / 20) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 block">Asistencia Media</span>
                  <span className="text-xl font-bold text-amber-400">
                    {componentAverages.asistencia}%
                  </span>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${componentAverages.asistencia}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Permite al profesor identificar si el grupo tiene mayor dificultad en los exámenes
                escritos o en la entrega de tareas prácticas.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ================= INDIVIDUAL VIEW ================= */
        <div className="space-y-6">
          {/* Student Picker Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar alumno por nombre o matrícula..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-xl">
              {filteredStudentList.slice(0, 6).map((item) => {
                const isSelected = activeStudentCalc?.student.id === item.student.id;
                return (
                  <button
                    key={item.student.id}
                    onClick={() => setSelectedStudentId(item.student.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
                    }`}
                  >
                    <img
                      src={item.student.fotoUrl}
                      alt={item.student.nombre}
                      className="w-5 h-5 rounded-md object-cover"
                    />
                    <span>{item.student.nombre}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeStudentCalc && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={activeStudentCalc.student.fotoUrl}
                    alt={activeStudentCalc.student.nombre}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {activeStudentCalc.student.nombre} {activeStudentCalc.student.apellido}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      C.I: {activeStudentCalc.student.cedula}
                    </p>
                    <p className="text-xs text-indigo-400 font-mono">
                      Mat: {activeStudentCalc.student.matricula}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Asignatura:</span>
                    <span className="font-semibold text-white">
                      {activeStudentCalc.materia.codigo} - {activeStudentCalc.materia.nombre}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Sección:</span>
                    <span className="font-semibold text-cyan-400">
                      {activeStudentCalc.seccion.codigoSeccion}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Definitiva Acumulada:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {activeStudentCalc.notaDefinitiva} / 20
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Asistencia:</span>
                    <span className="font-bold text-amber-400">
                      {activeStudentCalc.asistenciaPorcentaje}%
                    </span>
                  </div>
                </div>

                {/* Level badge */}
                <div className="pt-2">
                  <div
                    className={`p-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider ${
                      getNivelColor(activeStudentCalc.nivel).bg
                    } ${getNivelColor(activeStudentCalc.nivel).text} ${
                      getNivelColor(activeStudentCalc.nivel).border
                    }`}
                  >
                    Estado: {getNivelColor(activeStudentCalc.nivel).label}
                  </div>
                </div>
              </div>

              {/* Parciales Breakdown & Temporal Evolution */}
              <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Evolución Parcial a Parcial y Calificaciones
                </h3>

                <div className="space-y-3">
                  {Object.entries(activeStudentCalc.parcialSubtotals).map(([pId, data], idx) => {
                    return (
                      <div
                        key={pId}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white">Parcial {idx + 1}</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {data.subtotalSobreEscala} / 20{' '}
                            <span className="text-slate-500 font-normal text-xs">
                              (Aporta +{data.subtotalPonderado} pts)
                            </span>
                          </span>
                        </div>

                        {/* Breakdown pills */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1">
                          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Quizzes</span>
                            <span className="font-semibold text-cyan-400">{data.quizzesAvg}</span>
                          </div>
                          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Tareas</span>
                            <span className="font-semibold text-indigo-400">{data.tareasAvg}</span>
                          </div>
                          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Examen</span>
                            <span className="font-semibold text-emerald-400">{data.examen}</span>
                          </div>
                          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Asistencia</span>
                            <span className="font-semibold text-amber-400">
                              {data.asistenciaNota}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Academic Simulator / Forecast Box */}
                {prediction && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                      <Calculator className="w-4 h-4" />
                      <span>Simulador de Proyección Académica (Cálculo de Aprobación)</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {prediction.isAlreadyPassing ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          El alumno ya ha alcanzado la puntuación mínima acumulada para aprobar la
                          materia (acumulado actual: {activeStudentCalc.notaDefinitiva} / 20).
                        </span>
                      ) : (
                        <span>
                          Para alcanzar la nota mínima aprobatoria de <strong>10 pts</strong>, el
                          estudiante necesita{' '}
                          <strong className="text-amber-400">
                            +{prediction.pointsNeeded} puntos adicionales
                          </strong>{' '}
                          en la nota definitiva acumulada.
                          {prediction.isPossible ? (
                            <span className="block mt-1 text-slate-300">
                              En el 3er Parcial (35%), requiere una calificación de al menos{' '}
                              <strong className="text-white bg-indigo-600 px-1.5 py-0.5 rounded">
                                {prediction.requiredInP3} / 20
                              </strong>{' '}
                              para asegurar la materia.
                            </span>
                          ) : (
                            <span className="block mt-1 text-rose-400 font-semibold">
                              Atención: Matemáticamente no alcanza el puntaje mínimo con el peso
                              restante. Se recomienda asignación de recuperación.
                            </span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
