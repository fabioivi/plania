'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useCredentials } from "@/hooks/api";
import {
  Sparkles,

  BookOpen,
  FileText,
  Clock,
  Plus,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: credentials = [] } = useCredentials();
  const hasVerifiedCredential = credentials.some(c => c.system === 'ifms' && c.isVerified);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Professor';

  // Mock data for UI development
  const stats = [
    { label: 'Disciplinas Ativas', value: '12', icon: BookOpen, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Planos Gerados', value: '24', icon: FileText, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Horas Economizadas', value: '120h', icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  ];

  const recentPlans = [
    { title: 'Cálculo I', date: 'Há 2 horas', status: 'Rascunho', color: 'bg-yellow-100 text-yellow-800' },
    { title: 'Física Geral', date: 'Ontem', status: 'Concluído', color: 'bg-green-100 text-green-800' },
    { title: 'Álgebra Linear', date: '16 Dez', status: 'Em Revisão', color: 'bg-indigo-100 text-indigo-800' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-foreground tracking-tight leading-tight">Olá, {firstName}! 👋</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 font-medium">Vamos planejar aulas incríveis hoje.</p>
        </div>
        <Link href="/generate">
          <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <Plus className="mr-2 h-5 w-5" /> Novo Plano
          </Button>
        </Link>
      </div>

      {/* Alert if not configured */}
      {!hasVerifiedCredential && (
        <div className="bg-white dark:bg-card border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 shadow-sm dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
            <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
              <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-foreground text-sm md:text-base">Conecte sua conta do IFMS</h3>
              <p className="text-slate-600 dark:text-muted-foreground text-xs md:text-sm max-w-xl">
                Sincronize seus diários e <span className="font-bold text-indigo-700 dark:text-indigo-400">automatize seus planos</span>.
              </p>
            </div>
          </div>
          <Link href="/settings" className="w-full md:w-auto">
            <Button size="sm" className="w-full md:w-auto px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:shadow-none font-semibold text-sm">
              Conectar Agora <Sparkles className="ml-2 h-3 w-3 text-indigo-100" />
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-card p-8 rounded-3xl shadow-sm dark:shadow-none border border-slate-100 dark:border-border flex items-center space-x-6 hover:translate-y-[-2px] transition-transform duration-300">
            <div className={`h-14 w-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-7 w-7 ${stat.color}`} />
            </div>
            <div>
              <h4 className="text-4xl font-black text-slate-900 dark:text-foreground tracking-tight">{stat.value}</h4>
              <p className="text-slate-500 dark:text-muted-foreground font-bold text-xs uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Plans (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-foreground flex items-center"><TrendingUp className="mr-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Atividades Recentes</h3>
            <Link href="/plans" className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">Ver tudo</Link>
          </div>

          <div className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-border shadow-sm dark:shadow-none overflow-hidden">
            {recentPlans.map((plan, i) => (
              <div key={i} className="p-6 border-b border-slate-50 dark:border-border/50 last:border-0 hover:bg-slate-50 dark:hover:bg-secondary/20 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-foreground text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{plan.title}</h4>
                    <p className="text-sm text-slate-400 dark:text-muted-foreground font-medium">{plan.date}</p>
                  </div>
                </div>
                <Badge className={`${plan.color} border-none px-3 py-1 rounded-lg font-bold`}>{plan.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Tips (1/3 width) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-foreground flex items-center"><Sparkles className="mr-2 h-5 w-5 text-amber-500" /> Dicas da IA</h3>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-900 dark:to-purple-900 rounded-3xl p-8 text-white shadow-xl dark:shadow-none relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-3">Otimize seu tempo</h4>
              <p className="text-indigo-100 dark:text-indigo-200 mb-6 leading-relaxed">A IA percebeu que você tem 3 turmas de Cálculo. Que tal unificar o planejamento?</p>
              <Button className="bg-white text-indigo-700 hover:bg-indigo-50 border-none w-full font-bold">Gerar Plano Unificado</Button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
