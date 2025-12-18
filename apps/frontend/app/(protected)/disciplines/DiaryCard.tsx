'use client'



import { Button } from "@/components/ui/button"
import { BookOpen, Loader2, AlertCircle, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { useTeachingPlans } from "@/hooks/api"
import type { Diary } from "@/types"

interface DiaryCardProps {
  diary: Diary
}

export function DiaryCard({ diary }: DiaryCardProps) {
  const { data: plans = [], isLoading: loadingPlans } = useTeachingPlans(diary.id)

  return (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col h-full">
      <div className="p-6 pb-0 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg text-xs tracking-wide uppercase">
            {diary.turma}
          </div>
          {diary.periodo && (
            <span className="text-slate-400 font-bold text-xs flex items-center">
              <Clock className="w-3 h-3 mr-1" /> {diary.periodo}
            </span>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
          {diary.disciplina}
        </h3>
        <p className="text-slate-500 font-medium text-sm mb-6">{diary.curso}</p>

        {/* Loading / Empty / List Plans */}
        <div className="space-y-3 mb-6">
          {loadingPlans ? (
            <div className="flex items-center text-sm text-slate-400 font-medium">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando planos...
            </div>
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/teaching-plans/${plan.id}`}
                className="block bg-slate-50 hover:bg-indigo-50 p-3 rounded-xl transition-colors border border-transparent hover:border-indigo-100 group/plan"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plan.status}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover/plan:text-indigo-500" />
                </div>
                <p className="font-bold text-slate-700 text-sm group-hover/plan:text-indigo-700 truncate">
                  {plan.unidadeCurricular || diary.disciplina}
                </p>
              </Link>
            ))
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start">
              <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-slate-700">Sem planos</p>
                <p className="text-xs text-slate-500 mt-1">Nenhum plano gerado para esta turma.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <Link href={`/diaries/${diary.id}`}>
          <Button className="w-full bg-white text-slate-700 hover:bg-white hover:text-indigo-600 border border-slate-200 shadow-sm font-bold h-11">
            <BookOpen className="w-4 h-4 mr-2" /> Gerenciar Aulas
          </Button>
        </Link>
      </div>
    </div>
  )
}
