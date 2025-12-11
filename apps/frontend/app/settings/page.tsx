'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings as SettingsIcon, ArrowLeft, Lock, User, Database, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import { LLMConfigSection } from "@/components/settings/LLMConfigSection"
import { useCredentials, useSaveCredential, useTestCredential, useDeleteCredential } from "@/hooks/api"
import type { AcademicCredential } from "@/types"

export default function SettingsPage() {
  // React Query hooks
  const { data: credentials = [], isLoading: loadingCredential } = useCredentials()
  const { mutate: saveCredential, isPending: isSaving } = useSaveCredential()
  const { mutate: testCredential, isPending: isTesting } = useTestCredential()
  const { mutate: deleteCredential, isPending: isDeleting } = useDeleteCredential()

  // Local form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Get IFMS credential from list
  const credential = useMemo(() => {
    return credentials.find((c: AcademicCredential) => c.system === 'ifms') || null
  }, [credentials])

  // Update username when credential loads
  useMemo(() => {
    if (credential) {
      setUsername(credential.username)
    }
  }, [credential])

  const handleSave = () => {
    if (!username || !password) {
      toast.error('Preencha todos os campos')
      return
    }

    saveCredential({
      system: 'ifms',
      username,
      password,
    }, {
      onSuccess: () => {
        setPassword('') // Limpar senha do formulário
      }
    })
  }

  const handleTest = () => {
    if (!credential) {
      toast.error('Salve as credenciais antes de testar')
      return
    }

    testCredential(credential.id)
    // Toast messages are handled by the mutation
  }

  const handleDelete = () => {
    if (!credential) return

    if (!confirm('Tem certeza que deseja remover suas credenciais?')) {
      return
    }

    deleteCredential(credential.id, {
      onSuccess: () => {
        setUsername('')
        setPassword('')
      }
    })
  }

  const getStatusColor = () => {
    if (!credential) return 'bg-slate-400'
    if (credential.isVerified) return 'bg-green-500'
    if (credential.lastError) return 'bg-red-500'
    return 'bg-yellow-500'
  }

  const getStatusText = () => {
    if (!credential) return 'Não configurado'
    if (credential.isVerified) return 'Conectado'
    if (credential.lastError) return 'Erro na autenticação'
    return 'Aguardando verificação'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    try {
      const date = parseISO(dateString)
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      console.error('Erro ao formatar data:', dateString, error)
      return 'Data inválida'
    }
  }

  const getLastTestDate = () => {
    if (!credential) return 'Nunca'
    return formatDate(credential.lastTestedAt || credential.lastVerifiedAt)
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Configurações</h2>
          <p className="text-muted-foreground">
            Gerencie suas preferências e integrações
          </p>
        </div>

        <div className="space-y-6">
          {/* Sistema Acadêmico */}
          {loadingCredential ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">Carregando configurações...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Sistema Acadêmico IFMS</CardTitle>
                    <CardDescription>
                      Configure suas credenciais para importar dados automaticamente
                    </CardDescription>
                  </div>
                </div>
                {credential && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={isDeleting || isSaving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  🔒 Seus dados são criptografados e usados apenas para sincronizar suas disciplinas e horários
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Usuário / Matrícula
                  </Label>
                  <Input
                    id="username"
                    placeholder="Digite seu usuário do sistema acadêmico"
                    type="text"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                        disabled={isSaving || isDeleting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          placeholder={credential ? "Digite nova senha (deixe vazio para manter)" : "Digite sua senha"}
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                          disabled={isSaving || isDeleting}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                        >
                          {showPassword ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={handleSave}
                        disabled={isSaving || isTesting || isDeleting}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          credential ? 'Atualizar Credenciais' : 'Salvar Credenciais'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleTest}
                        disabled={!credential || isSaving || isTesting || isDeleting}
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          'Testar Conexão'
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Status da Conexão</p>
                        <p className="text-xs text-muted-foreground">
                          Último teste: {getLastTestDate()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor()}`}></div>
                        <span className="text-muted-foreground">{getStatusText()}</span>
                      </div>
                    </div>

                    {credential?.lastError && (
                      <Alert variant="destructive" className="mt-2">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Erro:</strong> {credential.lastError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
              </CardContent>
            </Card>
          )}

          {/* Preferências de IA */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-6 w-6 text-purple-600" />
                <div>
                  <CardTitle>Configurações de IA</CardTitle>
                  <CardDescription>
                    Configure suas chaves de API para geração de planos de ensino com IA
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <LLMConfigSection />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}
