import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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

  // Modals state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActaModalOpen, setIsActaModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isSQLiteModalOpen, setIsSQLiteModalOpen] = useState(false);

  // If professor is not authenticated, show the login portal
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenActaModal={() => setIsActaModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
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
