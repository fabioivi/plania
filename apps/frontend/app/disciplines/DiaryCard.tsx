'use client'

/**
 * DiaryCard Component
 * Card component for displaying a diary with its teaching plans
 * Uses React Query for data fetching
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, FileText, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useTeachingPlans } from "@/hooks/api"
import type { Diary } from "@/types"

interface DiaryCardProps {
  diary: Diary
}

export function DiaryCard({ diary }: DiaryCardProps) {
  // React Query hook - cada card gerencia sua própria query
  const { data: plans = [], isLoading: loadingPlans } = useTeachingPlans(diary.id)

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                {diary.turma}
              </Badge>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
                Em Andamento
              </Badge>
            </div>
            <CardTitle className="text-lg">{diary.disciplina}</CardTitle>
            <CardDescription className="mt-1">
              {diary.curso}
            </CardDescription>
            {diary.periodo && (
              <p className="text-xs text-muted-foreground mt-1">
                Período: {diary.periodo}
              </p>
            )}
          </div>
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Teaching Plans Section */}
        {loadingPlans ? (
          <div className="mb-4 p-3 bg-muted/50 rounded-md flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando planos...</span>
          </div>
        ) : plans.length > 0 ? (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {plans.length} {plans.length === 1 ? 'Plano de Ensino' : 'Planos de Ensino'}
              </span>
            </div>
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/teaching-plans/${plan.id}`}
                className="block p-3 bg-muted/30 hover:bg-muted/60 rounded-md transition-colors border border-transparent hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {plan.unidadeCurricular || diary.disciplina}
                    </p>
                    {plan.professores && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Prof. {plan.professores}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {plan.status}
                      </Badge>
                      {plan.anoSemestre && (
                        <span className="text-xs text-muted-foreground">
                          {plan.anoSemestre}
                        </span>
                      )}
                    </div>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">Nenhum plano de ensino encontrado</p>
              <p className="text-xs text-yellow-700 mt-1">
                Sincronize novamente ou crie um plano manualmente
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/diaries/${diary.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="gap-2 w-full">
              <FileText className="h-4 w-4" />
              Ver Conteúdo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
