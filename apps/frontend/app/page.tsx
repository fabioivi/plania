'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/plans');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Bem-vindo ao <span className="text-black">PlanIA</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Plataforma inteligente para criação e gerenciamento de planos de ensino.
            Automatize o preenchimento de diários e planos no sistema acadêmico.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="text-lg px-8">
                Começar agora
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Entrar
              </Button>
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Automatização
              </h3>
              <p className="mt-2 text-gray-600">
                Preencha automaticamente diários e planos no sistema acadêmico
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Segurança
              </h3>
              <p className="mt-2 text-gray-600">
                Suas credenciais são criptografadas com AES-256-GCM
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">
                Produtividade
              </h3>
              <p className="mt-2 text-gray-600">
                Economize tempo com processos automáticos e inteligentes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
