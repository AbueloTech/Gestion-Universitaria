import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ConfiguracionEvaluacion, ParcialConfig } from '../types';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const EvaluacionConfigView: React.FC = () => {
  const {
    materias,
    configuraciones,
    updateConfiguracion,
    selectedMateriaId,
    setSelectedMateriaId,
  } = useApp();

  const [activeMateriaId, setActiveMateriaId] = useState<string>(() => {
    return selectedMateriaId !== 'all' ? selectedMateriaId : materias[0]?.id || '';
  });

  const [localConfig, setLocalConfig] = useState<ConfiguracionEvaluacion | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with selected materia config
  useEffect(() => {
    const found = configuraciones.find((c) => c.materiaId === activeMateriaId);
    if (found) {
      setLocalConfig(JSON.parse(JSON.stringify(found)));
    }
  }, [activeMateriaId, configuraciones]);

  if (!localConfig) {
    return null;
  }

  // Add new parcial
  const handleAddParcial = () => {
    const nextNum = localConfig.parciales.length + 1;
    const newParcial: ParcialConfig = {
      id: `p-${Date.now()}`,
      nombre: `${nextNum}er Parcial`,
      pesoParcial: 30,
      quizzesCount: 2,
      quizzesWeight: 20,
      tareasCount: 2,
      tareasWeight: 20,
      examenWeight: 50,
      asistenciaWeight: 10,
    };

    setLocalConfig({
      ...localConfig,
      parciales: [...localConfig.parciales, newParcial],
    });
  };

  // Remove parcial
  const handleRemoveParcial = (parcialId: string) => {
    if (localConfig.parciales.length <= 1) {
      alert('Debe existir al menos un parcial en la evaluación de la materia.');
      return;
    }
    setLocalConfig({
      ...localConfig,
      parciales: localConfig.parciales.filter((p) => p.id !== parcialId),
    });
  };

  // Update parcial field
  const handleUpdateParcial = (parcialId: string, field: keyof ParcialConfig, value: any) => {
    setLocalConfig({
      ...localConfig,
      parciales: localConfig.parciales.map((p) =>
        p.id === parcialId ? { ...p, [field]: value } : p
      ),
    });
  };

  // Check sum of semester weights
  const totalSemesterWeight = localConfig.parciales.reduce(
    (acc, p) => acc + (Number(p.pesoParcial) || 0),
    0
  );

  // Apply template
  const handleApplyTemplate = (type: 'standard3' | 'twoParciales') => {
    if (type === 'standard3') {
      setLocalConfig({
        ...localConfig,
        parciales: [
          {
            id: 'p1',
            nombre: '1er Parcial',
            pesoParcial: 30,
            quizzesCount: 2,
            quizzesWeight: 20,
            tareasCount: 2,
            tareasWeight: 20,
            examenWeight: 50,
            asistenciaWeight: 10,
          },
          {
            id: 'p2',
            nombre: '2do Parcial',
            pesoParcial: 35,
            quizzesCount: 2,
            quizzesWeight: 20,
            tareasCount: 3,
            tareasWeight: 20,
            examenWeight: 50,
            asistenciaWeight: 10,
          },
          {
            id: 'p3',
            nombre: '3er Parcial',
            pesoParcial: 35,
            quizzesCount: 2,
            quizzesWeight: 20,
            tareasCount: 2,
            tareasWeight: 20,
            examenWeight: 50,
            asistenciaWeight: 10,
          },
        ],
      });
    } else {
      setLocalConfig({
        ...localConfig,
        parciales: [
          {
            id: 'p1',
            nombre: '1er Parcial (50%)',
            pesoParcial: 50,
            quizzesCount: 3,
            quizzesWeight: 20,
            tareasCount: 3,
            tareasWeight: 20,
            examenWeight: 50,
            asistenciaWeight: 10,
          },
          {
            id: 'p2',
            nombre: '2do Parcial / Proyecto (50%)',
            pesoParcial: 50,
            quizzesCount: 2,
            quizzesWeight: 20,
            tareasCount: 2,
            tareasWeight: 20,
            examenWeight: 50,
            asistenciaWeight: 10,
          },
        ],
      });
    }
  };

  const handleSave = () => {
    updateConfiguracion(localConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const activeMateriaObj = materias.find((m) => m.id === activeMateriaId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Parámetros de Evaluación
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">Configuración del Plan de Evaluación</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina el número de parciales y la estructura de cada uno: cantidad de quizzes, tareas,
            peso del examen y ponderación de asistencia.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>¡Parámetros Guardados!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {/* Select Materia */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-400 font-medium">Asignatura a Configurar:</span>
        {materias.map((m) => {
          const isSelected = activeMateriaId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveMateriaId(m.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              <span>{m.codigo} - {m.nombre}</span>
            </button>
          );
        })}
      </div>

      {/* Scale & General Rules */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white">Escala y Criterio de Aprobación</h2>
            <p className="text-xs text-slate-400">
              Escala de calificaciones para {activeMateriaObj?.nombre}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApplyTemplate('standard3')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Plantilla 3 Parciales (30-35-35)</span>
            </button>
            <button
              onClick={() => handleApplyTemplate('twoParciales')}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Plantilla 2 Parciales (50-50)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escala de Calificación
            </label>
            <select
              value={localConfig.escala}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  escala: e.target.value as any,
                  notaMinimaAprobatoria:
                    e.target.value === '0-20' ? 10 : e.target.value === '0-10' ? 5 : 60,
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="0-20">Escala Universitaria 0 - 20 Puntos (Estándar)</option>
              <option value="0-100">Escala Porcentual 0 - 100 Puntos</option>
              <option value="0-10">Escala Decimal 0 - 10 Puntos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nota Mínima Aprobatoria
            </label>
            <input
              type="number"
              value={localConfig.notaMinimaAprobatoria}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  notaMinimaAprobatoria: parseFloat(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Calificaciones menores a esta nota se consideran Reprobadas
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Suma de Ponderación Semestral
            </label>
            <div
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border ${
                totalSemesterWeight === 100
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              <span>Total Parciales: {totalSemesterWeight}%</span>
              {totalSemesterWeight === 100 ? (
                <span className="flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correcto (100%)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Debe sumar 100%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parciales List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Estructura de Cortes / Parciales ({localConfig.parciales.length})
          </h2>

          <button
            onClick={handleAddParcial}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Añadir Otro Parcial</span>
          </button>
        </div>

        <div className="space-y-4">
          {localConfig.parciales.map((parcial, pIndex) => {
            const internalWeight =
              parcial.quizzesWeight +
              parcial.tareasWeight +
              parcial.examenWeight +
              parcial.asistenciaWeight;
            const isInternalWeightValid = internalWeight === 100;

            return (
              <div
                key={parcial.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
              >
                {/* Parcial Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
                      #{pIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={parcial.nombre}
                      onChange={(e) => handleUpdateParcial(parcial.id, 'nombre', e.target.value)}
                      className="bg-slate-950 border border-slate-700 px-3 py-1 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 w-64 sm:w-80"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400 font-medium">
                        Peso Semestral:
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={parcial.pesoParcial}
                          onChange={(e) =>
                            handleUpdateParcial(
                              parcial.id,
                              'pesoParcial',
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white text-center"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveParcial(parcial.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      title="Eliminar este parcial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Parcial Items Grid: Quizzes, Tareas, Examen, Asistencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quizzes Box */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-cyan-400 block">
                      Quizzes / Pruebas Cortas
                    </span>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Cantidad de Quizzes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={parcial.quizzesCount}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'quizzesCount',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Peso en el Parcial (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={parcial.quizzesWeight}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'quizzesWeight',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Tareas Box */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-indigo-400 block">
                      Tareas / Talleres
                    </span>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Cantidad de Tareas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={parcial.tareasCount}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'tareasCount',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Peso en el Parcial (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={parcial.tareasWeight}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'tareasWeight',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Examen Box */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 block">
                      Examen Parcial Escrito
                    </span>
                    <div className="pt-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Peso del Examen (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={parcial.examenWeight}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'examenWeight',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block pt-1">
                      Evaluación principal individual
                    </span>
                  </div>

                  {/* Asistencia Box */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-400 block">
                      Asistencia y Participación
                    </span>
                    <div className="pt-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Peso de Asistencia (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={parcial.asistenciaWeight}
                        onChange={(e) =>
                          handleUpdateParcial(
                            parcial.id,
                            'asistenciaWeight',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block pt-1">
                      Calculada según registro de clases
                    </span>
                  </div>
                </div>

                {/* Validation line for this parcial */}
                <div
                  className={`p-2 rounded-xl text-xs flex items-center justify-between ${
                    isInternalWeightValid
                      ? 'bg-slate-950 text-slate-400 border border-slate-800'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span>
                    Distribución interna del Parcial: {parcial.quizzesWeight}% Quizzes +{' '}
                    {parcial.tareasWeight}% Tareas + {parcial.examenWeight}% Examen +{' '}
                    {parcial.asistenciaWeight}% Asistencia ={' '}
                    <strong
                      className={isInternalWeightValid ? 'text-emerald-400' : 'text-rose-400'}
                    >
                      {internalWeight}%
                    </strong>
                  </span>

                  {!isInternalWeightValid && (
                    <span className="text-[11px] text-rose-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Los 4 componentes deben sumar 100%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
