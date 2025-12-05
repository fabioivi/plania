"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function GeneratePage() {
  const [step, setStep] = useState<"config" | "generating" | "success">("config")
  const [formData, setFormData] = useState({
    discipline: "",
    semester: "2024.2",
    workload: "",
    objectives: "",
    methodology: "",
    additionalNotes: ""
  })

  const handleGenerate = () => {
    setStep("generating")
    // Simulate AI generation
    setTimeout(() => {
      setStep("success")
    }, 5000)
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>

        {/* Configuration Step */}
        {step === "config" && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Gerar Plano com IA</h1>
              </div>
              <p className="text-muted-foreground">
                Configure os parâmetros e deixe a IA criar um plano de ensino completo e personalizado
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Configuração do Plano</CardTitle>
                <CardDescription>
                  Preencha as informações básicas. A IA usará esses dados para gerar um plano personalizado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Discipline Selection */}
                <div className="space-y-2">
                  <Label htmlFor="discipline">Disciplina *</Label>
                  <Select 
                    value={formData.discipline}
                    onValueChange={(value) => setFormData({...formData, discipline: value})}
                  >
                    <SelectTrigger id="discipline">
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="calculo1">Cálculo Diferencial e Integral I</SelectItem>
                      <SelectItem value="algebra">Álgebra Linear</SelectItem>
                      <SelectItem value="fisica1">Física Experimental I</SelectItem>
                      <SelectItem value="programacao">Programação Orientada a Objetos</SelectItem>
                      <SelectItem value="estruturas">Estruturas de Dados</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Disciplinas importadas do sistema acadêmico
                  </p>
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semester">Período Letivo *</Label>
                  <Select 
                    value={formData.semester}
                    onValueChange={(value) => setFormData({...formData, semester: value})}
                  >
                    <SelectTrigger id="semester">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024.1">2024.1</SelectItem>
                      <SelectItem value="2024.2">2024.2</SelectItem>
                      <SelectItem value="2025.1">2025.1</SelectItem>
                      <SelectItem value="2025.2">2025.2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Workload */}
                <div className="space-y-2">
                  <Label htmlFor="workload">Carga Horária (horas) *</Label>
                  <Input 
                    id="workload"
                    type="number"
                    placeholder="Ex: 60"
                    value={formData.workload}
                    onChange={(e) => setFormData({...formData, workload: e.target.value})}
                  />
                </div>

                {/* Objectives */}
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos de Aprendizagem (Opcional)</Label>
                  <Textarea 
                    id="objectives"
                    placeholder="Ex: Desenvolver habilidades analíticas para resolver problemas de cálculo diferencial..."
                    rows={4}
                    value={formData.objectives}
                    onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    A IA pode sugerir objetivos se deixado em branco
                  </p>
                </div>

                {/* Methodology */}
                <div className="space-y-2">
                  <Label htmlFor="methodology">Metodologia Preferida (Opcional)</Label>
                  <Select 
                    value={formData.methodology}
                    onValueChange={(value) => setFormData({...formData, methodology: value})}
                  >
                    <SelectTrigger id="methodology">
                      <SelectValue placeholder="Selecione ou deixe a IA decidir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tradicional">Aulas Expositivas Tradicionais</SelectItem>
                      <SelectItem value="ativa">Metodologias Ativas</SelectItem>
                      <SelectItem value="hibrida">Híbrida (Presencial + EAD)</SelectItem>
                      <SelectItem value="projetos">Aprendizagem Baseada em Projetos</SelectItem>
                      <SelectItem value="problemas">Aprendizagem Baseada em Problemas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações Adicionais (Opcional)</Label>
                  <Textarea 
                    id="notes"
                    placeholder="Ex: Enfatizar aplicações práticas, incluir laboratórios, seguir diretrizes do MEC..."
                    rows={3}
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({...formData, additionalNotes: e.target.value})}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                  <Link href="/dashboard">
                    <Button variant="outline">
                      Cancelar
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleGenerate}
                    disabled={!formData.discipline || !formData.semester || !formData.workload}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Plano com IA
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Generating Step */}
        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <Card className="w-full max-w-2xl">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Animated Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <Loader2 className="relative h-20 w-20 text-primary animate-spin" />
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Gerando seu plano de ensino...</h2>
                    <p className="text-muted-foreground">
                      Nossa IA está analisando suas informações e criando um plano personalizado
                    </p>
                  </div>

                  {/* Progress Steps */}
                  <div className="w-full max-w-md space-y-4 pt-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">Analisando disciplina</p>
                        <p className="text-sm text-muted-foreground">Contexto acadêmico identificado</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">Estruturando conteúdo</p>
                        <p className="text-sm text-muted-foreground">Organizando unidades temáticas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      <div className="flex-1 text-left">
                        <p className="font-medium">Gerando objetivos e metodologia</p>
                        <p className="text-sm text-muted-foreground">Personalizando abordagem pedagógica</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-muted"></div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-muted-foreground">Definindo avaliações</p>
                        <p className="text-sm text-muted-foreground">Aguardando...</p>
                      </div>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <p className="text-sm text-muted-foreground pt-4">
                    Tempo estimado: 5-10 minutos ⚡
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <Card className="w-full max-w-2xl border-green-200 bg-green-50/50">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center text-center space-y-6">
                  {/* Success Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl"></div>
                    <CheckCircle2 className="relative h-20 w-20 text-green-500" />
                  </div>

                  {/* Title */}
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Plano gerado com sucesso! 🎉</h2>
                    <p className="text-muted-foreground">
                      Seu plano de ensino está pronto para revisão e edição
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="w-full bg-background rounded-lg p-6 text-left space-y-2">
                    <h3 className="font-semibold mb-3">Resumo do Plano</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Disciplina:</span>
                        <p className="font-medium">Cálculo Diferencial e Integral I</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Período:</span>
                        <p className="font-medium">2024.2</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carga Horária:</span>
                        <p className="font-medium">60 horas</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unidades:</span>
                        <p className="font-medium">4 unidades temáticas</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Link href="/dashboard">
                      <Button variant="outline">
                        Voltar ao Dashboard
                      </Button>
                    </Link>
                    <Link href="/plans/review/1">
                      <Button className="gap-2">
                        Revisar e Editar Plano
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  )
}
