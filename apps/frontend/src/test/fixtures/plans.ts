export const mockTeachingPlan = {
  id: 'plan-1',
  diaryId: '1',
  ementa: 'Desenvolvimento de aplicações web modernas utilizando HTML, CSS e JavaScript',
  objetivoGeral: 'Capacitar o aluno no desenvolvimento de aplicações web responsivas e interativas',
  objetivosEspecificos: `
- Compreender a estrutura de documentos HTML
- Aplicar estilos com CSS
- Desenvolver interatividade com JavaScript
- Implementar design responsivo
  `.trim(),
  metodologia: 'Aulas práticas e teóricas com projetos hands-on',
  avaliacaoAprendizagem: [
    {
      tipo: 'Prova Prática',
      peso: 40,
      descricao: 'Desenvolvimento de um site completo',
    },
    {
      tipo: 'Projeto Final',
      peso: 60,
      descricao: 'Aplicação web interativa',
    },
  ],
  recuperacaoAprrendizagem: 'Atividades de reforço e projeto adicional',
  propostaTrabalho: [
    {
      semana: 1,
      dataInicio: '2023-08-15',
      dataFim: '2023-08-19',
      conteudo: 'Introdução ao HTML - Estrutura básica',
      horasTotais: 4,
    },
    {
      semana: 2,
      dataInicio: '2023-08-22',
      dataFim: '2023-08-26',
      conteudo: 'HTML Avançado - Formulários e Semântica',
      horasTotais: 4,
    },
  ],
  referencias: `
- MDN Web Docs: https://developer.mozilla.org
- W3Schools: https://www.w3schools.com
- Eloquent JavaScript: https://eloquentjavascript.net
  `.trim(),
  cargaHoraria: {
    teorica: 40,
    pratica: 40,
    total: 80,
  },
}

export const mockTeachingPlanHistory = {
  id: 'history-1',
  teachingPlanId: 'plan-1',
  version: 1,
  changes: 'Versão inicial do plano',
  content: JSON.stringify(mockTeachingPlan),
  createdAt: '2023-08-01T10:00:00Z',
}

export const mockGeneratedPlan = {
  objetivoGeral: 'Desenvolver competências em programação web',
  objetivosEspecificos: 'HTML, CSS, JavaScript, Design Responsivo',
  metodologia: 'Metodologia ativa com projetos práticos',
  avaliacaoAprendizagem: [
    {
      tipo: 'Avaliação Contínua',
      peso: 30,
      descricao: 'Participação e exercícios',
    },
    {
      tipo: 'Projeto Prático',
      peso: 70,
      descricao: 'Desenvolvimento de aplicação web',
    },
  ],
  recuperacaoAprrendizagem: 'Projeto de recuperação',
  propostaTrabalho: [
    {
      semana: 1,
      dataInicio: '2023-08-15',
      dataFim: '2023-08-19',
      conteudo: 'Fundamentos de HTML',
      horasTotais: 4,
    },
  ],
}
