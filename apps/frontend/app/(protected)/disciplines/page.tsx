'use client'

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { BookOpen, Search, Filter, RefreshCw, Loader2, SearchX, X, GraduationCap, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useEffect, useState, useRef } from "react"
import { useSyncProgress } from "@/hooks/useSyncProgress"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"
import { useDiaries, useSyncDiaries, useCredentials } from "@/hooks/api"
import { toast } from "sonner"
import { DiaryCard } from "./DiaryCard"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"
import { cn } from "@/lib/utils"


export default function DisciplinesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  // React Query hooks
  const { data: diaries = [], isLoading: loading } = useDiaries()
  const { mutate: syncDiaries } = useSyncDiaries()

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCursos, setSelectedCursos] = useState<string[]>([])
  const [selectedPeriodos, setSelectedPeriodos] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isFilterOpen &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node) &&
        filterTriggerRef.current &&
        !filterTriggerRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isFilterOpen])

  // Derived filters
  const uniqueCursos = useMemo(() => {
    const cursos = diaries.map(d => d.curso).filter(Boolean) as string[]
    return Array.from(new Set(cursos)).sort()
  }, [diaries])

  const uniquePeriodos = useMemo(() => {
    const periodos = diaries.map(d => d.periodo).filter(Boolean) as string[]
    return Array.from(new Set(periodos)).sort()
  }, [diaries])

  const filteredDiaries = useMemo(() => {
    return diaries.filter(diary => {
      const normalizeText = (text: string) =>
        text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

      const searchNormalized = normalizeText(searchTerm)

      const matchesSearch =
        !searchTerm ||
        [diary.disciplina, diary.turma, diary.curso, diary.periodo]
          .some(field => field && normalizeText(field).includes(searchNormalized))

      const matchesCurso = selectedCursos.length === 0 || (diary.curso && selectedCursos.includes(diary.curso))
      const matchesPeriodo = selectedPeriodos.length === 0 || (diary.periodo && selectedPeriodos.includes(diary.periodo))

      return matchesSearch && matchesCurso && matchesPeriodo
    })
  }, [diaries, searchTerm, selectedCursos, selectedPeriodos])

  const toggleCurso = (curso: string) => {
    setSelectedCursos(prev =>
      prev.includes(curso)
        ? prev.filter(c => c !== curso)
        : [...prev, curso]
    )
  }

  const togglePeriodo = (periodo: string) => {
    setSelectedPeriodos(prev =>
      prev.includes(periodo)
        ? prev.filter(p => p !== periodo)
        : [...prev, periodo]
    )
  }

  const activeFiltersCount = selectedCursos.length + selectedPeriodos.length

  const clearAllFilters = () => {
    setSearchTerm('')
    setSelectedCursos([])
    setSelectedPeriodos([])
  }

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-foreground tracking-tight leading-tight">
            Minhas Disciplinas
          </h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 font-medium">
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

        <div>
          <Button
            onClick={handleSync}
            disabled={syncState?.status === 'syncing'}
            className="h-14 px-8 rounded-2xl bg-white dark:bg-card hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-600 shadow-sm dark:shadow-none hover:shadow-xl dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300 font-bold text-base group"
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
        <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 shadow-xl shadow-indigo-100/50 dark:shadow-none animate-in fade-in slide-in-from-top-4 duration-500">
          <SyncProgressDisplay
            state={syncState}
            progress={progress}
            isConnected={isConnected}
          />
        </div>
      )}

      {/* Filters and Search Toolbar */}
      <div className="bg-white dark:bg-card p-2 rounded-2xl border border-slate-200 dark:border-border shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row gap-2 sticky top-4 z-20 backdrop-blur-xl bg-white/90 dark:bg-card/90">
        <div className="relative flex-1 group">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 bg-slate-100 dark:bg-secondary rounded-lg group-focus-within:bg-indigo-100 dark:group-focus-within:bg-indigo-900/50 transition-colors">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
          </div>
          <Input
            placeholder="Buscar por nome da disciplina, turma ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-14 h-14 rounded-xl border-2 border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-secondary/20 hover:border-indigo-100 dark:hover:border-indigo-900/30 focus-visible:bg-white dark:focus-visible:bg-secondary/20 focus-visible:border-indigo-500 focus-visible:ring-0 text-base font-medium transition-all"
          />
        </div>
        <div className="relative">
          <Button
            ref={filterTriggerRef}
            variant="ghost"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "h-14 px-6 rounded-xl font-bold relative transition-all duration-300",
              isFilterOpen || activeFiltersCount > 0
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/50"
                : "text-slate-600 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            )}
          >
            <Filter className={cn("mr-2 h-4 w-4 transition-transform duration-300", isFilterOpen ? "rotate-90" : "")} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Custom Dropdown Panel */}
          {isFilterOpen && (
            <div
              ref={filterDropdownRef}
              className="absolute top-full right-0 mt-3 w-[400px] bg-white dark:bg-card rounded-3xl shadow-2xl border border-slate-100 dark:border-border z-40 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 p-6"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50 dark:border-border">
                <h3 className="text-lg font-bold text-slate-800 dark:text-foreground">Filtrar Disciplinas</h3>
                {activeFiltersCount > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Limpar tudo
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsFilterOpen(false)}><X className="h-4 w-4 text-slate-400" /></Button>
                )}
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {/* Cursos Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <GraduationCap className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Cursos</h4>
                  </div>
                  <div className="space-y-1">
                    {uniqueCursos.map(curso => (
                      <div
                        key={curso}
                        onClick={() => toggleCurso(curso)}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                          selectedCursos.includes(curso)
                            ? "bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
                            : "bg-white dark:bg-card border-transparent hover:bg-slate-50 dark:hover:bg-secondary/20 hover:border-slate-200 dark:hover:border-border"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                          selectedCursos.includes(curso)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 group-hover:border-indigo-400"
                        )}>
                          {selectedCursos.includes(curso) && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-colors select-none",
                          selectedCursos.includes(curso) ? "text-indigo-900 dark:text-indigo-300" : "text-slate-600 dark:text-muted-foreground"
                        )}>{curso}</span>
                      </div>
                    ))}
                    {uniqueCursos.length === 0 && (
                      <p className="text-xs text-slate-400 italic pl-2">Nenhum curso encontrado.</p>
                    )}
                  </div>
                </div>

                {/* Periodos Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Clock className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Períodos</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {uniquePeriodos.map(periodo => (
                      <div
                        key={periodo}
                        onClick={() => togglePeriodo(periodo)}
                        className={cn(
                          "group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border",
                          selectedPeriodos.includes(periodo)
                            ? "bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
                            : "bg-white dark:bg-card border-transparent hover:bg-slate-50 dark:hover:bg-secondary/20 hover:border-slate-200 dark:hover:border-border"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                          selectedPeriodos.includes(periodo)
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 group-hover:border-indigo-400"
                        )}>
                          {selectedPeriodos.includes(periodo) && <span className="text-[10px] font-bold">✓</span>}
                        </div>
                        <span className={cn(
                          "flex-1 text-sm font-medium transition-colors select-none",
                          selectedPeriodos.includes(periodo) ? "text-indigo-900 dark:text-indigo-300" : "text-slate-600 dark:text-muted-foreground"
                        )}>{periodo}</span>
                      </div>
                    ))}
                    {uniquePeriodos.length === 0 && (
                      <p className="text-xs text-slate-400 italic pl-2 col-span-2">Nenhum período encontrado.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {filteredDiaries.length} resultados encontrados
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      {
        loading ? (
          <div className="flex flex-col items-center justify-center py-32 animate-pulse">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
            <p className="text-lg text-slate-600 font-bold">Carregando suas disciplinas...</p>
            <p className="text-slate-400">Isso pode levar alguns segundos.</p>
          </div>
        ) : diaries.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-card/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-slate-300 dark:border-border hover:border-indigo-300 hover:bg-white dark:hover:bg-card transition-all duration-300 group">
            <div className="w-24 h-24 bg-white dark:bg-card rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-100 dark:shadow-none bg-slate-50/50 group-hover:shadow-indigo-100 group-hover:scale-110 transition-all duration-500">
              <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors duration-300" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-foreground mb-3 tracking-tight">Comece sua Jornada</h3>
            <p className="text-slate-500 dark:text-muted-foreground max-w-lg mx-auto mb-10 font-medium text-lg leading-relaxed">
              Parece que você ainda não tem disciplinas. Sincronize com o sistema acadêmico para importar suas turmas automaticamente.
            </p>
            <Button onClick={handleSync} size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 dark:hover:shadow-none hover:-translate-y-1 transition-all text-lg font-bold">
              <RefreshCw className="mr-3 h-6 w-6" /> Importar Dados Agora
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ">
            {/* Using 3 columns on large screens for better density with the new compact cards */}
            {filteredDiaries.map((diary) => (
              <DiaryCard key={diary.id} diary={diary} />
            ))}
            {filteredDiaries.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-50 dark:bg-card rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-border">
                  <SearchX className="h-10 w-10 text-slate-300 dark:text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-foreground mb-2">Nenhum resultado encontrado</h3>
                <p className="text-slate-500 dark:text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                  Não conseguimos encontrar nenhuma disciplina com os termos ou filtros atuais. Tente ajustar sua busca.
                </p>
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="h-12 px-8 rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 font-semibold shadow-sm dark:shadow-none transition-all hover:shadow-md dark:hover:shadow-none"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar filtros e busca
                </Button>
              </div>
            )}
          </div>
        )
      }
    </div >
  )
}
