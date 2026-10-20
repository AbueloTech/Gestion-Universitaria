import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  calculateSectionStats,
  getNivelColor,
} from '../utils/gradeCalculations';
import {
  Users,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  TableProperties,
  ArrowRight,
  UserX,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    professor,
    materias,
    secciones,
    calculatedStudents,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
    setActiveTab,
    activeConfig,
  } = useApp();

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    return calculatedStudents.filter((item) => {
      if (selectedMateriaId !== 'all' && item.materia.id !== selectedMateriaId) {
        return false;
      }
      if (selectedSeccionId !== 'all' && item.seccion.id !== selectedSeccionId) {
        return false;
      }
      return true;
    });
  }, [calculatedStudents, selectedMateriaId, selectedSeccionId]);

  const stats = useMemo(() => {
    return calculateSectionStats(filteredStudents);
  }, [filteredStudents]);

  // Sections in the current view
  const currentSecciones = useMemo(() => {
    return secciones.filter((s) => {
      if (selectedMateriaId !== 'all' && s.materiaId !== selectedMateriaId) return false;
      if (selectedSeccionId !== 'all' && s.id !== selectedSeccionId) return false;
      return true;
    });
  }, [secciones, selectedMateriaId, selectedSeccionId]);

  // Section comparison metrics
  const sectionComparisons = useMemo(() => {
    return currentSecciones.map((sec) => {
      const parentMat = materias.find((m) => m.id === sec.materiaId);
      const secStudents = calculatedStudents.filter((s) => s.seccion.id === sec.id);
      const secStats = calculateSectionStats(secStudents);
      return {
        seccion: sec,
        materia: parentMat,
        stats: secStats,
      };
    });
  }, [currentSecciones, materias, calculatedStudents]);

  // Schedule for the week
  const allHorarios = useMemo(() => {
    const list: Array<{
      id: string;
      dia: string;
      horaInicio: string;
      horaFin: string;
      aula: string;
      seccionCodigo: string;
      materiaNombre: string;
      materiaCodigo: string;
      materiaColor: string;
    }> = [];

    currentSecciones.forEach((sec) => {
      const mat = materias.find((m) => m.id === sec.materiaId);
      if (!mat) return;
      sec.horarios.forEach((h) => {
        list.push({
          id: `${sec.id}-${h.id}`,
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          aula: h.aula || sec.aulaPrincipal,
          seccionCodigo: sec.codigoSeccion,
          materiaNombre: mat.nombre,
          materiaCodigo: mat.codigo,
          materiaColor: mat.color,
        });
      });
    });

    // Sort by day and time
    const dayOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return list.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.dia) - dayOrder.indexOf(b.dia);
      if (dayDiff !== 0) return dayDiff;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [currentSecciones, materias]);

  // At risk students list
  const atRiskStudents = useMemo(() => {
    return filteredStudents
      .filter((s) => s.nivel === 'en_riesgo' || s.nivel === 'reprobado')
      .sort((a, b) => a.notaDefinitiva - b.notaDefinitiva);
  }, [filteredStudents]);

  // Best performing students
  const topStudents = useMemo(() => {
    return [...filteredStudents]
      .sort((a, b) => b.notaDefinitiva - a.notaDefinitiva)
      .slice(0, 5);
  }, [filteredStudents]);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                Semestre {professor.semestreActivo}
              </span>
              <span className="text-xs text-slate-400">• {professor.facultad}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              ¡Bienvenido, {professor.title} {professor.name}!
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Panel de control y seguimiento académico general. Monitoree las notas, comportamiento
              por sección, asistencias y estudiantes en riesgo en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('vaciado')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <TableProperties className="w-4 h-4" />
              <span>Vaciado de Notas</span>
            </button>
            <button
              onClick={() => setActiveTab('asistencia')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <span>Pase de Asistencia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Materia selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            setSelectedMateriaId('all');
            setSelectedSeccionId('all');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
            selectedMateriaId === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
          }`}
        >
          Todas las Materias ({materias.length})
        </button>
        {materias.map((m) => {
          const isSelected = selectedMateriaId === m.id;
          const count = calculatedStudents.filter((s) => s.materia.id === m.id).length;
          return (
            <button
              key={m.id}
              onClick={() => {
                setSelectedMateriaId(m.id);
                setSelectedSeccionId('all');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: m.color || '#6366f1' }}
              />
              <span>{m.codigo} - {m.nombre}</span>
              <span className="px-1.5 py-0.2 bg-slate-900/60 text-[10px] rounded text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Alumnos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Alumnos</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{stats.totalEstudiantes}</span>
            <span className="text-xs text-slate-500">en {currentSecciones.length} secciones</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {selectedMateriaId === 'all' ? 'En todas las materias' : 'En materia seleccionada'}
          </p>
        </div>

        {/* Card 2: Promedio General */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Promedio General</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-white">{stats.promedioGeneral}</span>
            <span className="text-xs text-slate-500">/ 20 pts</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Máx: <strong className="text-emerald-400">{stats.notaMaxima}</strong></span>
            <span>•</span>
            <span>Mín: <strong className="text-rose-400">{stats.notaMinima}</strong></span>
          </div>
        </div>

        {/* Card 3: Tasa de Aprobación */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Aprobación</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{stats.tasaAprobacion}%</span>
            <span className="text-xs text-slate-500">({stats.aprobadosCount}/{stats.totalEstudiantes})</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.tasaAprobacion}%` }}
            />
          </div>
        </div>

        {/* Card 4: Asistencia Media */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Asistencia Media</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{stats.asistenciaPromedio}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.asistenciaPromedio}%` }}
            />
          </div>
        </div>

        {/* Card 5: Alumnos en Riesgo */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Alumnos en Riesgo</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{stats.enRiesgoCount + stats.reprobadosCount}</span>
            <span className="text-xs text-rose-400/80">críticos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Requieren atención y asesoría
          </p>
        </div>
      </div>

      {/* Grid: Comportamiento por Secciones & Distribución de Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Comportamiento de cada Sección / Grupo */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Comportamiento por Sección / Grupo</h2>
              <p className="text-xs text-slate-400">
                Comparativa de notas promedio, asistencia y tasa de aprobación por cada sección
              </p>
            </div>
            <span className="text-xs text-slate-500">{sectionComparisons.length} secciones activas</span>
          </div>

          <div className="space-y-3">
            {sectionComparisons.map((sc) => {
              const sec = sc.seccion;
              const mat = sc.materia;
              const sStats = sc.stats;
              const passPct = sStats.tasaAprobacion;
              const isSelected = selectedSeccionId === sec.id;

              return (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSeccionId(isSelected ? 'all' : sec.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: mat?.color || '#6366f1' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {mat?.codigo} - {sec.codigoSeccion}
                          </span>
                          <span className="text-xs text-slate-400">• {mat?.nombre}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{sec.aulaPrincipal}</span>
                          <span>•</span>
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{sStats.totalEstudiantes} estudiantes</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Promedio
                        </span>
                        <span className="text-sm font-bold text-white">
                          {sStats.promedioGeneral} <span className="text-[10px] text-slate-400">/20</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Asistencia
                        </span>
                        <span className="text-sm font-bold text-amber-400">
                          {sStats.asistenciaPromedio}%
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Aprobados
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          {passPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress bar breakdown */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Distribución de Aprobados ({sStats.aprobadosCount}) vs Reprobados/Riesgo ({sStats.reprobadosCount + sStats.enRiesgoCount})</span>
                      <span className="font-medium text-slate-300">{passPct}% Aprobación</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(sStats.distribucionNiveles.sobresaliente / (sStats.totalEstudiantes || 1)) * 100}%` }}
                        title={`Sobresalientes: ${sStats.distribucionNiveles.sobresaliente}`}
                      />
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(sStats.distribucionNiveles.notable / (sStats.totalEstudiantes || 1)) * 100}%` }}
                        title={`Notables: ${sStats.distribucionNiveles.notable}`}
                      />
                      <div
                        className="bg-teal-500"
                        style={{ width: `${(sStats.distribucionNiveles.aprobado / (sStats.totalEstudiantes || 1)) * 100}%` }}
                        title={`Aprobados regulares: ${sStats.distribucionNiveles.aprobado}`}
                      />
                      <div
                        className="bg-amber-500"
                        style={{ width: `${(sStats.distribucionNiveles.en_riesgo / (sStats.totalEstudiantes || 1)) * 100}%` }}
                        title={`En Riesgo: ${sStats.distribucionNiveles.en_riesgo}`}
                      />
                      <div
                        className="bg-rose-500"
                        style={{ width: `${(sStats.distribucionNiveles.reprobado / (sStats.totalEstudiantes || 1)) * 100}%` }}
                        title={`Reprobados: ${sStats.distribucionNiveles.reprobado}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 col): Distribución de Calificaciones (Histogram) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Distribución de Notas</h2>
            <p className="text-xs text-slate-400">
              Clasificación por rangos de rendimiento académico
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                label: 'Sobresaliente (18 - 20)',
                count: stats.distribucionNiveles.sobresaliente,
                color: 'bg-emerald-500',
                textColor: 'text-emerald-400',
              },
              {
                label: 'Notable (15 - 17.9)',
                count: stats.distribucionNiveles.notable,
                color: 'bg-blue-500',
                textColor: 'text-blue-400',
              },
              {
                label: 'Aprobado (10 - 14.9)',
                count: stats.distribucionNiveles.aprobado,
                color: 'bg-teal-500',
                textColor: 'text-teal-400',
              },
              {
                label: 'En Riesgo (08 - 09.9)',
                count: stats.distribucionNiveles.en_riesgo,
                color: 'bg-amber-500',
                textColor: 'text-amber-400',
              },
              {
                label: 'Reprobado (< 08)',
                count: stats.distribucionNiveles.reprobado,
                color: 'bg-rose-500',
                textColor: 'text-rose-400',
              },
            ].map((lvl, idx) => {
              const pct = stats.totalEstudiantes > 0 ? ((lvl.count / stats.totalEstudiantes) * 100).toFixed(0) : '0';
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{lvl.label}</span>
                    <span className={`font-bold ${lvl.textColor}`}>
                      {lvl.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${lvl.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('estadisticas')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Ver Estadísticas Detalladas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horario Semanal del Profesor */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Horario Semanal de Clases del Profesor</span>
            </h2>
            <p className="text-xs text-slate-400">
              Distribución de clases asignadas por día, hora y aula
            </p>
          </div>

          <button
            onClick={() => setActiveTab('materias')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <span>Configurar Aulas y Horarios</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {daysOfWeek.map((day) => {
            const dayClasses = allHorarios.filter((h) => h.dia === day);
            const hasClasses = dayClasses.length > 0;

            return (
              <div
                key={day}
                className={`p-3 rounded-xl border flex flex-col min-h-[140px] ${
                  hasClasses
                    ? 'bg-slate-950/70 border-slate-800'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">{day}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      hasClasses
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {dayClasses.length} {dayClasses.length === 1 ? 'clase' : 'clases'}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {hasClasses ? (
                    dayClasses.map((clase) => (
                      <div
                        key={clase.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 shadow-sm text-left"
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: clase.materiaColor }}
                          />
                          <span className="text-[11px] font-bold text-white truncate">
                            {clase.materiaCodigo} - {clase.seccionCodigo}
                          </span>
                        </div>
                        <div className="text-[10px] text-indigo-300 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{clase.horaInicio} - {clase.horaFin}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="truncate">{clase.aula}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-[11px] text-slate-600 italic">
                      Sin clases
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Casos de Atención Prioritaria & Top Estudiantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At Risk Students */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Estudiantes en Riesgo Académico</h3>
                <p className="text-[11px] text-slate-400">
                  Calificaciones por debajo de la nota aprobatoria (10 pts)
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alumnos')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.slice(0, 5).map((item) => {
                const nivel = getNivelColor(item.nivel);
                return (
                  <div
                    key={item.student.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-rose-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.student.fotoUrl}
                        alt={item.student.nombre}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {item.student.nombre} {item.student.apellido}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.materia.codigo} • {item.seccion.codigoSeccion} • Mat: {item.student.matricula}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-400">
                        {item.notaDefinitiva} <span className="text-[10px] text-slate-400">/20</span>
                      </span>
                      <span className={`block text-[10px] px-1.5 py-0.2 rounded border font-semibold ${nivel.bg} ${nivel.text} ${nivel.border}`}>
                        {nivel.label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                No hay estudiantes en situación de riesgo en la selección actual.
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Students */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cuadro de Honor (Mejores Promedios)</h3>
                <p className="text-[11px] text-slate-400">
                  Estudiantes con desempeño Sobresaliente
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('alumnos')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Ver directorio
            </button>
          </div>

          <div className="space-y-2">
            {topStudents.map((item, idx) => {
              const nivel = getNivelColor(item.nivel);
              return (
                <div
                  key={item.student.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs font-bold text-slate-500">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.student.fotoUrl}
                      alt={item.student.nombre}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {item.student.nombre} {item.student.apellido}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.materia.codigo} • {item.seccion.codigoSeccion} • Asist: {item.asistenciaPorcentaje}%
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">
                      {item.notaDefinitiva} <span className="text-[10px] text-slate-400">/20</span>
                    </span>
                    <span className={`block text-[10px] px-1.5 py-0.2 rounded border font-semibold ${nivel.bg} ${nivel.text} ${nivel.border}`}>
                      {nivel.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
