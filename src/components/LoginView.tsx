import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle, 
  BookOpen, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Copy, 
  Check, 
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { Avatar } from './common/Avatar';

interface LoginViewProps {
  onShowSplash?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onShowSplash }) => {
  const { professor, login } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Standalone URL that runs solely the web app without the Gemini AI Studio chat wrapper
  const standaloneUrl = 'https://ais-pre-4kczwe4tl4xkhhi7i3pz3u-34594970824.us-east5.run.app';

  const isDefaultPassword = !professor.pinOrPassword || professor.pinOrPassword.trim() === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim();

    if (!clean) {
      setErrorMsg('Debe ingresar una contraseña válida. No se permite el acceso sin clave.');
      return;
    }

    const success = login(clean);
    if (!success) {
      if (isDefaultPassword) {
        setErrorMsg('Contraseña incorrecta. Verifique la clave ingresada (clave inicial por defecto: "admin").');
      } else {
        setErrorMsg('Contraseña incorrecta. Ingrese la contraseña personalizada configurada en su perfil docente.');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(standaloneUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isPasswordEmpty = password.trim().length === 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        
        {/* Top actions: Replay Splash */}
        {onShowSplash && (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onShowSplash}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition border border-indigo-500/20 cursor-pointer"
              title="Volver a ver la pantalla de inicio con animación luminosa"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Ver Presentación Inicial</span>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-3 shadow-lg shadow-indigo-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Portal Docente</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Sistema Integral de Gestión de Notas y Secciones
          </p>
          <div className="inline-block mt-2 px-3 py-1 bg-slate-800 text-xs font-medium text-slate-300 rounded-full border border-slate-700">
            {professor.universidad}
          </div>
        </div>

        {/* Professor profile badge */}
        <div className="flex items-center gap-3 p-3 mb-5 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <Avatar
            src={professor.avatarUrl}
            alt={professor.name}
            className="w-12 h-12 rounded-xl border border-slate-600 shadow shrink-0"
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

        {/* Strict Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Contraseña Requerida</span>
              </label>
              {isDefaultPassword ? (
                <span className="text-[11px] text-slate-400">
                  Clave inicial: <code className="text-indigo-300 font-mono bg-slate-800 px-1 py-0.5 rounded">admin</code>
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Clave personalizada activa
                </span>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Ingrese su contraseña obligatoria..."
                className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                  errorMsg
                    ? 'border-rose-500/60 focus:ring-rose-500/30'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
                }`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isPasswordEmpty}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 font-medium text-sm rounded-xl transition-all cursor-pointer ${
              isPasswordEmpty
                ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-75'
                : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Sistema de Notas</span>
          </button>
        </form>

        {/* Security notice */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Seguridad del Sistema Docente</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isDefaultPassword ? (
              <>
                Se requiere obligatoriamente una clave para acceder (clave inicial: <code className="text-indigo-300 font-mono">admin</code>). Por seguridad, cámbiela en su Perfil Docente al ingresar.
              </>
            ) : (
              <>
                Acceso restringido con clave personalizada. La contraseña por defecto <code className="text-slate-500 line-through font-mono">admin</code> ha sido deshabilitada definitivamente.
              </>
            )}
          </p>
        </div>

        {/* Standalone link section without Gemini AI Chat */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              Enlace Directo (Sin Chat de AI)
            </span>
            <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              App Pura
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800">
            <input
              type="text"
              readOnly
              value={standaloneUrl}
              className="bg-transparent text-[11px] text-slate-400 font-mono flex-1 outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-xs transition cursor-pointer shrink-0"
              title="Copiar enlace directo"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500 leading-tight">
            Use este enlace para abrir o compartir la aplicación a pantalla completa sin la barra lateral del asistente.
          </p>
        </div>

        {/* Security footer note */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            Control de Acceso Docente
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
