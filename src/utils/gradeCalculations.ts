import {
  ConfiguracionEvaluacion,
  Materia,
  NivelNota,
  ParcialGradeData,
  Seccion,
  Student,
  StudentCalculatedGrades,
  StudentGradeRecord,
} from '../types';

export function calculateParcialSubtotal(
  parcialGrade: ParcialGradeData | undefined,
  quizzesWeight: number,
  tareasWeight: number,
  examenWeight: number,
  asistenciaWeight: number,
  escala: '0-20' | '0-100' | '0-10' = '0-20'
): {
  quizzesAvg: number;
  tareasAvg: number;
  examen: number;
  asistenciaNota: number;
  subtotalSobreEscala: number;
} {
  if (!parcialGrade) {
    return {
      quizzesAvg: 0,
      tareasAvg: 0,
      examen: 0,
      asistenciaNota: 0,
      subtotalSobreEscala: 0,
    };
  }

  // Quizzes average
  const validQuizzes = parcialGrade.quizzes || [];
  const quizzesAvg =
    validQuizzes.length > 0
      ? validQuizzes.reduce((acc, q) => acc + (Number(q) || 0), 0) / validQuizzes.length
      : 0;

  // Tareas average
  const validTareas = parcialGrade.tareas || [];
  const tareasAvg =
    validTareas.length > 0
      ? validTareas.reduce((acc, t) => acc + (Number(t) || 0), 0) / validTareas.length
      : 0;

  const examen = Number(parcialGrade.examen) || 0;
  const asistenciaNota = Number(parcialGrade.asistencia) || 0;

  // Calculate weighted subtotal for the parcial on the scale (e.g. out of 20 or 100)
  // Ensure weights sum is respected
  const totalWeight = (quizzesWeight + tareasWeight + examenWeight + asistenciaWeight) || 100;
  const subtotal =
    (quizzesAvg * quizzesWeight +
      tareasAvg * tareasWeight +
      examen * examenWeight +
      asistenciaNota * asistenciaWeight) /
    totalWeight;

  return {
    quizzesAvg: Number(quizzesAvg.toFixed(2)),
    tareasAvg: Number(tareasAvg.toFixed(2)),
    examen: Number(examen.toFixed(2)),
    asistenciaNota: Number(asistenciaNota.toFixed(2)),
    subtotalSobreEscala: Number(subtotal.toFixed(2)),
  };
}

export function determineNivelNota(nota: number, escala: '0-20' | '0-100' | '0-10' = '0-20'): NivelNota {
  if (nota <= 0) return 'sin_evaluar';

  if (escala === '0-20') {
    if (nota >= 18) return 'sobresaliente';
    if (nota >= 15) return 'notable';
    if (nota >= 10) return 'aprobado';
    if (nota >= 7) return 'en_riesgo';
    return 'reprobado';
  } else if (escala === '0-10') {
    if (nota >= 9) return 'sobresaliente';
    if (nota >= 7.5) return 'notable';
    if (nota >= 5) return 'aprobado';
    if (nota >= 3.5) return 'en_riesgo';
    return 'reprobado';
  } else {
    // 0-100
    if (nota >= 90) return 'sobresaliente';
    if (nota >= 75) return 'notable';
    if (nota >= 60) return 'aprobado';
    if (nota >= 40) return 'en_riesgo';
    return 'reprobado';
  }
}

export function getNivelColor(nivel: NivelNota): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (nivel) {
    case 'sobresaliente':
      return {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'Sobresaliente',
      };
    case 'notable':
      return {
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        label: 'Notable',
      };
    case 'aprobado':
      return {
        bg: 'bg-teal-500/15',
        text: 'text-teal-400',
        border: 'border-teal-500/30',
        label: 'Aprobado',
      };
    case 'en_riesgo':
      return {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'En Riesgo',
      };
    case 'reprobado':
      return {
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        label: 'Reprobado',
      };
    default:
      return {
        bg: 'bg-slate-500/15',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        label: 'Sin Evaluar',
      };
  }
}

export function calculateStudentOverallGrades(
  student: Student,
  materia: Materia,
  seccion: Seccion,
  config: ConfiguracionEvaluacion,
  gradeRecord: StudentGradeRecord | undefined,
  asistenciaPorcentaje: number = 100
): StudentCalculatedGrades {
  const escala = config.escala || '0-20';
  const notaMinima = config.notaMinimaAprobatoria || (escala === '0-20' ? 10 : escala === '0-10' ? 5 : 60);

  const parcialSubtotals: StudentCalculatedGrades['parcialSubtotals'] = {};
  let totalPonderadoAcumulado = 0;
  let totalPesoEvaluado = 0;

  config.parciales.forEach((parcial) => {
    const pGrade = gradeRecord?.parciales?.[parcial.id];
    const calc = calculateParcialSubtotal(
      pGrade,
      parcial.quizzesWeight,
      parcial.tareasWeight,
      parcial.examenWeight,
      parcial.asistenciaWeight,
      escala
    );

    // Contribution to semester final grade: (subtotal * pesoParcial / 100)
    const subtotalPonderado = (calc.subtotalSobreEscala * parcial.pesoParcial) / 100;
    parcialSubtotals[parcial.id] = {
      ...calc,
      subtotalPonderado: Number(subtotalPonderado.toFixed(2)),
    };

    if (calc.subtotalSobreEscala > 0) {
      totalPonderadoAcumulado += subtotalPonderado;
      totalPesoEvaluado += parcial.pesoParcial;
    }
  });

  // Calculate final accumulated note
  // If semester is in progress, show current weighted or projected
  const notaDefinitiva = Number(totalPonderadoAcumulado.toFixed(2));
  const nivel = determineNivelNota(notaDefinitiva, escala);
  const isAprobado = notaDefinitiva >= notaMinima;

  return {
    student,
    materia,
    seccion,
    parcialSubtotals,
    notaDefinitiva,
    asistenciaPorcentaje,
    nivel,
    isAprobado,
  };
}

export interface SectionStatistics {
  totalEstudiantes: number;
  promedioGeneral: number;
  notaMaxima: number;
  notaMinima: number;
  aprobadosCount: number;
  reprobadosCount: number;
  enRiesgoCount: number;
  tasaAprobacion: number; // 0 to 100
  asistenciaPromedio: number;
  distribucionNiveles: {
    sobresaliente: number;
    notable: number;
    aprobado: number;
    en_riesgo: number;
    reprobado: number;
    sin_evaluar: number;
  };
}

export function calculateSectionStats(studentsCalc: StudentCalculatedGrades[]): SectionStatistics {
  const total = studentsCalc.length;
  if (total === 0) {
    return {
      totalEstudiantes: 0,
      promedioGeneral: 0,
      notaMaxima: 0,
      notaMinima: 0,
      aprobadosCount: 0,
      reprobadosCount: 0,
      enRiesgoCount: 0,
      tasaAprobacion: 0,
      asistenciaPromedio: 0,
      distribucionNiveles: {
        sobresaliente: 0,
        notable: 0,
        aprobado: 0,
        en_riesgo: 0,
        reprobado: 0,
        sin_evaluar: 0,
      },
    };
  }

  const notas = studentsCalc.map((s) => s.notaDefinitiva).filter((n) => n > 0);
  const sumNotas = notas.reduce((acc, n) => acc + n, 0);
  const promedioGeneral = notas.length > 0 ? Number((sumNotas / notas.length).toFixed(2)) : 0;
  const notaMaxima = notas.length > 0 ? Math.max(...notas) : 0;
  const notaMinima = notas.length > 0 ? Math.min(...notas) : 0;

  const aprobadosCount = studentsCalc.filter((s) => s.isAprobado).length;
  const reprobadosCount = studentsCalc.filter((s) => !s.isAprobado && s.nivel === 'reprobado').length;
  const enRiesgoCount = studentsCalc.filter((s) => s.nivel === 'en_riesgo').length;
  const tasaAprobacion = total > 0 ? Number(((aprobadosCount / total) * 100).toFixed(1)) : 0;

  const sumAsistencia = studentsCalc.reduce((acc, s) => acc + s.asistenciaPorcentaje, 0);
  const asistenciaPromedio = Number((sumAsistencia / total).toFixed(1));

  const distribucionNiveles = {
    sobresaliente: studentsCalc.filter((s) => s.nivel === 'sobresaliente').length,
    notable: studentsCalc.filter((s) => s.nivel === 'notable').length,
    aprobado: studentsCalc.filter((s) => s.nivel === 'aprobado').length,
    en_riesgo: enRiesgoCount,
    reprobado: reprobadosCount,
    sin_evaluar: studentsCalc.filter((s) => s.nivel === 'sin_evaluar').length,
  };

  return {
    totalEstudiantes: total,
    promedioGeneral,
    notaMaxima,
    notaMinima,
    aprobadosCount,
    reprobadosCount,
    enRiesgoCount,
    tasaAprobacion,
    asistenciaPromedio,
    distribucionNiveles,
  };
}
