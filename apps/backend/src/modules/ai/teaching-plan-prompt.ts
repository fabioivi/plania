export function buildTeachingPlanPrompt({ anoSemestre, curso, unidadeCurricular, professores, cargaHorariaTotal, aulasTeoricas, aulasPraticas, ementa, objetivoGeral, objetivosEspecificos, semanas, userObjectives, userMethodology, userNotes }) {
  let prompt = `Atue como um coordenador pedagógico universitário ou técnico experiente.
Crie um **Plano de Ensino** rigoroso e estruturado para a seguinte solicitação:

# Dados da Disciplina
Semestre: ${anoSemestre}
Curso: ${curso}
Unidade Curricular: ${unidadeCurricular}
Carga Horária Total: ${cargaHorariaTotal}
Ementa: ${ementa}

# Objetivos Educacionais
Objetivo Geral: ${objetivoGeral}
Objetivos Específicos: ${objetivosEspecificos.join('; ')}

# Calendário de Aulas
`;

  semanas.forEach((week) => {
    prompt += `Semana ${week.weekNumber} (${week.startDate} - ${week.endDate}): ${week.totalHours}h\n`;
    // week.classes.forEach((cls) => {
    //   prompt += `  - ${cls.date}: ${cls.timeRange}\n`;
    // });
  });

  if (userObjectives) {
    prompt += `\n# Objetivos Desejados pelo Professor:\n${userObjectives}\n`;
  }

  if (userMethodology) {
    prompt += `\n# Metodologia Preferida:\n${userMethodology}\n`;
  }

  if (userNotes) {
    prompt += `\n# Observações Adicionais:\n${userNotes}\n`;
  }

  prompt += `
Elabore um plano de ensino completo e detalhado no formato JSON exato abaixo. Não adicione nenhum texto fora do JSON. A saída deve ser apenas o objeto JSON válido, sem introduções, explicações ou formatação extra.
A estrutura deve ser exatamente esta:
{
"objetivoGeral": "String refletindo a finalidade ampla da disciplina, em português brasileiro técnico.",
"objetivosEspecificos": ["Array de strings mensuráveis e alinhadas ao objetivo geral, em português brasileiro técnico."],
"metodologia": "String descrevendo as estratégias pedagógicas, em português brasileiro técnico.",
"recuperacaoAprrendizagem": "Descreva o processo de recuperação da aprendizagem: quando ocorrerá, critérios, atividades e instrumentos utilizados para recuperação.",
"propostaTrabalho": [
{
"semana": Número inteiro sequencial começando de 1 (use números únicos e incrementais para cada entrada do calendário, mesmo se houver rótulos duplicados como 'Semana 1'),
"dataInicial": "dd/mm/yyyy (extraída do calendário)",
"dataFinal": "dd/mm/yyyy (extraída do calendário)",
"tema": "Tema resumido da semana, em português brasileiro técnico",
"numAulas": Número inteiro correspondente às horas do calendário (ex: 2 para 2h),
"conteudo": "Conteúdo programático específico, em português brasileiro técnico",
"tecnicasEnsino": ["Array de strings como 'Aula prática', 'Estudo de caso', 'Expositiva/dialogada', 'Pesquisa'"],
"recursosEnsino": ["Array de strings como 'Biblioteca', 'Laboratório', 'Projetor multimídia', 'Quadro branco/canetão'"]
}
],
"avaliacaoAprendizagem": [
{
"etapa": "Identificador da etapa (ex.: 'NP1', 'Avaliação Formativa 1').",
"avaliacao": "Nome ou tipo da avaliação (ex.: 'Prova escrita', 'Trabalho prático').",
"instrumentos": "Instrumentos utilizados (ex.: prova, relatório, apresentação).",
"dataPrevista": "Data prevista para realização da avaliação no formato dd/MM/yyyy, se aplicável.",
"valorMaximo": Número representando o valor máximo ou peso da avaliação (ex.: 10, 30).
}
]
}

INSTRUÇÕES PEDAGÓGICAS:
- Todo o plano deve ser redigido em português brasileiro culto e técnico.
- Garanta alinhamento com as diretrizes curriculares do MEC para educação profissional.
- Assegure progressão lógica do conteúdo e integração entre teoria e prática.
`;

  return prompt;
}
