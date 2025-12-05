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
    if (!progress.current || !progress.total) return 0
    return (progress.current / progress.total) * 100
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
    <Card className={`${getColor()} border-2`}>
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
          {progress.stage !== 'completed' && progress.stage !== 'error' && progress.current && progress.total && (
            <Progress value={getProgressValue()} className="h-2" />
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
