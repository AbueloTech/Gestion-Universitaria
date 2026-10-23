import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Calendar,
  LogOut,
  FileSpreadsheet,
  Layers,
  Filter,
  User,
  Menu,
  X,
  Printer,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Avatar } from './common/Avatar';
import { NotificationBellDropdown } from './notifications/NotificationBellDropdown';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenActaModal: () => void;
  onOpenProfileModal: () => void;
  onShowSplash?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  onOpenActaModal,
  onOpenProfileModal,
  onShowSplash,
}) => {
  const {
    professor,
    logout,
    materias,
    secciones,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Available sections for current materia filter
  const filteredSecciones = selectedMateriaId === 'all'
    ? secciones
    : secciones.filter((s) => s.materiaId === selectedMateriaId);

  return (
    <header className="no-print sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Mobile button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-white text-base">UniGrade</span>
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                    Docente
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{professor.universidad}</p>
              </div>
            </div>
          </div>

          {/* Center: Global Filter Bar (Materia & Sección) */}
          <div className="hidden md:flex items-center gap-2.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            {/* Materia select */}
            <div className="flex items-center gap-1.5 px-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedMateriaId}
                onChange={(e) => {
                  setSelectedMateriaId(e.target.value);
                  setSelectedSeccionId('all');
                }}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  Todas las Materias ({materias.length})
                </option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-800" />

            {/* Seccion select */}
            <div className="flex items-center gap-1.5 px-2">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={selectedSeccionId}
                onChange={(e) => setSelectedSeccionId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  Todas las Secciones ({filteredSecciones.length})
                </option>
                {filteredSecciones.map((s) => {
                  const parentMat = materias.find((m) => m.id === s.materiaId);
                  return (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {parentMat ? `${parentMat.codigo} - ` : ''}{s.codigoSeccion} ({s.aulaPrincipal})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Right actions: Semester, Print Acta, User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 bg-slate-800/70 border border-slate-700/60 rounded-lg text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Semestre: <strong className="text-white">{professor.semestreActivo}</strong></span>
            </div>

            {/* Notification Bell Dropdown */}
            <NotificationBellDropdown />

            {/* Quick print button */}
            <button
              onClick={onOpenActaModal}
              title="Generar Acta Oficial de Calificaciones"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Acta Oficial</span>
            </button>

            {/* Professor dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pl-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition cursor-pointer"
              >
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">{professor.name}</p>
                  <p className="text-[10px] text-slate-400 leading-tight">{professor.title}</p>
                </div>
                <Avatar
                  src={professor.avatarUrl}
                  alt={professor.name}
                  className="w-8 h-8 rounded-lg border border-slate-600"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pr-1" />
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{professor.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{professor.email}</p>
                    <p className="text-[10px] text-indigo-400 mt-0.5">{professor.departamento}</p>
                  </div>

                  <button
                    onClick={onOpenProfileModal}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white text-left transition"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Perfil y Ajustes de Profesor</span>
                  </button>

                  {onShowSplash && (
                    <button
                      onClick={onShowSplash}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 text-left transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Ver Intro Splash Luminosa</span>
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-left transition border-t border-slate-800/60"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
