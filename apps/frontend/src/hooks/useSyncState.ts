import { useState, useCallback } from 'react'
import { SyncProgressState, SyncType, SyncItem } from '@/components/sync/SyncProgressDialog'

export function useSyncState(type: SyncType) {
  const [state, setState] = useState<SyncProgressState | null>(null)

  const startSync = useCallback((total: number, message?: string) => {
    setState({
      status: 'syncing',
      type,
      current: 0,
      total,
      succeeded: 0,
      failed: 0,
      items: [],
      message: message || (type === 'download' ? 'Baixando...' : type === 'upload' ? 'Enviando...' : 'Sincronizando...'),
    })
  }, [type])

  const updateProgress = useCallback((current: number, currentItem?: string) => {
    setState(prev => prev ? { ...prev, current, currentItem } : null)
  }, [])

  const addItem = useCallback((item: SyncItem) => {
    setState(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        items: [...prev.items, item],
        succeeded: prev.succeeded + (item.success ? 1 : 0),
        failed: prev.failed + (item.success ? 0 : 1),
      }
    })
  }, [])

  const complete = useCallback((message?: string, items?: SyncItem[]) => {
    setState(prev => {
      if (!prev) return null
      
      const finalItems = items || prev.items
      const succeeded = finalItems.filter(i => i.success).length
      const failed = finalItems.filter(i => !i.success).length
      
      return {
        ...prev,
        status: 'completed',
        items: finalItems,
        succeeded,
        failed,
        current: finalItems.length,
        message: message || (failed === 0 
          ? `${succeeded} ${succeeded === 1 ? 'item processado' : 'itens processados'} com sucesso!`
          : `Concluído: ${succeeded} sucesso, ${failed} falhas`
        ),
      }
    })
  }, [])

  const error = useCallback((message: string, items?: SyncItem[]) => {
    setState(prev => ({
      status: 'error',
      type: prev?.type || type,
      current: prev?.current || 0,
      total: prev?.total || 0,
      succeeded: prev?.succeeded || 0,
      failed: prev?.failed || 0,
      items: items || prev?.items || [],
      message,
    }))
  }, [type])

  const reset = useCallback(() => {
    setState(null)
  }, [])

  return {
    state,
    setState,
    startSync,
    updateProgress,
    addItem,
    complete,
    error,
    reset,
  }
}
