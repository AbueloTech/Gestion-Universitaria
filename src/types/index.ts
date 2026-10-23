export type GradingScale = '0-20' | '0-100' | '0-10';

export interface ProfessorProfile {
  id: string;
  name: string;
  title: string; // e.g. "Dr.", "Prof.", "Ing."
  email: string;
  universidad: string;
  facultad: string;
  departamento: string;
  avatarUrl: string;
  pinOrPassword?: string;
  semestreActivo: string; // e.g. "2026-I"
}

export type DiaSemana = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface HorarioClase {
  id: string;
  dia: DiaSemana;
  horaInicio: string; // "08:00"
  horaFin: string; // "10:00"
  aula: string; // "Aula 302" o "Lab Informática 3"
}

export interface Seccion {
  id: string;
  materiaId: string;
  codigoSeccion: string; // "SEC-01", "SEC-02", "SEC-A"
  periodo: string; // "2026-I"
  aulaPrincipal: string;
  cupoMaximo: number;
  horarios: HorarioClase[];
}

export interface Materia {
  id: string;
  codigo: string; // "MAT-101", "INF-204"
  nombre: string; // "Cálculo Diferencial e Integral"
  creditos: number;
  departamento: string;
  color: string; // Tailwind color token or hex
}

export interface ParcialConfig {
  id: string;
  nombre: string; // "1er Parcial (30%)", "2do Parcial (35%)", etc.
  pesoParcial: number; // Porcentaje del semestre, ej: 30
  quizzesCount: number; // Número de Quizzes, ej: 2
  quizzesWeight: number; // Peso de quizzes dentro del parcial (%), ej: 20
  tareasCount: number; // Número de Tareas, ej: 3
  tareasWeight: number; // Peso de tareas dentro del parcial (%), ej: 20
  examenWeight: number; // Peso del examen parcial (%), ej: 50
  asistenciaWeight: number; // Peso de asistencia (%), ej: 10
}

export interface ConfiguracionEvaluacion {
  materiaId: string;
  escala: GradingScale; // '0-20' o '0-100'
  notaMinimaAprobatoria: number; // 10 para 0-20, o 60 para 0-100
  parciales: ParcialConfig[];
}

export interface Student {
  id: string;
  matricula: string; // "2023-0194"
  cedula: string; // "V-28.123.456"
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fotoUrl: string;
  seccionId: string;
  materiaId: string;
  status: 'regular' | 'condicional' | 'retirado';
  fechaInscripcion: string;
}

export interface ParcialGradeData {
  quizzes: number[];
  tareas: number[];
  examen: number;
  asistencia: number; // 0 a 100% de asistencia o nota directa
  observaciones?: string;
}

export interface StudentGradeRecord {
  id: string;
  studentId: string;
  seccionId: string;
  materiaId: string;
  parciales: {
    [parcialId: string]: ParcialGradeData;
  };
}

export type EstadoAsistencia = 'presente' | 'tarde' | 'falta_justificada' | 'falta_injustificada';

export interface SesionAsistencia {
  id: string;
  seccionId: string;
  materiaId: string;
  fecha: string; // YYYY-MM-DD
  temaClase: string;
  registros: {
    [studentId: string]: EstadoAsistencia;
  };
}

export type NivelNota = 'sobresaliente' | 'notable' | 'aprobado' | 'en_riesgo' | 'reprobado' | 'sin_evaluar';

export interface StudentCalculatedGrades {
  student: Student;
  materia: Materia;
  seccion: Seccion;
  parcialSubtotals: {
    [parcialId: string]: {
      quizzesAvg: number;
      tareasAvg: number;
      examen: number;
      asistenciaNota: number;
      subtotalSobreEscala: number; // Nota de este parcial (0-20)
      subtotalPonderado: number; // Contribución ponderada a la definitiva
    };
  };
  notaDefinitiva: number; // Nota final acumulada sobre la escala
  asistenciaPorcentaje: number; // % general de asistencia
  nivel: NivelNota;
  isAprobado: boolean;
}

export type TipoNotificacion = 'entrega_proxima' | 'cambio_horario' | 'alerta_academica';
export type PrioridadNotificacion = 'urgente' | 'alta' | 'media' | 'baja';

export interface AcademicNotification {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  descripcion: string;
  materiaId?: string;
  seccionId?: string;
  fechaEvento?: string; // e.g. "2026-10-24"
  horaEvento?: string; // e.g. "23:59" o "08:00"
  aulaAnterior?: string; // Para cambios de horario
  aulaNueva?: string; // Para cambios de horario
  horarioAnterior?: string;
  horarioNuevo?: string;
  prioridad: PrioridadNotificacion;
  leida: boolean;
  creadaEn: string;
  accion?: {
    label: string;
    tabTarget: 'dashboard' | 'materias' | 'alumnos' | 'vaciado' | 'asistencia' | 'estadisticas' | 'configuracion';
    materiaId?: string;
    seccionId?: string;
  };
}

