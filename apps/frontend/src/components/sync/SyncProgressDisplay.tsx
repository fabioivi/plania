"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2, XCircle, RefreshCw } from "lucide-react"
import { SyncProgress } from "@/hooks/useSyncProgress"

interface SyncProgressDisplayProps {
  progress: SyncProgress | null
  isConnected: boolean
}

export function SyncProgressDisplay({ progress, isConnected }: SyncProgressDisplayProps) {
  if (!progress) return null

  const getProgressValue = () => {
    // Se não tem current ou total, começa em 0
    if (!progress.current || !progress.total) return 0

    // Calcula a porcentagem
    const percentage = (progress.current / progress.total) * 100

    // Garante que está entre 0 e 100
    return Math.min(Math.max(percentage, 0), 100)
  }

  const getIcon = () => {
    switch (progress.stage) {
      case 'starting':
      case 'diaries':
      case 'plans':
        return <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
      default:
        return <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    }
  }

  const getColor = () => {
    switch (progress.stage) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
      case 'error':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
      default:
        return 'bg-white dark:bg-card border-slate-200 dark:border-border'
    }
  }

  return (
    <Card className={`${getColor()} border-2`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1 space-y-1">
              <p className="font-medium text-sm text-slate-600 dark:text-muted-foreground leading-relaxed">
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
                <p className="text-xs text-slate-500 dark:text-slate-300">
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
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Conexão perdida. Reconectando...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
