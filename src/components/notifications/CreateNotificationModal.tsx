import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TipoNotificacion, PrioridadNotificacion } from '../../types';
import {
  X,
  Bell,
  Calendar,
  Clock,
  MapPin,
  Save,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CreateNotificationModalProps {
  onClose: () => void;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({ onClose }) => {
  const { materias, secciones, addNotification, selectedMateriaId } = useApp();

  const [tipo, setTipo] = useState<TipoNotificacion>('entrega_proxima');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [materiaId, setMateriaId] = useState(selectedMateriaId !== 'all' ? selectedMateriaId : materias[0]?.id || '');
  const [seccionId, setSeccionId] = useState('');
  const [fechaEvento, setFechaEvento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [horaEvento, setHoraEvento] = useState('23:59');
  const [aulaAnterior, setAulaAnterior] = useState('');
  const [aulaNueva, setAulaNueva] = useState('');
  const [horarioNuevo, setHorarioNuevo] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadNotificacion>('alta');
  const [saved, setSaved] = useState(false);

  // Sections filtered by selected course
  const availableSecciones = secciones.filter((s) => s.materiaId === materiaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;

    addNotification({
      tipo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materiaId: materiaId || undefined,
      seccionId: seccionId || undefined,
      fechaEvento: fechaEvento || undefined,
      horaEvento: horaEvento || undefined,
      aulaAnterior: aulaAnterior.trim() || undefined,
      aulaNueva: aulaNueva.trim() || undefined,
      horarioNuevo: horarioNuevo.trim() || undefined,
      prioridad,
      accion:
        tipo === 'entrega_proxima'
          ? {
              label: 'Calificar en Sábana',
              tabTarget: 'vaciado',
              materiaId: materiaId || undefined,
              seccionId: seccionId || undefined,
            }
          : {
              label: 'Ver Horario',
              tabTarget: 'materias',
              materiaId: materiaId || undefined,
              seccionId: seccionId || undefined,
            },
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Crear Nueva Alerta Académica</h3>
              <p className="text-xs text-slate-400">
                Notificación sobre fechas de entrega o cambios en los horarios
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notification Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Tipo de Alerta *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTipo('entrega_proxima');
                  if (!titulo) setTitulo('Entrega de Tarea / Quiz');
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  tipo === 'entrega_proxima'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                  <CalendarClock className="w-4 h-4" />
                  <span>Fecha de Entrega Próxima</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tareas, Quizzes, Parciales, Informes de Laboratorio o Cierre de Actas
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTipo('cambio_horario');
                  if (!titulo) setTitulo('Cambio de Horario / Reasignación de Aula');
                }}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                  tipo === 'cambio_horario'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-white ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-300">
                  <Clock className="w-4 h-4" />
                  <span>Cambio de Horario / Aula</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Reubicación de aula, reprogramación de hora o clase extraordinaria
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título de la Alerta *
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                tipo === 'entrega_proxima'
                  ? 'ej. Entrega de Proyecto Final: Algoritmos'
                  : 'ej. Cambio de Aula: Sesión práctica en Lab 3'
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Course and Section selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Materia Asociada *
              </label>
              <select
                value={materiaId}
                onChange={(e) => {
                  setMateriaId(e.target.value);
                  setSeccionId('');
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Sección (Opcional)
              </label>
              <select
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Todas las secciones de la materia</option>
                {availableSecciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigoSeccion} ({s.aulaPrincipal})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Specific fields for Delivery Type */}
          {tipo === 'entrega_proxima' && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Detalles del Vencimiento
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fecha Límite *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hora Límite
                  </label>
                  <input
                    type="time"
                    value={horaEvento}
                    onChange={(e) => setHoraEvento(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Specific fields for Schedule Change Type */}
          {tipo === 'cambio_horario' && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                Detalles de la Reasignación
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Aula Anterior
                  </label>
                  <input
                    type="text"
                    value={aulaAnterior}
                    onChange={(e) => setAulaAnterior(e.target.value)}
                    placeholder="ej. Aula 302"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Aula Nueva *
                  </label>
                  <input
                    type="text"
                    required
                    value={aulaNueva}
                    onChange={(e) => setAulaNueva(e.target.value)}
                    placeholder="ej. Lab de Computación 2"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Horario Reajustado / Extraordinario
                </label>
                <input
                  type="text"
                  value={horarioNuevo}
                  onChange={(e) => setHorarioNuevo(e.target.value)}
                  placeholder="ej. Jueves 14:00 - 16:00 o Sábado 09:00 - 11:00"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fecha de Entrada en Vigor
                  </label>
                  <input
                    type="date"
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción o Instrucciones para el Docente *
            </label>
            <textarea
              required
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explique el motivo, instrucciones o materiales requeridos..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nivel de Prioridad
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'baja', label: 'Baja', color: 'text-slate-400 border-slate-700' },
                { id: 'media', label: 'Media', color: 'text-blue-400 border-blue-500/40' },
                { id: 'alta', label: 'Alta', color: 'text-amber-400 border-amber-500/40' },
                { id: 'urgente', label: 'Urgente', color: 'text-rose-400 border-rose-500/40' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrioridad(p.id as PrioridadNotificacion)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                    prioridad === p.id
                      ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500/40'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={p.color}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>¡Alerta Creada!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Publicar Alerta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
