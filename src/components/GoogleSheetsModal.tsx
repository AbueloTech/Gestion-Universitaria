import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
  initGoogleAuth,
} from '../services/googleAuth';
import {
  createAndExportToGoogleSheets,
  syncToExistingGoogleSheet,
  GoogleSheetsResult,
} from '../services/googleSheets';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  X,
  Upload,
  Lock,
  Sparkles,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  onClose: () => void;
  selectedParcialId: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  onClose,
  selectedParcialId,
}) => {
  const {
    professor,
    materias,
    secciones,
    configuraciones,
    selectedMateriaId,
    selectedSeccionId,
    calculatedStudents,
    gradeRecords,
  } = useApp();

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [createdResult, setCreatedResult] = useState<GoogleSheetsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with existing sheet form
  const [existingSpreadsheetUrlOrId, setExistingSpreadsheetUrlOrId] = useState('');
  const [showConfirmSync, setShowConfirmSync] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Active Subject & Section
  const activeMateria =
    selectedMateriaId !== 'all'
      ? materias.find((m) => m.id === selectedMateriaId) || materias[0]
      : materias[0];

  const activeSecciones = secciones.filter((s) => s.materiaId === activeMateria?.id);
  const activeSeccion =
    selectedSeccionId !== 'all'
      ? activeSecciones.find((s) => s.id === selectedSeccionId) || activeSecciones[0]
      : activeSecciones[0];

  const currentConfig =
    configuraciones.find((c) => c.materiaId === activeMateria?.id) || configuraciones[0];

  const currentParcialConfig = currentConfig?.parciales.find((p) => p.id === selectedParcialId);

  const sectionStudents = calculatedStudents.filter((s) => s.seccion.id === activeSeccion?.id);

  // Check auth state on load
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setErrorMessage(
        err.message?.includes('popup-closed-by-user')
          ? 'La ventana de inicio de sesión de Google fue cerrada. Intente nuevamente.'
          : err.message || 'Error al conectar con la cuenta de Google'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setToken(null);
    setCreatedResult(null);
  };

  // Create new Google Sheet in Professor's Google Drive
  const handleCreateNewSpreadsheet = async () => {
    if (!activeMateria || !activeSeccion) return;
    const currentToken = token || (await getGoogleAccessToken());
    if (!currentToken) {
      setErrorMessage('Por favor inicie sesión con su cuenta de Google primero.');
      return;
    }

    setIsCreatingSheet(true);
    setErrorMessage(null);

    try {
      const result = await createAndExportToGoogleSheets({
        accessToken: currentToken,
        materia: activeMateria,
        seccion: activeSeccion,
        config: currentConfig,
        sectionStudents,
        gradeRecords,
        professor,
        selectedParcialId,
        currentParcialConfig,
      });

      setCreatedResult(result);
    } catch (err: any) {
      console.error('Error creating Google Sheet:', err);
      setErrorMessage(err.message || 'Error al crear la hoja en Google Drive.');
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Extract pure spreadsheet ID from full URL or direct ID
  const parseSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  // Sync to existing sheet with mandatory user confirmation
  const handleConfirmSync = async () => {
    const currentToken = token || (await getGoogleAccessToken());
    if (!currentToken) return;

    const spreadsheetId = parseSpreadsheetId(existingSpreadsheetUrlOrId);
    if (!spreadsheetId) {
      setErrorMessage('Ingrese un ID o enlace de hoja de cálculo válido.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setShowConfirmSync(false);

    try {
      await syncToExistingGoogleSheet({
        accessToken: currentToken,
        spreadsheetId,
        sheetName: selectedParcialId === 'resumen' ? 'Resumen Semestral' : `Parcial_${selectedParcialId}`,
        materia: activeMateria,
        seccion: activeSeccion,
        config: currentConfig,
        sectionStudents,
        gradeRecords,
        professor,
      });

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (err: any) {
      console.error('Error syncing to existing sheet:', err);
      setErrorMessage(err.message || 'Error al actualizar la hoja de cálculo existente.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative animate-in fade-in my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Conexión con Google Sheets</h2>
              <p className="text-xs text-slate-400">
                Sincronización en la nube con Google Drive
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Auth Section */}
        {!googleUser ? (
          <div className="p-6 bg-slate-950/70 border border-slate-800 rounded-2xl text-center space-y-4 mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vincular Cuenta de Google</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Inicie sesión con su cuenta de Google para crear y actualizar hojas de cálculo
                oficiales directamente en su Google Drive institucional o personal.
              </p>
            </div>

            {/* Official Google Material Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-xl shadow-md transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Conectando con Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span className="font-semibold">Continuar con Google</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Connected User Profile Pill */
          <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-5">
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google'}
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {googleUser.email?.[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    {googleUser.displayName || 'Docente Conectado'}
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-semibold border border-emerald-500/30">
                    Conectado
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{googleUser.email}</p>
              </div>
            </div>

            <button
              onClick={handleGoogleLogout}
              className="px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 transition cursor-pointer"
              title="Cerrar sesión de Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          </div>
        )}

        {/* Action 1: Create New Google Sheet */}
        {googleUser && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Crear Hoja Completa en su Google Drive</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Genera una hoja titulada{' '}
                    <strong className="text-slate-200">
                      UniGrade - {activeMateria?.codigo} {activeSeccion?.codigoSeccion}
                    </strong>{' '}
                    con pestañas para cada parcial y resumen consolidado.
                  </p>
                </div>

                <button
                  onClick={handleCreateNewSpreadsheet}
                  disabled={isCreatingSheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                >
                  {isCreatingSheet ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando en Drive...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Crear en Google Sheets</span>
                    </>
                  )}
                </button>
              </div>

              {/* Created Sheet Success Link */}
              {createdResult && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>¡Hoja de cálculo creada exitosamente en su Google Drive!</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Se han creado las pestañas para cada corte y el resumen con las calificaciones y
                    asistencias actuales.
                  </p>
                  <a
                    href={createdResult.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Action 2: Sincronizar con Hoja Existente */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sincronizar con una Hoja Existente</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Si ya tiene una hoja de cálculo creada en Google Sheets, pegue el enlace o ID para
                  actualizar las calificaciones.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pegue la URL de Google Sheets o el Spreadsheet ID..."
                  value={existingSpreadsheetUrlOrId}
                  onChange={(e) => setExistingSpreadsheetUrlOrId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => setShowConfirmSync(true)}
                  disabled={!existingSpreadsheetUrlOrId.trim() || isSyncing}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Sincronizar</span>
                  )}
                </button>
              </div>

              {syncSuccess && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>¡Datos actualizados exitosamente en su hoja de Google Sheets!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal for Mutating Existing Sheet (Mandatory Least Privilege UX) */}
        {showConfirmSync && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-white">¿Confirmar actualización en Google Sheets?</h4>
              </div>

              <p className="text-xs text-slate-300">
                Esta acción sobreescribirá la pestaña correspondiente en su hoja de cálculo de Google
                con las calificaciones actuales de la sección{' '}
                <strong className="text-white">
                  {activeMateria?.codigo} - {activeSeccion?.codigoSeccion}
                </strong>{' '}
                ({sectionStudents.length} estudiantes).
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfirmSync(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSync}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
                >
                  Sí, Actualizar Hoja
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
