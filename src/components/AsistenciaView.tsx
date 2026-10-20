import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EstadoAsistencia, SesionAsistencia } from '../types';
import {
  CalendarCheck2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Plus,
  Trash2,
  Save,
  Sparkles,
} from 'lucide-react';

export const AsistenciaView: React.FC = () => {
  const {
    materias,
    secciones,
    students,
    asistencias,
    saveAsistenciaSesion,
    deleteAsistenciaSesion,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
  } = useApp();

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

  // Section students
  const sectionStudents = useMemo(() => {
    if (!activeSeccion) return [];
    return students.filter((s) => s.seccionId === activeSeccion.id);
  }, [students, activeSeccion]);

  // Historical sessions for this section
  const sectionSessions = useMemo(() => {
    if (!activeSeccion) return [];
    return asistencias.filter((a) => a.seccionId === activeSeccion.id);
  }, [asistencias, activeSeccion]);

  // Active form state for taking attendance
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [temaClase, setTemaClase] = useState('');
  const [activeRecords, setActiveRecords] = useState<{ [studentId: string]: EstadoAsistencia }>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize records when students load or change
  useMemo(() => {
    const init: { [studentId: string]: EstadoAsistencia } = {};
    sectionStudents.forEach((s) => {
      init[s.id] = 'presente';
    });
    setActiveRecords(init);
  }, [sectionStudents]);

  const handleSetStudentStatus = (studentId: string, status: EstadoAsistencia) => {
    setActiveRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status: EstadoAsistencia) => {
    const next: { [studentId: string]: EstadoAsistencia } = {};
    sectionStudents.forEach((s) => {
      next[s.id] = status;
    });
    setActiveRecords(next);
  };

  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeccion || !activeMateria) return;

    saveAsistenciaSesion({
      seccionId: activeSeccion.id,
      materiaId: activeMateria.id,
      fecha: sessionDate,
      temaClase: temaClase.trim() || `Clase del ${sessionDate}`,
      registros: activeRecords,
    });

    setSavedSuccess(true);
    setTemaClase('');
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const statusOptions: Array<{
    id: EstadoAsistencia;
    label: string;
    short: string;
    activeClass: string;
    icon: any;
  }> = [
    {
      id: 'presente',
      label: 'Presente',
      short: 'P',
      activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-sm',
      icon: CheckCircle2,
    },
    {
      id: 'tarde',
      label: 'Tardanza',
      short: 'T',
      activeClass: 'bg-amber-600 text-white border-amber-500 shadow-sm',
      icon: Clock,
    },
    {
      id: 'falta_justificada',
      label: 'Justificada',
      short: 'FJ',
      activeClass: 'bg-blue-600 text-white border-blue-500 shadow-sm',
      icon: AlertCircle,
    },
    {
      id: 'falta_injustificada',
      label: 'Injustificada',
      short: 'FI',
      activeClass: 'bg-rose-600 text-white border-rose-500 shadow-sm',
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <CalendarCheck2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Control de Asistencia
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Registro Diario y Pase de Lista</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pase de lista presencial por clase con cálculo automático del porcentaje de asistencia
            para la ponderación académica.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
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
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec.codigoSeccion} ({sec.aulaPrincipal})
            </button>
          ))}
        </div>
      </div>

      {/* Attendance Form & Live List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Pase de lista interactivo */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <form onSubmit={handleSaveAttendance} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Tema de la sesión (ej. Derivadas Trigonométricas)..."
                  value={temaClase}
                  onChange={(e) => setTemaClase(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white w-64 sm:w-80"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('presente')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Todos Presentes</span>
                </button>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savedSuccess ? '¡Guardada!' : 'Guardar Sesión'}</span>
                </button>
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-2">
              {sectionStudents.map((st, idx) => {
                const currentStatus = activeRecords[st.id] || 'presente';

                return (
                  <div
                    key={st.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-center text-xs font-mono text-slate-500">
                        {idx + 1}
                      </span>
                      <img
                        src={st.fotoUrl}
                        alt={st.nombre}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {st.nombre} {st.apellido}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          C.I: {st.cedula} • Mat: {st.matricula}
                        </span>
                      </div>
                    </div>

                    {/* Status radio pills */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {statusOptions.map((opt) => {
                        const isCurrent = currentStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSetStudentStatus(st.id, opt.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer border ${
                              isCurrent
                                ? opt.activeClass
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            <span>{opt.short}</span>
                            <span className="hidden md:inline text-[11px]">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </div>

        {/* Right (1 col): Historial de Clases Pasadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Historial de Clases de la Sección</h2>
            <p className="text-xs text-slate-400">
              {sectionSessions.length} sesiones registradas en este periodo
            </p>
          </div>

          <div className="space-y-3">
            {sectionSessions.length > 0 ? (
              sectionSessions.map((sess) => {
                const total = Object.keys(sess.registros).length || 1;
                const presentes = Object.values(sess.registros).filter(
                  (v) => v === 'presente' || v === 'tarde'
                ).length;
                const pct = Math.round((presentes / total) * 100);

                return (
                  <div
                    key={sess.id}
                    className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{sess.fecha}</span>
                      </div>
                      <button
                        onClick={() => deleteAsistenciaSesion(sess.id)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-1">{sess.temaClase}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Asistencia del grupo:</span>
                      <span className="font-bold text-amber-400">{pct}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                Aún no hay sesiones guardadas para esta sección. Guarde una nueva clase usando el
                formulario a la izquierda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
