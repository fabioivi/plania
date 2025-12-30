'use client'

import React, { useState, useMemo, useEffect } from "react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Lock,
  User,
  Database,
  Eye,
  EyeOff,
  XCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Moon,
  Sun,
  Monitor,
  Paintbrush
} from "lucide-react"

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"
import { LLMConfigSection } from "@/components/settings/LLMConfigSection"
import { useCredentials, useSaveCredential, useTestCredential, useDeleteCredential, useDeleteAllData } from "@/hooks/api"
import { useSyncProgress } from "@/hooks/useSyncProgress"
import type { AcademicCredential } from "@/types"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"

import { Building2 } from "lucide-react"

function DeleteDataButton() {
  const { mutate: deleteAllData, isPending } = useDeleteAllData()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending} className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/50 dark:hover:text-red-300 shadow-none font-bold transition-all duration-300">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Apagando...
            </>
          ) : (
            'Apagar Tudo'
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Isso excluirá permanentemente todos os seus diários importados e planos de ensino gerados.
            Suas credenciais serão mantidas, então você poderá sincronizar os dados novamente,
            mas perderá quaisquer planos gerados pela IA que não foram enviados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteAllData()}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Sim, apagar tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface CredentialCardProps {
  system: string
  title: string
  description: string
  icon: React.ElementType
  iconColorClass: string
  iconBgClass: string
  credential: AcademicCredential | null
  loadingCredential: boolean
  isSaving: boolean
  isTesting: boolean
  isDeleting: boolean
  onSave: (data: any) => void
  onTest: (id: string) => void
  onDelete: (id: string) => void
}

function CredentialCard({
  system,
  title,
  description,
  icon: Icon,
  iconColorClass,
  iconBgClass,
  credential,
  loadingCredential,
  isSaving,
  isTesting,
  isDeleting,
  onSave,
  onTest,
  onDelete
}: CredentialCardProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Update local state when credential changes (loaded from API)
  useEffect(() => {
    if (credential) {
      setUsername(credential.username)
    }
  }, [credential])

  const handleSave = () => {
    if (!username || !password) {
      toast.error('Preencha todos os campos')
      return
    }
    onSave({ system, username, password })
    // We don't clear password here to let user retry if needed, 
    // or if successful, parent component might trigger refresh.
    // Ideally, upon success, we clear password field for security if it's a new entry
    if (!credential) {
      setPassword('')
    }
  }

  const handleDelete = () => {
    if (!credential || !confirm('Tem certeza que deseja remover suas credenciais?')) return
    onDelete(credential.id)
    setUsername('')
    setPassword('')
  }

  const getStatusColor = () => {
    if (!credential) return 'bg-slate-300'
    if (credential.isVerified) return 'bg-emerald-500'
    if (credential.lastError) return 'bg-rose-500'
    return 'bg-blue-500 animate-pulse'
  }

  const getStatusText = () => {
    if (!credential) return 'Não configurado'
    if (credential.isVerified) return 'Conectado e Verificado'
    if (credential.lastError) return 'Erro na autenticação'
    return 'Verificando credenciais...'
  }

  const getLastTestDate = () => {
    if (!credential || (!credential.lastTestedAt && !credential.lastVerifiedAt)) return 'Nunca'
    const dateStr = credential.lastTestedAt || credential.lastVerifiedAt
    try {
      return format(parseISO(dateStr!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
      return 'Data inválida'
    }
  }

  const isVerifying = !!(credential && !credential.isVerified && !credential.lastError && !isTesting);

  return (
    <section className="bg-white dark:bg-card rounded-[2rem] border border-slate-200 dark:border-border shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 dark:border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`${iconBgClass} p-3 rounded-2xl`}>
              <Icon className={`h-8 w-8 ${iconColorClass}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">{title}</h2>
              <p className="text-slate-500 dark:text-muted-foreground font-medium">{description}</p>
            </div>
          </div>
          {credential && (
            <Button variant="ghost" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={handleDelete}>
              <Trash2 className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="p-8 space-y-6">
        {loadingCredential ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-3" /> Carregando...
          </div>
        ) : (
          <>
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-secondary/50 p-4 rounded-xl border border-slate-100 dark:border-border">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-1">Status da Conexão</p>
                <div className="flex items-center gap-2">
                  {isTesting || (credential && !credential.isVerified && !credential.lastError) ? (
                    <Loader2 className="h-3 w-3 text-indigo-600 animate-spin" />
                  ) : (
                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor()}`}></div>
                  )}
                  <span className="font-bold text-slate-700 dark:text-foreground">{isTesting ? 'Validando...' : getStatusText()}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-1">Última Verificação</p>
                <p className="font-bold text-slate-700 dark:text-foreground">{getLastTestDate()}</p>
              </div>
            </div>

            {/* Error Mesage */}
            {credential?.lastError && !isTesting && !isSaving && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                <XCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                <p className="text-rose-700 font-medium text-sm">{credential.lastError}</p>
              </div>
            )}

            {/* Form */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="pl-1 text-slate-700 dark:text-slate-200">Matrícula / Usuário</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder="Ex: usuário do sistema"
                    disabled={isSaving || isDeleting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="pl-1 text-slate-700 dark:text-slate-200">Senha do Portal</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                    placeholder={credential ? "••••••••" : "Sua senha"}
                    disabled={isSaving || isDeleting}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleSave}
                className="h-12 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                disabled={isSaving || isTesting || isDeleting || isVerifying}
              >
                {isSaving || isVerifying ? <Loader2 className="animate-spin mr-2" /> : null}
                {credential ? 'Atualizar Credenciais' : 'Conectar Agora'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onTest(credential!.id)}
                disabled={!credential || isSaving || isTesting}
                className="h-12 flex-1 border-slate-200 dark:border-border font-bold text-slate-700 dark:text-foreground rounded-xl"
              >
                {isTesting ? <Loader2 className="animate-spin mr-2" /> : 'Testar Conexão'}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default function SettingsPage() {
  const { setTheme, theme } = useTheme()
  const queryClient = useQueryClient()
  const { data: credentials = [], isLoading: loadingCredential } = useCredentials()
  const { mutate: saveCredential, isPending: isSaving } = useSaveCredential()
  const { mutate: testCredential, isPending: isTesting } = useTestCredential()
  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential()

  const ifmsCredential = useMemo(() => {
    return credentials.find((c: AcademicCredential) => c.system === 'ifms') || null
  }, [credentials])

  const suapCredential = useMemo(() => {
    return credentials.find((c: AcademicCredential) => c.system === 'suap') || null
  }, [credentials])

  // Polling for credential status if verifying
  const { connect, disconnect, progress } = useSyncProgress()

  // Connect to SSE on mount
  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // Listen for credential updates via SSE
  useEffect(() => {
    if (progress?.stage === 'credential-status') {
      console.log('📡 [SettingsPage] SSE Received credential update:', progress)
      queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })
      // Optional: Toast is already handled by useTestCredential mutation, but this acts as backup for background verification updates
    }
  }, [progress, queryClient])

  const handleSave = (data: any) => {
    console.log('💾 [SettingsPage] handleSave triggered for:', data.system)
    saveCredential(data, {
      onSuccess: () => {
        console.log('✅ [SettingsPage] saveCredential SUCCESS')
        toast.info('Credenciais salvas. Verificando acesso...')
      },
      onError: (error) => {
        console.error('❌ [SettingsPage] saveCredential ERROR:', error)
      }
    })
  }

  const handleTest = (id: string) => {
    console.log('🧪 [SettingsPage] handleTest triggered for ID:', id)
    testCredential(id, {
      onSuccess: (data) => {
        console.log('✅ [SettingsPage] testCredential SUCCESS:', data)
      },
      onError: (error) => {
        console.error('❌ [SettingsPage] testCredential ERROR:', error)
      }
    })
  }

  const handleDelete = (id: string) => {
    deleteCredential(id)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-foreground tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 font-medium">Gerencie suas conexões e preferências de IA.</p>
        </div>
      </div>

      {/* Alerts - Show for ifms as primary or just generic */}
      {(!ifmsCredential?.isVerified && !suapCredential?.isVerified) ? (
        <div className="bg-white dark:bg-card border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-8 shadow-xl shadow-indigo-100/50 dark:shadow-none flex items-center gap-6 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-2xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>

          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/50 group-hover:bg-indigo-600 transition-colors duration-500 relative z-10">
            <AlertTriangle className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors duration-500" />
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-slate-800 dark:text-foreground text-lg">Atenção Necessária</h4>
            <p className="text-slate-600 dark:text-muted-foreground font-medium leading-relaxed">
              É necessário ativar uma credencial (IFMS ou SUAP) para <span className="text-indigo-600 font-bold">sincronizar seus diários</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/50 rounded-3xl p-8 shadow-xl shadow-emerald-100/50 dark:shadow-none flex items-center gap-6 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-2xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>

          <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-900/50 group-hover:bg-emerald-600 transition-colors duration-500 relative z-10">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors duration-500" />
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-slate-800 dark:text-foreground text-lg">Tudo Certo!</h4>
            <p className="text-slate-600 dark:text-muted-foreground font-medium leading-relaxed">
              Sua conta está <span className="text-emerald-600 font-bold">conectada e pronta para uso</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-8">

        {/* IFMS Card */}
        <CredentialCard
          system="ifms"
          title="Sistema Acadêmico - IFMS"
          description="Conexão com o Portal do Professor do IFMS (Q-Acadêmico)"
          icon={Database}
          iconColorClass="text-blue-600 dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-950/20"
          credential={ifmsCredential}
          loadingCredential={loadingCredential}
          isSaving={isSaving}
          isTesting={isTesting}
          isDeleting={isDeleting}
          onSave={handleSave}
          onTest={handleTest}
          onDelete={handleDelete}
        />

        {/* SUAP Card */}
        <CredentialCard
          system="suap"
          title="Sistema Acadêmico - SUAP"
          description="Conexão com o Sistema Unificado de Administração Pública"
          icon={Building2}
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/20"
          credential={suapCredential}
          loadingCredential={loadingCredential}
          isSaving={isSaving}
          isTesting={isTesting}
          isDeleting={isDeleting}
          onSave={handleSave}
          onTest={handleTest}
          onDelete={handleDelete}
        />

        {/* AI Configuration */}
        <section className="bg-white dark:bg-card rounded-[2rem] border border-slate-200 dark:border-border shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-border flex items-center gap-4">
            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-2xl">
              <BrainCircuit className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">Inteligência Artificial</h2>
              <p className="text-slate-500 dark:text-muted-foreground font-medium">Configure o modelo LLM para geração de planos</p>
            </div>
          </div>
          <div className="p-8">
            <LLMConfigSection />
          </div>
        </section>

        {/* Appearance Configuration */}
        <section className="bg-white dark:bg-card rounded-[2rem] border border-slate-200 dark:border-border shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-border/50 flex items-center gap-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-2xl">
              <Paintbrush className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">Aparência</h2>
              <p className="text-slate-500 dark:text-muted-foreground font-medium">Personalize a experiência visual da plataforma</p>
            </div>
          </div>
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div>
                <Label className="text-base font-semibold text-slate-900 dark:text-foreground">Tema</Label>
                <p className="text-sm text-slate-500 dark:text-muted-foreground mt-1">
                  Escolha como você prefere visualizar a interface.
                </p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-secondary/50 border-slate-200 dark:border-border text-slate-900 dark:text-foreground">
                  <SelectValue placeholder="Selecione o tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Claro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Escuro</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>Sistema</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white dark:bg-card rounded-[2rem] border border-slate-200 dark:border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="p-8 border-b border-slate-100 dark:border-border/50 flex items-center gap-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-foreground">Zona de Perigo</h2>
              <p className="text-slate-500 dark:text-muted-foreground font-medium">Ações irreversíveis e gerenciamento de dados</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-950/5">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-foreground">Apagar Dados Acadêmicos</h4>
                <p className="text-sm text-slate-500 dark:text-muted-foreground font-medium">Remove todos os diários e planos gerados. Suas credenciais serão mantidas.</p>
              </div>
              <DeleteDataButton />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
