"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Download,
  Printer,
  Share2,
  FileText,
  Target,
  BookOpen,
  Calendar,
  Users,
  GraduationCap
} from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"

export default function PlanPreviewPage() {
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    // Implementar download PDF
    console.log("Download PDF")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/plans/review/1">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Edição
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
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
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <GraduationCap className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">INSTITUTO FEDERAL DE MATO GROSSO DO SUL</h1>
              <p className="text-lg text-muted-foreground">Campus Campo Grande</p>
              <Separator className="my-4" />
              <h2 className="text-2xl font-semibold">PLANO DE ENSINO</h2>
              <Badge variant="secondary" className="text-base px-4 py-1">2024.2</Badge>
            </div>

            <Separator />

            {/* Informações Gerais */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">IDENTIFICAÇÃO</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-muted-foreground">Disciplina:</p>
                  <p className="text-base">Cálculo Diferencial e Integral I</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Código:</p>
                  <p className="text-base">MAT101</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Curso:</p>
                  <p className="text-base">Engenharia de Software</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Período:</p>
                  <p className="text-base">2024.2</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Carga Horária:</p>
                  <p className="text-base">60 horas (4 créditos)</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Aulas Teóricas:</p>
                  <p className="text-base">40 aulas</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Aulas Práticas:</p>
                  <p className="text-base">40 aulas</p>
                </div>
                <div>
                  <p className="font-semibold text-muted-foreground">Professor:</p>
                  <p className="text-base">Prof. Dr. João Silva</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Ementa */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">EMENTA</h3>
              </div>
              <p className="text-justify leading-relaxed">
                Estudo de funções reais de uma variável real. Limites e continuidade. 
                Derivadas e suas aplicações. Integrais definidas e indefinidas. 
                Teorema Fundamental do Cálculo. Aplicações práticas em problemas de 
                otimização e análise de taxas de variação.
              </p>
            </section>

            <Separator />

            {/* Objetivos */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">OBJETIVOS</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Objetivo Geral:</h4>
                  <p className="text-justify leading-relaxed">
                    Proporcionar ao estudante o conhecimento fundamental do cálculo diferencial 
                    e integral de funções reais de uma variável, desenvolvendo o raciocínio 
                    lógico-matemático necessário para a resolução de problemas em diversas 
                    áreas do conhecimento.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Objetivos Específicos:</h4>
                  <ul className="space-y-2 ml-6">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Compreender os conceitos de limite e continuidade de funções reais</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Aplicar técnicas de derivação para resolver problemas de otimização</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Analisar o comportamento de funções utilizando derivadas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Calcular integrais definidas e indefinidas</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Aplicar o Teorema Fundamental do Cálculo</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Resolver problemas práticos envolvendo taxas de variação</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Desenvolver o pensamento analítico e a capacidade de abstração matemática</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            {/* Conteúdo Programático */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">DETALHAMENTO DA PROPOSTA DE TRABALHO</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-300 p-2 text-left font-semibold">Mês</th>
                      <th className="border border-slate-300 p-2 text-left font-semibold">Período em dias</th>
                      <th className="border border-slate-300 p-2 text-left font-semibold">Nº aulas</th>
                      <th className="border border-slate-300 p-2 text-left font-semibold">Observações</th>
                      <th className="border border-slate-300 p-2 text-left font-semibold">Conteúdo a ser desenvolvido</th>
                      <th className="border border-slate-300 p-2 text-left font-semibold">Metodologia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Semana 1 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Agosto</td>
                      <td className="border border-slate-300 p-2">12 a 16</td>
                      <td className="border border-slate-300 p-2 text-center">1</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Limites e Continuidade: Noção intuitiva de limite</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Expositiva/dialogada<br/><br/>
                        <strong>Recursos de Ensino:</strong> Projetor multimídia, Quadro branco/canetão
                      </td>
                    </tr>
                    {/* Semana 2 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Agosto</td>
                      <td className="border border-slate-300 p-2">19 a 23</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Limites e Continuidade: Definição formal e propriedades</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Estudo de caso, Expositiva/dialogada<br/><br/>
                        <strong>Recursos de Ensino:</strong> Biblioteca, Laboratório, Projetor multimídia, Quadro branco/canetão
                      </td>
                    </tr>
                    {/* Semana 3 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Agosto</td>
                      <td className="border border-slate-300 p-2">26 a 30</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Derivadas: Conceito e interpretação geométrica</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Quadro branco/canetão, Lista de exercícios
                      </td>
                    </tr>
                    {/* Semana 4 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Setembro</td>
                      <td className="border border-slate-300 p-2">02 a 06</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Derivadas: Regras de derivação</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Laboratório, Projetor multimídia, Software matemático
                      </td>
                    </tr>
                    {/* Semana 5 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Setembro</td>
                      <td className="border border-slate-300 p-2">09 a 13</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Derivadas: Aplicações e problemas de otimização</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Estudo de caso, Resolução de problemas<br/><br/>
                        <strong>Recursos de Ensino:</strong> Biblioteca, Projetor multimídia, Artigos científicos
                      </td>
                    </tr>
                    {/* Semana 6 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Setembro</td>
                      <td className="border border-slate-300 p-2">16 a 20</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2 bg-amber-50 dark:bg-amber-950/20">Semana de Ciência e Tecnologia</td>
                      <td className="border border-slate-300 p-2">Integrais Indefinidas: Conceito e técnicas básicas</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Seminário<br/><br/>
                        <strong>Recursos de Ensino:</strong> Auditório, Projetor multimídia
                      </td>
                    </tr>
                    {/* Semana 7 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Setembro</td>
                      <td className="border border-slate-300 p-2">23 a 27</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Integrais Indefinidas: Métodos de integração</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Quadro branco/canetão, Software matemático
                      </td>
                    </tr>
                    {/* Semana 8 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Setembro</td>
                      <td className="border border-slate-300 p-2">30 a 04</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Integrais Definidas: Teorema Fundamental do Cálculo</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Demonstração<br/><br/>
                        <strong>Recursos de Ensino:</strong> Projetor multimídia, Quadro branco/canetão
                      </td>
                    </tr>
                    {/* Semana 9 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Outubro</td>
                      <td className="border border-slate-300 p-2">07 a 11</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Avaliação Parcial: Limites e Derivadas</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Avaliação escrita<br/><br/>
                        <strong>Recursos de Ensino:</strong> Sala de aula
                      </td>
                    </tr>
                    {/* Semana 10 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Outubro</td>
                      <td className="border border-slate-300 p-2">14 a 18</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Aplicações de Integrais: Cálculo de áreas</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Estudo de caso<br/><br/>
                        <strong>Recursos de Ensino:</strong> Laboratório, Software de visualização
                      </td>
                    </tr>
                    {/* Semana 11 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Outubro</td>
                      <td className="border border-slate-300 p-2">21 a 25</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Aplicações de Integrais: Volumes de sólidos de revolução</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Demonstração prática<br/><br/>
                        <strong>Recursos de Ensino:</strong> Projetor multimídia, Modelos físicos
                      </td>
                    </tr>
                    {/* Semana 12 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Outubro</td>
                      <td className="border border-slate-300 p-2">28 a 01</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Funções de Várias Variáveis: Introdução e domínio</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Visualização 3D<br/><br/>
                        <strong>Recursos de Ensino:</strong> Software matemático, Projetor multimídia
                      </td>
                    </tr>
                    {/* Semana 13 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Novembro</td>
                      <td className="border border-slate-300 p-2">04 a 08</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Derivadas Parciais: Conceito e interpretação</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Aula prática, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Quadro branco/canetão, Lista de exercícios
                      </td>
                    </tr>
                    {/* Semana 14 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Novembro</td>
                      <td className="border border-slate-300 p-2">11 a 15</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2 bg-amber-50 dark:bg-amber-950/20">Recesso acadêmico</td>
                      <td className="border border-slate-300 p-2">Revisão geral de conteúdos</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Plantão de dúvidas, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Sala de aula, Material de apoio
                      </td>
                    </tr>
                    {/* Semana 15 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Novembro</td>
                      <td className="border border-slate-300 p-2">18 a 22</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Integrais Múltiplas: Integrais duplas</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Expositiva/dialogada, Aula prática<br/><br/>
                        <strong>Recursos de Ensino:</strong> Projetor multimídia, Software matemático
                      </td>
                    </tr>
                    {/* Semana 16 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Novembro</td>
                      <td className="border border-slate-300 p-2">25 a 29</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Integrais Múltiplas: Aplicações em áreas e volumes</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Estudo de caso, Resolução de problemas<br/><br/>
                        <strong>Recursos de Ensino:</strong> Laboratório, Material digital
                      </td>
                    </tr>
                    {/* Semana 17 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Dezembro</td>
                      <td className="border border-slate-300 p-2">02 a 06</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Revisão Final: Todos os conteúdos</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Plantão de dúvidas, Resolução de exercícios<br/><br/>
                        <strong>Recursos de Ensino:</strong> Biblioteca, Sala de aula, Material complementar
                      </td>
                    </tr>
                    {/* Semana 18 */}
                    <tr>
                      <td className="border border-slate-300 p-2">Dezembro</td>
                      <td className="border border-slate-300 p-2">09 a 13</td>
                      <td className="border border-slate-300 p-2 text-center">4</td>
                      <td className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2">Avaliação Final: Prova integradora</td>
                      <td className="border border-slate-300 p-2 text-xs">
                        <strong>Técnicas de Ensino:</strong> Avaliação escrita<br/><br/>
                        <strong>Recursos de Ensino:</strong> Sala de aula
                      </td>
                    </tr>
                    <tr className="bg-slate-200 dark:bg-slate-700 font-semibold">
                      <td colSpan={2} className="border border-slate-300 p-2 text-right">TOTAL DE AULAS:</td>
                      <td className="border border-slate-300 p-2 text-center">73</td>
                      <td colSpan={3} className="border border-slate-300 p-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <Separator />

            {/* Metodologia */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">METODOLOGIA</h3>
              </div>
              <p className="text-justify leading-relaxed">
                As aulas serão desenvolvidas por meio de exposições dialogadas, resolução de 
                exercícios em sala, atividades práticas em grupo, e utilização de recursos 
                tecnológicos como softwares matemáticos. Serão propostas listas de exercícios 
                para fixação do conteúdo e desenvolvimento do raciocínio lógico-matemático.
              </p>
              <p className="text-justify leading-relaxed">
                Haverá atendimento individual aos alunos em horários extraclasse para 
                esclarecimento de dúvidas e acompanhamento do desenvolvimento acadêmico.
              </p>
            </section>

            <Separator />

            {/* Avaliação */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">AVALIAÇÃO</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-justify leading-relaxed">
                  A avaliação será processual e contínua, considerando os seguintes instrumentos:
                </p>
                
                <ul className="space-y-2 ml-6">
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span><strong>Provas escritas (60%):</strong> Duas provas teóricas e práticas durante o semestre</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span><strong>Listas de exercícios (20%):</strong> Resolução de problemas propostos</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span><strong>Trabalhos práticos (20%):</strong> Aplicações do cálculo em situações-problema</span>
                  </li>
                </ul>
                
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Nota mínima para aprovação:</strong> 6,0 (seis)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Frequência mínima:</strong> 75% de presença
                </p>
              </div>
            </section>

            <Separator />

            {/* Recuperação da Aprendizagem */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">RECUPERAÇÃO DA APRENDIZAGEM</h3>
              </div>
              <p className="text-justify leading-relaxed">
                A recuperação dos conteúdos propostos ocorrerá através de atividades complementares, 
                revisão do conteúdo e atendimento de Permanência de Estudante (PE). A recuperação de 
                notas se dará através de trabalhos ou prova.
              </p>
            </section>

            <Separator />

            {/* Bibliografia */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">BIBLIOGRAFIA</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">Bibliografia Básica:</h4>
                  <ol className="space-y-1 ml-6 text-sm">
                    <li>1. STEWART, James. <strong>Cálculo</strong>. Volume 1. 8ª ed. São Paulo: Cengage Learning, 2017.</li>
                    <li>2. THOMAS, George B. <strong>Cálculo</strong>. Volume 1. 12ª ed. São Paulo: Pearson, 2012.</li>
                    <li>3. GUIDORIZZI, Hamilton L. <strong>Um Curso de Cálculo</strong>. Volume 1. 6ª ed. Rio de Janeiro: LTC, 2018.</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Bibliografia Complementar:</h4>
                  <ol className="space-y-1 ml-6 text-sm">
                    <li>1. LEITHOLD, Louis. <strong>O Cálculo com Geometria Analítica</strong>. Volume 1. 3ª ed. São Paulo: Harbra, 1994.</li>
                    <li>2. SWOKOWSKI, Earl W. <strong>Cálculo com Geometria Analítica</strong>. Volume 1. 2ª ed. São Paulo: Makron Books, 1994.</li>
                    <li>3. ANTON, Howard. <strong>Cálculo: um novo horizonte</strong>. Volume 1. 8ª ed. Porto Alegre: Bookman, 2007.</li>
                  </ol>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Campo Grande, MS - Dezembro de 2024</p>
              <div className="mt-8 pt-4 flex justify-around max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="border-t border-foreground w-48 mb-1"></div>
                  <p className="font-semibold">Professor Responsável</p>
                  <p className="text-xs">Prof. Dr. João Silva</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
