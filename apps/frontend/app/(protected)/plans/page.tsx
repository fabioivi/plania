'use client'

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import { FileText, Search, Filter, Sparkles, Plus } from "lucide-react"
import Link from "next/link"

export default function PlansPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-foreground tracking-tight">Meus Planos de Ensino</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 font-medium">Biblioteca completa de planejamentos.</p>
        </div>
        <Link href="/generate">
          <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Plus className="mr-2 h-5 w-5" /> Novo Plano
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-card p-4 rounded-2xl border border-slate-100 dark:border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Buscar plano por título..."
            className="pl-12 h-12 rounded-xl bg-slate-50 dark:bg-secondary/50 border-slate-200 dark:border-border focus:ring-indigo-500"
          />
        </div>
        <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 dark:border-border">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      {/* Empty State / Content */}
      <div className="bg-white dark:bg-card rounded-[2.5rem] border border-slate-200 dark:border-border p-16 text-center shadow-sm">
        <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-950/50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
          <FileText className="h-10 w-10 text-indigo-500" />
        </div>
        <h3 className="text-3xl font-black text-slate-900 dark:text-foreground mb-4 tracking-tight">Comece a planejar</h3>
        <p className="text-slate-500 dark:text-muted-foreground max-w-lg mx-auto mb-10 font-medium text-lg">
          Você ainda não tem planos salvos. Use nossa Inteligência Artificial para gerar seu primeiro plano de ensino em segundos.
        </p>
        <Link href="/generate">
          <Button size="lg" className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 dark:shadow-none text-lg">
            <Sparkles className="mr-2 h-6 w-6" /> Gerar com IA
          </Button>
        </Link>
      </div>
    </div>
  )
}
