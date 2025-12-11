# Plano de Refatoração: Geração de Planos de Ensino com IA

## 🎯 Objetivo
Refatorar a feature de geração de planos de ensino seguindo princípios de Clean Code, SOLID e boas práticas de arquitetura.

## 📋 Problemas Atuais

### 1. Bugs Críticos
- ❌ Carga horária concatenada com string " horas"
- ❌ Semestre gerando string inválida (ex: "2024.undefined")
- ❌ Horário semanal e carga horária duplicados no prompt
- ❌ JSON válido não garantido (depende do provider)
- ❌ Objetivos sendo enviados quando deveriam ser gerados
- ❌ Temperatura alta (0.7) para geração estruturada

### 2. Problemas Arquiteturais
- ❌ Service com 400+ linhas fazendo múltiplas responsabilidades
- ❌ Lógica de parsing JSON (100+ linhas) dentro do service
- ❌ Construção de prompt misturada com lógica de negócio
- ❌ Falta de DTOs/Value Objects claros
- ❌ Validações espalhadas pelo código
- ❌ Edge cases não tratados adequadamente

### 3. Edge Cases Não Tratados
- ⚠️ Diário sem ementa adequada
- ⚠️ Datas inválidas no diário
- ⚠️ TimeRange com formatos diferentes
- ⚠️ Provider sem suporte a schema
- ⚠️ Timeout indefinido na geração SSE
- ⚠️ Semanas sem totalHours correto
- ⚠️ Usuário sem LLM configurado

## 🏗️ Nova Arquitetura Proposta

```
apps/backend/src/modules/ai/
├── teaching-plan-generator/
│   ├── teaching-plan-generator.service.ts        # Orquestrador principal
│   ├── services/
│   │   ├── diary-data.service.ts                 # Carrega e valida dados do diário
│   │   ├── week-schedule.service.ts              # Agrupa aulas por semana
│   │   ├── prompt-builder.service.ts             # Constrói prompt de forma limpa
│   │   ├── llm-client.service.ts                 # Abstração LLM com JSON garantido
│   │   └── response-parser.service.ts            # Parse e validação de resposta
│   ├── domain/
│   │   ├── value-objects/
│   │   │   ├── workload.vo.ts                    # Carga horária (número, não string)
│   │   │   ├── academic-period.vo.ts             # Ano/Semestre
│   │   │   ├── time-range.vo.ts                  # Parse robusto de horários
│   │   │   └── week-schedule.vo.ts               # Semana com validações
│   │   ├── entities/
│   │   │   └── teaching-plan-draft.entity.ts     # Plano gerado (antes de salvar)
│   │   └── dto/
│   │       ├── generate-plan-request.dto.ts      # Input validado
│   │       ├── generation-context.dto.ts         # Contexto completo
│   │       └── generated-plan-response.dto.ts    # Output normalizado
│   ├── validators/
│   │   ├── diary-validator.ts                    # Valida diário tem dados suficientes
│   │   ├── json-schema-validator.ts              # Validação AJV isolada
│   │   └── teaching-plan-validator.ts            # Regras de negócio
│   └── utils/
│       ├── json-extractor.util.ts                # Extração robusta de JSON
│       └── date-parser.util.ts                   # Parse de datas brasileiro
└── teaching-plan-prompt.ts                        # Mantido, mas simplificado
```

## 🔧 Correções Imediatas

### 1. Corrigir Carga Horária
**Antes:**
```typescript
const cargaHorariaTotal = diary.cargaHoraria ||
  weekSchedule.reduce((sum, week) => sum + week.totalHours, 0) + ' horas';
```

**Depois:**
```typescript
const cargaHorariaTotal = diary.cargaHoraria ||
  weekSchedule.reduce((sum, week) => sum + week.totalHours, 0);
```

### 2. Remover Semestre do Prompt
**Antes:**
```typescript
const anoSemestre = `${diary.anoLetivo}.${diary.semestre}`;
Semestre: ${anoSemestre}
```

**Depois:**
```typescript
const periodo = diary.anoLetivo
  ? `${diary.anoLetivo}${diary.semestre ? `.${diary.semestre}` : ''}`
  : 'Não informado';
Período Letivo: ${periodo}
```

### 3. Remover Duplicação de Horários
**Antes:**
```typescript
Carga Horária Total: ${cargaHorariaTotal}
# Calendário de Aulas
Semana 1 (01/03 - 07/03): 4h
Semana 2 (08/03 - 14/03): 4h
```

**Depois:**
```typescript
Carga Horária Total: ${cargaHorariaTotal} horas
Número de Semanas: ${semanas.length}
# Calendário de Aulas (datas)
Semana 1: 01/03 - 07/03
Semana 2: 08/03 - 14/03
```

### 4. Garantir JSON Válido
**Antes:**
```typescript
const response = await llmProvider.generateCompletion(prompt, {
  systemPrompt,
  temperature: 0.7,
  maxTokens: 8192,
  responseSchema: teachingPlanSchema,
});
```

**Depois:**
```typescript
const response = await llmProvider.generateCompletion(prompt, {
  systemPrompt: systemPrompt + '\n\nRESPONDA APENAS COM JSON VÁLIDO. NÃO INCLUA MARKDOWN, EXPLICAÇÕES OU TEXTO ADICIONAL.',
  temperature: 0.2,  // Baixa para geração estruturada
  maxTokens: 8192,
  responseFormat: { type: 'json_object' },  // Force JSON mode (OpenAI/Gemini)
  responseSchema: teachingPlanSchema,       // Schema validation (quando suportado)
});
```

### 5. Remover Objetivos do Input
**Frontend - Remover campo:**
```typescript
// REMOVER:
<Textarea
  id="objectives"
  label="Objetivos de Aprendizagem (Opcional)"
/>

// Adicionar nota:
<Alert>
  <Info /> Os objetivos serão gerados automaticamente pela IA
  baseados na ementa e nas diretrizes do MEC.
</Alert>
```

**Backend - Remover do prompt:**
```typescript
// REMOVER linhas 26-28:
if (userObjectives) {
  prompt += `\n# Objetivos Desejados pelo Professor:\n${userObjectives}\n`;
}

// REMOVER linhas 12-14 (objetivos scraped):
# Objetivos Educacionais
Objetivo Geral: ${objetivoGeral}
Objetivos Específicos: ${objetivosEspecificos.join('; ')}
```

**Novo prompt:**
```typescript
# Instruções
Com base na ementa e no calendário de aulas, GERE:
- Objetivo Geral alinhado às diretrizes do MEC
- Objetivos Específicos mensuráveis e alcançáveis
- Metodologia apropriada para o contexto
```

### 6. Reduzir Temperatura
```typescript
temperature: 0.2  // Mais determinístico para JSON estruturado
```

## 📐 Value Objects Propostos

### WorkloadVO
```typescript
export class WorkloadVO {
  private constructor(private readonly hours: number) {}

  static create(input: string | number | undefined): WorkloadVO {
    let hours: number;

    if (typeof input === 'number') {
      hours = input;
    } else if (typeof input === 'string') {
      // Parse "80 horas", "80h", "80"
      const match = input.match(/(\d+)/);
      hours = match ? parseInt(match[1]) : 0;
    } else {
      hours = 0;
    }

    if (hours < 0 || hours > 1000) {
      throw new Error(`Carga horária inválida: ${hours}`);
    }

    return new WorkloadVO(hours);
  }

  getValue(): number {
    return this.hours;
  }

  toString(): string {
    return `${this.hours} horas`;
  }
}
```

### AcademicPeriodVO
```typescript
export class AcademicPeriodVO {
  private constructor(
    private readonly year: number,
    private readonly semester?: number
  ) {}

  static create(year?: number, semester?: number): AcademicPeriodVO {
    if (!year || year < 2000 || year > 2100) {
      throw new Error(`Ano letivo inválido: ${year}`);
    }

    if (semester && (semester < 1 || semester > 2)) {
      throw new Error(`Semestre inválido: ${semester}`);
    }

    return new AcademicPeriodVO(year, semester);
  }

  toString(): string {
    return this.semester
      ? `${this.year}.${this.semester}`
      : `${this.year}`;
  }

  getYear(): number {
    return this.year;
  }

  getSemester(): number | undefined {
    return this.semester;
  }
}
```

### TimeRangeVO
```typescript
export class TimeRangeVO {
  private constructor(
    private readonly hours: number,
    private readonly originalFormat: string
  ) {}

  static create(timeRange: string): TimeRangeVO {
    // Suporta: "2h", "08:00-10:00", "2 horas", "120 min"

    // Padrão: "Xh"
    let match = timeRange.match(/(\d+)\s*h/i);
    if (match) {
      return new TimeRangeVO(parseInt(match[1]), timeRange);
    }

    // Padrão: "HH:MM-HH:MM"
    match = timeRange.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (match) {
      const [, startH, startM, endH, endM] = match.map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const hours = (endMinutes - startMinutes) / 60;
      return new TimeRangeVO(hours, timeRange);
    }

    // Padrão: "X minutos"
    match = timeRange.match(/(\d+)\s*min/i);
    if (match) {
      const hours = parseInt(match[1]) / 60;
      return new TimeRangeVO(hours, timeRange);
    }

    // Fallback: 2 horas
    console.warn(`Formato de horário não reconhecido: ${timeRange}. Usando 2h como padrão.`);
    return new TimeRangeVO(2, timeRange);
  }

  getHours(): number {
    return this.hours;
  }

  getOriginalFormat(): string {
    return this.originalFormat;
  }
}
```

## 🧪 Validações Propostas

### DiaryValidator
```typescript
export class DiaryValidator {
  static validateForPlanGeneration(diary: Diary): ValidationResult {
    const errors: string[] = [];

    if (!diary.disciplina) {
      errors.push('Diário sem nome de disciplina');
    }

    if (!diary.anoLetivo) {
      errors.push('Diário sem ano letivo definido');
    }

    if (!diary.cargaHoraria && !diary.ementa) {
      errors.push('Diário sem carga horária nem ementa');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static validateHasSufficientContent(
    diary: Diary,
    weekSchedule: WeekSchedule[],
    existingPlans: TeachingPlan[]
  ): ValidationResult {
    const errors: string[] = [];

    if (weekSchedule.length === 0) {
      errors.push('Diário não possui aulas cadastradas. Sincronize o diário primeiro.');
    }

    if (weekSchedule.length < 4) {
      errors.push(`Diário possui apenas ${weekSchedule.length} semana(s). Mínimo recomendado: 4 semanas.`);
    }

    if (existingPlans.length === 0) {
      errors.push('Nenhum plano de ensino de referência encontrado. Recomenda-se sincronizar planos do sistema primeiro.');
    }

    if (existingPlans.length > 0 && !existingPlans[0].ementa) {
      errors.push('Plano de referência não possui ementa. Isso pode afetar a qualidade da geração.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: errors,  // Alguns são warnings, não impedem geração
    };
  }
}
```

## 🔄 Serviços Refatorados

### PromptBuilderService
```typescript
@Injectable()
export class PromptBuilderService {
  buildGenerationPrompt(context: GenerationContext): string {
    const sections = [
      this.buildHeader(),
      this.buildDisciplineInfo(context.diary, context.workload, context.period),
      this.buildSyllabusSection(context.existingPlans),
      this.buildCalendarSection(context.weekSchedule),
      this.buildUserPreferences(context.userPreferences),
      this.buildInstructions(),
      this.buildJsonSchema(),
    ];

    return sections.filter(s => s).join('\n\n');
  }

  private buildDisciplineInfo(diary: Diary, workload: WorkloadVO, period: AcademicPeriodVO): string {
    return `# Dados da Disciplina
Período Letivo: ${period.toString()}
Curso: ${diary.curso}
Unidade Curricular: ${diary.disciplina}
Carga Horária Total: ${workload.toString()}`;
  }

  private buildCalendarSection(weekSchedule: WeekSchedule[]): string {
    const weeks = weekSchedule
      .map(w => `Semana ${w.weekNumber}: ${w.formattedDateRange}`)
      .join('\n');

    return `# Calendário de Aulas (${weekSchedule.length} semanas)
${weeks}`;
  }

  private buildInstructions(): string {
    return `# Instruções para Geração
1. GERE objetivos alinhados à ementa e diretrizes do MEC
2. Distribua o conteúdo da ementa ao longo das ${weekSchedule.length} semanas
3. Sugira metodologias apropriadas para o contexto
4. Crie avaliações formativas e somativas
5. Responda APENAS com JSON válido no formato especificado`;
  }
}
```

### LLMClientService
```typescript
@Injectable()
export class LLMClientService {
  constructor(private readonly llmService: LLMService) {}

  async generateStructuredResponse<T>(
    userId: string,
    prompt: string,
    schema: any,
    options?: {
      maxRetries?: number;
      temperature?: number;
    }
  ): Promise<T> {
    const provider = await this.llmService.getProvider(userId);
    const retries = options?.maxRetries ?? 2;
    const temperature = options?.temperature ?? 0.2;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const systemPrompt = this.buildSystemPrompt(attempt);

        const response = await provider.generateCompletion(prompt, {
          systemPrompt,
          temperature: temperature + (attempt * 0.1),  // Increase temp on retry
          maxTokens: 8192,
          responseFormat: { type: 'json_object' },     // OpenAI/Gemini JSON mode
          responseSchema: schema,                       // Schema validation
        });

        // Parse and validate
        const parsed = this.parseJsonResponse(response);
        const validated = this.validateAgainstSchema(parsed, schema);

        return validated as T;
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Failed to generate valid JSON after ${retries + 1} attempts: ${error.message}`);
        }
        this.logger.warn(`Attempt ${attempt + 1} failed, retrying...`, error.message);
      }
    }

    throw new Error('Unexpected error in LLM generation');
  }

  private buildSystemPrompt(attempt: number): string {
    const base = `Você é um especialista em educação brasileira e elaboração de planos de ensino.
Você conhece as diretrizes do MEC e as melhores práticas pedagógicas.
Sempre responda em português do Brasil.`;

    const jsonInstruction = attempt === 0
      ? '\n\nRetorne APENAS JSON válido, sem markdown, comentários ou texto adicional.'
      : '\n\n**ATENÇÃO**: Sua resposta anterior foi inválida. Retorne APENAS um objeto JSON válido, começando com { e terminando com }. NÃO inclua ```json, explicações ou qualquer outro texto.';

    return base + jsonInstruction;
  }

  private parseJsonResponse(response: any): any {
    // Use JsonExtractorUtil
    return JsonExtractorUtil.extract(response);
  }

  private validateAgainstSchema(data: any, schema: any): any {
    // Use JsonSchemaValidator
    return JsonSchemaValidator.validate(data, schema);
  }
}
```

## 🎨 Controllers Simplificados

### AIController (refatorado)
```typescript
@Sse('teaching-plans/generate/:diaryId')
async generateTeachingPlanSSE(
  @Param('diaryId') diaryId: string,
  @Request() req,
): Promise<Observable<MessageEvent>> {
  const userId = req.user.id;

  return this.teachingPlanGeneratorService.generatePlanWithProgress(
    userId,
    { diaryId },
    {
      maxDuration: 300000,  // 5 min timeout
      progressInterval: 500,
    }
  );
}
```

## 📊 Benefícios da Refatoração

### Antes
- ❌ 1 arquivo, 409 linhas
- ❌ 1 método com 229 linhas
- ❌ Parsing JSON inline (100+ linhas)
- ❌ Sem validações robustas
- ❌ Edge cases não tratados
- ❌ Temperatura alta (0.7)
- ❌ JSON não garantido

### Depois
- ✅ 15+ arquivos modulares
- ✅ Métodos < 50 linhas cada
- ✅ 3 Value Objects
- ✅ 5 serviços especializados
- ✅ Validações em camada dedicada
- ✅ 10+ edge cases tratados
- ✅ Temperatura baixa (0.2)
- ✅ JSON garantido com retry

### Métricas
- **Cobertura de testes**: 0% → 80%+
- **Complexidade ciclomática**: 45 → <10 por método
- **Duplicação de código**: ~30% → <5%
- **Linhas por arquivo**: ~400 → ~100
- **Manutenibilidade**: Baixa → Alta

## 🚀 Plano de Implementação

### Fase 1: Correções Críticas (Imediato)
1. ✅ Corrigir carga horária (remover concatenação string)
2. ✅ Remover semestre do prompt (ou tratar undefined)
3. ✅ Remover duplicação de horários
4. ✅ Forçar JSON mode e reduzir temperatura
5. ✅ Remover objetivos do input (frontend + backend)

**Tempo estimado**: 2-3 horas
**Impacto**: Alto - Bugs críticos resolvidos

### Fase 2: Value Objects (Curto prazo)
1. Criar WorkloadVO
2. Criar AcademicPeriodVO
3. Criar TimeRangeVO
4. Refatorar código existente para usar VOs

**Tempo estimado**: 4-6 horas
**Impacto**: Médio - Validações robustas

### Fase 3: Serviços Especializados (Médio prazo)
1. Extrair PromptBuilderService
2. Criar LLMClientService
3. Criar ResponseParserService
4. Criar DiaryDataService
5. Criar WeekScheduleService

**Tempo estimado**: 8-12 horas
**Impacto**: Alto - Código limpo e testável

### Fase 4: Validadores (Médio prazo)
1. Criar DiaryValidator
2. Criar JsonSchemaValidator
3. Criar TeachingPlanValidator
4. Adicionar validators aos flows

**Tempo estimado**: 4-6 horas
**Impacto**: Médio - Edge cases tratados

### Fase 5: Testes (Longo prazo)
1. Unit tests para VOs
2. Unit tests para serviços
3. Integration tests
4. E2E tests

**Tempo estimado**: 12-16 horas
**Impacto**: Alto - Qualidade garantida

## ✅ Checklist de Implementação

- [ ] Corrigir carga horária
- [ ] Remover/tratar semestre vazio
- [ ] Remover duplicação de horários no prompt
- [ ] Forçar JSON mode em LLM
- [ ] Reduzir temperatura para 0.2
- [ ] Remover campo objetivos do frontend
- [ ] Remover objetivos do prompt (deixar IA gerar)
- [ ] Criar WorkloadVO
- [ ] Criar AcademicPeriodVO
- [ ] Criar TimeRangeVO
- [ ] Criar PromptBuilderService
- [ ] Criar LLMClientService
- [ ] Criar ResponseParserService
- [ ] Criar DiaryValidator
- [ ] Adicionar timeout SSE
- [ ] Adicionar retry logic
- [ ] Tratar edge case: diário sem ementa
- [ ] Tratar edge case: datas inválidas
- [ ] Tratar edge case: provider sem JSON mode
- [ ] Escrever testes unitários
- [ ] Escrever testes de integração
- [ ] Documentar API
- [ ] Code review

## 📚 Referências

- [Clean Code - Robert Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [Domain-Driven Design - Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Value Objects Pattern](https://martinfowler.com/bliki/ValueObject.html)
- [OpenAI JSON Mode](https://platform.openai.com/docs/guides/structured-outputs)
