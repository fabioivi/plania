# Feature: Fluxo de Geração de Planos de Ensino com IA

## 📋 Visão Geral

Refatorar o sistema de geração de planos de ensino com IA para criar um fluxo completo desde a geração até o envio ao sistema acadêmico, usando dados dos planos IFMS existentes como base.

## 🎯 Objetivos

1. Usar dados corretos do plano de ensino IFMS como base para geração
2. Permitir revisão e ajuste do conteúdo gerado antes de enviar
3. Rastrear status do plano (gerado por IA, revisado, enviado ao IFMS)
4. Melhorar qualidade do prompt usando dados estruturados do plano existente

## 🔄 Fluxo Proposto

### 1. Ponto de Entrada: Botão "Editar com IA"
**Localização:** `/teaching-plans/[id]` (página de visualização do plano)

```tsx
// Quando usuário clica em "Editar com IA"
onClick={() => router.push(`/generate?planId=${plan.id}`)}
```

**Comportamento:**
- Redireciona para `/generate?planId=e45f6bad-520e-4cd3-8c92-0badb3605a4a`
- Carrega dados do plano de ensino existente (do IFMS)

---

### 2. Página de Geração: `/generate`

**Dados Pré-preenchidos (do plano IFMS):**
- ✅ Nome da Disciplina (unidadeCurricular)
- ✅ Período (anoSemestre)
- ✅ Carga Horária (cargaHorariaTotal)
- ✅ Curso
- ✅ Campus
- ✅ Ementa (read-only, vem do plano IFMS)
- ✅ Calendário de Aulas (vem do diary content)

**Campos Editáveis:**
- Metodologia preferida (opcional)
- Observações adicionais (opcional)

**Ação:**
- Botão "Gerar Plano com IA"
- Mostra progresso via SSE
- Após geração bem-sucedida, salva plano com `source: 'ai'` e `sentToIFMS: false`

---

### 3. Página de Revisão: `/plans/review/[id]`

**Objetivo:** Permitir ajustes no conteúdo gerado pela IA antes de enviar ao IFMS

**Seções Editáveis:**
1. **Objetivo Geral** (textarea)
2. **Objetivos Específicos** (lista editável)
3. **Metodologia** (textarea)
4. **Proposta de Trabalho Semanal** (tabela editável)
   - Semana, Data, Tema, Conteúdo, Técnicas, Recursos, Num Aulas
5. **Avaliações** (tabela editável)
   - Etapa, Avaliação, Instrumentos, Data Prevista, Valor Máximo
6. **Recuperação da Aprendizagem** (textarea)
7. **Referências** (textarea)

**Ações:**
- ✅ **Salvar Rascunho** - Salva alterações sem enviar
- ✅ **Gerar Novamente** - Volta para `/generate` com mesmo planId
- ✅ **Enviar para IFMS** - Envia plano para sistema acadêmico
  - Marca `sentToIFMS: true`
  - Usa scraping service para enviar
- ❌ **Cancelar** - Volta para página de planos

---

## 🗄️ Mudanças no Banco de Dados

### Entity: `TeachingPlan`

**Novos Campos:**

```typescript
@Column({ name: 'source', default: 'ifms' })
source: 'ifms' | 'ai'; // Origem: scraped do IFMS ou gerado por IA

@Column({ name: 'base_plan_id', nullable: true })
basePlanId: string; // ID do plano IFMS usado como base (se source='ai')

@Column({ name: 'sent_to_ifms', default: false })
sentToIFMS: boolean; // Se o plano foi enviado ao sistema IFMS

@Column({ name: 'sent_at', nullable: true })
sentAt: Date; // Data de envio ao IFMS

@Column({ name: 'external_id', unique: true, nullable: true })
externalId: string; // ID no IFMS (null para planos AI não enviados)
```

**Status Possíveis:**
- `source='ifms'` + `externalId` presente = Plano scraped do IFMS (original)
- `source='ai'` + `sentToIFMS=false` = Plano gerado, em rascunho
- `source='ai'` + `sentToIFMS=true` = Plano gerado e enviado ao IFMS

---

## 🔧 Mudanças no Backend

### 1. Endpoint: Gerar Plano com IA (Atualizado)

**Rota:** `POST /ai/teaching-plans/generate`

**Novo Payload:**
```typescript
{
  diaryId: string,        // ID do diário
  basePlanId?: string,    // ID do plano IFMS usado como base
  methodology?: string,
  additionalNotes?: string
}
```

**Comportamento:**
1. Se `basePlanId` fornecido:
   - Busca plano IFMS completo
   - Usa TODOS os dados dele no prompt (ementa, objetivos, carga horária, etc)
   - Gera variação baseada no plano existente
2. Se `basePlanId` não fornecido:
   - Comportamento atual (usa dados do diary + planos existentes)

**Resposta:**
```typescript
{
  plan: GeneratedTeachingPlan,
  basedOn?: TeachingPlan  // Plano usado como base
}
```

---

### 2. Service: `TeachingPlanGeneratorService`

**Método Atualizado:** `buildPrompt()`

**Mudanças:**
```typescript
private buildPrompt(
  diary: Diary,
  weekSchedule: WeekSchedule[],
  basePlan?: TeachingPlan,  // ← NOVO: Plano IFMS base
  userInput?: Partial<GenerateTeachingPlanDto>,
): string {
  // Priorizar dados do basePlan (se fornecido)
  const ementa = basePlan?.ementa || 'Não disponível';
  const cargaHorariaTotal = basePlan?.cargaHorariaTotal || diary.cargaHoraria;
  const curso = basePlan?.curso || diary.curso;
  const anoSemestre = basePlan?.anoSemestre || `${diary.anoLetivo}.${diary.semestre}`;

  // Incluir objetivos do plano base como referência (não para copiar)
  const referenceObjectives = basePlan ? {
    objetivoGeral: basePlan.objetivoGeral,
    objetivosEspecificos: basePlan.objetivosEspecificos
  } : null;

  // Incluir proposta de trabalho do plano base como referência
  const referenceWorkPlan = basePlan?.propostaTrabalho || null;

  return buildTeachingPlanPrompt({
    // ... dados existentes
    basePlanReference: {
      objectives: referenceObjectives,
      workPlan: referenceWorkPlan,
      evaluation: basePlan?.avaliacaoAprendizagem,
    },
    // Instrução: "Use como REFERÊNCIA, mas crie conteúdo novo e adaptado"
  });
}
```

---

### 3. Endpoint: Salvar Plano Gerado

**Rota:** `POST /academic/teaching-plans/ai`

**Payload:**
```typescript
{
  diaryId: string,
  basePlanId?: string,
  planData: GeneratedTeachingPlan
}
```

**Comportamento:**
- Cria TeachingPlan com:
  - `source: 'ai'`
  - `basePlanId: basePlanId` (se fornecido)
  - `sentToIFMS: false`
  - `externalId: null`
  - `status: 'Gerado por IA - Rascunho'`

---

### 4. Endpoint: Atualizar Plano (Rascunho)

**Rota:** `PUT /academic/teaching-plans/:id`

**Payload:**
```typescript
{
  objetivoGeral?: string,
  objetivosEspecificos?: string,
  metodologia?: string,
  propostaTrabalho?: any[],
  avaliacaoAprendizagem?: any[],
  recuperacaoAprendizagem?: string,
  referencias?: string
}
```

**Comportamento:**
- Atualiza campos do plano
- Mantém `sentToIFMS: false`

---

### 5. Endpoint: Enviar Plano ao IFMS

**Rota:** `POST /academic/teaching-plans/:id/send`

**Comportamento:**
1. Valida que `source='ai'` e `sentToIFMS=false`
2. Usa ScrapingService para enviar ao IFMS
3. Atualiza:
   - `sentToIFMS: true`
   - `sentAt: new Date()`
   - `externalId: <id retornado pelo IFMS>`
   - `status: 'Enviado ao IFMS'`

---

## 🎨 Mudanças no Frontend

### 1. Página `/generate` (Atualizada)

**Novos Query Params:**
- `?planId=xxx` - ID do plano IFMS base

**Mudanças:**
```tsx
const searchParams = useSearchParams();
const planId = searchParams.get('planId');
const diaryId = searchParams.get('diaryId');

// Se planId, buscar dados do plano
const { data: basePlan } = useTeachingPlan(planId);

// Pré-preencher form com dados do plano
useEffect(() => {
  if (basePlan) {
    setFormData({
      diaryId: basePlan.diaryId,
      basePlanId: basePlan.id,
      methodology: '',
      additionalNotes: ''
    });
    setSelectedDiary({
      id: basePlan.diaryId,
      disciplina: basePlan.unidadeCurricular,
      curso: basePlan.curso,
      cargaHoraria: basePlan.cargaHorariaTotal,
      anoLetivo: basePlan.anoSemestre?.split('.')[0],
      semestre: basePlan.anoSemestre?.split('.')[1]
    });
  }
}, [basePlan]);
```

**UI:**
- Mostrar banner: "📋 Gerando baseado no plano: {basePlan.unidadeCurricular}"
- Campos bloqueados (read-only):
  - Disciplina
  - Período
  - Carga Horária
  - Curso
  - Ementa (exibida em card informativo)

---

### 2. Nova Página `/plans/review/[id]`

**Estrutura:**
```tsx
export default function ReviewAIPlanPage() {
  const params = useParams();
  const planId = params.id as string;

  const { data: plan } = useTeachingPlan(planId);
  const { mutate: updatePlan } = useUpdateTeachingPlan();
  const { mutate: sendToIFMS } = useSendPlanToIFMS();

  // Estados para edição
  const [editedPlan, setEditedPlan] = useState(plan);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSaveDraft = () => {
    updatePlan({ planId, data: editedPlan });
  };

  const handleSendToIFMS = () => {
    if (hasChanges) {
      // Salvar antes de enviar
      updatePlan({ planId, data: editedPlan }, {
        onSuccess: () => sendToIFMS(planId)
      });
    } else {
      sendToIFMS(planId);
    }
  };

  return (
    <div>
      {/* Header com ações */}
      <div className="flex justify-between">
        <h1>Revisar Plano Gerado por IA</h1>
        <div className="flex gap-2">
          <Button onClick={handleSaveDraft} disabled={!hasChanges}>
            Salvar Rascunho
          </Button>
          <Button onClick={() => router.push(`/generate?planId=${plan.basePlanId}`)}>
            Gerar Novamente
          </Button>
          <Button onClick={handleSendToIFMS} variant="default">
            Enviar para IFMS
          </Button>
        </div>
      </div>

      {/* Formulário de Edição */}
      <EditableTeachingPlanForm
        plan={editedPlan}
        onChange={(updated) => {
          setEditedPlan(updated);
          setHasChanges(true);
        }}
      />
    </div>
  );
}
```

---

### 3. Componente `EditableTeachingPlanForm`

**Componentes de Edição:**
- `EditableTextarea` - Para textos longos (objetivos, metodologia)
- `EditableList` - Para lista de objetivos específicos
- `EditableTable` - Para proposta de trabalho e avaliações
- `EditableRichText` - Para referências (com formatação)

---

### 4. Atualizar `/teaching-plans/[id]`

**Mudanças no Botão "Editar com IA":**
```tsx
<Button
  className="gap-2"
  onClick={() => router.push(`/generate?planId=${plan.id}`)}
>
  <Edit className="h-4 w-4" />
  Editar com IA
</Button>
```

**Mostrar Status do Plano:**
```tsx
{plan.source === 'ai' && (
  <Badge variant={plan.sentToIFMS ? "success" : "warning"}>
    {plan.sentToIFMS ? "✓ Enviado ao IFMS" : "⚠ Rascunho (não enviado)"}
  </Badge>
)}
```

---

## 📝 Prompt Melhorado

### Novo Template: `buildTeachingPlanPrompt`

**Adições ao Prompt:**

```markdown
# Plano de Referência (IFMS)

Você tem acesso ao plano de ensino oficial aprovado no IFMS como REFERÊNCIA.
Use-o como INSPIRAÇÃO, mas NÃO COPIE literalmente.

## Objetivos do Plano de Referência:
Geral: {basePlan.objetivoGeral}
Específicos:
{basePlan.objetivosEspecificos}

## Proposta de Trabalho do Plano de Referência:
{basePlan.propostaTrabalho (resumido)}

## Avaliações do Plano de Referência:
{basePlan.avaliacaoAprendizagem}

---

# Instruções de Geração

Com base na EMENTA, no calendário de aulas, e INSPIRADO no plano de referência:

1. **Crie NOVOS objetivos** que sejam:
   - Alinhados à ementa
   - Similares em estrutura aos do plano de referência
   - Mas com redação diferente e possivelmente mais detalhados

2. **Distribua o conteúdo** ao longo das semanas:
   - Use o calendário fornecido (datas exatas)
   - Inspire-se na sequência do plano de referência
   - Adapte para o número de aulas disponível

3. **Proponha avaliações** que:
   - Sejam consistentes com o plano de referência
   - Estejam distribuídas adequadamente
   - Tenham pesos similares

4. **Mantenha coerência** com:
   - Metodologia do plano de referência
   - Tipo de recursos utilizados
   - Abordagem pedagógica
```

---

## 🎯 Vantagens da Nova Abordagem

### 1. **Qualidade Melhorada**
- ✅ Usa dados reais e aprovados do IFMS
- ✅ Mantém consistência com planos existentes
- ✅ Ementa correta e oficial

### 2. **Controle do Usuário**
- ✅ Revisão antes de enviar
- ✅ Ajustes manuais possíveis
- ✅ Rastreamento de status

### 3. **Rastreabilidade**
- ✅ Sabe qual plano foi usado como base
- ✅ Sabe se foi gerado por IA
- ✅ Sabe se foi enviado ao IFMS

### 4. **Flexibilidade**
- ✅ Pode gerar novamente se não gostar
- ✅ Pode editar antes de enviar
- ✅ Mantém histórico de versões

---

## 📋 Checklist de Implementação

### Fase 1: Backend - Database & Entities
- [ ] Adicionar campos `source`, `basePlanId`, `sentToIFMS`, `sentAt` à entity
- [ ] Criar migration para novos campos
- [ ] Atualizar tipos TypeScript

### Fase 2: Backend - Geração com Plano Base
- [ ] Atualizar `generatePlan()` para aceitar `basePlanId`
- [ ] Modificar `buildPrompt()` para usar dados do plano base
- [ ] Atualizar prompt template com seção de referência
- [ ] Testar geração com plano base vs sem plano base

### Fase 3: Backend - CRUD de Planos AI
- [ ] Endpoint `POST /academic/teaching-plans/ai` (criar plano AI)
- [ ] Endpoint `PUT /academic/teaching-plans/:id` (atualizar rascunho)
- [ ] Endpoint `POST /academic/teaching-plans/:id/send` (enviar ao IFMS)
- [ ] Validações (só pode atualizar se `source='ai'` e `sentToIFMS=false`)

### Fase 4: Backend - Envio ao IFMS
- [ ] Implementar lógica de envio via ScrapingService
- [ ] Capturar `externalId` retornado pelo IFMS
- [ ] Atualizar status após envio bem-sucedido
- [ ] Tratamento de erros

### Fase 5: Frontend - Página `/generate`
- [ ] Suportar query param `?planId=xxx`
- [ ] Buscar e pré-preencher com dados do plano base
- [ ] UI read-only para dados do plano base
- [ ] Banner informativo "Baseado no plano X"
- [ ] Enviar `basePlanId` no payload

### Fase 6: Frontend - Página `/plans/review/[id]`
- [ ] Criar página nova
- [ ] Componente `EditableTeachingPlanForm`
- [ ] Sub-componentes editáveis (textarea, list, table)
- [ ] Lógica de detecção de mudanças
- [ ] Botão "Salvar Rascunho"
- [ ] Botão "Gerar Novamente"
- [ ] Botão "Enviar para IFMS" com confirmação

### Fase 7: Frontend - Integração
- [ ] Atualizar botão "Editar com IA" em `/teaching-plans/[id]`
- [ ] Mostrar badges de status (AI, Rascunho, Enviado)
- [ ] Após geração bem-sucedida, redirecionar para `/plans/review/[id]`
- [ ] Hooks React Query para novos endpoints

### Fase 8: Testes & Validação
- [ ] Testar fluxo completo: Editar → Gerar → Revisar → Enviar
- [ ] Testar geração sem plano base (modo legado)
- [ ] Validar dados salvos no banco
- [ ] Testar envio ao IFMS (sandbox)
- [ ] Edge cases (sem internet, timeout, etc)

---

## 🚀 Ordem de Implementação Sugerida

1. **Backend primeiro** (Fases 1-4)
   - Infraestrutura de dados
   - API endpoints
   - Lógica de geração melhorada

2. **Frontend incremental** (Fases 5-7)
   - Página `/generate` atualizada
   - Página `/plans/review/[id]` nova
   - Integração com páginas existentes

3. **Testes & Ajustes** (Fase 8)
   - Validação end-to-end
   - Refinamento de UX
   - Correções de bugs

---

## 📌 Notas Importantes

### Compatibilidade com Planos Existentes
- Planos IFMS existentes: `source='ifms'`, `sentToIFMS=null` (ou migrar para `true`)
- Não quebrar funcionalidades existentes
- Migration deve marcar planos IFMS corretamente

### Segurança
- Validar que usuário tem permissão para editar o plano
- Validar que plano não foi enviado antes de permitir edição
- Confirmar antes de enviar ao IFMS (ação irreversível)

### Performance
- Cache de planos base (já buscados)
- Lazy load de componentes de edição
- Debounce em saves automáticos (se implementar)

### UX
- Loading states em todas as operações
- Feedback claro de sucesso/erro
- Confirmações para ações destrutivas
- Breadcrumbs para navegação clara
