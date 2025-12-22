'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const onNavigate = (page: string) => {
    if (page === 'landing') {
      router.push('/');
    } else if (page === 'login') {
      router.push('/login');
    } else if (page === 'dashboard') {
      router.push('/dashboard');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await register(
        formData.fullName,
        formData.email,
        formData.password
      );
      // The register function in AuthContext handles token storage and state updates.
      // Redirecting to dashboard is usually handled by a useEffect in auth context or manually here.
      // Assuming AuthContext automatically updates 'isAuthenticated', we can redirect.
      onNavigate('dashboard');
    } catch (err: any) {
      // Extract error message safely from Axios error or fallback
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar conta. Tente novamente.';
      setError(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 -ml-20 -mt-20 w-[500px] h-[500px] bg-purple-100 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-[500px] h-[500px] bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white dark:bg-card rounded-3xl shadow-xl dark:shadow-none border border-slate-100 dark:border-border p-8 relative z-10">
        <button
          onClick={() => onNavigate('landing')}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-none">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground">Comece Gratuitamente</h2>
          <p className="text-slate-500 dark:text-muted-foreground mt-2">Junte-se a milhares de professores inovadores.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-foreground mb-2">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Maria da Silva"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-secondary/50 font-medium text-slate-700 dark:text-foreground outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="prof.maria@escola.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-secondary/50 font-medium text-slate-700 dark:text-foreground outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-foreground mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo de 6 caracteres"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 dark:bg-secondary/50 font-medium text-slate-700 dark:text-foreground outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-start py-2">
            <input type="checkbox" id="terms" className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" required />
            <label htmlFor="terms" className="ml-2 text-sm text-slate-600 dark:text-muted-foreground">
              Eu concordo com os <a href="#" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Termos de Serviço</a> e <a href="#" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Política de Privacidade</a>.
            </label>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? 'Criando Conta...' : 'Criar Conta Grátis'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-border text-center">
          <p className="text-slate-600 dark:text-muted-foreground">
            Já tem uma conta?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
