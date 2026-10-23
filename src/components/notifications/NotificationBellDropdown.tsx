import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AcademicNotification } from '../../types';
import {
  Bell,
  Clock,
  CalendarClock,
  Check,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';

export const NotificationBellDropdown: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveTab,
    setSelectedMateriaId,
    setSelectedSeccionId,
    materias,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = (notif: AcademicNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.accion) {
      if (notif.accion.materiaId && notif.accion.materiaId !== 'all') {
        setSelectedMateriaId(notif.accion.materiaId);
      }
      if (notif.accion.seccionId && notif.accion.seccionId !== 'all') {
        setSelectedSeccionId(notif.accion.seccionId);
      }
      setActiveTab(notif.accion.tabTarget);
    } else {
      setActiveTab('dashboard');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Centro de Notificaciones y Alertas"
        className={`relative p-2 rounded-xl transition cursor-pointer ${
          isOpen
            ? 'bg-slate-800 text-white'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
            {unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">Alertas y Notificaciones</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                  {unreadNotificationsCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded hover:bg-slate-800 transition"
                >
                  Marcar leídas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length > 0 ? (
              notifications.slice(0, 6).map((notif) => {
                const materia = materias.find((m) => m.id === notif.materiaId);
                const isEntrega = notif.tipo === 'entrega_proxima';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3 text-left transition cursor-pointer hover:bg-slate-800/70 flex gap-2.5 ${
                      !notif.leida ? 'bg-indigo-950/20' : 'opacity-80'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isEntrega ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                          <CalendarClock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-bold text-white truncate">
                          {notif.titulo}
                        </span>
                        {!notif.leida && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                        {notif.descripcion}
                      </p>

                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        {materia && (
                          <span className="font-semibold text-slate-300">{materia.codigo}</span>
                        )}
                        {notif.fechaEvento && <span>• {notif.fechaEvento}</span>}
                        {notif.prioridad === 'urgente' && (
                          <span className="text-rose-400 font-bold">• Urgente</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No hay notificaciones registradas.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setIsOpen(false);
              }}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <span>Ver todas las alertas en el Dashboard</span>
              <ArrowRight className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
