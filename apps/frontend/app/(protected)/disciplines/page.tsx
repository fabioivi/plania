'use client'

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { BookOpen, Search, Filter, RefreshCw, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useEffect, useState } from "react"
import { useSyncProgress } from "@/hooks/useSyncProgress"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"
import { useDiaries, useSyncDiaries, useCredentials } from "@/hooks/api"
import { toast } from "sonner"
import { DiaryCard } from "./DiaryCard"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"


export default function DisciplinesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  // React Query hooks
  const { data: diaries = [], isLoading: loading } = useDiaries()
  const { mutate: syncDiaries } = useSyncDiaries()

  // Sistema de sincronização genérico
  const { state: syncState, startSync, complete, error: syncError, reset } = useSyncState('download')

  // Hook de progresso SSE (mantido para compatibilidade)
  const { progress, isConnected, connect, disconnect } = useSyncProgress()

  // Calculate last sync from diaries
  const lastSync = useMemo(() => {
    if (diaries.length === 0) return null
    const mostRecent = diaries.reduce((latest, diary) => {
      return new Date(diary.updatedAt) > new Date(latest.updatedAt) ? diary : latest
    })
    return new Date(mostRecent.updatedAt)
  }, [diaries])

  // Check for verified credential to enable/disable sync
  const { data: credentials = [] } = useCredentials()
  const hasVerifiedCredential = useMemo(() => {
    return credentials.some(c => c.system === 'ifms' && c.isVerified)
  }, [credentials])

  const handleSync = async () => {
    if (!hasVerifiedCredential) {
      toast.warning('É preciso cadastrar e verificar sua credencial do IFMS antes de utilizar o sistema.')
      router.push('/settings')
      return
    }

    try {
      startSync(1, 'Conectando ao servidor...')

      // Conectar ao SSE para receber atualizações em tempo real
      connect()

      // Aguardar um pouco para garantir que SSE conectou
      await new Promise(resolve => setTimeout(resolve, 500))

      // Use the React Query mutation
      syncDiaries(undefined, {
        onError: (err: any) => {
          syncError(err.response?.data?.message || 'Erro ao sincronizar diários', [{
            id: 'ERROR',
            name: 'Erro de sincronização',
            success: false,
            message: err.response?.data?.message || err.message
          }])
          disconnect()
        }
      })
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err)
      syncError(err.response?.data?.message || 'Erro ao sincronizar diários', [{
        id: 'ERROR',
        name: 'Erro de sincronização',
        success: false,
        message: err.response?.data?.message || err.message
      }])
      disconnect()
    }
  }

  // Detectar quando sincronização termina pelo progresso SSE
  useEffect(() => {
    if (progress?.stage === 'completed') {
      complete('Sincronização concluída com sucesso!')
      queryClient.invalidateQueries({ queryKey: queryKeys.diaries.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachingPlans.all })
      setTimeout(() => {
        disconnect()
        reset()
      }, 2000)
    } else if (progress?.stage === 'error') {
      syncError(progress.message || 'Erro na sincronização')
      setTimeout(() => {
        disconnect()
      }, 2000)
    }
  }, [progress, complete, syncError, disconnect, reset, queryClient])

  // State for live time updates
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca'
    const syncTime = new Date(lastSync)
    const diff = currentTime.getTime() - syncTime.getTime()
    if (diff < 0) return 'Agora mesmo'
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (minutes < 1) return 'Agora mesmo'
    if (minutes < 60) return `Há ${minutes} minuto${minutes !== 1 ? 's' : ''}`
    if (hours < 24) return `Há ${hours} hora${hours !== 1 ? 's' : ''}`
    if (days < 7) return `Há ${days} dia${days !== 1 ? 's' : ''}`
    return syncTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Minhas Disciplinas</h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gerencie e sincronize suas turmas do sistema acadêmico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {diaries.length > 0 && (
            <span className="text-sm font-bold text-slate-400">
              Última atualização: {formatLastSync()}
            </span>
          )}
          <Button
            onClick={handleSync}
            disabled={syncState?.status === 'syncing'}
            className="h-12 px-6 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100 shadow-sm font-bold"
          >
            {syncState?.status === 'syncing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar Tudo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync State Display */}
      {(syncState || (progress && !syncState)) && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-fade-in">
          <SyncProgressDisplay
            state={syncState}
            progress={progress}
            isConnected={isConnected}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar por nome da disciplina ou turma..."
            className="pl-12 h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-500 font-medium">Carregando suas disciplinas...</p>
        </div>
      ) : diaries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhuma disciplina encontrada</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
            Parece que você ainda não sincronizou seus dados. Conecte-se ao sistema acadêmico para importar suas turmas.
          </p>
          <Button onClick={handleSync} size="lg" className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200">
            <RefreshCw className="mr-2 h-5 w-5" /> Importar do Sistema Acadêmico
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {diaries.map((diary) => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>
      )}
    </div>
  )
}
