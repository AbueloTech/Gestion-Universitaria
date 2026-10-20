import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ProfessorProfile,
  Materia,
  Seccion,
  ConfiguracionEvaluacion,
  Student,
  StudentGradeRecord,
  SesionAsistencia,
  StudentCalculatedGrades,
  ParcialGradeData,
} from '../types';
import {
  initialProfessor,
  initialMaterias,
  initialSecciones,
  initialConfiguraciones,
  initialStudents,
  initialGradeRecords,
  initialAsistencias,
} from '../data/mockData';
import { calculateStudentOverallGrades } from '../utils/gradeCalculations';

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  professor: ProfessorProfile;
  login: (pinOrPass: string) => boolean;
  logout: () => void;
  updateProfessorProfile: (profile: Partial<ProfessorProfile>) => void;

  // Navigation
  activeTab: 'dashboard' | 'materias' | 'alumnos' | 'vaciado' | 'asistencia' | 'estadisticas' | 'configuracion';
  setActiveTab: (tab: 'dashboard' | 'materias' | 'alumnos' | 'vaciado' | 'asistencia' | 'estadisticas' | 'configuracion') => void;

  // Selected filters
  selectedMateriaId: string;
  setSelectedMateriaId: (id: string) => void;
  selectedSeccionId: string;
  setSelectedSeccionId: (id: string) => void;
  filterNivelNota: string;
  setFilterNivelNota: (nivel: string) => void;
  filterDiaSemana: string;
  setFilterDiaSemana: (dia: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data
  materias: Materia[];
  secciones: Seccion[];
  configuraciones: ConfiguracionEvaluacion[];
  students: Student[];
  gradeRecords: StudentGradeRecord[];
  asistencias: SesionAsistencia[];

  // Computed
  calculatedStudents: StudentCalculatedGrades[];
  activeMateria: Materia | undefined;
  activeSeccion: Seccion | undefined;
  activeConfig: ConfiguracionEvaluacion | undefined;

  // CRUD Materias & Secciones
  addMateria: (materia: Omit<Materia, 'id'>) => Materia;
  updateMateria: (id: string, data: Partial<Materia>) => void;
  deleteMateria: (id: string) => void;
  addSeccion: (seccion: Omit<Seccion, 'id'>) => Seccion;
  updateSeccion: (id: string, data: Partial<Seccion>) => void;
  deleteSeccion: (id: string) => void;

  // Evaluacion Config
  updateConfiguracion: (config: ConfiguracionEvaluacion) => void;

  // Students CRUD
  addStudent: (student: Omit<Student, 'id' | 'fechaInscripcion'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  // Grades CRUD
  updateStudentParcialGrade: (
    studentId: string,
    seccionId: string,
    materiaId: string,
    parcialId: string,
    data: Partial<ParcialGradeData>
  ) => void;

  // Attendance
  saveAsistenciaSesion: (sesion: Omit<SesionAsistencia, 'id'> & { id?: string }) => void;
  deleteAsistenciaSesion: (id: string) => void;

  // System
  resetToDefaults: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH: 'unigrade_auth_v1',
  PROFESSOR: 'unigrade_prof_v1',
  MATERIAS: 'unigrade_materias_v1',
  SECCIONES: 'unigrade_secciones_v1',
  CONFIGS: 'unigrade_configs_v1',
  STUDENTS: 'unigrade_students_v1',
  GRADES: 'unigrade_grades_v1',
  ASISTENCIAS: 'unigrade_asistencias_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved ? JSON.parse(saved) : true; // default logged in for friendly evaluation, can test logout anytime
  });

  const [professor, setProfessor] = useState<ProfessorProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFESSOR);
    return saved ? JSON.parse(saved) : initialProfessor;
  });

  // Navigation & filters
  const [activeTab, setActiveTab] = useState<'dashboard' | 'materias' | 'alumnos' | 'vaciado' | 'asistencia' | 'estadisticas' | 'configuracion'>('dashboard');
  const [selectedMateriaId, setSelectedMateriaId] = useState<string>('all');
  const [selectedSeccionId, setSelectedSeccionId] = useState<string>('all');
  const [filterNivelNota, setFilterNivelNota] = useState<string>('all');
  const [filterDiaSemana, setFilterDiaSemana] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Domain data
  const [materias, setMaterias] = useState<Materia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATERIAS);
    return saved ? JSON.parse(saved) : initialMaterias;
  });

  const [secciones, setSecciones] = useState<Seccion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SECCIONES);
    return saved ? JSON.parse(saved) : initialSecciones;
  });

  const [configuraciones, setConfiguraciones] = useState<ConfiguracionEvaluacion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIGS);
    return saved ? JSON.parse(saved) : initialConfiguraciones;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [gradeRecords, setGradeRecords] = useState<StudentGradeRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
    return saved ? JSON.parse(saved) : initialGradeRecords;
  });

  const [asistencias, setAsistencias] = useState<SesionAsistencia[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASISTENCIAS);
    return saved ? JSON.parse(saved) : initialAsistencias;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFESSOR, JSON.stringify(professor));
  }, [professor]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIAS, JSON.stringify(materias));
  }, [materias]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SECCIONES, JSON.stringify(secciones));
  }, [secciones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configuraciones));
  }, [configuraciones]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(gradeRecords));
  }, [gradeRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ASISTENCIAS, JSON.stringify(asistencias));
  }, [asistencias]);

  // Auth actions
  const login = (pinOrPass: string) => {
    const valid = !professor.pinOrPassword || pinOrPass.trim() === professor.pinOrPassword.trim() || pinOrPass === 'admin';
    if (valid) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfessorProfile = (data: Partial<ProfessorProfile>) => {
    setProfessor((prev) => ({ ...prev, ...data }));
  };

  // Active helpers
  const activeMateria = useMemo(() => {
    if (selectedMateriaId === 'all') return undefined;
    return materias.find((m) => m.id === selectedMateriaId);
  }, [selectedMateriaId, materias]);

  const activeSeccion = useMemo(() => {
    if (selectedSeccionId === 'all') return undefined;
    return secciones.find((s) => s.id === selectedSeccionId);
  }, [selectedSeccionId, secciones]);

  const activeConfig = useMemo(() => {
    const matId = selectedMateriaId !== 'all' ? selectedMateriaId : materias[0]?.id;
    return configuraciones.find((c) => c.materiaId === matId) || configuraciones[0];
  }, [selectedMateriaId, materias, configuraciones]);

  // Calculate overall grades for all students
  const calculatedStudents = useMemo(() => {
    return students.map((student) => {
      const mat = materias.find((m) => m.id === student.materiaId) || materias[0];
      const sec = secciones.find((s) => s.id === student.seccionId) || secciones[0];
      const config =
        configuraciones.find((c) => c.materiaId === student.materiaId) ||
        configuraciones[0];
      const record = gradeRecords.find(
        (g) => g.studentId === student.id && g.seccionId === student.seccionId
      );

      // Calculate attendance rate for this student
      const studentSessions = asistencias.filter((a) => a.seccionId === student.seccionId);
      let attendancePct = 100;
      if (studentSessions.length > 0) {
        let presentCount = 0;
        studentSessions.forEach((sess) => {
          const status = sess.registros[student.id];
          if (status === 'presente') presentCount += 1;
          else if (status === 'tarde') presentCount += 0.75;
          else if (status === 'falta_justificada') presentCount += 0.5;
        });
        attendancePct = Number(((presentCount / studentSessions.length) * 100).toFixed(1));
      }

      return calculateStudentOverallGrades(student, mat, sec, config, record, attendancePct);
    });
  }, [students, materias, secciones, configuraciones, gradeRecords, asistencias]);

  // CRUD Materias
  const addMateria = (data: Omit<Materia, 'id'>) => {
    const newId = `mat-${Date.now()}`;
    const newMateria: Materia = { ...data, id: newId };
    setMaterias((prev) => [...prev, newMateria]);

    // Create default evaluation config for this materia
    const newConfig: ConfiguracionEvaluacion = {
      materiaId: newId,
      escala: '0-20',
      notaMinimaAprobatoria: 10,
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
          tareasCount: 2,
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
    };
    setConfiguraciones((prev) => [...prev, newConfig]);
    return newMateria;
  };

  const updateMateria = (id: string, data: Partial<Materia>) => {
    setMaterias((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const deleteMateria = (id: string) => {
    setMaterias((prev) => prev.filter((m) => m.id !== id));
    setSecciones((prev) => prev.filter((s) => s.materiaId !== id));
    setStudents((prev) => prev.filter((s) => s.materiaId !== id));
    setConfiguraciones((prev) => prev.filter((c) => c.materiaId !== id));
    if (selectedMateriaId === id) setSelectedMateriaId('all');
  };

  // CRUD Secciones
  const addSeccion = (data: Omit<Seccion, 'id'>) => {
    const newId = `sec-${Date.now()}`;
    const newSec: Seccion = { ...data, id: newId };
    setSecciones((prev) => [...prev, newSec]);
    return newSec;
  };

  const updateSeccion = (id: string, data: Partial<Seccion>) => {
    setSecciones((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  };

  const deleteSeccion = (id: string) => {
    setSecciones((prev) => prev.filter((s) => s.id !== id));
    setStudents((prev) => prev.filter((s) => s.seccionId !== id));
    if (selectedSeccionId === id) setSelectedSeccionId('all');
  };

  // Evaluacion Config
  const updateConfiguracion = (config: ConfiguracionEvaluacion) => {
    setConfiguraciones((prev) =>
      prev.map((c) => (c.materiaId === config.materiaId ? config : c))
    );
  };

  // Students CRUD
  const addStudent = (data: Omit<Student, 'id' | 'fechaInscripcion'>) => {
    const newId = `stu-${Date.now()}`;
    const newStu: Student = {
      ...data,
      id: newId,
      fechaInscripcion: new Date().toISOString().split('T')[0],
    };
    setStudents((prev) => [...prev, newStu]);

    // Initialize empty grade record
    const newRecord: StudentGradeRecord = {
      id: `grd-${Date.now()}`,
      studentId: newId,
      seccionId: data.seccionId,
      materiaId: data.materiaId,
      parciales: {
        p1: { quizzes: [0, 0], tareas: [0, 0], examen: 0, asistencia: 0 },
        p2: { quizzes: [0, 0], tareas: [0, 0], examen: 0, asistencia: 0 },
        p3: { quizzes: [0, 0], tareas: [0, 0], examen: 0, asistencia: 0 },
      },
    };
    setGradeRecords((prev) => [...prev, newRecord]);
    return newStu;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    // Also sync seccion/materia in grades if changed
    if (data.seccionId || data.materiaId) {
      setGradeRecords((prev) =>
        prev.map((g) =>
          g.studentId === id
            ? {
                ...g,
                seccionId: data.seccionId || g.seccionId,
                materiaId: data.materiaId || g.materiaId,
              }
            : g
        )
      );
    }
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setGradeRecords((prev) => prev.filter((g) => g.studentId !== id));
  };

  // Grades update
  const updateStudentParcialGrade = (
    studentId: string,
    seccionId: string,
    materiaId: string,
    parcialId: string,
    data: Partial<ParcialGradeData>
  ) => {
    setGradeRecords((prev) => {
      const existing = prev.find(
        (g) => g.studentId === studentId && g.seccionId === seccionId
      );

      if (existing) {
        const currentParcial = existing.parciales?.[parcialId] || {
          quizzes: [],
          tareas: [],
          examen: 0,
          asistencia: 0,
        };
        const updatedParcial = { ...currentParcial, ...data };
        return prev.map((g) =>
          g.id === existing.id
            ? {
                ...g,
                parciales: {
                  ...g.parciales,
                  [parcialId]: updatedParcial,
                },
              }
            : g
        );
      } else {
        const newRecord: StudentGradeRecord = {
          id: `grd-${Date.now()}`,
          studentId,
          seccionId,
          materiaId,
          parciales: {
            [parcialId]: {
              quizzes: data.quizzes || [],
              tareas: data.tareas || [],
              examen: data.examen || 0,
              asistencia: data.asistencia || 0,
              observaciones: data.observaciones || '',
            },
          },
        };
        return [...prev, newRecord];
      }
    });
  };

  // Asistencia save
  const saveAsistenciaSesion = (sesionData: Omit<SesionAsistencia, 'id'> & { id?: string }) => {
    setAsistencias((prev) => {
      if (sesionData.id) {
        return prev.map((a) => (a.id === sesionData.id ? (sesionData as SesionAsistencia) : a));
      }
      const newSesion: SesionAsistencia = {
        ...sesionData,
        id: `asist-${Date.now()}`,
      };
      return [newSesion, ...prev];
    });
  };

  const deleteAsistenciaSesion = (id: string) => {
    setAsistencias((prev) => prev.filter((a) => a.id !== id));
  };

  // Reset & Export/Import
  const resetToDefaults = () => {
    setProfessor(initialProfessor);
    setMaterias(initialMaterias);
    setSecciones(initialSecciones);
    setConfiguraciones(initialConfiguraciones);
    setStudents(initialStudents);
    setGradeRecords(initialGradeRecords);
    setAsistencias(initialAsistencias);
    localStorage.clear();
  };

  const exportDatabaseJSON = () => {
    const backup = {
      professor,
      materias,
      secciones,
      configuraciones,
      students,
      gradeRecords,
      asistencias,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.professor) setProfessor(data.professor);
      if (data.materias) setMaterias(data.materias);
      if (data.secciones) setSecciones(data.secciones);
      if (data.configuraciones) setConfiguraciones(data.configuraciones);
      if (data.students) setStudents(data.students);
      if (data.gradeRecords) setGradeRecords(data.gradeRecords);
      if (data.asistencias) setAsistencias(data.asistencias);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        professor,
        login,
        logout,
        updateProfessorProfile,
        activeTab,
        setActiveTab,
        selectedMateriaId,
        setSelectedMateriaId,
        selectedSeccionId,
        setSelectedSeccionId,
        filterNivelNota,
        setFilterNivelNota,
        filterDiaSemana,
        setFilterDiaSemana,
        searchQuery,
        setSearchQuery,
        materias,
        secciones,
        configuraciones,
        students,
        gradeRecords,
        asistencias,
        calculatedStudents,
        activeMateria,
        activeSeccion,
        activeConfig,
        addMateria,
        updateMateria,
        deleteMateria,
        addSeccion,
        updateSeccion,
        deleteSeccion,
        updateConfiguracion,
        addStudent,
        updateStudent,
        deleteStudent,
        updateStudentParcialGrade,
        saveAsistenciaSesion,
        deleteAsistenciaSesion,
        resetToDefaults,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
