"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Download,
  Printer,
  Share2,
  FileText,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { TeachingPlanView, TeachingPlanData } from "@/components/teaching-plan/TeachingPlanView"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { toast } from "sonner"

export default function PlanPreviewPage() {
  const params = useParams()
  const planId = params.id as string
  
  const [plan, setPlan] = useState<TeachingPlanData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlan()
  }, [planId])

  const loadPlan = async () => {
    try {
      setLoading(true)
      // Fetch generated plan from API
      const response = await api.get(`/plans/${planId}`)
      setPlan(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar plano:', err)
      // Usar dados de exemplo se a API falhar
      setPlan(getMockPlan())
    } finally {
      setLoading(false)
    }
  }

  const getMockPlan = (): TeachingPlanData => ({
    campus: 'Campus Campo Grande',
    anoSemestre: '2024.2',
    curso: 'Engenharia de Software',
    unidadeCurricular: 'Cálculo Diferencial e Integral I',
    professores: 'Prof. Dr. João Silva',
    cargaHorariaTotal: 60,
    numAulasTeorica: 40,
    numAulasPraticas: 40,
    status: 'Rascunho',
    ementa: 'Estudo de funções reais de uma variável real. Limites e continuidade. Derivadas e suas aplicações. Integrais definidas e indefinidas. Teorema Fundamental do Cálculo. Aplicações práticas em problemas de otimização e análise de taxas de variação.',
    objetivoGeral: 'Proporcionar ao estudante o conhecimento fundamental do cálculo diferencial e integral de funções reais de uma variável, desenvolvendo o raciocínio lógico-matemático necessário para a resolução de problemas em diversas áreas do conhecimento.',
    objetivosEspecificos: `• Compreender os conceitos de limite e continuidade de funções reais
• Aplicar técnicas de derivação para resolver problemas de otimização
• Analisar o comportamento de funções utilizando derivadas
• Calcular integrais definidas e indefinidas
• Aplicar o Teorema Fundamental do Cálculo
• Resolver problemas práticos envolvendo taxas de variação
• Desenvolver o pensamento analítico e a capacidade de abstração matemática`,
    metodologia: 'As aulas serão desenvolvidas por meio de exposições dialogadas, resolução de exercícios em sala, atividades práticas em grupo, e utilização de recursos tecnológicos como softwares matemáticos. Serão propostas listas de exercícios para fixação do conteúdo e desenvolvimento do raciocínio lógico-matemático.\n\nHaverá atendimento individual aos alunos em horários extraclasse para esclarecimento de dúvidas e acompanhamento do desenvolvimento acadêmico.',
    avaliacaoAprendizagem: [
      {
        etapa: '1ª Etapa',
        avaliacao: 'Prova Escrita',
        instrumentos: 'Avaliação individual',
        dataPrevista: '15/09/2024',
        valorMaximo: '30'
      },
      {
        etapa: '2ª Etapa',
        avaliacao: 'Lista de Exercícios',
        instrumentos: 'Resolução de problemas',
        dataPrevista: '20/10/2024',
        valorMaximo: '20'
      },
      {
        etapa: '3ª Etapa',
        avaliacao: 'Trabalho Prático',
        instrumentos: 'Aplicação do cálculo',
        dataPrevista: '10/11/2024',
        valorMaximo: '20'
      },
      {
        etapa: 'Final',
        avaliacao: 'Prova Final',
        instrumentos: 'Avaliação integradora',
        dataPrevista: '10/12/2024',
        valorMaximo: '30'
      }
    ],
    observacoesAvaliacoes: 'Nota mínima para aprovação: 6,0 (seis). Frequência mínima: 75% de presença.',
    recuperacaoAprendizagem: 'A recuperação dos conteúdos propostos ocorrerá através de atividades complementares, revisão do conteúdo e atendimento de Permanência de Estudante (PE). A recuperação de notas se dará através de trabalhos ou prova.',
    propostaTrabalho: [
      {
        mes: 'Agosto',
        periodo: '12 a 16',
        numAulas: 1,
        conteudo: 'Limites e Continuidade: Noção intuitiva de limite',
        metodologia: 'Técnicas: Aula prática, Expositiva/dialogada. Recursos: Projetor multimídia, Quadro branco/canetão'
      },
      {
        mes: 'Agosto',
        periodo: '19 a 23',
        numAulas: 4,
        conteudo: 'Limites e Continuidade: Definição formal e propriedades',
        metodologia: 'Técnicas: Aula prática, Estudo de caso. Recursos: Biblioteca, Laboratório, Projetor'
      },
      {
        mes: 'Setembro',
        periodo: '02 a 06',
        numAulas: 4,
        conteudo: 'Derivadas: Regras de derivação',
        metodologia: 'Técnicas: Aula prática, Resolução de exercícios. Recursos: Software matemático'
      }
    ],
    bibliografiaBasica: [
      'STEWART, James. Cálculo. Volume 1. 8ª ed. São Paulo: Cengage Learning, 2017.',
      'THOMAS, George B. Cálculo. Volume 1. 12ª ed. São Paulo: Pearson, 2012.',
      'GUIDORIZZI, Hamilton L. Um Curso de Cálculo. Volume 1. 6ª ed. Rio de Janeiro: LTC, 2018.'
    ],
    bibliografiaComplementar: [
      'LEITHOLD, Louis. O Cálculo com Geometria Analítica. Volume 1. 3ª ed. São Paulo: Harbra, 1994.',
      'SWOKOWSKI, Earl W. Cálculo com Geometria Analítica. Volume 1. 2ª ed. São Paulo: Makron Books, 1994.',
      'ANTON, Howard. Cálculo: um novo horizonte. Volume 1. 8ª ed. Porto Alegre: Bookman, 2007.'
    ]
  })
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    toast.info('Funcionalidade em desenvolvimento')
  }

  const handleShare = () => {
    toast.info('Funcionalidade em desenvolvimento')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4 max-w-5xl">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8 px-4 max-w-5xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Plano não encontrado</h3>
              <p className="text-muted-foreground mb-6">
                O plano de ensino solicitado não foi encontrado.
              </p>
              <Link href="/plans">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Planos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          header {
            display: none !important;
          }
          main {
            padding: 20px !important;
          }
          h1 {
            font-size: 24px !important;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href={`/plans/review/${planId}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Edição
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Compartilhar
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
            <Button variant="default" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Preview Document */}
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-12 space-y-8">
            <TeachingPlanView 
              plan={plan} 
              variant="compact"
              showHeader={true}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
