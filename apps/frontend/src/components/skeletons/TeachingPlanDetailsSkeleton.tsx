import { ChevronLeft } from "lucide-react"

export function TeachingPlanDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background pb-20 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto">

                {/* Back Button Placeholder */}
                <div className="mb-6 print:hidden">
                    <div className="inline-flex items-center gap-2 pl-0 text-slate-500 dark:text-muted-foreground opacity-50 cursor-not-allowed">
                        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-full p-1">
                            <ChevronLeft className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">Voltar para Disciplinas</span>
                    </div>
                </div>

                {/* Header Action Bar Skeleton */}
                <div className="mb-8 flex flex-col gap-6 bg-white dark:bg-card p-6 rounded-[2rem] border border-slate-200 dark:border-border shadow-sm dark:shadow-none relative overflow-hidden">
                    {/* Decorative background blob */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10 w-full">

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="h-5 w-24 bg-slate-100 dark:bg-secondary rounded-md animate-pulse" />
                            <div className="h-5 w-32 bg-slate-100 dark:bg-secondary rounded-md animate-pulse" />
                            <div className="h-5 w-20 bg-slate-100 dark:bg-secondary rounded-md animate-pulse" />
                            <div className="h-5 w-28 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-md animate-pulse" />
                        </div>

                        {/* Title */}
                        <div className="mb-3 space-y-2">
                            <div className="h-9 w-3/4 md:w-2/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4 mb-4">
                            <div className="h-4 w-56 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="relative z-10 flex flex-wrap gap-3 w-full justify-start">
                        <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="h-10 w-44 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl animate-pulse" />
                        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                        <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                    </div>

                    {/* Shimmer Overlay */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent z-0 pointer-events-none" />
                </div>

                {/* Content Cards Skeleton */}
                <div className="space-y-8">
                    {/* Card 1 - Ementa */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        {/* Card Content */}
                        <div className="p-6 space-y-3">
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Card 2 - Objetivos */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Objetivo Geral */}
                            <div className="space-y-3">
                                <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            </div>
                            {/* Objetivos Específicos */}
                            <div className="space-y-3">
                                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                    <div className="h-4 w-4/5 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3 - Metodologia */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-11/12 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Card 4 - Cronograma (Table) */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="p-0">
                            {/* Table Header */}
                            <div className="h-12 border-b border-slate-100 dark:border-border bg-slate-50/30 dark:bg-secondary/20" />
                            {/* Table Rows */}
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-50 dark:border-border/50 last:border-0">
                                    <div className="h-8 w-16 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                        <div className="h-3 w-1/2 bg-slate-50 dark:bg-slate-800/50 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Card 5 - Avaliação */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                            <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Card 6 - Bibliografia */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
                        <div className="bg-slate-50/80 dark:bg-secondary/30 p-4 border-b border-slate-100 dark:border-border flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/50 animate-pulse" />
                            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Bibliografia Básica */}
                            <div className="space-y-3">
                                <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                    <div className="h-4 w-11/12 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                </div>
                            </div>
                            {/* Bibliografia Complementar */}
                            <div className="space-y-3">
                                <div className="h-5 w-52 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    )
}
