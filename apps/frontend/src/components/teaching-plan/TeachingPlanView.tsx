'use client'

import { Card, CardContent } from "@/components/ui/card"
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
  Clock,
  Layers,
  School
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
    <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100/50 dark:border-indigo-900/50 flex items-center gap-3">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Identificação</h3>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {plan.campus && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus</p>
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <p className="font-semibold text-slate-900 dark:text-foreground">{plan.campus}</p>
              </div>
            </div>
          )}
          {plan.anoSemestre && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Ano/Semestre</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <p className="font-semibold text-slate-900 dark:text-foreground">{plan.anoSemestre}</p>
              </div>
            </div>
          )}
          {plan.curso && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Curso</p>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <p className="font-semibold text-slate-900 dark:text-foreground">{plan.curso}</p>
              </div>
            </div>
          )}
          {plan.unidadeCurricular && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Unidade Curricular</p>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <p className="font-semibold text-slate-900 dark:text-foreground">{plan.unidadeCurricular}</p>
              </div>
            </div>
          )}
          {plan.professores && (
            <div className="md:col-span-2 space-y-1">
              <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Professor(es)</p>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400 dark:text-muted-foreground" />
                <p className="font-medium text-slate-900 dark:text-foreground bg-slate-50 dark:bg-secondary/50 px-3 py-1 rounded-md inline-block">{plan.professores}</p>
              </div>
            </div>
          )}
        </div>

        {(plan.cargaHorariaTotal || plan.numAulasTeorica || plan.numAulasPraticas) && (
          <div className="grid grid-cols-3 gap-4 pt-6 mt-2 border-t border-slate-100 dark:border-border">
            {plan.cargaHorariaTotal !== undefined && (
              <div className="space-y-1 text-center bg-slate-50 dark:bg-secondary/30 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Carga Total</p>
                <p className="font-bold text-xl text-indigo-600 dark:text-indigo-400">{plan.cargaHorariaTotal}h</p>
              </div>
            )}
            {plan.numAulasTeorica !== undefined && (
              <div className="space-y-1 text-center bg-slate-50 dark:bg-secondary/30 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Teóricas</p>
                <p className="font-bold text-xl text-slate-700 dark:text-foreground">{plan.numAulasTeorica}</p>
              </div>
            )}
            {plan.numAulasPraticas !== undefined && (
              <div className="space-y-1 text-center bg-slate-50 dark:bg-secondary/30 rounded-xl p-3">
                <p className="text-xs font-medium text-slate-500 dark:text-muted-foreground">Práticas</p>
                <p className="font-bold text-xl text-slate-700 dark:text-foreground">{plan.numAulasPraticas}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderStatusCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-100 dark:ring-border bg-white dark:bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-blue-50 p-2.5 rounded-xl">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase">Período</p>
            <p className="font-bold text-slate-700 dark:text-foreground">{plan.anoSemestre || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-100 dark:ring-border bg-white dark:bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-purple-50 p-2.5 rounded-xl">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase">Carga Horária</p>
            <p className="font-bold text-slate-700 dark:text-foreground">{plan.cargaHorariaTotal || 0}h</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-100 dark:ring-border bg-white dark:bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-emerald-50 p-2.5 rounded-xl">
            <Layers className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase">Aulas</p>
            <p className="font-bold text-slate-700 dark:text-foreground">
              {(plan.numAulasTeorica || 0) + (plan.numAulasPraticas || 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-100 dark:ring-border bg-white dark:bg-card">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="bg-slate-50 p-2.5 rounded-xl">
            <Target className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase">Status</p>
            <Badge variant="secondary" className="mt-0.5 bg-slate-100 dark:bg-secondary text-slate-600 dark:text-foreground hover:bg-slate-200 dark:hover:bg-secondary/80">{plan.status || 'Ativo'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderEmenta = () => {
    if (!plan.ementa) return null

    return (
      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Ementa</h3>
        </div>
        <CardContent className="p-6">
          <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {plan.ementa}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderObjetivos = () => {
    if (!plan.objetivoGeral && !plan.objetivosEspecificos) return null

    return (
      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Objetivos</h3>
        </div>
        <CardContent className="p-6 space-y-8">
          {plan.objetivoGeral && (
            <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-50 dark:border-indigo-900/20">
              <h4 className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Objetivo Geral
              </h4>
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {plan.objetivoGeral}
              </p>
            </div>
          )}
          {plan.objetivosEspecificos && (
            <div className="pl-2">
              <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-foreground mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                Objetivos Específicos
              </h4>
              <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed border-l-2 border-slate-100 dark:border-border pl-4">
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
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Metodologia</h3>
        </div>
        <CardContent className="p-6">
          <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {plan.metodologia}
          </p>
        </CardContent>
      </Card>
    )
  }

  const renderAvaliacao = () => {
    if (!plan.avaliacaoAprendizagem || plan.avaliacaoAprendizagem.length === 0) return null

    return (
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-900/50 p-2 rounded-lg">
            <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Avaliação da Aprendizagem</h3>
        </div>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-secondary/20 border-b border-slate-200 dark:border-border">
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Etapa</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Avaliação</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Instrumentos</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Data</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Nota Máx.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-border">
                  {plan.avaliacaoAprendizagem.map((avaliacao, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-secondary/10 transition-colors bg-white dark:bg-card">
                      <td className="py-4 px-6 font-bold text-slate-700 dark:text-foreground">{avaliacao.etapa || '-'}</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-muted-foreground font-medium leading-relaxed max-w-[200px]">{avaliacao.avaliacao || '-'}</td>
                      <td className="py-4 px-6">
                        {avaliacao.instrumentos ? (
                          <div className="flex flex-wrap gap-1">
                            {avaliacao.instrumentos.split(',').map((instr, i) => (
                              <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-secondary text-slate-600 dark:text-muted-foreground border-slate-200 dark:border-border font-medium rounded-md hover:bg-slate-200 dark:hover:bg-secondary/80 transition-colors">
                                {instr.trim()}
                              </Badge>
                            ))}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-muted-foreground font-medium whitespace-nowrap">{avaliacao.dataPrevista || '-'}</td>
                      <td className="py-4 px-6">
                        {avaliacao.valorMaximo ? (
                          <div className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg inline-block border border-indigo-100 min-w-[3rem] text-center shadow-sm">
                            {avaliacao.valorMaximo}
                          </div>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {plan.observacoesAvaliacoes && (
            <div className="mt-6 p-4 bg-amber-50/40 border border-amber-100/60 rounded-xl flex gap-3">
              <div className="mt-0.5">
                <div className="h-2 w-2 rounded-full bg-amber-400"></div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Observações</p>
                <p className="text-sm text-amber-900 leading-relaxed font-medium">{plan.observacoesAvaliacoes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderRecuperacao = () => {
    if (!plan.recuperacaoAprendizagem) return null

    return (
      <Card className="border-0 shadow-sm dark:shadow-none ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Recuperação da Aprendizagem</h3>
        </div>
        <CardContent className="p-6">
          <p className="text-sm md:text-base text-slate-600 dark:text-muted-foreground whitespace-pre-wrap leading-relaxed">
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
        teachingTechniques: item.tecnicasEnsino ? item.tecnicasEnsino.join(', ') : (item.metodologia || ''),
        teachingResources: item.recursosEnsino ? item.recursosEnsino.join(', ') : undefined
      }))
    }

    const weekScheduleData = convertToWeekSchedule(plan.propostaTrabalho)
    const totalAulas = weekScheduleData.reduce((sum, week) => sum + week.classes, 0)

    return (
      <Card className="border border-slate-200 dark:border-border shadow-sm dark:shadow-none bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Cronograma</h3>
          </div>
          <Badge variant="secondary" className="bg-white dark:bg-secondary border border-slate-200 dark:border-border text-slate-700 dark:text-foreground font-mono">
            {totalAulas} Aulas
          </Badge>
        </div>
        <CardContent className="p-6">
          <WorkProposalTable
            data={weekScheduleData}
            showCheckbox={false}
            showActions={false}
          />
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
      <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
          <BookMarked className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-slate-800 dark:text-foreground text-lg">Referências Bibliográficas</h3>
        </div>
        <CardContent className="p-6 space-y-6">
          {hasBasica && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm uppercase tracking-wide border-b border-slate-100 dark:border-border pb-2">Bibliografia Básica</h4>
              <ol className="space-y-3 ml-4">
                {plan.bibliografiaBasica!.map((ref, index) => (
                  <li key={index} className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed pl-2 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {hasComplementar && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-foreground text-sm uppercase tracking-wide border-b border-slate-100 dark:border-border pb-2">Bibliografia Complementar</h4>
              <ol className="space-y-3 ml-4">
                {plan.bibliografiaComplementar!.map((ref, index) => (
                  <li key={index} className="text-sm text-slate-600 dark:text-muted-foreground leading-relaxed pl-2 border-l-2 border-slate-200 dark:border-border">
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!hasBasica && !hasComplementar && hasReferencias && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{plan.referencias}</p>
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
          <School className="h-12 w-12 text-slate-900" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">INSTITUTO FEDERAL DE MATO GROSSO DO SUL</h1>
        <p className="text-lg text-slate-600 font-medium tracking-wide uppercase">{plan.campus || 'Campus'}</p>
        <Separator className="my-6" />
        <h2 className="text-2xl font-bold text-slate-800">PLANO DE ENSINO</h2>
        {plan.anoSemestre && (
          <Badge variant="outline" className="text-base px-6 py-1 border-slate-900 text-slate-900 rounded-full">
            {plan.anoSemestre}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in w-full">
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
