import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  X,
  Save,
  Lock,
  CheckCircle2,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Clipboard,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { convertGoogleDriveUrl, isDataUrl, isLikelyImageUrl } from '../utils/imageUrlHelper';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { professor, updateProfessorProfile } = useApp();
  const [form, setForm] = useState({ ...professor });
  const [saved, setSaved] = useState(false);
  const [driveNotice, setDriveNotice] = useState<{ isFolder?: boolean; isDocs?: boolean; converted?: boolean } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDriveGuide, setShowDriveGuide] = useState(false);
  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // High quality professional academic presets
  const professorPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1580894732483-30549c7161b9?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  ];

  // Process a local File to Base64 data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (.jpg, .png, .webp, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, avatarUrl: base64 }));
      setImageError(false);
      setDriveNotice(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle local image file upload input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle URL change with auto Google Drive conversion
  const handleUrlChange = (value: string) => {
    setImageError(false);
    const driveResult = convertGoogleDriveUrl(value);

    if (driveResult.isFolder) {
      setDriveNotice({ isFolder: true });
      setForm((prev) => ({ ...prev, avatarUrl: value }));
      return;
    }

    if (driveResult.isDocsOrSheets) {
      setDriveNotice({ isDocs: true });
      setForm((prev) => ({ ...prev, avatarUrl: value }));
      return;
    }

    if (driveResult.wasConverted) {
      setDriveNotice({ converted: true });
      setForm((prev) => ({ ...prev, avatarUrl: driveResult.convertedUrl }));
      return;
    }

    setDriveNotice(null);
    setForm((prev) => ({ ...prev, avatarUrl: value }));
  };

  // Paste from clipboard handler
  const handlePasteClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          processFile(file);
          return;
        }
      }
      // If no image blob, check text clipboard
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch {
      // Fallback: prompt to use input or file
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = {
      ...form,
      pinOrPassword: form.pinOrPassword && form.pinOrPassword.trim() ? form.pinOrPassword.trim() : 'admin',
    };
    updateProfessorProfile(finalForm);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const isCurrentDrive =
    form.avatarUrl.includes('drive.google.com') ||
    form.avatarUrl.includes('googleusercontent.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Perfil y Ajustes del Docente</h3>
              <p className="text-xs text-slate-400">Personalice sus datos institucionales y su fotografía real</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PHOTO MANAGEMENT SECTION */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fotografía Oficial del Profesor</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {isDataUrl(form.avatarUrl) ? '✓ Foto local cargada' : isCurrentDrive ? '🔗 Enlace de Google Drive' : 'Foto activa'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Photo Avatar Preview with Drag & Drop box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                title="Haga clic o arrastre una imagen aquí"
                className={`relative shrink-0 w-24 h-24 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all flex flex-col items-center justify-center group ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-500/20 scale-105'
                    : 'border-indigo-500/50 hover:border-indigo-400 bg-slate-900 shadow-lg'
                }`}
              >
                {!imageError && form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt={form.name}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-600/20 text-indigo-400 flex flex-col items-center justify-center font-bold text-xl">
                    <span>{form.name ? form.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'PR'}</span>
                    <span className="text-[9px] font-normal text-slate-400 mt-1">Sin foto</span>
                  </div>
                )}

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] text-center p-1">
                  <Upload className="w-4 h-4 mb-0.5 text-indigo-300" />
                  <span>Cambiar foto</span>
                </div>
              </div>

              {/* Controls and Tabs */}
              <div className="flex-1 w-full space-y-2.5">
                {/* Method Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('upload')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center gap-1 ${
                      activePhotoTab === 'upload'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir de PC / Celular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('url')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center gap-1 ${
                      activePhotoTab === 'url'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Pegar URL o Drive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('presets')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition text-center flex items-center justify-center gap-1 ${
                      activePhotoTab === 'presets'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Avatares</span>
                  </button>
                </div>

                {/* TAB 1: SUBIR DESDE DISPOSITIVO (RECOMENDADO) */}
                {activePhotoTab === 'upload' && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/30 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Seleccionar Foto de mi Archivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                        title="Pegar imagen copiada del portapapeles"
                      >
                        <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pegar (Ctrl+V)</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 <strong>La opción más fácil y 100% segura:</strong> No requiere internet ni configurar
                      permisos. Puedes seleccionar una foto de tu disco duro, celular o arrastrarla directamente
                      al recuadro. Se almacena localmente de inmediato.
                    </p>
                  </div>
                )}

                {/* TAB 2: ENLACE WEB O GOOGLE DRIVE */}
                {activePhotoTab === 'url' && (
                  <div className="space-y-2 animate-in fade-in">
                    <div className="relative">
                      <input
                        type="text"
                        value={form.avatarUrl}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="Pegue aquí: enlace de Drive, Imgur, Postimages o URL directa (.jpg, .png)..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      {form.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, avatarUrl: '' }));
                            setDriveNotice(null);
                            setImageError(false);
                          }}
                          className="absolute right-2 top-2 text-slate-400 hover:text-white"
                          title="Limpiar campo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Notice for converted Drive link */}
                    {driveNotice?.converted && (
                      <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2 animate-in fade-in">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <strong>¡Enlace de Google Drive reconocido!</strong> Convertido automáticamente a formato
                          de visualización de imagen.
                        </div>
                      </div>
                    )}

                    {/* Notice for folder warning */}
                    {driveNotice?.isFolder && (
                      <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <strong>Atención:</strong> Ha pegado el enlace de una <em>carpeta</em> de Drive, no de
                          un archivo de imagen. Abra la foto en Google Drive y copie el enlace de esa foto
                          específica.
                        </div>
                      </div>
                    )}

                    {/* Notice for doc/sheet warning */}
                    {driveNotice?.isDocs && (
                      <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <strong>Atención:</strong> Ha pegado el enlace de un documento o planilla, no una
                          imagen.
                        </div>
                      </div>
                    )}

                    {/* Help toggle for Google Drive */}
                    <button
                      type="button"
                      onClick={() => setShowDriveGuide(!showDriveGuide)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>¿Por qué a veces falla Google Drive y qué URLs puedo usar?</span>
                      {showDriveGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showDriveGuide && (
                      <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-2 animate-in fade-in">
                        <p className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          ¿Cómo hacer que funcione una foto de Google Drive?
                        </p>
                        <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                          <li>
                            En Google Drive, haz clic derecho sobre la foto y elige <strong>Compartir</strong>.
                          </li>
                          <li>
                            Bajo <strong>Acceso general</strong>, cámbialo de <em>Restringido</em> a{' '}
                            <strong className="text-emerald-300">"Cualquier persona con el enlace"</strong> (con rol Lector).
                          </li>
                          <li>
                            Haz clic en <strong>Copiar enlace</strong> y pégalo aquí arriba. Nuestro sistema lo transformará
                            automáticamente.
                          </li>
                        </ol>

                        <div className="pt-2 border-t border-slate-800 text-slate-400">
                          <p className="font-semibold text-white mb-1">¿Qué otros tipos de URLs funcionan de inmediato?</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Cualquier enlace directo que termine en <code className="text-indigo-300">.jpg</code>, <code className="text-indigo-300">.png</code> o <code className="text-indigo-300">.webp</code>.</li>
                            <li>
                              Servicios gratuitos de subida de imágenes como{' '}
                              <strong className="text-white">ImgBB.com</strong>,{' '}
                              <strong className="text-white">Postimages.org</strong> o{' '}
                              <strong className="text-white">Imgur.com</strong> (copiando el "Enlace directo").
                            </li>
                            <li>
                              O clic derecho en cualquier foto de tu perfil institucional/web y elegir{' '}
                              <em>"Copiar dirección de la imagen"</em>.
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PRESETS */}
                {activePhotoTab === 'presets' && (
                  <div className="space-y-2 animate-in fade-in">
                    <span className="text-[11px] text-slate-400 block">
                      Seleccione un avatar académico profesional en alta resolución:
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {professorPresets.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, avatarUrl: url });
                            setImageError(false);
                            setDriveNotice(null);
                          }}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition ${
                            form.avatarUrl === url
                              ? 'border-indigo-400 scale-105 ring-2 ring-indigo-500/50'
                              : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error banner if image failed to load */}
            {imageError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">
                    No fue posible mostrar la imagen desde la URL ingresada.
                  </p>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed">
                    {isCurrentDrive ? (
                      <>
                        <strong>Motivo común en Google Drive:</strong> El archivo sigue protegido como <em>"Restringido"</em>.
                        Para solucionarlo, ve a Drive &gt; Compartir &gt; cámbialo a <strong>"Cualquier persona con el enlace"</strong>.
                        O más fácil: haz clic en la pestaña <strong>"Subir de PC / Celular"</strong> y sube el archivo directamente sin depender de enlaces.
                      </>
                    ) : (
                      <>
                        La URL no devuelve un archivo de imagen accesible públicamente. Asegúrese de que sea una URL directa (.jpg, .png)
                        o use el botón <strong>"Subir de PC / Celular"</strong> para cargar su foto real desde su equipo.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ACADEMIC & INSTITUTIONAL DATA */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Título Académico</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                placeholder="Dr., Ing., Prof., Lic."
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo del Profesor *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico Institucional</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Semestre / Período Activo</label>
              <input
                type="text"
                value={form.semestreActivo}
                onChange={(e) => setForm({ ...form, semestreActivo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                placeholder="ej. 2026-I"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Universidad / Institución Universitaria</label>
            <input
              type="text"
              value={form.universidad}
              onChange={(e) => setForm({ ...form, universidad: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Facultad</label>
              <input
                type="text"
                value={form.facultad}
                onChange={(e) => setForm({ ...form, facultad: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Departamento Académico</label>
              <input
                type="text"
                value={form.departamento}
                onChange={(e) => setForm({ ...form, departamento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contraseña de Acceso Docente</span>
            </label>
            <input
              type="text"
              value={form.pinOrPassword || ''}
              onChange={(e) => setForm({ ...form, pinOrPassword: e.target.value })}
              placeholder="admin"
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Contraseña de seguridad para acceder a la aplicación. Al cambiarla, la clave por defecto (<code className="text-indigo-300">admin</code>) quedará revocada inmediatamente.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>¡Datos Guardados Exitosamente!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Perfil y Foto</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
