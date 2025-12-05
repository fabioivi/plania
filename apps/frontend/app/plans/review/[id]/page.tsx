"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { 
  ArrowLeft, 
  Sparkles, 
  FileText,
  Target,
  BookOpen,
  Calendar,
  Users,
  MessageSquare,
  Wand2,
  Upload,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { PlanHeader } from "@/components/layout/plan-header"

// Tipo para o cronograma
type WeekSchedule = {
  id: string
  week: number
  month: string
  period: string
  classes: number
  observations: string
  content: string
  teachingTechniques: string
  teachingResources: string
}

// Dados de exemplo
const weekScheduleData: WeekSchedule[] = [
  {
    id: "week-1",
    week: 1,
    month: "8 - Agosto",
    period: "12 a 16",
    classes: 1,
    observations: "",
    content: "Limites e Continuidade: Noção intuitiva de limite",
    teachingTechniques: "Aula prática, Expositiva/dialogada",
    teachingResources: "Projetor multimídia, Quadro branco/canetão"
  },
  {
    id: "week-2",
    week: 2,
    month: "8 - Agosto",
    period: "19 a 23",
    classes: 4,
    observations: "",
    content: "Limites e Continuidade: Definição formal e propriedades",
    teachingTechniques: "Aula prática, Estudo de caso, Expositiva/dialogada",
    teachingResources: "Biblioteca, Laboratório, Projetor multimídia, Quadro branco/canetão"
  },
  {
    id: "week-3",
    week: 3,
    month: "8 - Agosto",
    period: "26 a 30",
    classes: 4,
    observations: "",
    content: "Derivadas: Conceito e interpretação geométrica",
    teachingTechniques: "Expositiva/dialogada, Resolução de exercícios",
    teachingResources: "Quadro branco/canetão, Lista de exercícios"
  },
  {
    id: "week-4",
    week: 4,
    month: "9 - Setembro",
    period: "02 a 06",
    classes: 4,
    observations: "",
    content: "Derivadas: Regras de derivação",
    teachingTechniques: "Aula prática, Resolução de exercícios",
    teachingResources: "Laboratório, Projetor multimídia, Software matemático"
  },
  {
    id: "week-5",
    week: 5,
    month: "9 - Setembro",
    period: "09 a 13",
    classes: 4,
    observations: "",
    content: "Derivadas: Aplicações e problemas de otimização",
    teachingTechniques: "Estudo de caso, Resolução de problemas",
    teachingResources: "Biblioteca, Projetor multimídia, Artigos científicos"
  },
  {
    id: "week-6",
    week: 6,
    month: "9 - Setembro",
    period: "16 a 20",
    classes: 4,
    observations: "Semana de Ciência e Tecnologia",
    content: "Integrais Indefinidas: Conceito e técnicas básicas",
    teachingTechniques: "Expositiva/dialogada, Seminário",
    teachingResources: "Auditório, Projetor multimídia"
  },
  {
    id: "week-7",
    week: 7,
    month: "9 - Setembro",
    period: "23 a 27",
    classes: 4,
    observations: "",
    content: "Integrais Indefinidas: Métodos de integração",
    teachingTechniques: "Aula prática, Resolução de exercícios",
    teachingResources: "Quadro branco/canetão, Software matemático"
  },
  {
    id: "week-8",
    week: 8,
    month: "9 - Setembro",
    period: "30 a 04",
    classes: 4,
    observations: "",
    content: "Integrais Definidas: Teorema Fundamental do Cálculo",
    teachingTechniques: "Expositiva/dialogada, Demonstração",
    teachingResources: "Projetor multimídia, Quadro branco/canetão"
  },
  {
    id: "week-9",
    week: 9,
    month: "10 - Outubro",
    period: "07 a 11",
    classes: 4,
    observations: "",
    content: "Avaliação Parcial: Limites e Derivadas",
    teachingTechniques: "Avaliação escrita",
    teachingResources: "Sala de aula"
  },
  {
    id: "week-10",
    week: 10,
    month: "10 - Outubro",
    period: "14 a 18",
    classes: 4,
    observations: "",
    content: "Aplicações de Integrais: Cálculo de áreas",
    teachingTechniques: "Aula prática, Estudo de caso",
    teachingResources: "Laboratório, Software de visualização"
  },
  {
    id: "week-11",
    week: 11,
    month: "10 - Outubro",
    period: "21 a 25",
    classes: 4,
    observations: "",
    content: "Aplicações de Integrais: Volumes de sólidos de revolução",
    teachingTechniques: "Expositiva/dialogada, Demonstração prática",
    teachingResources: "Projetor multimídia, Modelos físicos"
  },
  {
    id: "week-12",
    week: 12,
    month: "10 - Outubro",
    period: "28 a 01",
    classes: 4,
    observations: "",
    content: "Funções de Várias Variáveis: Introdução e domínio",
    teachingTechniques: "Expositiva/dialogada, Visualização 3D",
    teachingResources: "Software matemático, Projetor multimídia"
  },
  {
    id: "week-13",
    week: 13,
    month: "11 - Novembro",
    period: "04 a 08",
    classes: 4,
    observations: "",
    content: "Derivadas Parciais: Conceito e interpretação",
    teachingTechniques: "Aula prática, Resolução de exercícios",
    teachingResources: "Quadro branco/canetão, Lista de exercícios"
  },
  {
    id: "week-14",
    week: 14,
    month: "11 - Novembro",
    period: "11 a 15",
    classes: 4,
    observations: "Recesso acadêmico",
    content: "Revisão geral de conteúdos",
    teachingTechniques: "Plantão de dúvidas, Resolução de exercícios",
    teachingResources: "Sala de aula, Material de apoio"
  },
  {
    id: "week-15",
    week: 15,
    month: "11 - Novembro",
    period: "18 a 22",
    classes: 4,
    observations: "",
    content: "Integrais Múltiplas: Integrais duplas",
    teachingTechniques: "Expositiva/dialogada, Aula prática",
    teachingResources: "Projetor multimídia, Software matemático"
  },
  {
    id: "week-16",
    week: 16,
    month: "11 - Novembro",
    period: "25 a 29",
    classes: 4,
    observations: "",
    content: "Integrais Múltiplas: Aplicações em áreas e volumes",
    teachingTechniques: "Estudo de caso, Resolução de problemas",
    teachingResources: "Laboratório, Material digital"
  },
  {
    id: "week-17",
    week: 17,
    month: "12 - Dezembro",
    period: "02 a 06",
    classes: 4,
    observations: "",
    content: "Revisão Final: Todos os conteúdos",
    teachingTechniques: "Plantão de dúvidas, Resolução de exercícios",
    teachingResources: "Biblioteca, Sala de aula, Material complementar"
  },
  {
    id: "week-18",
    week: 18,
    month: "12 - Dezembro",
    period: "09 a 13",
    classes: 4,
    observations: "",
    content: "Avaliação Final: Prova integradora",
    teachingTechniques: "Avaliação escrita",
    teachingResources: "Sala de aula"
  },
]

// Definição das colunas
const columns: ColumnDef<WeekSchedule>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar todas"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Selecionar linha"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    id: "period",
    header: "Período",
    cell: ({ row }) => {
      const monthFull = row.original.month.split(" - ")[1] || row.original.month
      return (
        <div className="text-sm">
          <div className="font-medium">{monthFull}</div>
          <div className="text-sm">{row.original.period}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "classes",
    header: "Nº Aulas",
    cell: ({ row }) => (
      <Badge>{row.getValue("classes")}</Badge>
    ),
  },
  {
    accessorKey: "observations",
    header: "Observações",
    cell: ({ row }) => {
      const obs = row.getValue("observations") as string
      return obs ? (
        <Badge variant="secondary" className="text-xs">{obs}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">-</span>
      )
    },
  },
  {
    accessorKey: "content",
    header: "Conteúdo",
    cell: ({ row }) => (
      <div className="w-48 text-sm whitespace-normal">
        {row.getValue("content")}
      </div>
    ),
  },
  {
    accessorKey: "teachingTechniques",
    header: "Técnicas de Ensino",
    cell: ({ row }) => {
      const techniques = (row.getValue("teachingTechniques") as string).split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-xs">
          {techniques.map((technique, index) => (
            <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700">
              {technique}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "teachingResources",
    header: "Recursos de Ensino",
    cell: ({ row }) => {
      const resources = (row.getValue("teachingResources") as string).split(", ")
      return (
        <div className="flex gap-1.5 flex-wrap max-w-xs">
          {resources.map((resource, index) => (
            <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700">
              {resource}
            </Badge>
          ))}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      return (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // TODO: Abrir modal de edição
              console.log("Editar semana", row.original)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // TODO: Confirmar e excluir semana
              console.log("Excluir semana", row.original)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    },
  },
]

export default function PlanReviewPage() {
  const [showAiAssistant, setShowAiAssistant] = useState(true)
  const [aiPrompt, setAiPrompt] = useState("")
  const [isFilling, setIsFilling] = useState(false)
  const [fillSuccess, setFillSuccess] = useState(false)

  const handleFillDiary = async () => {
    setIsFilling(true)
    setFillSuccess(false)
    
    // Simular preenchimento automático do diário
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setIsFilling(false)
    setFillSuccess(true)
    
    // Remover mensagem de sucesso após 5 segundos
    setTimeout(() => setFillSuccess(false), 5000)
  }

  return (
    <div className="min-h-screen bg-background">
      <PlanHeader 
        planTitle="Cálculo Diferencial e Integral I"
        planInfo="2024.2 • 60h"
        status="draft"
      />

      <div className="flex">
        {/* Main Content */}
        <main className={`flex-1 container mx-auto py-8 px-4 transition-all ${showAiAssistant ? 'max-w-5xl' : 'max-w-7xl'}`}>
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>

          {/* Plan Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Plano de Ensino</h1>
                <p className="text-muted-foreground">
                  Revise e edite o plano gerado pela IA. Use o assistente ao lado para fazer ajustes.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/plans/preview/1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar Prévia
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiAssistant(!showAiAssistant)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {showAiAssistant ? "Ocultar" : "Mostrar"} Assistente IA
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleFillDiary}
                  disabled={isFilling || fillSuccess}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isFilling ? (
                    <>
                      <Wand2 className="h-4 w-4 animate-spin" />
                      Preenchendo...
                    </>
                  ) : fillSuccess ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Diário Preenchido!
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Preencher Diário
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Success Alert */}
            {fillSuccess && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">Diário preenchido com sucesso!</p>
                    <p className="text-sm">O conteúdo do plano de ensino foi sincronizado automaticamente com o Sistema Acadêmico IFMS.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plan Content Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="objectives">Objetivos</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              <TabsTrigger value="methodology">Metodologia</TabsTrigger>
              <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informações Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="discipline">Disciplina</Label>
                      <Input id="discipline" value="Cálculo Diferencial e Integral I" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disciplineCode">Código da Disciplina</Label>
                      <Input id="disciplineCode" value="MAT101" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planCode">Código do Plano</Label>
                      <Input id="planCode" placeholder="Ex: PE-2024-001" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester">Período</Label>
                      <Input id="semester" value="2024.2" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workload">Carga Horária</Label>
                      <Input id="workload" value="60h" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theoretical">Total de Aulas Teóricas</Label>
                      <Input id="theoretical" type="number" placeholder="Ex: 40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="practical">Total de Aulas Práticas</Label>
                      <Input id="practical" type="number" placeholder="Ex: 40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Ementa</Label>
                    <Textarea 
                      id="description"
                      rows={4}
                      value="Estudo de funções reais de uma variável real. Limites e continuidade. Derivadas e suas aplicações. Integrais definidas e indefinidas. Teorema Fundamental do Cálculo."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Objectives Tab */}
            <TabsContent value="objectives" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objetivos de Aprendizagem
                  </CardTitle>
                  <CardDescription>
                    Competências e habilidades que os alunos devem desenvolver
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Objetivo Geral</Label>
                    <Textarea 
                      rows={3}
                      value="Proporcionar ao estudante o conhecimento fundamental do cálculo diferencial e integral de funções reais de uma variável, desenvolvendo o raciocínio lógico-matemático necessário para a resolução de problemas em diversas áreas do conhecimento."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Objetivos Específicos</Label>
                    <Textarea 
                      rows={8}
                      value={`• Compreender os conceitos de limite e continuidade de funções reais
• Aplicar técnicas de derivação para resolver problemas de otimização
• Analisar o comportamento de funções utilizando derivadas
• Calcular integrais definidas e indefinidas
• Aplicar o Teorema Fundamental do Cálculo
• Resolver problemas práticos envolvendo taxas de variação
• Desenvolver o pensamento analítico e a capacidade de abstração matemática`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Detalhamento da Proposta de Trabalho
                  </CardTitle>
                  <CardDescription>
                    Configure o cronograma semanal de aulas com conteúdo e metodologia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DataTable columns={columns} data={weekScheduleData} />

                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Total de Aulas:</span>
                      <span className="text-sm text-muted-foreground">
                        Carga horária: 60h (80 aulas de 45min)
                      </span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Badge variant="secondary" className="text-lg px-4">
                        {weekScheduleData.reduce((sum, week) => sum + week.classes, 0)} aulas
                      </Badge>
                      {(() => {
                        const totalClasses = weekScheduleData.reduce((sum, week) => sum + week.classes, 0)
                        const targetClasses = 80 // 60h ÷ 0.75h = 80 aulas de 45min
                        const difference = targetClasses - totalClasses
                        
                        if (difference > 0) {
                          return (
                            <Badge variant="outline" className="text-sm px-3 border-yellow-500 text-yellow-700">
                              Faltam {difference} aulas
                            </Badge>
                          )
                        } else if (difference === 0) {
                          return (
                            <Badge variant="outline" className="text-sm px-3 border-green-500 text-green-700 bg-green-50">
                              ✓ Carga horária completa
                            </Badge>
                          )
                        } else {
                          return (
                            <Badge variant="outline" className="text-sm px-3 border-red-500 text-red-700 bg-red-50">
                              Excedendo em {Math.abs(difference)} aulas
                            </Badge>
                          )
                        }
                      })()}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Wand2 className="h-4 w-4" />
                    Adicionar Nova Semana
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Methodology Tab */}
            <TabsContent value="methodology" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Metodologia de Ensino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estratégias Didáticas</Label>
                    <Textarea 
                      rows={6}
                      value={`As aulas serão ministradas de forma expositiva-dialogada, com resolução de exercícios em sala. Serão utilizados recursos audiovisuais e softwares matemáticos para visualização de conceitos.

Metodologias ativas serão empregadas através de:
• Resolução de problemas em grupo
• Estudos de caso aplicados
• Listas de exercícios graduadas
• Atendimento individualizado em horário de monitoria`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recursos Didáticos</Label>
                    <Textarea 
                      rows={4}
                      value="• Quadro branco e projetor multimídia\n• Software GeoGebra para visualização\n• Plataforma AVA para materiais complementares\n• Calculadoras científicas"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluation Tab */}
            <TabsContent value="evaluation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Sistema de Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Critérios de Avaliação</Label>
                    <Textarea 
                      rows={5}
                      value={`A avaliação será contínua e processual, considerando:
• Participação nas atividades em sala (10%)
• Listas de exercícios (20%)
• Duas provas escritas (35% cada)
• Trabalho final aplicado (opcional, substitui menor nota)`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recuperação da Aprendizagem</Label>
                    <Textarea 
                      rows={4}
                      value="A recuperação dos conteúdos propostos ocorrerá através de atividades complementares, revisão do conteúdo e atendimento de Permanência de Estudante (PE). A recuperação de notas se dará através de trabalhos ou prova."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bibliografia</Label>
                    <Textarea 
                      rows={6}
                      value={`Básica:
• STEWART, James. Cálculo, Volume I. 8ª ed. Cengage, 2017.
• GUIDORIZZI, Hamilton. Um Curso de Cálculo, Vol. 1. 6ª ed. LTC, 2018.

Complementar:
• ANTON, Howard. Cálculo, Volume I. 10ª ed. Bookman, 2014.
• LEITHOLD, Louis. O Cálculo com Geometria Analítica, Vol. 1. Harbra, 1994.`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Eventos e Datas Especiais
                  </CardTitle>
                  <CardDescription>
                    Configure as datas de eventos institucionais que serão exibidos no cronograma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Evento 1 */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Semana de Ciência e Tecnologia</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event1-start">Data Início</Label>
                        <Input id="event1-start" type="date" defaultValue="2024-10-07" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event1-end">Data Fim</Label>
                        <Input id="event1-end" type="date" defaultValue="2024-10-11" />
                      </div>
                    </div>
                  </div>

                  {/* Evento 2 */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Festival de Arte e Cultura</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event2-start">Data Início</Label>
                        <Input id="event2-start" type="date" defaultValue="2024-11-04" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event2-end">Data Fim</Label>
                        <Input id="event2-end" type="date" defaultValue="2024-11-08" />
                      </div>
                    </div>
                  </div>

                  {/* Evento 3 */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Dia da Consciência Negra</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event3-date">Data</Label>
                        <Input id="event3-date" type="date" defaultValue="2024-11-20" />
                      </div>
                    </div>
                  </div>

                  {/* Evento 4 */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">SEMICT - Semana de Iniciação Científica</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event4-start">Data Início</Label>
                        <Input id="event4-start" type="date" defaultValue="2024-11-25" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="event4-end">Data Fim</Label>
                        <Input id="event4-end" type="date" defaultValue="2024-11-29" />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full gap-2">
                    <Wand2 className="h-4 w-4" />
                    Adicionar Novo Evento
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* AI Assistant Sidebar */}
        {showAiAssistant && (
          <aside className="w-96 border-l bg-muted/30 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Assistant Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">Assistente IA</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Peça sugestões, melhorias ou reescreva seções do seu plano
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Ações Rápidas
                </Label>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Wand2 className="h-4 w-4" />
                    Melhorar objetivos
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Wand2 className="h-4 w-4" />
                    Sugerir metodologias
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Wand2 className="h-4 w-4" />
                    Adicionar avaliações
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                    <Wand2 className="h-4 w-4" />
                    Expandir conteúdo
                  </Button>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Solicitação Personalizada
                </Label>
                <Textarea 
                  placeholder="Ex: Adicione mais exercícios práticos na unidade 2..."
                  rows={4}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Aplicar com IA
                </Button>
              </div>

              {/* Suggestions */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                  Sugestões
                </Label>
                <div className="space-y-3">
                  <Card>
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium mb-1">Incluir metodologias ativas</p>
                          <p className="text-xs text-muted-foreground">
                            Considere adicionar aprendizagem baseada em problemas
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Aplicar
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          Ignorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium mb-1">Detalhamento de avaliação</p>
                          <p className="text-xs text-muted-foreground">
                            As datas das provas poderiam ser mais específicas
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Aplicar
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1">
                          Ignorar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
