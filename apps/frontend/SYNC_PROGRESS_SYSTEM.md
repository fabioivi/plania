# Sistema de Progresso de Sincronização

## Visão Geral

Sistema genérico e reutilizável para exibir progresso de operações de sincronização (download, upload ou sync) em toda a aplicação.

## Componentes

### 1. `SyncProgressDisplay`

Componente visual que exibe o progresso de sincronização em formato de Card.

**Props:**
- `state: SyncProgressState | null` - Estado atual da sincronização
- `isConnected?: boolean` - Status da conexão (padrão: true)
- `className?: string` - Classes CSS adicionais

**Exemplo de uso:**
```tsx
import { SyncProgressDisplay } from '@/components/sync'
import { useSyncState } from '@/hooks/useSyncState'

function MyComponent() {
  const { state } = useSyncState('download')
  
  return (
    <SyncProgressDisplay 
      state={state} 
      isConnected={true}
    />
  )
}
```

### 2. `useSyncState` Hook

Hook customizado para gerenciar o estado de sincronização.

**Métodos:**
- `startSync(total, message?)` - Inicia sincronização
- `updateProgress(current, currentItem?)` - Atualiza progresso
- `addItem(item)` - Adiciona item processado
- `complete(message?, items?)` - Marca como concluído
- `error(message, items?)` - Marca como erro
- `reset()` - Reseta o estado

**Exemplo de uso:**
```tsx
import { useSyncState } from '@/hooks/useSyncState'

function MyUploadComponent() {
  const { state, startSync, addItem, complete, error, reset } = useSyncState('upload')
  
  const handleUpload = async (items: string[]) => {
    startSync(items.length, 'Enviando arquivos...')
    
    for (const item of items) {
      try {
        await uploadItem(item)
        addItem({ id: item, name: item, success: true })
      } catch (err) {
        addItem({ 
          id: item, 
          name: item, 
          success: false, 
          message: err.message 
        })
      }
    }
    
    complete()
  }
  
  return (
    <div>
      <button onClick={() => handleUpload(['file1', 'file2'])}>
        Upload
      </button>
      {state && <SyncProgressDisplay state={state} />}
    </div>
  )
}
```

## Tipos

### SyncType
```typescript
type SyncType = 'download' | 'upload' | 'sync'
```

### SyncStatus
```typescript
type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'
```

### SyncItem
```typescript
interface SyncItem {
  id: string
  name: string
  success: boolean
  message?: string
}
```

### SyncProgressState
```typescript
interface SyncProgressState {
  status: SyncStatus
  type: SyncType
  current: number
  total: number
  succeeded: number
  failed: number
  currentItem?: string
  message?: string
  items: SyncItem[]
}
```

## Exemplos de Uso em Diferentes Contextos

### 1. Download de Dados (disciplines page)

```tsx
import { SyncProgressDisplay } from '@/components/sync'
import { useSyncProgress } from '@/hooks/useSyncProgress'

export default function DisciplinesPage() {
  const { progress, isConnected } = useSyncProgress()
  
  return (
    <div>
      {progress && (
        <SyncProgressDisplay 
          state={progress} 
          isConnected={isConnected}
        />
      )}
    </div>
  )
}
```

### 2. Upload de Conteúdo (SendProgressDialog)

```tsx
import { useSyncState } from '@/hooks/useSyncState'
import { SyncProgressDisplay } from '@/components/sync'

export function SendProgressDialog() {
  const { state, startSync, complete, error } = useSyncState('upload')
  
  const handleSend = async () => {
    startSync(items.length, 'Enviando conteúdos...')
    
    try {
      const result = await api.sendBulk(items)
      complete('Envio concluído!', result.items)
    } catch (err) {
      error('Erro no envio', [{ 
        id: 'error', 
        name: 'Erro geral', 
        success: false, 
        message: err.message 
      }])
    }
  }
  
  return (
    <Dialog>
      {state && <SyncProgressDisplay state={state} />}
    </Dialog>
  )
}
```

### 3. Sincronização Bidirecional

```tsx
import { useSyncState } from '@/hooks/useSyncState'

export function FullSyncComponent() {
  const { state, startSync, updateProgress, complete } = useSyncState('sync')
  
  const handleFullSync = async () => {
    startSync(100, 'Sincronizando tudo...')
    
    // Download
    updateProgress(25, 'Baixando diários...')
    await downloadDiaries()
    
    // Upload
    updateProgress(50, 'Enviando planos...')
    await uploadPlans()
    
    // Finalização
    updateProgress(100, 'Finalizando...')
    complete('Sincronização completa!')
  }
  
  return <SyncProgressDisplay state={state} />
}
```

## Integração com API

O sistema se integra perfeitamente com as respostas da API:

```typescript
// API Response
interface BulkResult {
  success: boolean
  total: number
  succeeded: number
  failed: number
  results: Array<{
    contentId: string
    success: boolean
    message?: string
  }>
}

// Conversão para SyncItems
const items = result.results.map(r => ({
  id: r.contentId,
  name: findName(r.contentId),
  success: r.success,
  message: r.message,
}))

complete('Operação concluída!', items)
```

## Personalização Visual

O componente usa cores diferentes baseado no status:

- **Syncing**: Azul (bg-blue-50, border-blue-200)
- **Completed**: Verde (bg-green-50, border-green-200)
- **Error**: Vermelho (bg-red-50, border-red-200)

Os ícones mudam automaticamente:
- Download: Download icon
- Upload: Upload icon  
- Sync: RefreshCw icon
- Syncing: Loader2 (spinning)
- Completed: CheckCircle2
- Error: XCircle

## Toast Integration

Combine com Sonner para feedback completo:

```tsx
import { toast } from 'sonner'

const handleOperation = async () => {
  startSync(items.length)
  
  try {
    const result = await api.operation()
    
    if (result.succeeded > 0) {
      toast.success(`${result.succeeded} items processados!`)
    }
    
    if (result.failed > 0) {
      toast.error(`${result.failed} items falharam`)
    }
    
    complete('Concluído!', items)
  } catch (err) {
    toast.error('Erro na operação')
    error(err.message)
  }
}
```
