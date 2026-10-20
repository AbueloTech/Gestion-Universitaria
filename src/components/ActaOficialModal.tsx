import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Download, ShieldCheck, GraduationCap } from 'lucide-react';

interface ActaOficialModalProps {
  onClose: () => void;
}

// Convert numbers 0-20 to words in Spanish
function numberToWordsES(num: number): string {
  const rounded = Math.round(num);
  const words: { [key: number]: string } = {
    0: 'CERO CERO',
    1: 'CERO UNO',
    2: 'CERO DOS',
    3: 'CERO TRES',
    4: 'CERO CUATRO',
    5: 'CERO CINCO',
    6: 'CERO SEIS',
    7: 'CERO SIETE',
    8: 'CERO OCHO',
    9: 'CERO NUEVE',
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÉIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
  };
  return words[rounded] || `${rounded}`;
}

export const ActaOficialModal: React.FC<ActaOficialModalProps> = ({ onClose }) => {
  const {
    professor,
    materias,
    secciones,
    calculatedStudents,
    selectedMateriaId,
    selectedSeccionId,
  } = useApp();

  const activeMateria = useMemo(() => {
    if (selectedMateriaId !== 'all') {
      return materias.find((m) => m.id === selectedMateriaId) || materias[0];
    }
    return materias[0];
  }, [materias, selectedMateriaId]);

  const activeSecciones = useMemo(() => {
    return secciones.filter((s) => s.materiaId === activeMateria?.id);
  }, [secciones, activeMateria]);

  const activeSeccion = useMemo(() => {
    if (selectedSeccionId !== 'all') {
      const found = activeSecciones.find((s) => s.id === selectedSeccionId);
      if (found) return found;
    }
    return activeSecciones[0];
  }, [activeSecciones, selectedSeccionId]);

  const sectionStudents = useMemo(() => {
    if (!activeSeccion) return [];
    return calculatedStudents.filter((s) => s.seccion.id === activeSeccion.id);
  }, [calculatedStudents, activeSeccion]);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="no-print flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Acta Oficial de Calificaciones</h2>
            <span className="text-xs text-slate-400">
              ({activeMateria?.codigo} - {activeSeccion?.codigoSeccion})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 font-sans print-container">
          {/* Official University Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-700">
              REPÚBLICA BOLIVARIANA / EDUCACIÓN UNIVERSITARIA
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 mt-1">
              {professor.universidad}
            </h1>
            <p className="text-xs font-semibold text-slate-700">{professor.facultad}</p>
            <p className="text-xs text-slate-600">{professor.departamento}</p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-100 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-800">
              ACTA OFICIAL DE CALIFICACIONES DEFINITIVAS — SEMESTRE {professor.semestreActivo}
            </div>
          </div>

          {/* Academic Info Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-300 p-3 bg-slate-50 mb-6 rounded">
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Código & Asignatura:
              </span>
              <span className="font-bold text-slate-900">
                {activeMateria?.codigo} - {activeMateria?.nombre}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Sección & Aula:
              </span>
              <span className="font-bold text-slate-900">
                {activeSeccion?.codigoSeccion} ({activeSeccion?.aulaPrincipal})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Profesor Evaluador:
              </span>
              <span className="font-bold text-slate-900">
                {professor.title} {professor.name}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block text-[10px] uppercase">
                Fecha de Emisión:
              </span>
              <span className="font-bold text-slate-900">{currentDate}</span>
            </div>
          </div>

          {/* Students Grades Table */}
          <table className="w-full text-left border-collapse border border-slate-300 text-xs mb-8">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300 text-[11px]">
                <th className="py-2 px-2 border border-slate-300 text-center w-8">N°</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-28">Cédula</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-24">Matrícula</th>
                <th className="py-2 px-3 border border-slate-300">Apellidos y Nombres</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-14">Asist. %</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-16">Nota (0-20)</th>
                <th className="py-2 px-2 border border-slate-300 text-center w-32">
                  Calificación en Letras
                </th>
                <th className="py-2 px-2 border border-slate-300 text-center w-24">Condición</th>
              </tr>
            </thead>
            <tbody>
              {sectionStudents.map((item, idx) => {
                const s = item.student;
                const isPassed = item.isAprobado;

                return (
                  <tr key={s.id} className="border-b border-slate-200 text-slate-800">
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {s.cedula}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono text-[11px]">
                      {s.matricula}
                    </td>
                    <td className="py-1.5 px-3 border border-slate-300 font-bold uppercase">
                      {s.apellido}, {s.nombre}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono">
                      {item.asistenciaPorcentaje}%
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-mono font-bold text-sm">
                      {item.notaDefinitiva}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center text-[10px] font-bold">
                      {numberToWordsES(item.notaDefinitiva)}
                    </td>
                    <td className="py-1.5 px-2 border border-slate-300 text-center font-bold text-[10px] uppercase">
                      <span className={isPassed ? 'text-emerald-700' : 'text-rose-700'}>
                        {isPassed ? 'APROBADO' : 'REPROBADO'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Signatures & Seal Section */}
          <div className="grid grid-cols-3 gap-8 pt-8 mt-6 border-t border-slate-300 text-center text-xs">
            <div>
              <div className="h-16 flex items-end justify-center">
                <span className="font-serif italic text-slate-500 text-sm">
                  {professor.name}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-1 font-bold text-slate-900">
                {professor.title} {professor.name}
              </div>
              <div className="text-[10px] text-slate-600">Profesor Titular de la Cátedra</div>
            </div>

            <div>
              <div className="h-16 flex items-end justify-center">
                <span className="font-serif italic text-slate-400 text-sm">[Firma & Sello]</span>
              </div>
              <div className="border-t border-slate-800 pt-1 font-bold text-slate-900">
                Jefatura de Departamento
              </div>
              <div className="text-[10px] text-slate-600">{professor.departamento}</div>
            </div>

            <div>
              <div className="h-16 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[9px] text-slate-400 uppercase font-bold text-center p-1">
                  Sello Control de Estudios
                </div>
              </div>
              <div className="border-t border-slate-800 pt-1 font-bold text-slate-900">
                Dirección de Control de Estudios
              </div>
              <div className="text-[10px] text-slate-600">Registro Académico Oficial</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
