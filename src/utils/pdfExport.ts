import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Materia,
  Seccion,
  ConfiguracionEvaluacion,
  ParcialConfig,
  StudentCalculatedGrades,
  StudentGradeRecord,
  ProfessorProfile,
} from '../types';

interface ExportPDFParams {
  materia: Materia;
  seccion: Seccion;
  config: ConfiguracionEvaluacion;
  selectedParcialId: string;
  currentParcialConfig?: ParcialConfig;
  sectionStudents: StudentCalculatedGrades[];
  gradeRecords: StudentGradeRecord[];
  professor: ProfessorProfile;
  sectionAverages?: {
    quizzesAvg: number;
    tareasAvg: number;
    examenAvg: number;
    subtotalAvg: number;
  };
}

export function exportGradeSheetPDF({
  materia,
  seccion,
  config,
  selectedParcialId,
  currentParcialConfig,
  sectionStudents,
  gradeRecords,
  professor,
  sectionAverages,
}: ExportPDFParams): string {
  // Use Landscape for complete tabular visibility
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isResumen = selectedParcialId === 'resumen';

  // Header background accent bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFillColor(99, 102, 241); // indigo-500 line
  doc.rect(0, 24, pageWidth, 1.5, 'F');

  // University Header Texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(professor.universidad.toUpperCase(), 14, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${professor.facultad}  •  ${professor.departamento}`, 14, 15);
  doc.text(`Docente: ${professor.title} ${professor.name}  •  Semestre: ${professor.semestreActivo}`, 14, 20);

  // Sheet Title on the right of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const sheetTitle = isResumen
    ? 'RESUMEN SEMESTRAL CONSOLIDADO'
    : `SÁBANA DE NOTAS - ${currentParcialConfig?.nombre.toUpperCase() || 'PARCIAL'}`;
  doc.text(sheetTitle, pageWidth - 14, 12, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254); // indigo-200
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, pageWidth - 14, 19, { align: 'right' });

  // Subject and Section Info Box below header
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 28, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Asignatura:`, 18, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(`${materia.codigo} - ${materia.nombre} (${materia.creditos} Créditos)`, 40, 34);

  doc.setFont('helvetica', 'bold');
  doc.text(`Sección:`, 18, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(`${seccion.codigoSeccion} (${seccion.aulaPrincipal})`, 33, 39);

  doc.setFont('helvetica', 'bold');
  doc.text(`Estudiantes:`, 140, 34);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sectionStudents.length} matriculados`, 162, 34);

  doc.setFont('helvetica', 'bold');
  doc.text(`Escala:`, 140, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.escala} (Nota Mínima Aprobatoria: ${config.notaMinimaAprobatoria})`, 154, 39);

  if (!isResumen && currentParcialConfig) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Ponderación:`, 215, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(`Peso Semestral: ${currentParcialConfig.pesoParcial}%`, 238, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Q: ${currentParcialConfig.quizzesWeight}% | T: ${currentParcialConfig.tareasWeight}% | Examen: ${currentParcialConfig.examenWeight}% | Asist: ${currentParcialConfig.asistenciaWeight}%`, 215, 39);
  }

  // Build Table Headers and Rows
  let tableHeaders: string[][] = [];
  let tableData: any[][] = [];

  if (!isResumen && currentParcialConfig) {
    // Specific Parcial Sheet Table
    const headers: string[] = ['N°', 'Cédula', 'Matrícula', 'Estudiante'];

    for (let q = 0; q < currentParcialConfig.quizzesCount; q++) {
      headers.push(`Q${q + 1}`);
    }
    headers.push('Prom. Q');

    for (let t = 0; t < currentParcialConfig.tareasCount; t++) {
      headers.push(`T${t + 1}`);
    }
    headers.push('Prom. T');
    headers.push('Examen');
    headers.push('Asist.');
    headers.push('Subtotal /20');
    headers.push('Aporte');
    headers.push('Estado');

    tableHeaders = [headers];

    sectionStudents.forEach((item, idx) => {
      const s = item.student;
      const record = gradeRecords.find(
        (g) => g.studentId === s.id && g.seccionId === seccion.id
      );
      const pData = record?.parciales?.[currentParcialConfig.id];
      const pSub = item.parcialSubtotals[currentParcialConfig.id] || {
        quizzesAvg: 0,
        tareasAvg: 0,
        examen: 0,
        asistenciaNota: 0,
        subtotalSobreEscala: 0,
        subtotalPonderado: 0,
      };

      const row: any[] = [
        idx + 1,
        s.cedula,
        s.matricula,
        `${s.apellido}, ${s.nombre}`,
      ];

      for (let q = 0; q < currentParcialConfig.quizzesCount; q++) {
        row.push(pData?.quizzes?.[q] ?? 0);
      }
      row.push(pSub.quizzesAvg);

      for (let t = 0; t < currentParcialConfig.tareasCount; t++) {
        row.push(pData?.tareas?.[t] ?? 0);
      }
      row.push(pSub.tareasAvg);

      row.push(pData?.examen ?? 0);
      row.push(pData?.asistencia ?? 20);
      row.push(pSub.subtotalSobreEscala.toFixed(1));
      row.push(`+${pSub.subtotalPonderado.toFixed(1)}`);
      row.push(item.nivel.toUpperCase());

      tableData.push(row);
    });

    // Add Section Averages Footer Row
    if (sectionAverages) {
      const avgRow: any[] = [
        '',
        'PROMEDIO',
        '',
        `Sección (${sectionStudents.length} alumnos)`,
      ];
      for (let q = 0; q < currentParcialConfig.quizzesCount; q++) avgRow.push('');
      avgRow.push(sectionAverages.quizzesAvg);
      for (let t = 0; t < currentParcialConfig.tareasCount; t++) avgRow.push('');
      avgRow.push(sectionAverages.tareasAvg);
      avgRow.push(sectionAverages.examenAvg);
      avgRow.push('20.0');
      avgRow.push(sectionAverages.subtotalAvg.toFixed(1));
      avgRow.push('');
      avgRow.push('');
      tableData.push(avgRow);
    }
  } else {
    // Consolidated Semester Summary Table
    const headers: string[] = ['N°', 'Cédula', 'Matrícula', 'Estudiante'];

    config.parciales.forEach((p, pIdx) => {
      headers.push(`P${pIdx + 1} (${p.pesoParcial}%)`);
      headers.push(`Aporte P${pIdx + 1}`);
    });

    headers.push('Asist. %');
    headers.push('Definitiva');
    headers.push('Condición');
    headers.push('Nivel');

    tableHeaders = [headers];

    sectionStudents.forEach((item, idx) => {
      const s = item.student;
      const row: any[] = [
        idx + 1,
        s.cedula,
        s.matricula,
        `${s.apellido}, ${s.nombre}`,
      ];

      config.parciales.forEach((p) => {
        const sub = item.parcialSubtotals[p.id];
        row.push(sub?.subtotalSobreEscala?.toFixed(1) ?? '0.0');
        row.push(`+${sub?.subtotalPonderado?.toFixed(1) ?? '0.0'}`);
      });

      row.push(`${item.asistenciaPorcentaje}%`);
      row.push(item.notaDefinitiva.toFixed(1));
      row.push(item.isAprobado ? 'APROBADO' : 'REPROBADO');
      row.push(item.nivel.toUpperCase());

      tableData.push(row);
    });
  }

  // Generate AutoTable
  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 45,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [30, 41, 59], // slate-800
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.1,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 }, // N°
      1: { halign: 'center', cellWidth: 22 }, // Cedula
      2: { halign: 'center', cellWidth: 20 }, // Matricula
      3: { halign: 'left' }, // Name
    },
    didParseCell: (data) => {
      // Style average row
      if (data.row.index === tableData.length - 1 && sectionAverages && !isResumen) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249]; // slate-100
        data.cell.styles.textColor = [79, 70, 229]; // indigo-600
      }

      // Check numeric grades: if grade < 10, highlight red text
      const rawVal = parseFloat(String(data.cell.raw));
      if (!isNaN(rawVal) && data.column.index > 3) {
        data.cell.styles.halign = 'center';
        if (rawVal < 10 && rawVal > 0) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = 'bold';
        } else if (rawVal >= 10) {
          data.cell.styles.textColor = [15, 118, 110]; // teal-700
        }
      }

      // Condition text highlight
      if (String(data.cell.raw) === 'REPROBADO') {
        data.cell.styles.textColor = [225, 29, 72];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      } else if (String(data.cell.raw) === 'APROBADO') {
        data.cell.styles.textColor = [16, 185, 129];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      }
    },
  });

  // Footer Signatures Box
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  const signatureY = Math.min(finalY + 12, pageHeight - 30);

  // If table went too close to bottom, add a new page or position cleanly
  if (signatureY < pageHeight - 20) {
    // Signature lines
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.3);

    // Left Signature: Professor
    doc.line(30, signatureY + 10, 100, signatureY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`${professor.title} ${professor.name}`, 65, signatureY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Profesor Titular de la Cátedra', 65, signatureY + 17, { align: 'center' });

    // Right Signature: Department Head
    doc.line(pageWidth - 100, signatureY + 10, pageWidth - 30, signatureY + 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('Jefatura de Departamento', pageWidth - 65, signatureY + 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(professor.departamento, pageWidth - 65, signatureY + 17, { align: 'center' });
  }

  // Footer page text
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `UniGrade Sistema Docente  •  Documento generado oficialmente  •  Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Output filename
  const cleanDate = new Date().toISOString().split('T')[0];
  const sheetTag = isResumen ? 'ResumenSemestral' : `Parcial_${selectedParcialId}`;
  const filename = `SabanaNotas_${materia.codigo}_${seccion.codigoSeccion}_${sheetTag}_${cleanDate}.pdf`;

  // Save PDF
  doc.save(filename);
  return filename;
}
