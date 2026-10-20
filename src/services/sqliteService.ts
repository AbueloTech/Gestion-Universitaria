import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import {
  Materia,
  Seccion,
  ConfiguracionEvaluacion,
  Student,
  StudentGradeRecord,
  SesionAsistencia,
  ProfessorProfile,
  StudentCalculatedGrades,
} from '../types';

let dbInstance: Database | null = null;

// Initialize SQLite WASM instance
export async function getSQLiteDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });

  dbInstance = new SQL.Database();
  initializeSchema(dbInstance);
  return dbInstance;
}

// Initialize Relational SQLite Schema
export function initializeSchema(db: Database) {
  db.run(`
    -- Tabla de Docente
    CREATE TABLE IF NOT EXISTS profesor (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT,
      email TEXT,
      universidad TEXT,
      facultad TEXT,
      departamento TEXT,
      semestre_activo TEXT
    );

    -- Tabla de Asignaturas / Materias
    CREATE TABLE IF NOT EXISTS materias (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      creditos INTEGER DEFAULT 4,
      departamento TEXT,
      color TEXT
    );

    -- Tabla de Secciones
    CREATE TABLE IF NOT EXISTS secciones (
      id TEXT PRIMARY KEY,
      materia_id TEXT NOT NULL,
      codigo_seccion TEXT NOT NULL,
      periodo TEXT NOT NULL,
      aula_principal TEXT,
      cupo_maximo INTEGER DEFAULT 30,
      FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
    );

    -- Tabla de Horarios de Clase
    CREATE TABLE IF NOT EXISTS horarios (
      id TEXT PRIMARY KEY,
      seccion_id TEXT NOT NULL,
      dia TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      aula TEXT,
      FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE
    );

    -- Tabla de Alumnos
    CREATE TABLE IF NOT EXISTS alumnos (
      id TEXT PRIMARY KEY,
      cedula TEXT NOT NULL UNIQUE,
      matricula TEXT NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      foto_url TEXT,
      materia_id TEXT NOT NULL,
      seccion_id TEXT NOT NULL,
      status TEXT DEFAULT 'regular',
      fecha_inscripcion TEXT,
      FOREIGN KEY (materia_id) REFERENCES materias(id),
      FOREIGN KEY (seccion_id) REFERENCES secciones(id)
    );

    -- Tabla de Calificaciones y Cortes
    CREATE TABLE IF NOT EXISTS calificaciones (
      id TEXT PRIMARY KEY,
      alumno_id TEXT NOT NULL,
      seccion_id TEXT NOT NULL,
      materia_id TEXT NOT NULL,
      parcial_id TEXT NOT NULL,
      quizzes_json TEXT,
      tareas_json TEXT,
      examen REAL DEFAULT 0,
      asistencia REAL DEFAULT 20,
      subtotal_20 REAL DEFAULT 0,
      aporte_definitiva REAL DEFAULT 0,
      FOREIGN KEY (alumno_id) REFERENCES alumnos(id) ON DELETE CASCADE
    );

    -- Tabla de Asistencias Diarias
    CREATE TABLE IF NOT EXISTS asistencias (
      id TEXT PRIMARY KEY,
      seccion_id TEXT NOT NULL,
      materia_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tema_clase TEXT,
      registros_json TEXT,
      FOREIGN KEY (seccion_id) REFERENCES secciones(id)
    );
  `);
}

// Sync whole app state into the SQLite Database
export async function syncAppStateToSQLite({
  professor,
  materias,
  secciones,
  students,
  gradeRecords,
  asistencias,
  calculatedStudents,
}: {
  professor: ProfessorProfile;
  materias: Materia[];
  secciones: Seccion[];
  students: Student[];
  gradeRecords: StudentGradeRecord[];
  asistencias: SesionAsistencia[];
  calculatedStudents: StudentCalculatedGrades[];
}): Promise<Database> {
  const db = await getSQLiteDB();

  // Clear existing rows to perform clean sync
  db.run(`
    DELETE FROM profesor;
    DELETE FROM horarios;
    DELETE FROM calificaciones;
    DELETE FROM asistencias;
    DELETE FROM alumnos;
    DELETE FROM secciones;
    DELETE FROM materias;
  `);

  // Insert Profesor
  db.run(
    `INSERT INTO profesor (id, name, title, email, universidad, facultad, departamento, semestre_activo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      professor.id,
      professor.name,
      professor.title,
      professor.email,
      professor.universidad,
      professor.facultad,
      professor.departamento,
      professor.semestreActivo,
    ]
  );

  // Insert Materias
  materias.forEach((m) => {
    db.run(
      `INSERT INTO materias (id, codigo, nombre, creditos, departamento, color)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [m.id, m.codigo, m.nombre, m.creditos, m.departamento, m.color]
    );
  });

  // Insert Secciones & Horarios
  secciones.forEach((sec) => {
    db.run(
      `INSERT INTO secciones (id, materia_id, codigo_seccion, periodo, aula_principal, cupo_maximo)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [sec.id, sec.materiaId, sec.codigoSeccion, sec.periodo, sec.aulaPrincipal, sec.cupoMaximo]
    );

    sec.horarios?.forEach((h) => {
      db.run(
        `INSERT INTO horarios (id, seccion_id, dia, hora_inicio, hora_fin, aula)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [h.id, sec.id, h.dia, h.horaInicio, h.horaFin, h.aula || sec.aulaPrincipal]
      );
    });
  });

  // Insert Alumnos
  students.forEach((st) => {
    db.run(
      `INSERT INTO alumnos (id, cedula, matricula, nombre, apellido, email, telefono, foto_url, materia_id, seccion_id, status, fecha_inscripcion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        st.id,
        st.cedula,
        st.matricula,
        st.nombre,
        st.apellido,
        st.email,
        st.telefono,
        st.fotoUrl,
        st.materiaId,
        st.seccionId,
        st.status,
        st.fechaInscripcion,
      ]
    );
  });

  // Insert Calificaciones with computed subtotals
  gradeRecords.forEach((gr) => {
    const calc = calculatedStudents.find((c) => c.student.id === gr.studentId && c.seccion.id === gr.seccionId);

    Object.entries(gr.parciales || {}).forEach(([pId, pData]) => {
      const pSub = calc?.parcialSubtotals?.[pId];
      db.run(
        `INSERT INTO calificaciones (id, alumno_id, seccion_id, materia_id, parcial_id, quizzes_json, tareas_json, examen, asistencia, subtotal_20, aporte_definitiva)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          `${gr.id}_${pId}`,
          gr.studentId,
          gr.seccionId,
          gr.materiaId,
          pId,
          JSON.stringify(pData.quizzes || []),
          JSON.stringify(pData.tareas || []),
          pData.examen || 0,
          pData.asistencia || 0,
          pSub?.subtotalSobreEscala || 0,
          pSub?.subtotalPonderado || 0,
        ]
      );
    });
  });

  // Insert Asistencias
  asistencias.forEach((asist) => {
    db.run(
      `INSERT INTO asistencias (id, seccion_id, materia_id, fecha, tema_clase, registros_json)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        asist.id,
        asist.seccionId,
        asist.materiaId,
        asist.fecha,
        asist.temaClase,
        JSON.stringify(asist.registros || {}),
      ]
    );
  });

  return db;
}

// Export SQLite database as binary .db / .sqlite file
export async function downloadSQLiteFile(db: Database, filename: string = 'unigrade.sqlite'): Promise<void> {
  const binaryArray = db.export();
  const blob = new Blob([binaryArray.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Execute arbitrary SQL query (for interactive query console)
export async function executeSQLQuery(sqlText: string): Promise<QueryExecResult[]> {
  const db = await getSQLiteDB();
  return db.exec(sqlText);
}

// Get Database statistics (tables and row counts)
export async function getSQLiteStats(): Promise<Array<{ table: string; count: number }>> {
  const db = await getSQLiteDB();
  const tables = ['profesor', 'materias', 'secciones', 'horarios', 'alumnos', 'calificaciones', 'asistencias'];
  const stats: Array<{ table: string; count: number }> = [];

  for (const t of tables) {
    try {
      const res = db.exec(`SELECT COUNT(*) as cnt FROM ${t};`);
      const count = Number(res[0]?.values[0]?.[0]) || 0;
      stats.push({ table: t, count });
    } catch {
      stats.push({ table: t, count: 0 });
    }
  }

  return stats;
}
