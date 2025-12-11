export function buildTeachingPlanPrompt({ anoSemestre, curso, unidadeCurricular, professores, cargaHorariaTotal, aulasTeoricas, aulasPraticas, ementa, objetivoGeral, objetivosEspecificos, semanas, userObjectives, userMethodology, userNotes }) {
  let prompt = `Atue como um coordenador pedagógico universitário ou técnico experiente.
Crie um **Plano de Ensino** rigoroso e estruturado para a seguinte solicitação:

# Dados da Disciplina
Período Letivo: ${anoSemestre}
Curso: ${curso}
Unidade Curricular: ${unidadeCurricular}
Carga Horária Total: ${cargaHorariaTotal} horas
Número de Semanas: ${semanas.length}
Ementa: ${ementa}

# Calendário de Aulas (Distribuição Semanal)
O plano deve cobrir ${semanas.length} semanas de aulas, distribuindo o conteúdo da ementa de forma equilibrada.
`;

  semanas.forEach((week) => {
    prompt += `Semana ${week.weekNumber}: ${week.startDate} - ${week.endDate}\n`;
  });

  if (userMethodology) {
    prompt += `\n# Metodologia Preferida:\n${userMethodology}\n`;
  }

  if (userNotes) {
    prompt += `\n# Observações Adicionais:\n${userNotes}\n`;
  }

  prompt += `
# Instruções de Geração
Com base na EMENTA e no calendário de aulas fornecidos, você deve GERAR:

1. **Objetivos Educacionais**: Crie objetivo geral e objetivos específicos alinhados à ementa e às diretrizes do MEC
2. **Metodologia**: Sugira estratégias pedagógicas apropriadas para o conteúdo
3. **Proposta de Trabalho Semanal**: Distribua o conteúdo da ementa ao longo das ${semanas.length} semanas
4. **Avaliações**: Proponha avaliações formativas e somativas apropriadas
5. **Recuperação**: Descreva o processo de recuperação da aprendizagem

Elabore um plano de ensino completo e detalhado no formato JSON exato abaixo.

**IMPORTANTE**:
- Retorne APENAS JSON válido
- NÃO adicione texto, introduções, explicações ou markdown fora do JSON
- A saída deve começar com { e terminar com }

A estrutura JSON deve ser EXATAMENTE esta:
{
"objetivoGeral": "String refletindo a finalidade ampla da disciplina. GERE com base na ementa, em português brasileiro técnico.",
"objetivosEspecificos": ["Array de strings mensuráveis e alinhadas ao objetivo geral. GERE objetivos específicos baseados na ementa."],
"metodologia": "String descrevendo as estratégias pedagógicas apropriadas para esta disciplina, em português brasileiro técnico.",
"recuperacaoAprrendizagem": "Descreva o processo de recuperação da aprendizagem: quando ocorrerá, critérios, atividades e instrumentos utilizados.",
"propostaTrabalho": [
{
"semana": Número inteiro sequencial começando de 1,
"dataInicial": "dd/mm/yyyy (extraída do calendário fornecido)",
"dataFinal": "dd/mm/yyyy (extraída do calendário fornecido)",
"tema": "Tema resumido da semana",
"numAulas": Número estimado de aulas necessárias para o conteúdo da semana (calcule proporcionalmente: carga horária total / número de semanas),
"conteudo": "Conteúdo programático específico desta semana, extraído e organizado da ementa",
"tecnicasEnsino": ["Array de técnicas como 'Aula expositiva', 'Estudo de caso', 'Laboratório', 'Seminário'"],
"recursosEnsino": ["Array de recursos como 'Biblioteca', 'Laboratório', 'Projetor multimídia', 'Computadores'"]
}
],
"avaliacaoAprendizagem": [
{
"etapa": "Identificador da etapa (ex.: 'NP1', 'NP2', 'Avaliação Formativa 1')",
"avaliacao": "Nome ou tipo da avaliação (ex.: 'Prova escrita', 'Trabalho prático', 'Seminário')",
"instrumentos": "Instrumentos utilizados (ex.: 'Prova individual', 'Relatório técnico', 'Apresentação')",
"dataPrevista": "Data prevista no formato dd/MM/yyyy, distribuída ao longo do período",
"valorMaximo": Número representando o peso (ex.: 10, 30, 40)
}
]
}

DIRETRIZES PEDAGÓGICAS:
- Todo o plano deve ser redigido em português brasileiro culto e técnico
- Garanta alinhamento com as diretrizes curriculares do MEC para educação profissional/técnica
- Assegure progressão lógica do conteúdo, do mais simples ao mais complexo
- Integre teoria e prática de forma equilibrada
- Distribua o conteúdo da ementa de forma uniforme entre as ${semanas.length} semanas
- Calcule numAulas proporcionalmente: ${cargaHorariaTotal} horas total / ${semanas.length} semanas
`;

  return prompt;
}
