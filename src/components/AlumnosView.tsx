import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Student, StudentCalculatedGrades } from '../types';
import { getNivelColor } from '../utils/gradeCalculations';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  Upload,
  X,
  Check,
  AlertTriangle,
  GraduationCap,
  ShieldAlert,
  Link as LinkIcon,
} from 'lucide-react';
import { convertGoogleDriveUrl } from '../utils/imageUrlHelper';

export const AlumnosView: React.FC = () => {
  const {
    students,
    materias,
    secciones,
    calculatedStudents,
    selectedMateriaId,
    setSelectedMateriaId,
    selectedSeccionId,
    setSelectedSeccionId,
    addStudent,
    updateStudent,
    deleteStudent,
    setActiveTab,
  } = useApp();

  // Local filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [filterDia, setFilterDia] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentCalculatedGrades | null>(null);

  // Student form state
  const [studentForm, setStudentForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    matricula: '',
    email: '',
    telefono: '',
    fotoUrl: '',
    materiaId: '',
    seccionId: '',
    status: 'regular' as 'regular' | 'condicional' | 'retirado',
  });

  // Avatar presets
  const presetPhotos = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  ];

  // Filter students based on all classification criteria
  const filteredCalculatedStudents = useMemo(() => {
    return calculatedStudents.filter((item) => {
      const s = item.student;
      const m = item.materia;
      const sec = item.seccion;

      // Filter by Materia
      if (selectedMateriaId !== 'all' && s.materiaId !== selectedMateriaId) {
        return false;
      }

      // Filter by Seccion
      if (selectedSeccionId !== 'all' && s.seccionId !== selectedSeccionId) {
        return false;
      }

      // Filter by Nivel de Nota
      if (filterNivel !== 'all' && item.nivel !== filterNivel) {
        return false;
      }

      // Filter by Status (regular, condicional, retirado)
      if (filterStatus !== 'all' && s.status !== filterStatus) {
        return false;
      }

      // Filter by Horario/Día de clase
      if (filterDia !== 'all') {
        const hasDay = sec.horarios?.some((h) => h.dia === filterDia);
        if (!hasDay) return false;
      }

      // Search term (nombre, apellido, cedula, matricula, email)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const fullName = `${s.nombre} ${s.apellido}`.toLowerCase();
        const matchName = fullName.includes(term);
        const matchCedula = s.cedula.toLowerCase().includes(term);
        const matchMatricula = s.matricula.toLowerCase().includes(term);
        const matchEmail = s.email.toLowerCase().includes(term);
        if (!matchName && !matchCedula && !matchMatricula && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [calculatedStudents, selectedMateriaId, selectedSeccionId, filterNivel, filterStatus, filterDia, searchTerm]);

  // Open modal for student creation/editing
  const handleOpenStudentModal = (st?: Student) => {
    const defaultMateriaId = materias[0]?.id || '';
    const availableSecs = secciones.filter((s) => s.materiaId === defaultMateriaId);
    const defaultSeccionId = availableSecs[0]?.id || '';

    if (st) {
      setEditingStudent(st);
      setStudentForm({
        nombre: st.nombre,
        apellido: st.apellido,
        cedula: st.cedula,
        matricula: st.matricula,
        email: st.email,
        telefono: st.telefono,
        fotoUrl: st.fotoUrl,
        materiaId: st.materiaId,
        seccionId: st.seccionId,
        status: st.status,
      });
    } else {
      setEditingStudent(null);
      setStudentForm({
        nombre: '',
        apellido: '',
        cedula: '',
        matricula: `2026-${Math.floor(1000 + Math.random() * 9000)}`,
        email: '',
        telefono: '',
        fotoUrl: presetPhotos[Math.floor(Math.random() * presetPhotos.length)],
        materiaId: selectedMateriaId !== 'all' ? selectedMateriaId : defaultMateriaId,
        seccionId: selectedSeccionId !== 'all' ? selectedSeccionId : defaultSeccionId,
        status: 'regular',
      });
    }
    setIsStudentModalOpen(true);
  };

  // Handle local image file upload (converts to base64 data url)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentForm((prev) => ({ ...prev, fotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.nombre.trim() || !studentForm.apellido.trim() || !studentForm.materiaId || !studentForm.seccionId) {
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, studentForm);
    } else {
      addStudent(studentForm);
    }
    setIsStudentModalOpen(false);
  };

  // Secciones available for selected materia in form
  const formAvailableSecciones = useMemo(() => {
    return secciones.filter((s) => s.materiaId === studentForm.materiaId);
  }, [secciones, studentForm.materiaId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Control de Alumnos
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Directorio y Asignación de Estudiantes</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestione los estudiantes con fotografía, clasifíquelos por materia, sección, nivel de
            calificación y horarios de clase.
          </p>
        </div>

        <button
          onClick={() => handleOpenStudentModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Inscribir Nuevo Alumno</span>
        </button>
      </div>

      {/* Classification & Filter Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter by Nivel de Notas */}
          <div>
            <select
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Nivel de Nota: Todos</option>
              <option value="sobresaliente">Sobresaliente (18 - 20)</option>
              <option value="notable">Notable (15 - 17.9)</option>
              <option value="aprobado">Aprobado (10 - 14.9)</option>
              <option value="en_riesgo">En Riesgo (08 - 09.9)</option>
              <option value="reprobado">Reprobado (&lt; 08)</option>
            </select>
          </div>

          {/* Filter by Horario / Día */}
          <div>
            <select
              value={filterDia}
              onChange={(e) => setFilterDia(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Horario: Cualquier Día</option>
              <option value="Lunes">Clases los Lunes</option>
              <option value="Martes">Clases los Martes</option>
              <option value="Miércoles">Clases los Miércoles</option>
              <option value="Jueves">Clases los Jueves</option>
              <option value="Viernes">Clases los Viernes</option>
              <option value="Sábado">Clases los Sábados</option>
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Estatus: Todos</option>
              <option value="regular">Regular</option>
              <option value="condicional">Condicional</option>
              <option value="retirado">Retirado</option>
            </select>
          </div>
        </div>

        {/* View toggle & Results Count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Mostrando <strong className="text-white">{filteredCalculatedStudents.length}</strong> de{' '}
              {students.length} estudiantes
            </span>
            {(filterNivel !== 'all' || filterDia !== 'all' || filterStatus !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilterNivel('all');
                  setFilterDia('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-2 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista de Tarjetas con Foto"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vista en Tabla Detallada"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCalculatedStudents.map((item) => {
            const s = item.student;
            const m = item.materia;
            const sec = item.seccion;
            const nivel = getNivelColor(item.nivel);

            return (
              <div
                key={s.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition hover:shadow-md group"
              >
                <div>
                  {/* Photo & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="relative">
                      <img
                        src={s.fotoUrl}
                        alt={`${s.nombre} ${s.apellido}`}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow group-hover:border-indigo-500 transition"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                          s.status === 'regular'
                            ? 'bg-emerald-500'
                            : s.status === 'condicional'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        title={`Estatus: ${s.status}`}
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-white block">
                        {item.notaDefinitiva} <span className="text-[10px] text-slate-400">/20</span>
                      </span>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold mt-0.5 ${nivel.bg} ${nivel.text} ${nivel.border}`}
                      >
                        {nivel.label}
                      </span>
                    </div>
                  </div>

                  {/* Name & Academic ID */}
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                      {s.nombre} {s.apellido}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>C.I: {s.cedula}</span>
                      <span>•</span>
                      <span>Mat: {s.matricula}</span>
                    </p>
                  </div>

                  {/* Course & Section Tag */}
                  <div className="mt-3 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: m?.color || '#6366f1' }}
                      />
                      <span className="font-semibold text-slate-200 truncate">
                        {m?.codigo} - {sec?.codigoSeccion}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span className="truncate">
                        {sec?.horarios?.map((h) => `${h.dia.slice(0, 3)} ${h.horaInicio}`).join(', ') || 'Sin horario'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer details & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Asist: <strong className="text-amber-400">{item.asistenciaPorcentaje}%</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedStudentDetail(item)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition"
                      title="Ver Ficha Académica"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenStudentModal(s)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      title="Editar Datos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar al estudiante ${s.nombre} ${s.apellido}?`)) {
                          deleteStudent(s.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-3">Cédula / Matrícula</th>
                  <th className="py-3 px-3">Asignatura</th>
                  <th className="py-3 px-3">Sección & Horario</th>
                  <th className="py-3 px-3 text-center">Asistencia</th>
                  <th className="py-3 px-3 text-right">Nota Definitiva</th>
                  <th className="py-3 px-3">Nivel</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCalculatedStudents.map((item) => {
                  const s = item.student;
                  const m = item.materia;
                  const sec = item.seccion;
                  const nivel = getNivelColor(item.nivel);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.fotoUrl}
                            alt={s.nombre}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                          />
                          <div>
                            <p className="font-bold text-white">
                              {s.nombre} {s.apellido}
                            </p>
                            <p className="text-[10px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        <div>{s.cedula}</div>
                        <div className="text-[10px] text-slate-500">{s.matricula}</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200">{m?.codigo}</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{m?.nombre}</p>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-indigo-300">{sec?.codigoSeccion}</div>
                        <div className="text-[10px] text-slate-400">
                          {sec?.horarios?.map((h) => h.dia).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-amber-400">{item.asistenciaPorcentaje}%</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="text-sm font-bold text-white">{item.notaDefinitiva}</span>
                        <span className="text-[10px] text-slate-400">/20</span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${nivel.bg} ${nivel.text} ${nivel.border}`}
                        >
                          {nivel.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentDetail(item)}
                            className="p-1 text-slate-400 hover:text-cyan-300"
                            title="Ver Ficha"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStudentModal(s)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar al estudiante ${s.nombre} ${s.apellido}?`)) {
                                deleteStudent(s.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Inscribir / Editar Alumno (con Foto) */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>{editingStudent ? 'Editar Ficha del Alumno' : 'Inscribir Nuevo Alumno'}</span>
              </h3>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              {/* Photo selection with uploader and presets */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Fotografía del Estudiante *
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={studentForm.fotoUrl || presetPhotos[0]}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Foto Local</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">o ingrese enlace web:</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={studentForm.fotoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          const driveRes = convertGoogleDriveUrl(val);
                          setStudentForm({ ...studentForm, fotoUrl: driveRes.wasConverted ? driveRes.convertedUrl : val });
                        }}
                        placeholder="Pegue enlace de Google Drive, Imgur o URL (.jpg, .png)..."
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    {/* Presets row */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {presetPhotos.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setStudentForm({ ...studentForm, fotoUrl: url })}
                          className={`w-7 h-7 rounded-lg overflow-hidden border transition ${
                            studentForm.fotoUrl === url
                              ? 'border-indigo-400 scale-110 ring-2 ring-indigo-500/40'
                              : 'border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Valentina"
                    value={studentForm.nombre}
                    onChange={(e) => setStudentForm({ ...studentForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Morales Rivas"
                    value={studentForm.apellido}
                    onChange={(e) => setStudentForm({ ...studentForm, apellido: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cédula de Identidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. V-28.451.902"
                    value={studentForm.cedula}
                    onChange={(e) => setStudentForm({ ...studentForm, cedula: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    N° Matrícula / Carnet
                  </label>
                  <input
                    type="text"
                    value={studentForm.matricula}
                    onChange={(e) => setStudentForm({ ...studentForm, matricula: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="estudiante@universidad.edu"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="+58 414 1234567"
                    value={studentForm.telefono}
                    onChange={(e) => setStudentForm({ ...studentForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Assignment: Materia & Seccion */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                <span className="block text-xs font-bold text-white">
                  Asignación de Materia y Sección
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Materia *</label>
                    <select
                      value={studentForm.materiaId}
                      onChange={(e) => {
                        const newMatId = e.target.value;
                        const validSecs = secciones.filter((s) => s.materiaId === newMatId);
                        setStudentForm({
                          ...studentForm,
                          materiaId: newMatId,
                          seccionId: validSecs[0]?.id || '',
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {materias.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.codigo} - {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Sección *</label>
                    <select
                      value={studentForm.seccionId}
                      onChange={(e) => setStudentForm({ ...studentForm, seccionId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      {formAvailableSecciones.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.codigoSeccion} ({sec.aulaPrincipal})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Estatus Académico</label>
                  <select
                    value={studentForm.status}
                    onChange={(e) =>
                      setStudentForm({
                        ...studentForm,
                        status: e.target.value as 'regular' | 'condicional' | 'retirado',
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="regular">Regular</option>
                    <option value="condicional">Condicional</option>
                    <option value="retirado">Retirado</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Completar Inscripción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Drawer: Ficha Académica Completa del Estudiante */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span>Expediente Académico del Alumno</span>
              </h3>
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <img
                src={selectedStudentDetail.student.fotoUrl}
                alt={selectedStudentDetail.student.nombre}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    {selectedStudentDetail.student.nombre} {selectedStudentDetail.student.apellido}
                  </h2>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                      getNivelColor(selectedStudentDetail.nivel).bg
                    } ${getNivelColor(selectedStudentDetail.nivel).text}`}
                  >
                    {getNivelColor(selectedStudentDetail.nivel).label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  C.I: {selectedStudentDetail.student.cedula} • Matrícula: {selectedStudentDetail.student.matricula}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedStudentDetail.student.email}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedStudentDetail.student.telefono}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject and Section Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Materia</span>
                <span className="text-xs font-bold text-white mt-1 block">
                  {selectedStudentDetail.materia.codigo}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sección</span>
                <span className="text-xs font-bold text-indigo-300 mt-1 block">
                  {selectedStudentDetail.seccion.codigoSeccion}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Definitiva</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  {selectedStudentDetail.notaDefinitiva} / 20
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Asistencia</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block">
                  {selectedStudentDetail.asistenciaPorcentaje}%
                </span>
              </div>
            </div>

            {/* Parcial Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Desglose de Calificaciones por Parcial
              </h4>

              <div className="space-y-2">
                {Object.entries(selectedStudentDetail.parcialSubtotals).map(([pId, data], idx) => (
                  <div
                    key={pId}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Parcial {idx + 1}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Quizzes: <strong className="text-slate-200">{data.quizzesAvg}</strong></span>
                        <span>Tareas: <strong className="text-slate-200">{data.tareasAvg}</strong></span>
                        <span>Examen: <strong className="text-slate-200">{data.examen}</strong></span>
                        <span>Asist: <strong className="text-slate-200">{data.asistenciaNota}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-white">
                        {data.subtotalSobreEscala} <span className="text-[10px] text-slate-400">/20</span>
                      </span>
                      <span className="block text-[10px] text-indigo-400">
                        Aporta: +{data.subtotalPonderado} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedMateriaId(selectedStudentDetail.materia.id);
                  setSelectedSeccionId(selectedStudentDetail.seccion.id);
                  setSelectedStudentDetail(null);
                  setActiveTab('vaciado');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
              >
                Ir a Vaciado de Notas de esta Sección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
