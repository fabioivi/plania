// Exemplo de página usando o Design System PlanIA
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-light">
        <div className="container-plania flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold text-black">PlanIA</h1>
          <nav className="flex gap-4">
            <Button variant="ghost">Meus Planos</Button>
            <Button variant="ghost">Configurações</Button>
            <Button>Novo Plano</Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-plania py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-black mb-2">
            Meus Planos de Ensino
          </h1>
          <p className="text-helper">
            Crie e gerencie seus planos de ensino com auxílio de IA
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <Card className="hover-elevate cursor-pointer transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="solid">Ativo</Badge>
                <span className="text-xs text-gray-medium">Há 2 dias</span>
              </div>
              <CardTitle>Matemática - 5º Ano</CardTitle>
              <CardDescription>
                Plano de ensino para o primeiro semestre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-dark">
                Objetivos: Desenvolver habilidades em álgebra básica e geometria...
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button size="sm">Ver Detalhes</Button>
            </CardFooter>
          </Card>

          {/* Card 2 */}
          <Card className="hover-elevate cursor-pointer transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">Rascunho</Badge>
                <span className="text-xs text-gray-medium">Há 5 dias</span>
              </div>
              <CardTitle>Português - 6º Ano</CardTitle>
              <CardDescription>
                Em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-dark">
                Objetivos: Aprimorar leitura e interpretação de textos...
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button size="sm">Ver Detalhes</Button>
            </CardFooter>
          </Card>

          {/* Card 3 - Loading State */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter className="gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </CardFooter>
          </Card>
        </div>

        <div className="divider"></div>

        {/* Formulário de Novo Plano */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Criar Novo Plano de Ensino</CardTitle>
            <CardDescription>
              Preencha as informações básicas do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Plano *</Label>
                <Input 
                  id="title"
                  placeholder="Ex: Matemática - 5º Ano - 1º Semestre"
                  className="focus-ring"
                />
                <p className="text-xs text-gray-medium">
                  Máximo 100 caracteres
                </p>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description"
                  placeholder="Descreva os principais objetivos e temas deste plano..."
                  rows={4}
                  className="focus-ring"
                />
              </div>

              {/* Disciplina */}
              <div className="space-y-2">
                <Label htmlFor="subject">Disciplina *</Label>
                <Input 
                  id="subject"
                  placeholder="Ex: Matemática, Português, Ciências..."
                  className="focus-ring"
                />
              </div>

              {/* Série/Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Série/Ano *</Label>
                  <Input 
                    id="grade"
                    placeholder="Ex: 5º Ano"
                    className="focus-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period">Período</Label>
                  <Input 
                    id="period"
                    placeholder="Ex: 1º Semestre"
                    className="focus-ring"
                  />
                </div>
              </div>

              {/* Badges de Exemplo */}
              <div className="space-y-2">
                <Label>Categorias</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Álgebra</Badge>
                  <Badge variant="default">Geometria</Badge>
                  <Badge variant="outline">Frações</Badge>
                  <Badge variant="outline">+ Adicionar</Badge>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost">Cancelar</Button>
            <div className="flex gap-2">
              <Button variant="outline">Salvar Rascunho</Button>
              <Button>Criar com IA</Button>
            </div>
          </CardFooter>
        </Card>

        {/* Estados de Botão */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-black mb-6">
            Componentes e Estados
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Botões */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Botões</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Default</p>
                  <Button>Botão Primário</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Outline</p>
                  <Button variant="outline">Botão Outline</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Ghost</p>
                  <Button variant="ghost">Botão Ghost</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Disabled</p>
                  <Button disabled>Botão Desabilitado</Button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Tamanhos</p>
                  <div className="flex items-center gap-2">
                    <Button size="sm">Pequeno</Button>
                    <Button size="default">Padrão</Button>
                    <Button size="lg">Grande</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Variantes</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="solid">Solid</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-dark">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="solid">Ativo</Badge>
                    <Badge variant="outline">Rascunho</Badge>
                    <Badge variant="default">Arquivado</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inputs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Input Normal</Label>
                  <Input placeholder="Digite algo..." />
                </div>
                <div className="space-y-2">
                  <Label>Input Desabilitado</Label>
                  <Input disabled placeholder="Desabilitado" />
                </div>
                <div className="space-y-2">
                  <Label>Textarea</Label>
                  <Textarea placeholder="Digite um texto longo..." />
                </div>
              </CardContent>
            </Card>

            {/* Loading States */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-28" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-light mt-16">
        <div className="container-plania py-6 text-center">
          <p className="text-sm text-gray-medium">
            © 2025 PlanIA - Sistema de Planos de Ensino com IA
          </p>
        </div>
      </footer>
    </div>
  )
}
