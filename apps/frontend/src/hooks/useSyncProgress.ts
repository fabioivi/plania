import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '../services/api'

export interface SyncProgress {
  stage: 'starting' | 'diaries' | 'plans' | 'completed' | 'error'
  message: string
  current?: number
  total?: number
  diaryName?: string
  planName?: string
}

export function useSyncProgress() {
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  const connect = useCallback(() => {
    // Disconnect existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No auth token available')
      return
    }

    const baseURL = api.defaults.baseURL || 'http://localhost:3333'
    const url = `${baseURL}/sync/events`

    const eventSource = new EventSource(url, {
      withCredentials: true,
    })

    // Note: EventSource doesn't support custom headers directly
    // We need to append token as query param or use different approach
    // For now, JWT should be in cookie or we need WebSocket

    eventSource.onopen = () => {
      console.log('✅ SSE Connection established')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SyncProgress = JSON.parse(event.data)
        console.log('📊 Sync progress:', data)
        setProgress(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE Connection error:', error)
      setIsConnected(false)
      eventSource.close()
    }

    eventSourceRef.current = eventSource
  }, [])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
      setProgress(null)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    progress,
    isConnected,
    connect,
    disconnect,
  }
}
