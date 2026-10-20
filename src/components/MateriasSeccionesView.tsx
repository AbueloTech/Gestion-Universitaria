import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Materia, Seccion, HorarioClase, DiaSemana } from '../types';
import {
  BookOpen,
  Plus,
  Layers,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Calendar,
  X,
  Check,
  Building,
  AlertCircle,
} from 'lucide-react';

export const MateriasSeccionesView: React.FC = () => {
  const {
    materias,
    secciones,
    students,
    addMateria,
    updateMateria,
    deleteMateria,
    addSeccion,
    updateSeccion,
    deleteSeccion,
    setSelectedMateriaId,
    setSelectedSeccionId,
    setActiveTab,
  } = useApp();

  // Modals state
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);

  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [editingSeccion, setEditingSeccion] = useState<Seccion | null>(null);
  const [targetMateriaIdForNewSec, setTargetMateriaIdForNewSec] = useState<string>('');

  // Materia form state
  const [matForm, setMatForm] = useState({
    codigo: '',
    nombre: '',
    creditos: 4,
    departamento: 'Ciencias Básicas e Ingeniería',
    color: '#6366f1',
  });

  // Seccion form state
  const [secForm, setSecForm] = useState<{
    materiaId: string;
    codigoSeccion: string;
    periodo: string;
    aulaPrincipal: string;
    cupoMaximo: number;
    horarios: HorarioClase[];
  }>({
    materiaId: '',
    codigoSeccion: '',
    periodo: '2026-I',
    aulaPrincipal: '',
    cupoMaximo: 30,
    horarios: [],
  });

  // New horario draft inside seccion modal
  const [newHorario, setNewHorario] = useState<{
    dia: DiaSemana;
    horaInicio: string;
    horaFin: string;
    aula: string;
  }>({
    dia: 'Lunes',
    horaInicio: '08:00',
    horaFin: '10:00',
    aula: '',
  });

  // Open Materia Modal
  const handleOpenMateriaModal = (m?: Materia) => {
    if (m) {
      setEditingMateria(m);
      setMatForm({
        codigo: m.codigo,
        nombre: m.nombre,
        creditos: m.creditos,
        departamento: m.departamento,
        color: m.color,
      });
    } else {
      setEditingMateria(null);
      setMatForm({
        codigo: '',
        nombre: '',
        creditos: 4,
        departamento: 'Ciencias Básicas e Ingeniería',
        color: '#6366f1',
      });
    }
    setIsMateriaModalOpen(true);
  };

  const handleSaveMateria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matForm.codigo.trim() || !matForm.nombre.trim()) return;

    if (editingMateria) {
      updateMateria(editingMateria.id, matForm);
    } else {
      addMateria(matForm);
    }
    setIsMateriaModalOpen(false);
  };

  // Open Seccion Modal
  const handleOpenSeccionModal = (materiaId: string, s?: Seccion) => {
    setTargetMateriaIdForNewSec(materiaId);
    if (s) {
      setEditingSeccion(s);
      setSecForm({
        materiaId: s.materiaId,
        codigoSeccion: s.codigoSeccion,
        periodo: s.periodo,
        aulaPrincipal: s.aulaPrincipal,
        cupoMaximo: s.cupoMaximo,
        horarios: [...s.horarios],
      });
      setNewHorario({
        dia: 'Lunes',
        horaInicio: '08:00',
        horaFin: '10:00',
        aula: s.aulaPrincipal,
      });
    } else {
      setEditingSeccion(null);
      setSecForm({
        materiaId,
        codigoSeccion: 'SEC-01',
        periodo: '2026-I',
        aulaPrincipal: 'Aula 101',
        cupoMaximo: 30,
        horarios: [
          {
            id: `h-${Date.now()}`,
            dia: 'Lunes',
            horaInicio: '08:00',
            horaFin: '10:00',
            aula: 'Aula 101',
          },
        ],
      });
      setNewHorario({
        dia: 'Miércoles',
        horaInicio: '08:00',
        horaFin: '10:00',
        aula: 'Aula 101',
      });
    }
    setIsSeccionModalOpen(true);
  };

  const handleAddHorarioToForm = () => {
    setSecForm((prev) => ({
      ...prev,
      horarios: [
        ...prev.horarios,
        {
          id: `h-${Date.now()}`,
          dia: newHorario.dia,
          horaInicio: newHorario.horaInicio,
          horaFin: newHorario.horaFin,
          aula: newHorario.aula || prev.aulaPrincipal,
        },
      ],
    }));
  };

  const handleRemoveHorarioFromForm = (hId: string) => {
    setSecForm((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((h) => h.id !== hId),
    }));
  };

  const handleSaveSeccion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secForm.codigoSeccion.trim()) return;

    if (editingSeccion) {
      updateSeccion(editingSeccion.id, secForm);
    } else {
      addSeccion(secForm);
    }
    setIsSeccionModalOpen(false);
  };

  const colorOptions = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#14b8a6', // Teal
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Asignación Académica
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Materias, Secciones y Horarios de Clases</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Administre las asignaturas asignadas al docente, cree secciones y configure las aulas y
            horarios de clase semanales.
          </p>
        </div>

        <button
          onClick={() => handleOpenMateriaModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Asignatura / Materia</span>
        </button>
      </div>

      {/* Materias list */}
      <div className="space-y-6">
        {materias.map((materia) => {
          const matSecciones = secciones.filter((s) => s.materiaId === materia.id);
          const matStudents = students.filter((s) => s.materiaId === materia.id);

          return (
            <div
              key={materia.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Materia Top Banner */}
              <div
                className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                style={{
                  background: `linear-gradient(90deg, ${materia.color}15 0%, rgba(15,23,42,0.6) 100%)`,
                }}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow"
                    style={{ backgroundColor: materia.color }}
                  >
                    {materia.codigo.split('-')[0] || 'MAT'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-slate-300 px-2 py-0.5 bg-slate-950/80 rounded border border-slate-800">
                        {materia.codigo}
                      </span>
                      <h2 className="text-base font-bold text-white">{materia.nombre}</h2>
                      <span className="text-xs text-slate-400">({materia.creditos} Créditos)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>{materia.departamento}</span>
                      <span>•</span>
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{matStudents.length} estudiantes matriculados</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <button
                    onClick={() => handleOpenSeccionModal(materia.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Agregar Sección</span>
                  </button>

                  <button
                    onClick={() => handleOpenMateriaModal(materia)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                    title="Editar Materia"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `¿Está seguro de eliminar la materia ${materia.nombre}? Esto eliminará sus secciones y alumnos asociados.`
                        )
                      ) {
                        deleteMateria(materia.id);
                      }
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition"
                    title="Eliminar Materia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Secciones Grid */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Secciones y Horarios Asignados ({matSecciones.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    Periodo Académico: 2026-I
                  </span>
                </div>

                {matSecciones.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matSecciones.map((sec) => {
                      const secStudents = students.filter((s) => s.seccionId === sec.id);

                      return (
                        <div
                          key={sec.id}
                          className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                                {sec.codigoSeccion}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenSeccionModal(materia.id, sec)}
                                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                  title="Editar Sección"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `¿Eliminar la sección ${sec.codigoSeccion}? Sus alumnos quedarán sin sección.`
                                      )
                                    ) {
                                      deleteSeccion(sec.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                                  title="Eliminar Sección"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-slate-300 font-medium">Aula:</span>
                                <span>{sec.aulaPrincipal}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-slate-300 font-medium">Inscritos:</span>
                                <span>
                                  {secStudents.length} / {sec.cupoMaximo} estudiantes
                                </span>
                              </div>
                            </div>

                            {/* Horarios List */}
                            <div className="mt-3 pt-3 border-t border-slate-800/80">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                                Horario de Clases:
                              </span>
                              <div className="space-y-1.5">
                                {sec.horarios && sec.horarios.length > 0 ? (
                                  sec.horarios.map((h) => (
                                    <div
                                      key={h.id}
                                      className="flex items-center justify-between text-xs bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-slate-400" />
                                        <span className="font-semibold text-white">{h.dia}</span>
                                      </div>
                                      <div className="flex items-center gap-1 font-mono text-[11px] text-indigo-300">
                                        <Clock className="w-2.5 h-2.5" />
                                        <span>{h.horaInicio} - {h.horaFin}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">
                                    Sin horarios asignados
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick shortcuts */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedMateriaId(materia.id);
                                setSelectedSeccionId(sec.id);
                                setActiveTab('vaciado');
                              }}
                              className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg text-xs font-medium border border-indigo-500/30 transition text-center"
                            >
                              Notas
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMateriaId(materia.id);
                                setSelectedSeccionId(sec.id);
                                setActiveTab('alumnos');
                              }}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition text-center"
                            >
                              Alumnos
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMateriaId(materia.id);
                                setSelectedSeccionId(sec.id);
                                setActiveTab('asistencia');
                              }}
                              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition text-center"
                            >
                              Asistencia
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-400">
                    <p className="text-xs mb-3">Esta materia aún no tiene secciones asignadas.</p>
                    <button
                      onClick={() => handleOpenSeccionModal(materia.id)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Crear Primera Sección
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Materia Add/Edit */}
      {isMateriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{editingMateria ? 'Editar Asignatura' : 'Nueva Asignatura / Materia'}</span>
              </h3>
              <button
                onClick={() => setIsMateriaModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMateria} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código de la Materia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. MAT-101, FIS-202"
                  value={matForm.codigo}
                  onChange={(e) => setMatForm({ ...matForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de la Asignatura *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Cálculo Diferencial e Integral"
                  value={matForm.nombre}
                  onChange={(e) => setMatForm({ ...matForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Créditos Académicos
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={matForm.creditos}
                    onChange={(e) =>
                      setMatForm({ ...matForm, creditos: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Color Distintivo
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {colorOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setMatForm({ ...matForm, color: c })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          matForm.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Departamento Académico
                </label>
                <input
                  type="text"
                  value={matForm.departamento}
                  onChange={(e) => setMatForm({ ...matForm, departamento: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMateriaModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30"
                >
                  {editingMateria ? 'Guardar Cambios' : 'Crear Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Seccion Add/Edit */}
      {isSeccionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>{editingSeccion ? 'Editar Sección' : 'Asignar Nueva Sección'}</span>
              </h3>
              <button
                onClick={() => setIsSeccionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSeccion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Código de Sección *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SEC-01, SEC-A"
                    value={secForm.codigoSeccion}
                    onChange={(e) =>
                      setSecForm({ ...secForm, codigoSeccion: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Periodo Académico
                  </label>
                  <input
                    type="text"
                    value={secForm.periodo}
                    onChange={(e) => setSecForm({ ...secForm, periodo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Aula Principal
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Aula 304, Lab 2"
                    value={secForm.aulaPrincipal}
                    onChange={(e) => setSecForm({ ...secForm, aulaPrincipal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cupo Máximo
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={secForm.cupoMaximo}
                    onChange={(e) =>
                      setSecForm({ ...secForm, cupoMaximo: parseInt(e.target.value) || 30 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Horarios Builder */}
              <div className="pt-2 border-t border-slate-800">
                <span className="block text-xs font-bold text-white mb-2">
                  Horarios de Clase Semanales
                </span>

                {/* Existing Horarios in Form */}
                <div className="space-y-2 mb-3">
                  {secForm.horarios.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-2 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{h.dia}</span>
                        <span className="font-mono text-indigo-300">
                          {h.horaInicio} - {h.horaFin}
                        </span>
                        <span className="text-slate-400">({h.aula || secForm.aulaPrincipal})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHorarioFromForm(h.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new horario slot */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400">
                    Añadir bloque horario:
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <select
                      value={newHorario.dia}
                      onChange={(e) =>
                        setNewHorario({ ...newHorario, dia: e.target.value as DiaSemana })
                      }
                      className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <input
                      type="time"
                      value={newHorario.horaInicio}
                      onChange={(e) =>
                        setNewHorario({ ...newHorario, horaInicio: e.target.value })
                      }
                      className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />

                    <input
                      type="time"
                      value={newHorario.horaFin}
                      onChange={(e) => setNewHorario({ ...newHorario, horaFin: e.target.value })}
                      className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />

                    <button
                      type="button"
                      onClick={handleAddHorarioToForm}
                      className="py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSeccionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30"
                >
                  {editingSeccion ? 'Guardar Cambios' : 'Crear Sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
