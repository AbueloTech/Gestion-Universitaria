import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Cpu, 
  Database, 
  BookOpen, 
  Layers,
  FastForward
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SplashScreenProps {
  onComplete: () => void;
  durationSeconds?: number;
}

const STEPS = [
  { at: 5, label: 'Inicializando núcleo de cálculo académico UniGrade v2.5', icon: Cpu },
  { at: 25, label: 'Cargando materias, secciones y matriz de ponderaciones (%)', icon: BookOpen },
  { at: 50, label: 'Verificando motor de asistencia, alertas y notas mínimas', icon: Layers },
  { at: 75, label: 'Validando motor local de base de datos SQLite y respaldos', icon: Database },
  { at: 92, label: 'Estableciendo protocolo de seguridad y autenticación docente', icon: ShieldCheck },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  durationSeconds = 20 
}) => {
  const { professor } = useApp();
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const intervalMs = 100;
    const totalMs = durationSeconds * 1000;
    const stepIncrement = (intervalMs / totalMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return next;
      });

      setElapsed((prev) => Math.min(prev + intervalMs / 1000, durationSeconds));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [durationSeconds, onComplete]);

  const remainingSeconds = Math.max(0, Math.ceil(durationSeconds - elapsed));

  // Determine current active status text
  const currentStep = [...STEPS].reverse().find(s => progress >= s.at) || STEPS[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between items-center p-6 sm:p-10 select-none overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Subtle grid pattern background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider uppercase text-white">UniGrade</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded">v2.5 PRO</span>
            </div>
            <p className="text-xs text-slate-400">Sistema Integral de Calificaciones</p>
          </div>
        </div>

        {/* Skip button for quick access */}
        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/50 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition shadow-lg cursor-pointer group"
          title="Saltar animación y pasar directamente al login"
        >
          <span>Omitir intro</span>
          <FastForward className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </header>

      {/* Central Luminous GitHub-Style Creation Wheel */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-8">
        
        {/* Orbital Center Container */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          
          {/* Outermost Pulsing Wave Ripple */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-ripple pointer-events-none" />
          <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-ripple pointer-events-none" style={{ animationDelay: '1.5s' }} />

          {/* External Dashed Orbital Track with reverse spin */}
          <div className="absolute inset-2 sm:inset-3 rounded-full border border-dashed border-indigo-400/30 animate-spin-reverse pointer-events-none" />

          {/* Luminous Neon Gradient Spinning Halo (GitHub Repo Creation Style) */}
          <div 
            className="absolute inset-6 sm:inset-8 rounded-full p-[3px] animate-spin-slow pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, #6366f1, #06b6d4, #a855f7, #10b981, #6366f1)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0)'
            }}
          />

          {/* Secondary counter-rotating neon ring */}
          <div 
            className="absolute inset-10 sm:inset-12 rounded-full p-[2px] animate-spin-reverse opacity-70 pointer-events-none"
            style={{
              background: 'conic-gradient(from 180deg, #38bdf8, transparent 40%, #818cf8 70%, transparent)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff 0)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #fff 0)'
            }}
          />

          {/* Central Glass Disk with Inner Glow */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-950/90 border border-slate-700/60 shadow-[0_0_60px_rgba(99,102,241,0.35)] flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-pulse-glow">
            
            {/* Ambient inner gradient reflection */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 via-transparent to-cyan-400/15 pointer-events-none" />

            {/* University Crest / Graduation Cap Icon */}
            <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-cyan-500/25 border border-indigo-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <GraduationCap className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
              <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1.5 -right-1.5 animate-bounce" />
            </div>

            {/* Glowing institution badge */}
            <div className="relative z-10 mt-2 text-center">
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-indigo-300">
                {professor.universidad ? professor.universidad.split(' ')[0] : 'ACADÉMICO'}
              </span>
            </div>
          </div>

          {/* Orbiting Satellite Particle 1 */}
          <div className="absolute inset-0 animate-spin-slow pointer-events-none">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_15px_#22d3ee] absolute top-4 left-1/2 -translate-x-1/2" />
          </div>

          {/* Orbiting Satellite Particle 2 */}
          <div className="absolute inset-0 animate-spin-reverse pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc] absolute bottom-6 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Status Text & Dynamic Step Indicator */}
        <div className="mt-8 text-center max-w-lg px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Configurando Entorno Docente</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300 font-mono">{remainingSeconds}s restantes</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Preparando Sistema Docente
          </h2>

          <div className="min-h-[44px] flex items-center justify-center">
            <p className="text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-2 transition-all">
              {React.createElement(currentStep.icon, { className: "w-4 h-4 text-cyan-400 shrink-0" })}
              <span>{currentStep.label}</span>
            </p>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full max-w-md mt-6 px-4">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-mono">
            <span>Progreso de carga</span>
            <span className="text-cyan-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-150 ease-out shadow-[0_0_15px_rgba(6,182,212,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Milestone Steps Badges */}
        <div className="hidden sm:flex items-center gap-2 mt-6">
          {STEPS.map((step, idx) => {
            const isCompleted = progress >= step.at;
            return (
              <div 
                key={idx}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                )}
                <span>Paso {idx + 1}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom Footer Info */}
      <footer className="relative z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Servidor Activo • Puerto Seguro • Base de Datos SQLite</span>
        </div>

        <button
          onClick={onComplete}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 rounded-lg text-white font-medium transition cursor-pointer text-xs"
        >
          <span>Acceder al Portal de Notas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
