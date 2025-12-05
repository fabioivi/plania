'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText,
  Target,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
  ClipboardCheck,
  BookMarked,
  Clock
} from "lucide-react"
import { WorkProposalTable, type WeekSchedule } from "./WorkProposalTable"

export interface TeachingPlanData {
  // Identificação
  campus?: string
  anoSemestre?: string
  curso?: string
  unidadeCurricular?: string
  professores?: string
  cargaHorariaTotal?: number
  numAulasTeorica?: number
  numAulasPraticas?: number
  status?: string
  
  // Conteúdo
  ementa?: string
  objetivoGeral?: string
  objetivosEspecificos?: string
  metodologia?: string
  
  // Avaliação
  avaliacaoAprendizagem?: Array<{
    etapa?: string
    avaliacao?: string
    instrumentos?: string
    dataPrevista?: string
    valorMaximo?: string | number
  }>
  observacoesAvaliacoes?: string
  recuperacaoAprendizagem?: string
  
  // Cronograma
  propostaTrabalho?: Array<{
    mes?: string
    periodo?: string
    numAulas?: string | number
    observacoes?: string
    conteudo?: string
    metodologia?: string
    tecnicasEnsino?: string[]
    recursosEnsino?: string[]
  }>
  
  // Bibliografia
  referencias?: string
  bibliografiaBasica?: string[]
  bibliografiaComplementar?: string[]
}

interface TeachingPlanViewProps {
  plan: TeachingPlanData
  variant?: 'full' | 'compact'
  showHeader?: boolean
}

export function TeachingPlanView({ 
  plan, 
  variant = 'full',
  showHeader = true 
}: TeachingPlanViewProps) {
  
  const renderIdentification = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Identificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.campus && (
            <div>
              <p className="text-sm text-muted-foreground">Campus</p>
              <p className="font-medium">{plan.campus}</p>
            </div>
          )}
          {plan.anoSemestre && (
            <div>
              <p className="text-sm text-muted-foreground">Ano/Semestre</p>
              <p className="font-medium">{plan.anoSemestre}</p>
            </div>
          )}
          {plan.curso && (
            <div>
              <p className="text-sm text-muted-foreground">Curso</p>
              <p className="font-medium">{plan.curso}</p>
            </div>
          )}
          {plan.unidadeCurricular && (
            <div>
              <p className="text-sm text-muted-foreground">Unidade Curricular</p>
              <p className="font-medium">{plan.unidadeCurricular}</p>
            </div>
          )}
          {plan.professores && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Professor(es)</p>
              <p className="font-medium">{plan.professores}</p>
            </div>
          )}
        </div>
        
        {(plan.cargaHorariaTotal || plan.numAulasTeorica || plan.numAulasPraticas) && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t">
            {plan.cargaHorariaTotal !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Carga Horária Total</p>
                <p className="font-medium">{plan.cargaHorariaTotal}h</p>
              </div>
            )}
            {plan.numAulasTeorica !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Aulas Teóricas</p>
                <p className="font-medium">{plan.numAulasTeorica}</p>
              </div>
            )}
            {plan.numAulasPraticas !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Aulas Práticas</p>
                <p className="font-medium">{plan.numAulasPraticas}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStatusCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="font-semibold">{plan.anoSemestre || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Carga Horária</p>
              <p className="font-semibold">{plan.cargaHorariaTotal || 0}h</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Aulas</p>
              <p className="font-semibold">
                {(plan.numAulasTeorica || 0) + (plan.numAulasPraticas || 0)} aulas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className="mt-1">{plan.status || 'Ativo'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderEmenta = () => {
    if (!plan.ementa) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ementa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-justify">
            {plan.ementa}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderObjetivos = () => {
    if (!plan.objetivoGeral && !plan.objetivosEspecificos) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.objetivoGeral && (
            <div>
              <h4 className="font-semibold mb-2">Objetivo Geral</h4>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-justify">
                {plan.objetivoGeral}
              </p>
            </div>
          )}
          {plan.objetivosEspecificos && (
            <div>
              <h4 className="font-semibold mb-2">Objetivos Específicos</h4>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {plan.objetivosEspecificos}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderMetodologia = () => {
    if (!plan.metodologia) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Metodologia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-justify">
            {plan.metodologia}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderAvaliacao = () => {
    if (!plan.avaliacaoAprendizagem || plan.avaliacaoAprendizagem.length === 0) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Sistema de Avaliação da Aprendizagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Etapa</th>
                  <th className="text-left py-2 px-3">Avaliação</th>
                  <th className="text-left py-2 px-3">Instrumentos</th>
                  <th className="text-left py-2 px-3">Data Prevista</th>
                  <th className="text-left py-2 px-3">Valor Máximo</th>
                </tr>
              </thead>
              <tbody>
                {plan.avaliacaoAprendizagem.map((avaliacao, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-3">{avaliacao.etapa || '-'}</td>
                    <td className="py-2 px-3">{avaliacao.avaliacao || '-'}</td>
                    <td className="py-2 px-3">{avaliacao.instrumentos || '-'}</td>
                    <td className="py-2 px-3">{avaliacao.dataPrevista || '-'}</td>
                    <td className="py-2 px-3">{avaliacao.valorMaximo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plan.observacoesAvaliacoes && (
            <div className="mt-4 p-3 bg-muted/50 rounded-md">
              <p className="text-xs font-semibold mb-1">Observações:</p>
              <p className="text-sm whitespace-pre-wrap">{plan.observacoesAvaliacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderRecuperacao = () => {
    if (!plan.recuperacaoAprendizagem) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Estratégias de Recuperação da Aprendizagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-justify">
            {plan.recuperacaoAprendizagem}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderCronograma = () => {
    if (!plan.propostaTrabalho || plan.propostaTrabalho.length === 0) return null
    
    // Converter dados do backend para o formato do WorkProposalTable
    const convertToWeekSchedule = (propostaTrabalho: typeof plan.propostaTrabalho): WeekSchedule[] => {
      return propostaTrabalho!.map((item, index) => ({
        id: `week-${index + 1}`,
        week: index + 1,
        month: item.mes || 'N/A',
        period: item.periodo || '',
        classes: typeof item.numAulas === 'string' ? parseInt(item.numAulas) || 0 : (item.numAulas || 0),
        observations: item.observacoes || '',
        content: item.conteudo || '',
        // Usar tecnicasEnsino se disponível, senão fallback para metodologia
        teachingTechniques: item.tecnicasEnsino ? item.tecnicasEnsino.join(', ') : (item.metodologia || ''),
        // Usar recursosEnsino se disponível
        teachingResources: item.recursosEnsino ? item.recursosEnsino.join(', ') : undefined
      }))
    }
    
    const weekScheduleData = convertToWeekSchedule(plan.propostaTrabalho)
    const totalAulas = weekScheduleData.reduce((sum, week) => sum + week.classes, 0)
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Proposta de Trabalho (Cronograma)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <WorkProposalTable 
            data={weekScheduleData}
            showCheckbox={false}
            showActions={false}
          />
          
          {/* Totalizador de aulas */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="font-semibold">Total de Aulas:</span>
            <Badge variant="secondary" className="text-lg px-4">
              {totalAulas} aulas
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderBibliografia = () => {
    const hasBasica = plan.bibliografiaBasica && plan.bibliografiaBasica.length > 0
    const hasComplementar = plan.bibliografiaComplementar && plan.bibliografiaComplementar.length > 0
    const hasReferencias = plan.referencias
    
    if (!hasBasica && !hasComplementar && !hasReferencias) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Referências Bibliográficas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasBasica && (
            <div>
              <h4 className="font-semibold mb-2">Bibliografia Básica</h4>
              <ol className="space-y-2 ml-6 text-sm">
                {plan.bibliografiaBasica!.map((ref, index) => (
                  <li key={index} className="leading-relaxed">{index + 1}. {ref}</li>
                ))}
              </ol>
            </div>
          )}
          
          {hasComplementar && (
            <div>
              <h4 className="font-semibold mb-2">Bibliografia Complementar</h4>
              <ol className="space-y-2 ml-6 text-sm">
                {plan.bibliografiaComplementar!.map((ref, index) => (
                  <li key={index} className="leading-relaxed">{index + 1}. {ref}</li>
                ))}
              </ol>
            </div>
          )}
          
          {!hasBasica && !hasComplementar && hasReferencias && (
            <p className="text-sm whitespace-pre-wrap">{plan.referencias}</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderPrintHeader = () => {
    if (!showHeader) return null
    
    return (
      <div className="text-center space-y-4 mb-8 print:block hidden">
        <div className="flex items-center justify-center gap-3 mb-4">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">INSTITUTO FEDERAL DE MATO GROSSO DO SUL</h1>
        <p className="text-lg text-muted-foreground">{plan.campus || 'Campus'}</p>
        <Separator className="my-4" />
        <h2 className="text-2xl font-semibold">PLANO DE ENSINO</h2>
        {plan.anoSemestre && (
          <Badge variant="secondary" className="text-base px-4 py-1">
            {plan.anoSemestre}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderPrintHeader()}
      {variant === 'full' && renderStatusCards()}
      {renderIdentification()}
      {renderEmenta()}
      {renderObjetivos()}
      {renderMetodologia()}
      {renderCronograma()}
      {renderAvaliacao()}
      {renderRecuperacao()}
      {renderBibliografia()}
    </div>
  )
}
