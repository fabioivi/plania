# WorkProposalTable Component

Componente reutilizável para exibir a tabela de **Proposta de Trabalho (Cronograma)** de planos de ensino com design padronizado e badges coloridos.

## Características

- ✅ DataTable configurável com filtros e ordenação
- ✅ Badges coloridos para técnicas (azul) e recursos (verde)
- ✅ Checkbox opcional para seleção de linhas
- ✅ Ações de editar/excluir opcionais
- ✅ Design responsivo e consistente
- ✅ Suporte a modo claro/escuro

## Uso Básico

### Importação

```tsx
import { WorkProposalTable, type WeekSchedule } from "@/components/teaching-plan/WorkProposalTable"
```

### Exemplo 1: Visualização Simples (Sem Ações)

```tsx
const data: WeekSchedule[] = [
  {
    id: "week-1",
    month: "8 - Agosto",
    period: "12 a 16",
    classes: 1,
    observations: "",
    content: "Limites e Continuidade: Noção intuitiva de limite",
    teachingTechniques: "Aula prática, Expositiva/dialogada",
    teachingResources: "Projetor multimídia, Quadro branco/canetão"
  }
]

<WorkProposalTable data={data} />
```

### Exemplo 2: Modo Review (Com Checkbox e Ações)

```tsx
const handleEdit = (week: WeekSchedule) => {
  console.log("Editando semana:", week)
  // Abrir modal de edição
}

const handleDelete = (week: WeekSchedule) => {
  console.log("Excluindo semana:", week)
  // Confirmar e excluir
}

<WorkProposalTable 
  data={weekScheduleData}
  showCheckbox={true}
  showActions={true}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Exemplo 3: Visualização de Plano de Ensino Scrapeado

```tsx
<WorkProposalTable 
  data={plan.propostaTrabalho}
  showCheckbox={false}
  showActions={false}
/>
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `data` | `WeekSchedule[]` | **obrigatório** | Array com os dados das semanas |
| `showCheckbox` | `boolean` | `false` | Exibe checkbox para seleção de linhas |
| `showActions` | `boolean` | `false` | Exibe botões de editar e excluir |
| `onEdit` | `(week: WeekSchedule) => void` | `undefined` | Callback ao clicar em editar |
| `onDelete` | `(week: WeekSchedule) => void` | `undefined` | Callback ao clicar em excluir |
| `className` | `string` | `""` | Classes CSS adicionais |

## Tipo WeekSchedule

```tsx
type WeekSchedule = {
  id: string                    // ID único da semana
  week?: number                 // Número da semana (opcional)
  month: string                 // Mês no formato "8 - Agosto"
  period: string                // Período da semana "12 a 16"
  classes: number               // Número de aulas
  observations?: string         // Observações (opcional)
  content: string               // Conteúdo a ser ministrado
  teachingTechniques: string    // Técnicas separadas por vírgula
  teachingResources?: string    // Recursos separados por vírgula (opcional)
}
```

## Design dos Badges

### Técnicas de Ensino (Azul)
```
bg-blue-50 text-blue-700 border border-blue-300
dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700
```

### Recursos de Ensino (Verde Esmeralda)
```
bg-emerald-50 text-emerald-700 border border-emerald-300
dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700
```

### Observações (Cinza Secundário)
```
variant="secondary"
```

### Número de Aulas (Padrão)
```
<Badge>{classes}</Badge>
```

## Páginas que Utilizam

1. **`/plans/review/[id]`** - Modo de edição com checkbox e ações
2. **`/teaching-plans/[id]`** - Visualização de planos scrapeados (pode usar)
3. **`/plans/preview/[id]`** - Preview para impressão (pode usar)

## Estrutura de Colunas

1. **Checkbox** (opcional) - Seleção de linhas
2. **Período** - Mês + período da semana
3. **Nº Aulas** - Badge com quantidade
4. **Observações** - Badge ou traço se vazio
5. **Conteúdo** - Texto do conteúdo programático
6. **Técnicas de Ensino** - Badges azuis separados
7. **Recursos de Ensino** - Badges verdes separados
8. **Ações** (opcional) - Botões de editar e excluir

## Recursos do DataTable

- ✅ Filtros por coluna
- ✅ Ordenação
- ✅ Paginação
- ✅ Seleção de linhas
- ✅ Responsivo

## Notas de Implementação

- Os dados de `teachingTechniques` e `teachingResources` devem ser strings separadas por vírgula e espaço: `"Técnica 1, Técnica 2"`
- O campo `observations` pode ser uma string vazia e será exibido como "-"
- O campo `teachingResources` é opcional e será exibido como "-" se não fornecido
- O formato do mês deve incluir o número e nome: `"8 - Agosto"` (será extraído apenas o nome)
