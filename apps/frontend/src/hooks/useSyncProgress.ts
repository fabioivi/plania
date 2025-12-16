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
    console.log('🔵 useSyncProgress: Iniciando conexão SSE...')

    // Disconnect existing connection
    if (eventSourceRef.current) {
      console.log('⚠️ useSyncProgress: Fechando conexão existente')
      eventSourceRef.current.close()
    }

    const baseURL = api.defaults.baseURL || '/api';
    const token = localStorage.getItem('token')

    if (!token) {
      console.error('❌ useSyncProgress: Token não encontrado no localStorage')
      return
    }

    // Enviar token via query parameter (EventSource não suporta headers customizados)
    const url = `${baseURL}/sync/events?token=${encodeURIComponent(token)}`

    console.log('🔗 useSyncProgress: Conectando a:', `${baseURL}/sync/events`)

    // EventSource envia cookies automaticamente (credenciais same-origin)
    const eventSource = new EventSource(url)

    eventSource.onopen = () => {
      console.log('✅ useSyncProgress: Conexão SSE estabelecida!')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SyncProgress = JSON.parse(event.data)
        console.log('📊 useSyncProgress: Evento recebido:', data)
        setProgress(data)
      } catch (error) {
        console.error('❌ useSyncProgress: Erro ao parsear mensagem SSE:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ useSyncProgress: Erro na conexão SSE:', error)
      console.log('ReadyState:', eventSource.readyState)
      setIsConnected(false)

      // Não fechar imediatamente, deixar tentar reconectar
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔴 useSyncProgress: Conexão fechada pelo servidor')
      }
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
