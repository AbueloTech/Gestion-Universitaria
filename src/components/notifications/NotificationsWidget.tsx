import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicNotification, TipoNotificacion, PrioridadNotificacion } from '../../types';
import {
  Bell,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Sparkles,
  FileText,
  Layers,
  ArrowRight,
  Filter,
  X,
  CalendarClock,
  AlertCircle,
} from 'lucide-react';

interface NotificationsWidgetProps {
  onOpenCreateModal: () => void;
}

export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({ onOpenCreateModal }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    toggleNotificationRead,
    deleteNotification,
    materias,
    secciones,
    setActiveTab,
    setSelectedMateriaId,
    setSelectedSeccionId,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'entrega' | 'horario' | 'unread'>('all');

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeFilter === 'entrega') return n.tipo === 'entrega_proxima';
      if (activeFilter === 'horario') return n.tipo === 'cambio_horario';
      if (activeFilter === 'unread') return !n.leida;
      return true;
    });
  }, [notifications, activeFilter]);

  // Counts by category
  const entregaCount = useMemo(
    () => notifications.filter((n) => n.tipo === 'entrega_proxima').length,
    [notifications]
  );
  const horarioCount = useMemo(
    () => notifications.filter((n) => n.tipo === 'cambio_horario').length,
    [notifications]
  );

  // Helper to format due countdown
  const getCountdownLabel = (fecha?: string) => {
    if (!fecha) return null;
    const target = new Date(fecha);
    const today = new Date();
    // Reset hours for day difference
    target.setHours(0, 0, 0, 0);
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.ceil((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Venció hace ${Math.abs(diffDays)}d`, urgency: 'overdue' };
    if (diffDays === 0) return { text: '¡Vence Hoy!', urgency: 'urgent' };
    if (diffDays === 1) return { text: 'Vence Mañana', urgency: 'urgent' };
    if (diffDays <= 3) return { text: `En ${diffDays} días`, urgency: 'soon' };
    return { text: `En ${diffDays} días (${fecha})`, urgency: 'normal' };
  };

  const handleActionClick = (notif: AcademicNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.accion) {
      if (notif.accion.materiaId && notif.accion.materiaId !== 'all') {
        setSelectedMateriaId(notif.accion.materiaId);
      }
      if (notif.accion.seccionId && notif.accion.seccionId !== 'all') {
        setSelectedSeccionId(notif.accion.seccionId);
      }
      setActiveTab(notif.accion.tabTarget);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Centro de Alertas y Notificaciones</h2>
              {unreadNotificationsCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {unreadNotificationsCount} pendientes
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Al día
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Alertas sobre fechas límite de tareas, quizzes y cambios extraordinarios de horarios o aulas
            </p>
          </div>
        </div>

        {/* Global Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 border border-slate-700/60 cursor-pointer"
              title="Marcar todas como leídas"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Marcar todas leídas</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Alerta</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span>Todas</span>
          <span className="px-1.5 py-0.2 bg-slate-900/60 text-[10px] rounded-full">
            {notifications.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('entrega')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'entrega'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
          <span>Fechas de Entrega</span>
          <span className="px-1.5 py-0.2 bg-slate-900/60 text-[10px] rounded-full">
            {entregaCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('horario')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'horario'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cambios de Horario / Aula</span>
          <span className="px-1.5 py-0.2 bg-slate-900/60 text-[10px] rounded-full">
            {horarioCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeFilter === 'unread'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-rose-400" />
          <span>No Leídas</span>
          {unreadNotificationsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => {
            const materia = materias.find((m) => m.id === n.materiaId);
            const seccion = secciones.find((s) => s.id === n.seccionId);
            const countdown = getCountdownLabel(n.fechaEvento);

            const isEntrega = n.tipo === 'entrega_proxima';
            const isHorario = n.tipo === 'cambio_horario';

            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                  !n.leida
                    ? 'bg-slate-950/90 border-slate-700 shadow-md ring-1 ring-indigo-500/20'
                    : 'bg-slate-950/40 border-slate-800/70 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Left accent bar */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                    isEntrega ? 'bg-amber-500' : isHorario ? 'bg-cyan-500' : 'bg-indigo-500'
                  }`}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pl-1.5">
                  {/* Content column */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Type Badge */}
                      {isEntrega ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <CalendarClock className="w-3 h-3" />
                          <span>Entrega Próxima</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          <Clock className="w-3 h-3" />
                          <span>Cambio de Horario / Aula</span>
                        </span>
                      )}

                      {/* Course / Section Tag */}
                      {materia && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 text-white border"
                          style={{
                            backgroundColor: `${materia.color || '#6366f1'}20`,
                            borderColor: `${materia.color || '#6366f1'}40`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: materia.color || '#6366f1' }}
                          />
                          <span>{materia.codigo}</span>
                          {seccion && <span>• {seccion.codigoSeccion}</span>}
                        </span>
                      )}

                      {/* Priority Tag */}
                      {n.prioridad === 'urgente' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                          Urgente
                        </span>
                      )}
                      {n.prioridad === 'alta' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Prioridad Alta
                        </span>
                      )}

                      {/* Countdown badge for deliveries */}
                      {countdown && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            countdown.urgency === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 font-bold'
                              : countdown.urgency === 'soon'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {countdown.text}
                        </span>
                      )}

                      {/* Unread dot */}
                      {!n.leida && (
                        <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{n.titulo}</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{n.descripcion}</p>
                    </div>

                    {/* Specific details for schedule changes */}
                    {isHorario && (n.aulaAnterior || n.aulaNueva || n.horarioNuevo) && (
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {n.aulaAnterior && n.aulaNueva && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <div className="text-[11px]">
                              <span className="text-slate-500 line-through mr-1.5">{n.aulaAnterior}</span>
                              <span className="text-white font-bold">➜ {n.aulaNueva}</span>
                            </div>
                          </div>
                        )}

                        {n.horarioNuevo && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div className="text-[11px]">
                              <span className="text-slate-400">Horario reprogramado: </span>
                              <strong className="text-indigo-300">{n.horarioNuevo}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Due time tag for delivery */}
                    {isEntrega && (n.fechaEvento || n.horaEvento) && (
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {n.fechaEvento && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>Fecha de cierre: <strong className="text-slate-200">{n.fechaEvento}</strong></span>
                          </span>
                        )}
                        {n.horaEvento && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Hora límite: <strong className="text-slate-200">{n.horaEvento} hrs</strong></span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/70 w-full lg:w-auto justify-end">
                    {/* Primary CTA */}
                    {n.accion && (
                      <button
                        onClick={() => handleActionClick(n)}
                        className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>{n.accion.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}

                    {/* Toggle read */}
                    <button
                      onClick={() => toggleNotificationRead(n.id)}
                      className={`p-1.5 rounded-lg text-xs transition border cursor-pointer ${
                        n.leida
                          ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                      title={n.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="p-1.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/80 mx-auto" />
            <h4 className="text-sm font-bold text-white">¡No hay notificaciones pendientes!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Todas las fechas de entrega y cambios de horarios están al día en la categoría seleccionada.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
