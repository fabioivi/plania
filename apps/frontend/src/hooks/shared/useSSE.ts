/**
 * useSSE Hook
 * Generic hook for Server-Sent Events (SSE) connections
 * Consolidates SSE logic from multiple components (~150+ lines of duplicate code)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseSSEOptions<T = any> {
  url: string
  onMessage?: (data: T) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  autoConnect?: boolean
  enabled?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
}

export interface UseSSEReturn<T = any> {
  data: T | null
  isConnected: boolean
  error: Event | null
  connect: () => void
  disconnect: () => void
  readyState: number
}

/**
 * Generic hook for handling Server-Sent Events
 *
 * @example
 * ```tsx
 * const { data, isConnected, connect, disconnect } = useSSE<SyncProgress>({
 *   url: '/api/sync/events',
 *   onMessage: (data) => setProgress(data),
 *   autoConnect: true,
 * })
 * ```
 */
export function useSSE<T = any>(options: UseSSEOptions<T>): UseSSEReturn<T> {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    autoConnect = false,
    enabled = true,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Event | null>(null)
  const [readyState, setReadyState] = useState<number>(EventSource.CLOSED)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!enabled || !url) {
      console.warn('SSE connection disabled or URL not provided')
      return
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = new EventSource(url)

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
        setReadyState(EventSource.OPEN)
        setError(null)
        reconnectCountRef.current = 0
        onOpen?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data) as T
          setData(parsedData)
          onMessage?.(parsedData)
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE connection error:', err)
        setError(err)
        setIsConnected(false)
        setReadyState(EventSource.CLOSED)
        onError?.(err)

        // Auto-reconnect logic
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          console.log(
            `Reconnecting... (attempt ${reconnectCountRef.current}/${reconnectAttempts})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else {
          console.error('Max reconnection attempts reached')
          eventSource.close()
        }
      }

      eventSourceRef.current = eventSource
    } catch (err) {
      console.error('Error creating EventSource:', err)
    }
  }, [url, enabled, onMessage, onError, onOpen, reconnectAttempts, reconnectInterval])

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (eventSourceRef.current) {
      console.log('SSE connection closed')
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsConnected(false)
      setReadyState(EventSource.CLOSED)
    }
  }, [])

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect && enabled) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, enabled, connect, disconnect])

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    readyState,
  }
}

/**
 * Hook specifically for sync progress SSE
 * Pre-configured for sync operations
 */
export function useSyncProgressSSE(diaryId: string | undefined) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  const url = diaryId
    ? `${baseUrl}/sync/events?diaryId=${diaryId}&token=${token}`
    : ''

  return useSSE<{
    percentage: number
    message: string
    type?: string
  }>({
    url,
    enabled: !!diaryId,
    autoConnect: false, // Manual connection control
  })
}
