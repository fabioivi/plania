# Sistema de Sincronização com Feedback em Tempo Real

## ✅ Implementações Concluídas

### Backend

#### 1. **Módulo de Eventos SSE** (`/modules/sync/`)

**Arquivos criados:**
- `sync-events.service.ts` - Gerencia conexões SSE e envia eventos de progresso
- `sync-events.controller.ts` - Endpoint `/sync/events` para conectar ao SSE
- `sync.module.ts` - Módulo NestJS para o sistema de eventos

**Funcionalidades:**
- Gerenciamento de conexões SSE por usuário
- Envio de eventos de progresso em tempo real
- Suporte a múltiplos clientes simultâneos
- Desconexão automática ao fechar cliente

#### 2. **Traduções e Mensagens em Português**

**Arquivo atualizado:** `auth-queue.processor.ts`

**Mensagens traduzidas:**
- ✅ "Iniciando sincronização com o sistema acadêmico..."
- ✅ "Conectando ao sistema e buscando diários de classe..."
- ✅ "X diários encontrados. Buscando planos de ensino..."
- ✅ "Buscando planos de ensino..." (com nome do diário)
- ✅ "Extraindo dados do plano de ensino X/Y..." (com contadores)
- ✅ "Sincronização concluída com sucesso!"
- ✅ Mensagens de erro em português

#### 3. **Sistema de Eventos de Progresso**

**Estrutura dos eventos:**
```typescript
interface SyncProgress {
  userId: string
  stage: 'starting' | 'diaries' | 'plans' | 'completed' | 'error'
  message: string
  current?: number      // Progresso atual
  total?: number        // Total de itens
  diaryName?: string    // Nome do diário sendo processado
  planName?: string     // Nome do plano sendo processado
}
```

**Estágios implementados:**
1. **starting**: Iniciando conexão com sistema
2. **diaries**: Buscando e salvando diários
3. **plans**: Extraindo planos de ensino (com detalhes por diário)
4. **completed**: Sincronização finalizada com sucesso
5. **error**: Erro durante sincronização

**Eventos emitidos:**
- Início da sincronização
- Diários encontrados
- Para cada diário: início do processamento com nome
- Para cada plano: progresso detalhado (X/Y)
- Conclusão com totais sincronizados
- Erros com mensagens descritivas

### Frontend

#### 1. **Hook `useSyncProgress`** (`/hooks/useSyncProgress.ts`)

**Funcionalidades:**
```typescript
const {
  progress,      // Dados de progresso atual
  isConnected,   // Status da conexão SSE
  connect,       // Conectar ao SSE
  disconnect,    // Desconectar do SSE
} = useSyncProgress()
```

**Features:**
- Conexão automática ao SSE
- Parsing de eventos de progresso
- Gerenciamento de estado da conexão
- Cleanup automático no unmount
- Tratamento de erros

#### 2. **Componente `SyncProgressDisplay`** (`/components/sync/`)

**Props:**
```typescript
interface SyncProgressDisplayProps {
  progress: SyncProgress | null
  isConnected: boolean
}
```

**Elementos visuais:**
- ✅ Ícone dinâmico por estágio (loading/success/error)
- ✅ Mensagem de status principal
- ✅ Nome do diário sendo processado
- ✅ Nome do plano sendo extraído
- ✅ Contador "X de Y"
- ✅ Barra de progresso visual
- ✅ Indicador de conexão perdida
- ✅ Cores por status (azul/verde/vermelho)

#### 3. **Componente `Progress`** (`/components/ui/progress.tsx`)

Barra de progresso usando Radix UI para feedback visual.

## 📊 Fluxo de Funcionamento

### 1. Usuário clica em "Sincronizar Agora"

```
Frontend (disciplines/page.tsx)
  ↓
  1. Conecta ao SSE (/sync/events)
  2. Dispara sincronização via API
  3. Aguarda eventos de progresso
```

### 2. Backend processa sincronização

```
API Call (/academic/diaries/sync)
  ↓
Queue Job (sync-diaries)
  ↓
auth-queue.processor.ts:
  1. Emite: "Iniciando..." → stage: starting
  2. Busca diários do IFMS
  3. Emite: "X diários encontrados" → stage: diaries
  4. Para cada diário:
     a. Emite: "Processando diário Y" → stage: plans, diaryName
     b. Busca lista de planos
     c. Para cada plano:
        i. Emite: "Extraindo plano Z/W" → stage: plans, planName
        ii. Extrai dados completos
        iii. Salva no banco
  5. Emite: "Concluído!" → stage: completed
```

### 3. Frontend exibe progresso em tempo real

```
useSyncProgress hook
  ↓
Recebe eventos SSE
  ↓
Atualiza estado
  ↓
SyncProgressDisplay renderiza:
  - Mensagem atual
  - Nome do diário/plano
  - Progresso X/Y
  - Barra visual
  - Ícone animado
```

## 🎨 Interface Visual

### Estados do Card de Progresso

**1. Iniciando (starting)**
```
🔄 Iniciando sincronização com o sistema acadêmico...
[Card azul com loader animado]
```

**2. Buscando Diários (diaries)**
```
🔄 3 diários encontrados. Buscando planos de ensino...
3 de 3
[Barra de progresso azul]
```

**3. Processando Planos (plans)**
```
🔄 Extraindo dados do plano de ensino 2/4...
📚 Programação Orientada a Objetos → Plano #789
2 de 3
[Barra de progresso azul]
```

**4. Concluído (completed)**
```
✅ Sincronização concluída com sucesso! 3 diários e 12 planos de ensino sincronizados.
[Card verde]
```

**5. Erro (error)**
```
❌ Erro ao sincronizar diários. Por favor, tente novamente.
[Card vermelho]
```

## 🔧 Como Usar

### No Frontend (disciplines/page.tsx)

```typescript
import { useSyncProgress } from '@/hooks/useSyncProgress'
import { SyncProgressDisplay } from '@/components/sync/SyncProgressDisplay'

export default function DisciplinesPage() {
  const { progress, isConnected, connect, disconnect } = useSyncProgress()
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    try {
      setSyncing(true)
      
      // Conectar ao SSE para receber progresso
      connect()
      
      // Disparar sincronização
      const result = await academicApi.syncDiaries()
      
      // Aguardar conclusão
      // Os eventos SSE mostrarão o progresso
      
      if (result.success) {
        toast.success(result.message)
        await loadDiaries()
      }
    } catch (err) {
      toast.error('Erro ao sincronizar')
    } finally {
      setSyncing(false)
      disconnect()
    }
  }

  return (
    <div>
      {/* Mostrar progresso durante sincronização */}
      {syncing && (
        <SyncProgressDisplay 
          progress={progress} 
          isConnected={isConnected} 
        />
      )}
      
      <Button onClick={handleSync} disabled={syncing}>
        {syncing ? (
          <>
            <Loader2 className="animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <RefreshCw />
            Sincronizar Agora
          </>
        )}
      </Button>
    </div>
  )
}
```

## ⚠️ Observações Importantes

### SSE vs WebSocket

Atualmente implementado com SSE (Server-Sent Events). 

**Limitação**: SSE padrão não suporta cabeçalhos personalizados (JWT).

**Soluções possíveis:**
1. ✅ **Token em query param**: `/sync/events?token=JWT_TOKEN`
2. ✅ **Cookie HTTP-only**: Enviar JWT em cookie
3. 🔄 **WebSocket**: Upgrade futuro para suporte bidirecional

### Atualização do Controller SSE

Para suportar JWT, o controller pode ser atualizado:

```typescript
@Get('events')
events(@Query('token') token: string, @Res() res: Response) {
  // Validar token
  const payload = this.jwtService.verify(token);
  const userId = payload.sub;
  
  this.syncEventsService.addClient(userId, res);
}
```

## 📁 Estrutura de Arquivos

```
backend/
└── src/
    └── modules/
        ├── sync/
        │   ├── sync-events.service.ts
        │   ├── sync-events.controller.ts
        │   └── sync.module.ts
        └── queue/
            └── auth-queue.processor.ts (atualizado)

frontend/
└── src/
    ├── hooks/
    │   └── useSyncProgress.ts
    └── components/
        ├── sync/
        │   └── SyncProgressDisplay.tsx
        └── ui/
            └── progress.tsx
```

## 🚀 Próximos Passos

1. **Atualizar `disciplines/page.tsx`** para usar os novos componentes
2. **Implementar autenticação JWT no SSE** (token via query ou cookie)
3. **Adicionar testes** para o fluxo de sincronização
4. **Melhorar tratamento de erros** com retry automático
5. **Adicionar cancelamento** de sincronização em andamento
6. **Persistir progresso** para retomar após refresh

## ✨ Benefícios

- ✅ **Feedback visual em tempo real** para o usuário
- ✅ **Mensagens em português** em todo o sistema
- ✅ **Transparência** sobre o que está sendo processado
- ✅ **Progresso detalhado** com contadores e nomes
- ✅ **UX melhorada** com loading states claros
- ✅ **Escalável** para adicionar mais eventos futuros
