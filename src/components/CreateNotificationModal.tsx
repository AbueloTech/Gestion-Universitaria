import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TipoNotificacion, PrioridadNotificacion, AcademicNotification } from '../types';
import {
  X,
  Bell,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Plus,
} from 'lucide-react';

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTipo?: TipoNotificacion;
}

export const CreateNotificationModal: React.FC<CreateNotificationModalProps> = ({
  isOpen,
  onClose,
  defaultTipo = 'entrega_proxima',
}) => {
  const { materias, secciones, addNotification } = useApp();

  const [tipo, setTipo] = useState<TipoNotificacion>(defaultTipo);
  const [prioridad, setPrioridad] = useState<PrioridadNotificacion>('alta');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [materiaId, setMateriaId] = useState<string>('all');
  const [seccionId, setSeccionId] = useState<string>('all');
  const [fechaEvento, setFechaEvento] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [horaEvento, setHoraEvento] = useState('23:59');

  // Specific for schedule change
  const [aulaAnterior, setAulaAnterior] = useState('');
  const [aulaNueva, setAulaNueva] = useState('');
  const [horarioAnterior, setHorarioAnterior] = useState('');
  const [horarioNuevo, setHorarioNuevo] = useState('');

  // Target action tab
  const [tabTarget, setTabTarget] = useState<'vaciado' | 'asistencia' | 'materias' | 'alumnos'>('vaciado');

  if (!isOpen) return null;

  const filteredSecciones = seccionId !== 'all' && materiaId !== 'all'
    ? secciones.filter((s) => s.materiaId === materiaId)
    : secciones.filter((s) => materiaId === 'all' || s.materiaId === materiaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    let actionLabel = 'Ver Detalles';
    if (tipo === 'entrega_proxima') actionLabel = 'Calificar en Sábana';
    else if (tipo === 'cambio_horario') actionLabel = 'Ver Horario';
    else if (tipo === 'alerta_academica') actionLabel = 'Ver Asistencia';

    const newNotif: Omit<AcademicNotification, 'id' | 'creadaEn'> = {
      tipo,
      prioridad,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || 'Recordatorio programado por el docente.',
      materiaId: materiaId === 'all' ? undefined : materiaId,
      seccionId: seccionId === 'all' ? undefined : seccionId,
      fechaEvento: fechaEvento || undefined,
      horaEvento: horaEvento || undefined,
      aulaAnterior: tipo === 'cambio_horario' ? aulaAnterior.trim() : undefined,
      aulaNueva: tipo === 'cambio_horario' ? aulaNueva.trim() : undefined,
      horarioAnterior: tipo === 'cambio_horario' ? horarioAnterior.trim() : undefined,
      horarioNuevo: tipo === 'cambio_horario' ? horarioNuevo.trim() : undefined,
      leida: false,
      accion: {
        label: actionLabel,
        tabTarget: tipo === 'entrega_proxima' ? 'vaciado' : tipo === 'cambio_horario' ? 'materias' : 'asistencia',
        materiaId: materiaId === 'all' ? undefined : materiaId,
        seccionId: seccionId === 'all' ? undefined : seccionId,
      },
    };

    addNotification(newNotif);
    onClose();
    // Reset fields
    setTitulo('');
    setDescripcion('');
    setAulaAnterior('');
    setAulaNueva('');
    setHorarioAnterior('');
    setHorarioNuevo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Programar Nueva Alerta o Notificación</h2>
              <p className="text-xs text-slate-400">
                Avisa sobre fechas límite de entrega, cambios de aula/horario o alertas de asistencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Tipo Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Tipo de Alerta <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('entrega_proxima')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  tipo === 'entrega_proxima'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-xs">Entrega Próxima</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('cambio_horario')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  tipo === 'cambio_horario'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-xs">Cambio Horario</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('alerta_academica')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  tipo === 'alerta_academica'
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span className="font-medium text-xs">Baja Asistencia</span>
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Título del Aviso <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                tipo === 'entrega_proxima'
                  ? 'Ej: Entrega de Tarea #3 / Cierre de Parcial 2'
                  : tipo === 'cambio_horario'
                  ? 'Ej: Cambio de Aula para la clase del Jueves'
                  : 'Ej: Alumnos con más del 25% de inasistencias'
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Materia y Sección */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Materia Asociada</label>
              <select
                value={materiaId}
                onChange={(e) => {
                  setMateriaId(e.target.value);
                  setSeccionId('all');
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas las Materias (General)</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sección</label>
              <select
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Todas las Secciones</option>
                {filteredSecciones.map((s) => {
                  const mat = materias.find((m) => m.id === s.materiaId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.codigoSeccion} {mat ? `(${mat.codigo})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Fecha, Hora y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {tipo === 'entrega_proxima' ? 'Fecha Límite' : 'Fecha de Aplicación'}
              </label>
              <input
                type="date"
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Hora Límite / Bloque</label>
              <input
                type="text"
                value={horaEvento}
                onChange={(e) => setHoraEvento(e.target.value)}
                placeholder="Ej: 23:59 o 08:00 - 10:00"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nivel de Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as PrioridadNotificacion)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="urgente">🚨 Urgente (Rojo)</option>
                <option value="alta">⚡ Alta (Ámbar)</option>
                <option value="media">🔹 Media (Azul)</option>
                <option value="baja">⚪ Baja (Gris)</option>
              </select>
            </div>
          </div>

          {/* Schedule Change Details */}
          {tipo === 'cambio_horario' && (
            <div className="p-3.5 bg-slate-800/70 border border-cyan-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <Clock className="w-4 h-4" />
                <span>Detalles del Cambio de Horario / Aula</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Aula / Lugar Anterior</label>
                  <input
                    type="text"
                    value={aulaAnterior}
                    onChange={(e) => setAulaAnterior(e.target.value)}
                    placeholder="Ej: Aula 204"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Aula / Lugar Nuevo</label>
                  <input
                    type="text"
                    value={aulaNueva}
                    onChange={(e) => setAulaNueva(e.target.value)}
                    placeholder="Ej: Lab de Cómputo 3"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Horario Anterior</label>
                  <input
                    type="text"
                    value={horarioAnterior}
                    onChange={(e) => setHorarioAnterior(e.target.value)}
                    placeholder="Ej: Miércoles 10:00 - 12:00"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Horario Nuevo</label>
                  <input
                    type="text"
                    value={horarioNuevo}
                    onChange={(e) => setHorarioNuevo(e.target.value)}
                    placeholder="Ej: Miércoles 14:00 - 16:00"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Descripción / Indicaciones */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Descripción o Instrucciones para el Docente / Estudiantes
            </label>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalla las instrucciones de entrega, formatos requeridos, motivos del cambio de salón o lista de alumnos en observación..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Quick Action Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Botón de Acción Rápida (Destino al pulsar la alerta)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTabTarget('vaciado')}
                className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                  tabTarget === 'vaciado'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Sábana de Notas
              </button>
              <button
                type="button"
                onClick={() => setTabTarget('asistencia')}
                className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                  tabTarget === 'asistencia'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Asistencias
              </button>
              <button
                type="button"
                onClick={() => setTabTarget('materias')}
                className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                  tabTarget === 'materias'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Horarios y Materias
              </button>
              <button
                type="button"
                onClick={() => setTabTarget('alumnos')}
                className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                  tabTarget === 'alumnos'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                Ficha Alumnos
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar y Activar Notificación</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
