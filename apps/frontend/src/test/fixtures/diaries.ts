export const mockDiary = {
  id: '1',
  codigo: 'DISC001',
  disciplina: 'Programação Web',
  turma: 'INFO-2023',
  curso: 'Técnico em Informática',
  ano: 2023,
  semestre: 2,
  cargaHoraria: 80,
}

export const mockDiaries = [
  mockDiary,
  {
    id: '2',
    codigo: 'DISC002',
    disciplina: 'Banco de Dados',
    turma: 'INFO-2023',
    curso: 'Técnico em Informática',
    ano: 2023,
    semestre: 2,
    cargaHoraria: 60,
  },
  {
    id: '3',
    codigo: 'DISC003',
    disciplina: 'Redes de Computadores',
    turma: 'INFO-2023',
    curso: 'Técnico em Informática',
    ano: 2023,
    semestre: 2,
    cargaHoraria: 40,
  },
]

export const mockDiaryContent = {
  id: 'content-1',
  diaryId: '1',
  date: '2023-08-15',
  timeRange: '13:00-15:00',
  type: 'Normal' as const,
  hours: 2,
  description: 'Introdução ao HTML',
}

export const mockDiaryContents = [
  mockDiaryContent,
  {
    id: 'content-2',
    diaryId: '1',
    date: '2023-08-17',
    timeRange: '13:00-15:00',
    type: 'Normal' as const,
    hours: 2,
    description: 'CSS Básico',
  },
  {
    id: 'content-3',
    diaryId: '1',
    date: '2023-08-22',
    timeRange: '13:00-15:00',
    type: 'Normal' as const,
    hours: 2,
    description: 'JavaScript - Variáveis e Tipos',
  },
]

export const mockDiaryWithPlans = {
  ...mockDiary,
  contents: mockDiaryContents,
  teachingPlan: {
    id: 'plan-1',
    diaryId: '1',
    ementa: 'Desenvolvimento de aplicações web',
    objetivoGeral: 'Capacitar o aluno no desenvolvimento web',
    objetivosEspecificos: 'Aprender HTML, CSS e JavaScript',
    metodologia: 'Aulas práticas e teóricas',
    avaliacaoAprendizagem: [],
    recuperacaoAprrendizagem: 'Atividades de reforço',
    propostaTrabalho: [],
    referencias: 'MDN Web Docs',
  },
}
