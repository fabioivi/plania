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
  BrainCircuit
} from "lucide-react"

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/api/query-client"
import { LLMConfigSection } from "@/components/settings/LLMConfigSection"
import { useCredentials, useSaveCredential, useTestCredential, useDeleteCredential, useDeleteAllData } from "@/hooks/api"
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

function DeleteDataButton() {
  const { mutate: deleteAllData, isPending } = useDeleteAllData()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending} className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 shadow-none font-bold">
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
            Suas credenciais do IFMS serão mantidas, então você poderá sincronizar os dados novamente,
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

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: credentials = [], isLoading: loadingCredential } = useCredentials()
  const { mutate: saveCredential, isPending: isSaving } = useSaveCredential()
  const { mutate: testCredential, isPending: isTesting } = useTestCredential()
  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const credential = useMemo(() => {
    return credentials.find((c: AcademicCredential) => c.system === 'ifms') || null
  }, [credentials])

  useMemo(() => {
    if (credential) {
      setUsername(credential.username)
    }
  }, [credential])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (credential && !credential.isVerified && !credential.lastError) {
      interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.credentials.all })
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [credential, queryClient])

  const handleSave = () => {
    if (!username || !password) {
      toast.error('Preencha todos os campos')
      return
    }
    saveCredential({ system: 'ifms', username, password }, {
      onSuccess: () => {
        setPassword('')
        toast.info('Credenciais salvas. Verificando acesso...')
      }
    })
  }

  const handleTest = () => {
    if (!credential) {
      toast.error('Salve as credenciais antes de testar')
      return
    }
    testCredential(credential.id)
  }

  const handleDelete = () => {
    if (!credential || !confirm('Tem certeza que deseja remover suas credenciais?')) return
    deleteCredential(credential.id, {
      onSuccess: () => {
        setUsername('')
        setPassword('')
      }
    })
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações</h1>
          <p className="text-slate-500 mt-2 font-medium">Gerencie suas conexões e preferências de IA.</p>
        </div>
      </div>

      {/* Alerts */}
      {!credential?.isVerified && (
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-xl shadow-indigo-100/50 flex items-center gap-6 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>

          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100 group-hover:bg-indigo-600 transition-colors duration-500 relative z-10">
            <AlertTriangle className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors duration-500" />
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-slate-800 text-lg">Atenção Necessária</h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              É necessário ativar uma credencial do IFMS para <span className="text-indigo-600 font-bold">sincronizar seus diários</span>.
            </p>
          </div>
        </div>
      )}

      {credential?.isVerified && (
        <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-xl shadow-emerald-100/50 flex items-center gap-6 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-50 group-hover:scale-125 transition-transform duration-700"></div>

          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-emerald-100 group-hover:bg-emerald-600 transition-colors duration-500 relative z-10">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 group-hover:text-white transition-colors duration-500" />
          </div>

          <div className="relative z-10">
            <h4 className="font-bold text-slate-800 text-lg">Tudo Certo!</h4>
            <p className="text-slate-600 font-medium leading-relaxed">
              Sua credencial do IFMS está <span className="text-emerald-600 font-bold">conectada e operando normalmente</span>.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-8">
        {/* Academic System Card */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl">
                  <Database className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sistema Acadêmico</h2>
                  <p className="text-slate-500 font-medium">Conexão com o Portal do Professor do IFMS</p>
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
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status da Conexão</p>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor()}`}></div>
                      <span className="font-bold text-slate-700">{getStatusText()}</span>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Última Verificação</p>
                    <p className="font-bold text-slate-700">{getLastTestDate()}</p>
                  </div>
                </div>

                {/* Error Mesage */}
                {credential?.lastError && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 mt-0.5" />
                    <p className="text-rose-700 font-medium text-sm">{credential.lastError}</p>
                  </div>
                )}

                {/* Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="pl-1">Matrícula / Usuário</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200"
                        placeholder="Ex: 1234567"
                        disabled={isSaving || isDeleting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="pl-1">Senha do Portal</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-200"
                        placeholder={credential ? "••••••••" : "Sua senha"}
                        disabled={isSaving || isDeleting}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    className="h-12 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200"
                    disabled={isSaving || isTesting || isDeleting}
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" /> : null}
                    {credential ? 'Atualizar Credenciais' : 'Conectar Agora'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTest}
                    disabled={!credential || isSaving || isTesting}
                    className="h-12 flex-1 border-slate-200 font-bold text-slate-700 rounded-xl"
                  >
                    {isTesting ? <Loader2 className="animate-spin mr-2" /> : 'Testar Conexão'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* AI Configuration */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center gap-4">
            <div className="bg-purple-50 p-3 rounded-2xl">
              <BrainCircuit className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Inteligência Artificial</h2>
              <p className="text-slate-500 font-medium">Configure o modelo LLM para geração de planos</p>
            </div>
          </div>
          <div className="p-8">
            <LLMConfigSection />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="border border-rose-100 bg-rose-50/30 rounded-[2rem] p-8">
          <h3 className="text-lg font-bold text-rose-700 mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Zona de Perigo
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-rose-100">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">Apagar Dados Acadêmicos</h4>
              <p className="text-sm text-slate-500 font-medium">Remove todos os diários e planos gerados. Suas credenciais serão mantidas.</p>
            </div>
            <DeleteDataButton />
          </div>
        </section>
      </div>
    </div>
  )
}
