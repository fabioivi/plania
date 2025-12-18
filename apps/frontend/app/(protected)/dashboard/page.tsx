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
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: credentials = [] } = useCredentials();
  const hasVerifiedCredential = credentials.some(c => c.system === 'ifms' && c.isVerified);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Professor';

  // Mock data for UI development
  const stats = [
    { label: 'Disciplinas Ativas', value: '12', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Planos Gerados', value: '24', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Horas Economizadas', value: '120h', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Olá, {firstName}! 👋</h1>
          <p className="text-slate-500 mt-2 font-medium">Vamos planejar aulas incríveis hoje.</p>
        </div>
        <Link href="/generate">
          <Button className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
            <Plus className="mr-2 h-5 w-5" /> Novo Plano
          </Button>
        </Link>
      </div>

      {/* Alert if not configured */}
      {!hasVerifiedCredential && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start space-x-4 animate-fade-in">
          <div className="bg-amber-100 p-2 rounded-lg">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 text-lg">Conecte sua conta do IFMS</h3>
            <p className="text-amber-700 mt-1 mb-4">Para gerar planos automaticamente baseados nas suas turmas reais, precisamos conectar ao sistema acadêmico.</p>
            <Link href="/settings">
              <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100">Configurar Agora</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className={`h-16 w-16 rounded-2xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{stat.label}</p>
              <h4 className="text-3xl font-black text-slate-900">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Plans (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-indigo-600" /> Atividades Recentes</h3>
            <Link href="/plans" className="text-indigo-600 font-bold text-sm hover:underline">Ver tudo</Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {recentPlans.map((plan, i) => (
              <div key={i} className="p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{plan.title}</h4>
                    <p className="text-sm text-slate-400 font-medium">{plan.date}</p>
                  </div>
                </div>
                <Badge className={`${plan.color} border-none px-3 py-1 rounded-lg font-bold`}>{plan.status}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Tips (1/3 width) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center"><Sparkles className="mr-2 h-5 w-5 text-amber-500" /> Dicas da IA</h3>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <h4 className="font-bold text-xl mb-3">Otimize seu tempo</h4>
              <p className="text-indigo-100 mb-6 leading-relaxed">A IA percebeu que você tem 3 turmas de Cálculo. Que tal unificar o planejamento?</p>
              <Button className="bg-white text-indigo-700 hover:bg-indigo-50 border-none w-full font-bold">Gerar Plano Unificado</Button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center"><Calendar className="mr-2 h-4 w-4 text-slate-400" /> Próximas Aulas</h4>
            <div className="space-y-4">
              {['Cálculo I - Turma A', 'Física - Lab 2', 'Mentoria'].map((a, i) => (
                <div key={i} className="flex items-center text-slate-600 font-medium pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div> {a}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
