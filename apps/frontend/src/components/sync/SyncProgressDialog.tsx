'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Download, Upload, RefreshCw } from "lucide-react"
import { SyncProgress } from "@/hooks/useSyncProgress"

export type SyncType = 'download' | 'upload' | 'sync'
export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'

export interface SyncItem {
  id: string
  name: string
  success: boolean
  message?: string
}

export interface SyncProgressState {
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

interface SyncProgressDisplayProps {
  state: SyncProgressState | null
  progress?: SyncProgress | null  // Para compatibilidade com SSE
  isConnected?: boolean
  className?: string
}

export function SyncProgressDisplay({ 
  state, 
  progress,
  isConnected = true,
  className = '' 
}: SyncProgressDisplayProps) {
  // Se tiver progresso SSE, usar ele ao invés do state
  if (progress) {
    return <SyncProgressDisplaySSE progress={progress} isConnected={isConnected} className={className} />
  }
  
  if (!state) return null

  const progressPercentage = state.total > 0 ? (state.current / state.total) * 100 : 0
  const errors = state.items.filter(item => !item.success)

  const getIcon = () => {
    if (state.status === 'syncing') {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
    }
    if (state.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    if (state.status === 'error') {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
    if (state.type === 'download') {
      return <Download className="h-5 w-5 text-blue-600" />
    }
    if (state.type === 'upload') {
      return <Upload className="h-5 w-5 text-blue-600" />
    }
    return <RefreshCw className="h-5 w-5 text-blue-600" />
  }

  const getColor = () => {
    switch (state.status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getMessage = () => {
    if (state.message) return state.message

    if (state.status === 'syncing') {
      if (state.type === 'download') return 'Baixando dados...'
      if (state.type === 'upload') return 'Enviando dados...'
      return 'Sincronizando...'
    }
    if (state.status === 'completed') {
      return state.failed === 0
        ? `${state.succeeded} ${state.succeeded === 1 ? 'item processado' : 'itens processados'} com sucesso!`
        : `Concluído: ${state.succeeded} sucesso, ${state.failed} falhas`
    }
    if (state.status === 'error') {
      return 'Erro na operação'
    }
    return 'Pronto'
  }

  return (
    <Card className={`${getColor()} border-2 ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm">
                {getMessage()}
              </p>

              {/* Current Item */}
              {state.currentItem && (
                <p className="text-xs text-muted-foreground">
                  {state.currentItem}
                </p>
              )}

              {/* Counter */}
              {state.total > 0 && (
                <p className="text-xs text-muted-foreground">
                  {state.current} de {state.total}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {state.status === 'syncing' && state.total > 0 && (
            <Progress value={progressPercentage} className="h-2" />
          )}

          {/* Stats */}
          {state.current > 0 && (state.status === 'syncing' || state.status === 'completed') && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Sucesso: <strong>{state.succeeded}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>Falhas: <strong>{state.failed}</strong></span>
              </div>
            </div>
          )}

          {/* Error List */}
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg max-h-40 overflow-y-auto">
              <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Erros encontrados:
              </p>
              <ul className="space-y-1 text-xs text-red-700">
                {errors.map((err, idx) => (
                  <li key={idx} className="flex flex-col gap-1 border-l-2 border-red-300 pl-2">
                    <span className="font-semibold">{err.name}</span>
                    {err.message && (
                      <span className="text-red-600">{err.message}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connection Status */}
          {!isConnected && state.status === 'syncing' && (
            <p className="text-xs text-yellow-600">
              ⚠️ Conexão perdida. Reconectando...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para exibir progresso SSE (antigo sistema)
function SyncProgressDisplaySSE({ 
  progress, 
  isConnected,
  className = ''
}: { 
  progress: SyncProgress
  isConnected: boolean
  className?: string
}) {
  const getProgressValue = () => {
    if (!progress.current || !progress.total) return 0
    const percentage = (progress.current / progress.total) * 100
    return Math.min(Math.max(percentage, 0), 100)
  }

  const getIcon = () => {
    switch (progress.stage) {
      case 'starting':
      case 'diaries':
      case 'plans':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <RefreshCw className="h-5 w-5 text-blue-600" />
    }
  }

  const getColor = () => {
    switch (progress.stage) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <Card className={`${getColor()} border-2 ${className}`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-sm">
                {progress.message}
              </p>
              
              {/* Detalhes do diário/plano */}
              {progress.diaryName && (
                <p className="text-xs text-muted-foreground">
                  📚 {progress.diaryName}
                  {progress.planName && (
                    <span className="ml-2">
                      → {progress.planName}
                    </span>
                  )}
                </p>
              )}
              
              {/* Contador */}
              {progress.current !== undefined && progress.total !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {progress.current} de {progress.total}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {progress.stage !== 'completed' && progress.stage !== 'error' && (
            <div>
              {progress.current && progress.total ? (
                <Progress value={getProgressValue()} className="h-2" />
              ) : (
                <Progress value={0} className="h-2" />
              )}
            </div>
          )}

          {/* Connection Status */}
          {!isConnected && progress.stage !== 'completed' && (
            <p className="text-xs text-yellow-600">
              ⚠️ Conexão perdida. Reconectando...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
