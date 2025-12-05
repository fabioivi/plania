'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, FileText, Sparkles, ArrowRight, Plus, Settings, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"

export default function DashboardPage() {
  const { user } = useAuth()
  
  const getFirstName = (fullName?: string) => {
    if (!fullName) return "Professor"
    return fullName.split(' ')[0]
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta, {getFirstName(user?.name)}! 👋</h2>
          <p className="text-muted-foreground">
            Gerencie seus planos de ensino e disciplinas com inteligência artificial
          </p>
        </div>

        {/* Alert - Configuração Sistema Acadêmico */}
        <Alert className="mb-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950/30">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
            Configure sua conta do Sistema Acadêmico IFMS
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <p className="mb-3">
              Para começar a utilizar o PlanIA e importar automaticamente seus dados (disciplinas, horários e diários), 
              você precisa configurar suas credenciais de acesso ao Sistema Acadêmico do IFMS.
            </p>
            <Link href="/settings">
              <Button variant="default" size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
                <Settings className="h-4 w-4" />
                Configurar Agora
              </Button>
            </Link>
          </AlertDescription>
        </Alert>

        {/* Quick Action */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Gerar Plano com IA</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Crie um plano de ensino completo em 5-10 minutos com assistência de IA. 
                  Nossa inteligência artificial analisa suas disciplinas e gera conteúdo personalizado.
                </p>
                <Link href="/generate">
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Começar Geração com IA
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="hidden lg:flex items-center justify-center w-48 h-48 ml-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                  <Sparkles className="relative h-24 w-24 text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disciplinas Ativas
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground mt-1">
                +2 desde o último semestre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Planos Gerados
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">8</div>
              <p className="text-xs text-muted-foreground mt-1">
                4 aguardando envio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Economia de Tempo
              </CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">~12h</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo economizado com IA
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Plans */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold">Planos Recentes</h3>
            <Link href="/plans">
              <Button variant="ghost" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Cálculo Diferencial e Integral I</CardTitle>
                    <CardDescription className="mt-1">Ciências Exatas • 2024.2</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                    Rascunho
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Plano gerado em 18/11/2024 • Última edição: 25/11/2024
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    Continuar Edição
                  </Button>
                  <Button size="sm" variant="outline">
                    Pré-visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Álgebra Linear</CardTitle>
                    <CardDescription className="mt-1">Ciências Exatas • 2024.2</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Enviado
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Plano gerado em 15/11/2024 • Enviado em 20/11/2024
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Ver Detalhes
                  </Button>
                  <Button size="sm" variant="ghost">
                    Duplicar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Física Experimental I</CardTitle>
                    <CardDescription className="mt-1">Ciências Exatas • 2024.2</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                    Em Revisão
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Plano gerado em 22/11/2024 • Última edição: hoje
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    Continuar Edição
                  </Button>
                  <Button size="sm" variant="outline">
                    Pré-visualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center h-full py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Criar Novo Plano</h4>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Gere um plano de ensino com IA em minutos
                </p>
                <Link href="/generate">
                  <Button variant="outline" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Gerar com IA
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-2xl font-bold mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/disciplines">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Gerenciar Disciplinas</h4>
                    <p className="text-sm text-muted-foreground">Sincronizar do sistema acadêmico</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/plans">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Ver Todos os Planos</h4>
                    <p className="text-sm text-muted-foreground">Acessar biblioteca completa</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/settings">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Configurações</h4>
                    <p className="text-sm text-muted-foreground">Preferências e integrações</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  )
}
