import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  TableProperties,
  CalendarCheck2,
  BarChart3,
  Sliders,
  Database,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenBackupModal: () => void;
  onOpenSQLiteModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  onOpenBackupModal,
  onOpenSQLiteModal,
}) => {
  const { activeTab, setActiveTab, students, materias, secciones, calculatedStudents } = useApp();

  // Count at-risk students for alert badge
  const atRiskCount = calculatedStudents.filter((s) => s.nivel === 'en_riesgo' || s.nivel === 'reprobado').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      subtitle: 'Resumen y Horario Semanal',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'materias',
      label: 'Materias y Horarios',
      subtitle: `${materias.length} materias, ${secciones.length} secciones`,
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'alumnos',
      label: 'Directorio de Alumnos',
      subtitle: `${students.length} estudiantes asignados`,
      icon: Users,
      badge: atRiskCount > 0 ? `${atRiskCount} alerta` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'vaciado',
      label: 'Vaciado de Notas',
      subtitle: 'Sábana y Calificaciones',
      icon: TableProperties,
      badge: 'Matriz',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'asistencia',
      label: 'Control de Asistencia',
      subtitle: 'Pase de lista por sección',
      icon: CalendarCheck2,
      badge: null,
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas Académicas',
      subtitle: 'Rendimiento grupal e individual',
      icon: BarChart3,
      badge: 'Gráficas',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'configuracion',
      label: 'Parámetros de Evaluación',
      subtitle: 'Ponderación y Quizzes',
      icon: Sliders,
      badge: null,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 w-72">
      {/* Navigation list */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Módulos Académicos
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition text-left cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 text-white border border-indigo-500/30 shadow-sm'
                  : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold border rounded ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database & SQLite Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <button
          onClick={onOpenSQLiteModal}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 text-xs text-slate-200 hover:text-white transition cursor-pointer shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
            <span className="font-semibold text-white">Base SQLite</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
            .db
          </span>
        </button>

        <button
          onClick={onOpenBackupModal}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-[11px]">Respaldo JSON</span>
          </div>
          <span className="text-[10px] text-slate-500">JSON</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="no-print hidden lg:block h-[calc(100vh-4rem)] sticky top-16 shrink-0 z-20">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
