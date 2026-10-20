import {
  Materia,
  Seccion,
  ConfiguracionEvaluacion,
  ParcialConfig,
  StudentCalculatedGrades,
  StudentGradeRecord,
  ProfessorProfile,
} from '../types';

interface CreateSpreadsheetParams {
  accessToken: string;
  materia: Materia;
  seccion: Seccion;
  config: ConfiguracionEvaluacion;
  sectionStudents: StudentCalculatedGrades[];
  gradeRecords: StudentGradeRecord[];
  professor: ProfessorProfile;
  selectedParcialId: string;
  currentParcialConfig?: ParcialConfig;
}

export interface GoogleSheetsResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function createAndExportToGoogleSheets({
  accessToken,
  materia,
  seccion,
  config,
  sectionStudents,
  gradeRecords,
  professor,
  selectedParcialId,
  currentParcialConfig,
}: CreateSpreadsheetParams): Promise<GoogleSheetsResult> {
  const title = `UniGrade - ${materia.codigo} ${seccion.codigoSeccion} (${seccion.periodo})`;

  // 1. Prepare sheets configuration
  const sheetTitles: string[] = [];
  config.parciales.forEach((p, idx) => {
    sheetTitles.push(`Parcial ${idx + 1}`);
  });
  sheetTitles.push('Resumen Semestral');

  const sheetsPayload = sheetTitles.map((st, idx) => ({
    properties: {
      sheetId: idx,
      title: st,
      gridProperties: {
        rowCount: sectionStudents.length + 15,
        columnCount: 20,
        frozenRowCount: 4,
      },
    },
  }));

  // 2. Create Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsPayload,
    }),
  });

  if (!createRes.ok) {
    const errorJson = await createRes.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Error HTTP ${createRes.status} al crear hoja en Google Sheets`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 3. Prepare values for each sheet
  const dataUpdates: Array<{ range: string; values: any[][] }> = [];

  // Populate each Parcial tab
  config.parciales.forEach((parcial, pIdx) => {
    const sheetName = `Parcial ${pIdx + 1}`;
    const rows: any[][] = [];

    // Header metadata block
    rows.push([`${professor.universidad.toUpperCase()} - ${professor.facultad}`]);
    rows.push([`Asignatura: ${materia.codigo} - ${materia.nombre}`, `Sección: ${seccion.codigoSeccion} (${seccion.aulaPrincipal})`, `Profesor: ${professor.title} ${professor.name}`, `Periodo: ${seccion.periodo}`]);
    rows.push([`Ponderación: ${parcial.nombre}`, `Peso Semestral: ${parcial.pesoParcial}%`, `Escala: ${config.escala}`, `Nota Mínima: ${config.notaMinimaAprobatoria}`]);

    // Table Header
    const tableHeader = ['N°', 'Cédula', 'Matrícula', 'Apellidos y Nombres'];
    for (let q = 0; q < parcial.quizzesCount; q++) tableHeader.push(`Quiz ${q + 1}`);
    tableHeader.push(`Prom. Quizzes (${parcial.quizzesWeight}%)`);
    for (let t = 0; t < parcial.tareasCount; t++) tableHeader.push(`Tarea ${t + 1}`);
    tableHeader.push(`Prom. Tareas (${parcial.tareasWeight}%)`);
    tableHeader.push(`Examen (${parcial.examenWeight}%)`);
    tableHeader.push(`Asistencia (${parcial.asistenciaWeight}%)`);
    tableHeader.push('Subtotal /20');
    tableHeader.push(`Aporte (${parcial.pesoParcial}%)`);
    tableHeader.push('Estado');

    rows.push(tableHeader);

    // Student rows
    sectionStudents.forEach((item, sIdx) => {
      const s = item.student;
      const rec = gradeRecords.find((g) => g.studentId === s.id && g.seccionId === seccion.id);
      const pData = rec?.parciales?.[parcial.id];
      const pSub = item.parcialSubtotals[parcial.id] || {
        quizzesAvg: 0,
        tareasAvg: 0,
        examen: 0,
        asistenciaNota: 0,
        subtotalSobreEscala: 0,
        subtotalPonderado: 0,
      };

      const sRow: any[] = [
        sIdx + 1,
        s.cedula,
        s.matricula,
        `${s.apellido}, ${s.nombre}`,
      ];

      for (let q = 0; q < parcial.quizzesCount; q++) {
        sRow.push(pData?.quizzes?.[q] ?? 0);
      }
      sRow.push(pSub.quizzesAvg);

      for (let t = 0; t < parcial.tareasCount; t++) {
        sRow.push(pData?.tareas?.[t] ?? 0);
      }
      sRow.push(pSub.tareasAvg);

      sRow.push(pData?.examen ?? 0);
      sRow.push(pData?.asistencia ?? 20);
      sRow.push(pSub.subtotalSobreEscala);
      sRow.push(pSub.subtotalPonderado);
      sRow.push(item.nivel.toUpperCase());

      rows.push(sRow);
    });

    dataUpdates.push({
      range: `'${sheetName}'!A1`,
      values: rows,
    });
  });

  // Populate Resumen Semestral tab
  {
    const sheetName = 'Resumen Semestral';
    const rows: any[][] = [];

    rows.push([`${professor.universidad.toUpperCase()} - RESUMEN CONSOLIDADO`]);
    rows.push([`Asignatura: ${materia.codigo} - ${materia.nombre}`, `Sección: ${seccion.codigoSeccion}`, `Profesor: ${professor.title} ${professor.name}`, `Periodo: ${seccion.periodo}`]);
    rows.push(['RESUMEN DE CALIFICACIONES DEFINITIVAS']);

    const header = ['N°', 'Cédula', 'Matrícula', 'Estudiante'];
    config.parciales.forEach((p, idx) => {
      header.push(`Parcial ${idx + 1} (${p.pesoParcial}%)`);
      header.push(`Aporte P${idx + 1}`);
    });
    header.push('Asistencia Global %');
    header.push('Nota Definitiva /20');
    header.push('Condición Final');
    header.push('Nivel Académico');

    rows.push(header);

    sectionStudents.forEach((item, sIdx) => {
      const s = item.student;
      const sRow: any[] = [
        sIdx + 1,
        s.cedula,
        s.matricula,
        `${s.apellido}, ${s.nombre}`,
      ];

      config.parciales.forEach((p) => {
        const sub = item.parcialSubtotals[p.id];
        sRow.push(sub?.subtotalSobreEscala ?? 0);
        sRow.push(sub?.subtotalPonderado ?? 0);
      });

      sRow.push(`${item.asistenciaPorcentaje}%`);
      sRow.push(item.notaDefinitiva);
      sRow.push(item.isAprobado ? 'APROBADO' : 'REPROBADO');
      sRow.push(item.nivel.toUpperCase());

      rows.push(sRow);
    });

    dataUpdates.push({
      range: `'${sheetName}'!A1`,
      values: rows,
    });
  }

  // 4. Batch update values in Google Sheets
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataUpdates,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorJson = await updateRes.json().catch(() => ({}));
    console.warn('Advertencia al poblar datos iniciales:', errorJson);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

// Update existing Google Sheet with confirmation
export async function syncToExistingGoogleSheet({
  accessToken,
  spreadsheetId,
  sheetName,
  materia,
  seccion,
  config,
  sectionStudents,
  gradeRecords,
  professor,
}: {
  accessToken: string;
  spreadsheetId: string;
  sheetName: string;
  materia: Materia;
  seccion: Seccion;
  config: ConfiguracionEvaluacion;
  sectionStudents: StudentCalculatedGrades[];
  gradeRecords: StudentGradeRecord[];
  professor: ProfessorProfile;
}): Promise<void> {
  const rows: any[][] = [];

  rows.push([`UniGrade Sincronización - ${materia.codigo} ${seccion.codigoSeccion} (${new Date().toLocaleString()})`]);
  rows.push(['N°', 'Cédula', 'Matrícula', 'Estudiante', 'Asistencia %', 'Nota Definitiva /20', 'Condición', 'Nivel']);

  sectionStudents.forEach((item, idx) => {
    const s = item.student;
    rows.push([
      idx + 1,
      s.cedula,
      s.matricula,
      `${s.apellido}, ${s.nombre}`,
      `${item.asistenciaPorcentaje}%`,
      item.notaDefinitiva,
      item.isAprobado ? 'APROBADO' : 'REPROBADO',
      item.nivel.toUpperCase(),
    ]);
  });

  const range = `'${sheetName}'!A1`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'Error al actualizar la hoja de Google Sheets');
  }
}
