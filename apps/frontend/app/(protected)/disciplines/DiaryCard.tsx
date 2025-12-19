import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ArrowRight, Clock, CalendarDays, GraduationCap } from "lucide-react"
import Link from "next/link"
import { useTeachingPlans } from "@/hooks/api"
import type { Diary } from "@/types"

interface DiaryCardProps {
  diary: Diary
}

export function DiaryCard({ diary }: DiaryCardProps) {
  const { data: plans = [], isLoading: loadingPlans } = useTeachingPlans(diary.id)

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Decorative gradient top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-7 flex-1 flex flex-col">
        {/* Header: Turma / Periodo */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 text-indigo-700 font-black px-3 py-1.5 rounded-lg text-xs tracking-wider uppercase border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors duration-300">
              {diary.turma}
            </div>
          </div>
          {diary.periodo && (
            <div className="flex items-center text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wide">{diary.periodo}</span>
            </div>
          )}
        </div>

        {/* Title & Info */}
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {diary.disciplina}
          </h3>
          <div className="flex items-center text-slate-500 font-medium text-sm">
            <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
            {diary.curso}
          </div>
        </div>

        {/* Plans Section */}
        <div className="space-y-3 mt-auto">
          {loadingPlans ? (
            <div className="flex items-center justify-center py-6 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
              <span className="text-sm font-medium text-slate-500">Carregando planos...</span>
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 mb-2">Planos de Ensino</p>
              {plans.slice(0, 2).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/teaching-plans/${plan.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group/plan"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${plan.status === 'CONCLUIDO' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-sm font-semibold text-slate-700 group-hover/plan:text-indigo-700 truncate">
                      {plan.unidadeCurricular || "Plano de Ensino"}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover/plan:text-indigo-500 transition-transform group-hover/plan:translate-x-1" />
                </Link>
              ))}
              {plans.length > 2 && (
                <div className="text-center">
                  <span className="text-xs font-medium text-slate-400">e mais {plans.length - 2} planos</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center justify-center text-center group-hover:bg-indigo-50/30 transition-colors">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
              </div>
              <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-700">Nenhum plano</p>
              <p className="text-xs text-slate-400 mt-1">Gere um plano com IA para começar</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 bg-slate-50/50 border-t border-slate-100 group-hover:bg-white transition-colors">
        <Link href={`/diaries/${diary.id}`} className="block">
          <Button className="w-full bg-white text-slate-700 hover:bg-indigo-600 hover:text-white border border-slate-200 hover:border-indigo-600 shadow-sm font-bold h-12 rounded-xl transition-all active:scale-[0.98]">
            <CalendarDays className="w-4 h-4 mr-2" />
            Gerenciar Aulas
          </Button>
        </Link>
      </div>
    </div>
  )
}
