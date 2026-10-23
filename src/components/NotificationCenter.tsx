import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TipoNotificacion, PrioridadNotificacion, AcademicNotification } from '../types';
import { CreateNotificationModal } from './CreateNotificationModal';
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Trash2,
  ExternalLink,
  Plus,
  Filter,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  UserX,
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleNotificationRead,
    deleteNotification,
    addNotification,
    materias,
    secciones,
    calculatedStudents,
    setSelectedMateriaId,
    setSelectedSeccionId,
    setActiveTab,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'entrega_proxima' | 'cambio_horario' | 'alerta_academica' | 'unread'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [defaultCreateTipo, setDefaultCreateTipo] = useState<TipoNotificacion>('entrega_proxima');

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (activeFilter === 'unread') return !notif.leida;
      if (activeFilter !== 'all') return notif.tipo === activeFilter;
      return true;
    });
  }, [notifications, activeFilter]);

  // Low attendance students calculation (< 75%)
  const lowAttendanceStudents = useMemo(() => {
    return calculatedStudents.filter((s) => s.asistenciaPorcentaje < 75 && s.asistenciaPorcentaje > 0);
  }, [calculatedStudents]);

  // Handle generating attendance alert automatically
  const handleAutoGenerateAttendanceAlert = () => {
    if (lowAttendanceStudents.length === 0) {
      alert('Actualmente ningún estudiante tiene porcentaje de asistencia inferior al 75%.');
      return;
    }

    const firstStudent = lowAttendanceStudents[0];
    const newNotif: Omit<AcademicNotification, 'id' | 'creadaEn'> = {
      tipo: 'alerta_academica',
      prioridad: 'urgente',
      titulo: `Alerta: ${lowAttendanceStudents.length} alumnos con baja asistencia (< 75%)`,
      descripcion: `Se detectaron ${lowAttendanceStudents.length} estudiantes con porcentaje crítico de asistencia. Estudiante en mayor riesgo: ${firstStudent.student.nombre} ${firstStudent.student.apellido} (${firstStudent.asistenciaPorcentaje}% en ${firstStudent.materia.codigo}). Se recomienda contactar o aplicar plan remedial antes del cierre del parcial.`,
      materiaId: firstStudent.materia.id,
      seccionId: firstStudent.seccion.id,
      leida: false,
      accion: {
        label: 'Ver Control de Asistencia',
        tabTarget: 'asistencia',
        materiaId: firstStudent.materia.id,
        seccionId: firstStudent.seccion.id,
      },
    };

    addNotification(newNotif);
    setActiveFilter('alerta_academica');
  };

  // Open modal with specific type
  const handleOpenCreateModal = (t: TipoNotificacion) => {
    setDefaultCreateTipo(t);
    setIsCreateModalOpen(true);
  };

  // Action button click
  const handleExecuteAction = (notif: AcademicNotification) => {
    if (!notif.leida) {
      markNotificationAsRead(notif.id);
    }
    if (notif.accion) {
      if (notif.accion.materiaId) setSelectedMateriaId(notif.accion.materiaId);
      if (notif.accion.seccionId) setSelectedSeccionId(notif.accion.seccionId);
      if (notif.accion.tabTarget) setActiveTab(notif.accion.tabTarget);
    }
  };

  // Format date helper
  const formatEventDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return timeStr ? `Hora: ${timeStr}` : null;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        const formatted = dateObj.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        return timeStr ? `${formatted} • ${timeStr}` : formatted;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadge = (p: PrioridadNotificacion) => {
    switch (p) {
      case 'urgente':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            URGENTE
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ALTA
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            MEDIA
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-700/60 text-slate-300 border border-slate-600/40">
            INFORMATIVA
          </span>
        );
    }
  };

  const getTypeIcon = (tipo: TipoNotificacion) => {
    switch (tipo) {
      case 'entrega_proxima':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'cambio_horario':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'alerta_academica':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-400 border border-indigo-500/30">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce shadow">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                Centro de Notificaciones y Alertas Académicas
              </h2>
              {unreadNotificationsCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-md text-[11px] font-semibold">
                  {unreadNotificationsCount} no leída{unreadNotificationsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Monitoreo continuo de vencimiento de entregas, cambios en aulas/horarios y alertas de asistencia
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Marcar todas como leídas</span>
            </button>
          )}

          {/* Quick audit button */}
          <button
            onClick={handleAutoGenerateAttendanceAlert}
            title="Revisar estudiantes con inasistencia crítica"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-medium border border-rose-800/50 transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Auditar Asistencia</span>
            {lowAttendanceStudents.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[10px] font-bold">
                {lowAttendanceStudents.length}
              </span>
            )}
          </button>

          {/* Create new alert button */}
          <button
            onClick={() => handleOpenCreateModal('entrega_proxima')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Alerta</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todas ({notifications.length})
          </button>

          <button
            onClick={() => setActiveFilter('entrega_proxima')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'entrega_proxima'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Entregas Próximas</span>
            <span className="text-[10px] opacity-75">
              ({notifications.filter((n) => n.tipo === 'entrega_proxima').length})
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('cambio_horario')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'cambio_horario'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cambios de Horario / Aula</span>
            <span className="text-[10px] opacity-75">
              ({notifications.filter((n) => n.tipo === 'cambio_horario').length})
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('alerta_academica')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'alerta_academica'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Baja Asistencia</span>
            <span className="text-[10px] opacity-75">
              ({notifications.filter((n) => n.tipo === 'alerta_academica').length})
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activeFilter === 'unread'
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            No Leídas ({unreadNotificationsCount})
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-slate-500 text-[11px]">
          <span>Tip: Pulsa en la acción para navegar directo a la vista relacionada</span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Todo al día</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No tienes alertas pendientes en esta categoría. Puedes programar una nueva notificación
              cuando lo necesites.
            </p>
            <button
              onClick={() => handleOpenCreateModal('entrega_proxima')}
              className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Alerta Ahora</span>
            </button>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const materia = materias.find((m) => m.id === notif.materiaId);
            const seccion = secciones.find((s) => s.id === notif.seccionId);
            const eventDateFormatted = formatEventDate(notif.fechaEvento, notif.horaEvento);

            return (
              <div
                key={notif.id}
                className={`p-4 transition hover:bg-slate-800/40 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  !notif.leida ? 'bg-indigo-950/15 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                {/* Left side: Icon, title, description, and badges */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      notif.tipo === 'entrega_proxima'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : notif.tipo === 'cambio_horario'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {getTypeIcon(notif.tipo)}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(notif.prioridad)}

                      {/* Course / Section Badge */}
                      {materia && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1"
                          style={{ backgroundColor: materia.color || '#6366f1' }}
                        >
                          {materia.codigo}
                          {seccion && ` • ${seccion.codigoSeccion}`}
                        </span>
                      )}

                      {notif.materiaId === 'all' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200">
                          Todas las materias
                        </span>
                      )}

                      {/* Event Date tag */}
                      {eventDateFormatted && (
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/50">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>{eventDateFormatted}</span>
                        </span>
                      )}

                      {!notif.leida && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400" title="No leída" />
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {notif.titulo}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {notif.descripcion}
                    </p>

                    {/* Schedule change extra detail box */}
                    {notif.tipo === 'cambio_horario' && (notif.aulaNueva || notif.horarioNuevo) && (
                      <div className="mt-2 p-2.5 bg-slate-800/60 border border-cyan-500/20 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {notif.aulaNueva && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div>
                              <span className="text-slate-400">Aula: </span>
                              {notif.aulaAnterior && (
                                <span className="line-through text-slate-500 mr-1.5">{notif.aulaAnterior}</span>
                              )}
                              <span className="font-bold text-cyan-300">{notif.aulaNueva}</span>
                            </div>
                          </div>
                        )}
                        {notif.horarioNuevo && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div>
                              <span className="text-slate-400">Horario: </span>
                              {notif.horarioAnterior && (
                                <span className="line-through text-slate-500 mr-1.5">{notif.horarioAnterior}</span>
                              )}
                              <span className="font-bold text-cyan-300">{notif.horarioNuevo}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Action button, toggle read, delete */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {notif.accion && (
                    <button
                      onClick={() => handleExecuteAction(notif)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <span>{notif.accion.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => toggleNotificationRead(notif.id)}
                    title={notif.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${notif.leida ? 'text-emerald-400' : 'text-slate-500'}`}
                    />
                  </button>

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    title="Eliminar notificación"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper */}
      <div className="px-5 py-3 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Las alertas de entrega y asistencia se actualizan en sincronía con la sábana de notas.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCreateModal('cambio_horario')}
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Clock className="w-3 h-3" />
            <span>Notificar cambio de aula/horario</span>
          </button>
        </div>
      </div>

      {/* Modal */}
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultTipo={defaultCreateTipo}
      />
    </div>
  );
};
