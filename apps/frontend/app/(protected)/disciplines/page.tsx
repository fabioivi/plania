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
    <div className="space-y-6 min-h-screen pb-20">
      {/* Top Decoration Removed */}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Minhas Disciplinas
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gerencie suas turmas, planos de ensino e diários de classe em um só lugar.
          </p>
          {diaries.length > 0 && (
            <div className="flex items-center gap-1.5 pt-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sincronizado: {formatLastSync()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <Button
            onClick={handleSync}
            disabled={syncState?.status === 'syncing'}
            className="h-14 px-8 rounded-2xl bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 font-bold text-base group"
          >
            {syncState?.status === 'syncing' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5 transition-transform group-hover:rotate-180 duration-700" /> Sincronizar Tudo
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sync State Display - Floating Card style */}
      {(syncState || (progress && !syncState)) && (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
          <SyncProgressDisplay
            state={syncState}
            progress={progress}
            isConnected={isConnected}
          />
        </div>
      )}

      {/* Filters and Search Toolbar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 flex flex-col md:flex-row gap-2 sticky top-4 z-20 backdrop-blur-xl bg-white/90">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 bg-slate-100 rounded-lg group-focus-within:bg-indigo-100 transition-colors">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <Input
            placeholder="Buscar por nome da disciplina, turma ou curso..."
            className="pl-14 h-14 rounded-xl border-transparent bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 text-base font-medium transition-all"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-14 px-6 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold">
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 animate-pulse">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
          <p className="text-lg text-slate-600 font-bold">Carregando suas disciplinas...</p>
          <p className="text-slate-400">Isso pode levar alguns segundos.</p>
        </div>
      ) : diaries.length === 0 ? (
        <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-slate-300 hover:border-indigo-300 hover:bg-white transition-all duration-300 group">
          <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-100 group-hover:shadow-indigo-100 group-hover:scale-110 transition-all duration-500">
            <BookOpen className="h-10 w-10 text-slate-300 group-hover:text-indigo-500 transition-colors duration-300" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Comece sua Jornada</h3>
          <p className="text-slate-500 max-w-lg mx-auto mb-10 font-medium text-lg leading-relaxed">
            Parece que você ainda não tem disciplinas. Sincronize com o sistema acadêmico para importar suas turmas automaticamente.
          </p>
          <Button onClick={handleSync} size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all text-lg font-bold">
            <RefreshCw className="mr-3 h-6 w-6" /> Importar Dados Agora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ">
          {/* Using 3 columns on large screens for better density with the new compact cards */}
          {diaries.map((diary) => (
            <DiaryCard key={diary.id} diary={diary} />
          ))}
        </div>
      )}
    </div>
  )
}
