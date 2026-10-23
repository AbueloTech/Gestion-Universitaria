import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/SplashScreen';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MateriasSeccionesView } from './components/MateriasSeccionesView';
import { AlumnosView } from './components/AlumnosView';
import { SabanaNotasView } from './components/SabanaNotasView';
import { AsistenciaView } from './components/AsistenciaView';
import { EstadisticasView } from './components/EstadisticasView';
import { EvaluacionConfigView } from './components/EvaluacionConfigView';
import { ActaOficialModal } from './components/ActaOficialModal';
import { ProfileModal } from './components/ProfileModal';
import { BackupModal } from './components/BackupModal';
import { SQLiteModal } from './components/SQLiteModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, activeTab } = useApp();

  // Splash screen state - begins active for initial startup
  const [showSplash, setShowSplash] = useState(true);

  // Modals state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActaModalOpen, setIsActaModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSQLiteModalOpen, setIsSQLiteModalOpen] = useState(false);

  // 1. Initial Splash Screen (20 seconds with central illuminated rotating GitHub-style orb)
  if (showSplash) {
    return (
      <SplashScreen 
        durationSeconds={20} 
        onComplete={() => setShowSplash(false)} 
      />
    );
  }

  // 2. Strict Professor Login Portal
  if (!isAuthenticated) {
    return <LoginView onShowSplash={() => setShowSplash(true)} />;
  }

  // 3. Main Authenticated Academic Application
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenActaModal={() => setIsActaModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onShowSplash={() => setShowSplash(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
          onOpenSQLiteModal={() => setIsSQLiteModalOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'materias' && <MateriasSeccionesView />}
          {activeTab === 'alumnos' && <AlumnosView />}
          {activeTab === 'vaciado' && (
            <SabanaNotasView onOpenActaModal={() => setIsActaModalOpen(true)} />
          )}
          {activeTab === 'asistencia' && <AsistenciaView />}
          {activeTab === 'estadisticas' && <EstadisticasView />}
          {activeTab === 'configuracion' && <EvaluacionConfigView />}
        </main>
      </div>

      {/* Modals */}
      {isActaModalOpen && <ActaOficialModal onClose={() => setIsActaModalOpen(false)} />}
      {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} />}
      {isBackupModalOpen && <BackupModal onClose={() => setIsBackupModalOpen(false)} />}
      {isSQLiteModalOpen && <SQLiteModal onClose={() => setIsSQLiteModalOpen(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
