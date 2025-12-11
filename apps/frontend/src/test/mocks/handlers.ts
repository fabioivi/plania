import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as any

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    }

    return HttpResponse.json(
      { message: 'Credenciais inválidas' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any

    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        email: body.email,
        name: body.name,
      },
    })
  }),

  // Academic endpoints
  http.get(`${API_BASE_URL}/academic/diaries`, () => {
    return HttpResponse.json([
      {
        id: '1',
        codigo: 'DISC001',
        disciplina: 'Programação Web',
        turma: 'INFO-2023',
        curso: 'Técnico em Informática',
        ano: 2023,
        semestre: 2,
        cargaHoraria: 80,
      },
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
    ])
  }),

  http.get(`${API_BASE_URL}/academic/diaries/:id`, ({ params }) => {
    const { id } = params

    return HttpResponse.json({
      id,
      codigo: 'DISC001',
      disciplina: 'Programação Web',
      turma: 'INFO-2023',
      curso: 'Técnico em Informática',
      ano: 2023,
      semestre: 2,
      cargaHoraria: 80,
      contents: [
        {
          id: 'content-1',
          diaryId: id,
          date: '2023-08-15',
          timeRange: '13:00-15:00',
          type: 'Normal',
          hours: 2,
          description: 'Introdução ao HTML',
        },
        {
          id: 'content-2',
          diaryId: id,
          date: '2023-08-17',
          timeRange: '13:00-15:00',
          type: 'Normal',
          hours: 2,
          description: 'CSS Básico',
        },
      ],
    })
  }),

  // LLM Config endpoints
  http.get(`${API_BASE_URL}/auth/llm-configs`, () => {
    return HttpResponse.json([
      {
        id: '1',
        userId: '1',
        provider: 'gemini',
        apiKey: '***',
        isActive: true,
        modelName: 'gemini-pro',
      },
    ])
  }),

  http.post(`${API_BASE_URL}/auth/llm-configs`, async ({ request }) => {
    const body = await request.json() as any

    return HttpResponse.json({
      id: '2',
      userId: '1',
      provider: body.provider,
      apiKey: '***',
      isActive: true,
      modelName: body.modelName,
    }, { status: 201 })
  }),

  // AI endpoints
  http.post(`${API_BASE_URL}/ai/generate-teaching-plan`, async ({ request }) => {
    const body = await request.json() as any

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return HttpResponse.json({
      id: 'plan-1',
      diaryId: body.diaryId,
      objetivoGeral: 'Objetivo geral do plano de ensino',
      objetivosEspecificos: 'Objetivos específicos',
      metodologia: 'Metodologia de ensino',
      avaliacaoAprendizagem: [],
      recuperacaoAprrendizagem: 'Recuperação',
      propostaTrabalho: [],
    })
  }),
]
