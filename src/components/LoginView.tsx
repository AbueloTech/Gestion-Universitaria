import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Lock, ShieldCheck, UserCheck, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import { Avatar } from './common/Avatar';

export const LoginView: React.FC = () => {
  const { professor, login } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
    }
  };

  const handleDemoLogin = () => {
    login(professor.pinOrPassword || 'admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Portal Docente</h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistema Integral de Gestión de Notas y Secciones
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-800 text-xs font-medium text-slate-300 rounded-full border border-slate-700">
            {professor.universidad}
          </div>
        </div>

        {/* Professor profile badge */}
        <div className="flex items-center gap-3 p-3 mb-6 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <Avatar
            src={professor.avatarUrl}
            alt={professor.name}
            className="w-12 h-12 rounded-xl border border-slate-600 shadow"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase text-indigo-400">{professor.title}</span>
              <span className="text-xs text-slate-400">• Semestre {professor.semestreActivo}</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{professor.name}</p>
            <p className="text-xs text-slate-400 truncate">{professor.departamento}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Contraseña de Acceso Docente</span>
              <span className="text-xs text-slate-500">Clave de demostración: <code className="text-indigo-300">admin</code></span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Ingrese contraseña o admin..."
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  error
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
                }`}
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Contraseña incorrecta. Intente con "admin".
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Sistema de Notas</span>
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-normal text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Acceso Rápido con 1 Clic (Modo Profesor)</span>
          </button>
        </form>

        {/* Security footer note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            Acceso Docente Encriptado
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            UniGrade v2.5
          </span>
        </div>
      </div>
    </div>
  );
};
