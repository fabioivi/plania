'use client'

import { CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
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

  // Premium Colors & Styles based on Status
  const getStatusStyles = () => {
    switch (state.status) {
      case 'syncing':
        return {
          container: "bg-white dark:bg-card border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/20 dark:shadow-none",
          iconBg: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-indigo-600 dark:bg-indigo-500",
          animation: "animate-pulse-subtle"
        }
      case 'completed':
        return {
          container: "bg-white dark:bg-card border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-100/20 dark:shadow-none",
          iconBg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-emerald-500 dark:bg-emerald-500",
          animation: ""
        }
      case 'error':
        return {
          container: "bg-white dark:bg-card border-rose-100 dark:border-rose-900/50 shadow-xl shadow-rose-100/20 dark:shadow-none",
          iconBg: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-rose-500 dark:bg-rose-500",
          animation: ""
        }
      default:
        return {
          container: "bg-white dark:bg-card border-slate-200 dark:border-border shadow-sm dark:shadow-none",
          iconBg: "bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-slate-400 dark:bg-slate-600",
          animation: ""
        }
    }
  }

  const styles = getStatusStyles()

  const getIcon = () => {
    if (state.status === 'syncing') {
      return <Loader2 className="h-6 w-6 animate-spin" />
    }
    if (state.status === 'completed') {
      return <CheckCircle2 className="h-6 w-6" />
    }
    if (state.status === 'error') {
      return <XCircle className="h-6 w-6" />
    }
    return <RefreshCw className="h-6 w-6" />
  }

  const getMessage = () => {
    if (state.message) return state.message
    if (state.status === 'syncing') return 'Sincronizando dados...'
    if (state.status === 'completed') return 'Sincronização concluída!'
    if (state.status === 'error') return 'Erro na sincronização'
    return 'Aguardando...'
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col gap-6 relative z-10 p-2">
        {/* Header Row */}
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${styles.iconBg} transition-colors duration-500`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-lg font-bold truncate leading-tight ${styles.title}`}>
              {getMessage()}
            </h4>
            {/* Connection Status Subtitle */}
            {!isConnected && state.status === 'syncing' && (
              <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mt-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> Conexão instável...
              </p>
            )}
            {isConnected && state.currentItem && (
              <p className="text-sm text-slate-500 font-medium truncate mt-0.5 opacity-80">
                {state.currentItem}
              </p>
            )}
          </div>
          {/* Counter Pill */}
          {state.total > 0 && (
            <div className="px-3 py-1 bg-white/50 rounded-full border border-black/5 text-xs font-bold text-slate-600 whitespace-nowrap shadow-sm backdrop-blur-md">
              {state.current} / {state.total}
            </div>
          )}
        </div>

        {/* Progress Bar Section */}
        {(state.status === 'syncing' || state.status === 'error') && state.total > 0 && (
          <div className="space-y-2">
            <div className={`h-3 w-full rounded-full overflow-hidden ${styles.barBg}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${styles.barFill}`}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
              <span>{Math.round(progressPercentage)}% concluído</span>
              <span className="opacity-75">{state.type === 'upload' ? 'Enviando envios...' : 'Processando...'}</span>
            </div>
          </div>
        )}

        {/* Completion Stats Grid */}
        {state.status === 'completed' && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <span className="block text-xl font-bold text-emerald-700 leading-none">{state.succeeded}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500/80">Sucesso</span>
              </div>
            </div>
            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <span className="block text-xl font-bold text-rose-700 leading-none">{state.failed}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-rose-500/80">Falhas</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Details Collapsible */}
        {errors.length > 0 && (
          <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar bg-white/40 rounded-xl border border-rose-100 p-3">
            <p className="text-xs font-bold text-rose-700 mb-2 flex items-center gap-1.5 sticky top-0 bg-white/0 backdrop-blur-sm">
              <AlertTriangle className="h-3 w-3" /> Detalhes dos erros ({errors.length})
            </p>
            <ul className="space-y-2">
              {errors.map((err, idx) => (
                <li key={idx} className="text-xs p-2 rounded-lg bg-rose-50/80 border border-rose-100 text-rose-800">
                  <span className="font-bold block mb-0.5">{err.name}</span>
                  <span className="opacity-90">{err.message || 'Erro desconhecido'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
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

  // Premium Colors & Styles based on Status
  const getStatusStyles = () => {
    switch (progress.stage) {
      case 'starting':
      case 'diaries':
      case 'plans':
        return {
          container: "bg-white dark:bg-card border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/20 dark:shadow-none",
          iconBg: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-indigo-600 dark:bg-indigo-500",
          animation: "animate-pulse-subtle"
        }
      case 'completed':
        return {
          container: "bg-white dark:bg-card border-emerald-100 dark:border-emerald-900/50 shadow-xl shadow-emerald-100/20 dark:shadow-none",
          iconBg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-emerald-500 dark:bg-emerald-500",
          animation: ""
        }
      case 'error':
        return {
          container: "bg-white dark:bg-card border-rose-100 dark:border-rose-900/50 shadow-xl shadow-rose-100/20 dark:shadow-none",
          iconBg: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-rose-500 dark:bg-rose-500",
          animation: ""
        }
      default:
        return {
          container: "bg-white dark:bg-card border-slate-200 dark:border-border shadow-sm dark:shadow-none",
          iconBg: "bg-slate-50 dark:bg-secondary text-slate-500 dark:text-muted-foreground",
          title: "text-slate-900 dark:text-foreground",
          barBg: "bg-slate-100 dark:bg-slate-800",
          barFill: "bg-slate-400 dark:bg-slate-600",
          animation: ""
        }
    }
  }

  const styles = getStatusStyles()

  const getIcon = () => {
    switch (progress.stage) {
      case 'starting':
      case 'diaries':
      case 'plans':
        return <Loader2 className="h-6 w-6 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-6 w-6" />
      case 'error':
        return <XCircle className="h-6 w-6" />
      default:
        return <RefreshCw className="h-6 w-6" />
    }
  }

  const progressPercentage = getProgressValue()

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col gap-6 relative z-10 p-2">
        {/* Header Row */}
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${styles.iconBg} transition-colors duration-500`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`text-lg font-bold truncate leading-tight ${styles.title}`}>
              {progress.message}
            </h4>
            {/* Connection Status Subtitle */}
            {!isConnected && progress.stage !== 'completed' && (
              <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mt-1 animate-pulse">
                <AlertTriangle className="h-3 w-3" /> Conexão instável...
              </p>
            )}
            {isConnected && progress.diaryName && (
              <p className="text-sm text-slate-500 font-medium truncate mt-0.5 opacity-80">
                {progress.diaryName} {progress.planName && `→ ${progress.planName}`}
              </p>
            )}
          </div>
          {/* Counter Pill */}
          {progress.current !== undefined && progress.total !== undefined && (
            <div className="px-3 py-1 bg-white/50 rounded-full border border-black/5 text-xs font-bold text-slate-600 whitespace-nowrap shadow-sm backdrop-blur-md">
              {progress.current} / {progress.total}
            </div>
          )}
        </div>

        {/* Progress Bar Section */}
        {progress.stage !== 'completed' && progress.stage !== 'error' && (
          <div className="space-y-2">
            <div className={`h-3 w-full rounded-full overflow-hidden ${styles.barBg}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${styles.barFill}`}
                style={{ width: `${progressPercentage}%` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 skew-x-12 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
              <span>{Math.round(progressPercentage)}% concluído</span>
              <span className="opacity-75">Processando...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
