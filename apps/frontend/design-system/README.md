# PlanIA Design System

**Design System Monocromático Completo para Plataforma Educacional**

![Version](https://img.shields.io/badge/version-1.0.0-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-black)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)
![Acessibilidade](https://img.shields.io/badge/WCAG-2.1%20AA-black)

---

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento](#espaçamento)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Componentes](#componentes)
8. [Estados Interativos](#estados-interativos)
9. [Acessibilidade](#acessibilidade)
10. [Instalação](#instalação)
11. [Uso](#uso)

---

## 🎨 Visão Geral

O **PlanIA Design System** é um sistema de design **monocromático (preto e branco)** criado especificamente para plataformas educacionais, focado em:

- ✨ **Elegância minimalista**
- 📖 **Legibilidade máxima**
- ♿ **Acessibilidade WCAG 2.1 AA**
- 🚀 **Performance otimizada**
- 📱 **Responsividade total**

---

## 🎨 Paleta de Cores

### Cores Base

```css
/* Escala Monocromática */
Preto Puro:        #000000 (texto principal, ícones)
Preto Escuro:      #1A1A1A (backgrounds secundários)
Cinza Muito Escuro: #2D2D2D (elementos terciários)
Cinza Escuro:      #4A4A4A (texto desabilitado)
Cinza Médio:       #808080 (placeholders)
Cinza Claro:       #D3D3D3 (bordas, dividers)
Cinza Muito Claro: #F5F5F5 (backgrounds leves)
Branco Puro:       #FFFFFF (background principal)
```

### Tokens Semânticos

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#000000` | Botões, ações principais |
| `primary-foreground` | `#FFFFFF` | Texto sobre preto |
| `secondary` | `#F5F5F5` | Backgrounds secundários |
| `accent` | `#2D2D2D` | Hover states, focus |
| `muted` | `#808080` | Texto desabilitado |
| `border` | `#D3D3D3` | Bordas padrão |
| `background` | `#FFFFFF` | Fundo da página |
| `foreground` | `#000000` | Texto principal |

### Exemplo de Uso

```tsx
<div className="bg-white border-gray-light text-black">
  <h1 className="text-black-pure">Título Principal</h1>
  <p className="text-gray-dark">Texto secundário</p>
</div>
```

---

## ✍️ Tipografia

### Font Stack

```css
font-sans: "Inter", "Roboto", -apple-system, sans-serif
font-mono: "JetBrains Mono", "Fira Code", "Monaco", monospace
```

### Escala Tipográfica

| Classe | Tamanho | Line Height | Uso |
|--------|---------|-------------|-----|
| `text-xs` | 11px | 1.2 | Captions, labels pequenos |
| `text-sm` | 13px | 1.4 | Helper text, small text |
| `text-base` | 15px | 1.5 | **Body padrão** |
| `text-lg` | 17px | 1.6 | Large body, list items |
| `text-xl` | 19px | 1.6 | Subheadings |
| `text-2xl` | 22px | 1.5 | Headings |
| `text-3xl` | 28px | 1.3 | **Page titles** |
| `text-4xl` | 36px | 1.2 | Hero titles |

### Pesos

- `font-regular`: 400 (corpo de texto)
- `font-medium`: 500 (labels, ênfase leve)
- `font-semibold`: 600 (headings, botões)
- `font-bold`: 700 (títulos principais)

### Hierarquia Recomendada

```tsx
// H1 - Título da Página
<h1 className="text-3xl font-semibold text-black">
  Planos de Ensino
</h1>

// H2 - Seção
<h2 className="text-2xl font-semibold text-black">
  Meus Planos
</h2>

// H3 - Subseção
<h3 className="text-xl font-medium text-black">
  Matemática - 5º Ano
</h3>

// Body
<p className="text-base font-regular text-black">
  Conteúdo do parágrafo...
</p>

// Helper Text
<span className="text-sm font-regular text-gray-dark">
  Campo obrigatório
</span>
```

---

## 📏 Espaçamento

### Grid de Espaçamento

| Classe | Valor | Uso |
|--------|-------|-----|
| `space-1` | 2px | Micro spacing |
| `space-2` | 4px | Tight spacing |
| `space-3` | 6px | Extra tight |
| `space-4` | 8px | Tight |
| `space-6` | 12px | Small |
| `space-8` | 16px | **Standard** |
| `space-10` | 20px | Medium |
| `space-12` | 24px | Large |
| `space-16` | 32px | Extra large |
| `space-20` | 40px | Huge |
| `space-24` | 48px | Very huge |

### Padrões Recomendados

```tsx
// Card
<div className="p-6">  // 24px padding

// Container
<div className="px-8 py-6">  // 32px horizontal, 24px vertical

// Form Field
<input className="p-3" />  // 12px padding

// Button
<button className="px-4 py-2">  // 16px x 8px

// Section Gap
<div className="space-y-8">  // 16px entre itens
```

---

## 🔲 Border Radius

| Classe | Valor | Uso |
|--------|-------|-----|
| `rounded-none` | 0px | Sem arredondamento |
| `rounded-sm` | 4px | Inputs, small components |
| `rounded-base` | 6px | **Padrão** |
| `rounded-md` | 8px | Botões, cards médios |
| `rounded-lg` | 12px | Cards, modais |
| `rounded-full` | 9999px | Badges, avatares |

### Uso por Componente

```tsx
<button className="rounded-md">Botão</button>      // 8px
<input className="rounded-base" />                  // 6px
<div className="card rounded-lg">Card</div>         // 12px
<span className="badge rounded-full">New</span>     // pill shape
```

---

## 🌑 Shadows

### Escala de Sombras

| Classe | Valor | Uso |
|--------|-------|-----|
| `shadow-none` | none | Flat design |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.08)` | Subtle |
| `shadow-base` | `0 2px 4px rgba(0,0,0,0.12)` | **Cards padrão** |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.15)` | Hover state |
| `shadow-lg` | `0 8px 16px rgba(0,0,0,0.18)` | Elevated cards |
| `shadow-xl` | `0 12px 24px rgba(0,0,0,0.20)` | **Modais** |
| `shadow-2xl` | `0 16px 32px rgba(0,0,0,0.22)` | Highest elevation |
| `shadow-inset-sm` | `inset 0 1px 2px rgba(0,0,0,0.05)` | Pressed state |

### Hierarquia Visual

```tsx
// Default Card
<div className="shadow-base">...</div>

// Hover Card
<div className="shadow-base hover:shadow-md transition-shadow">...</div>

// Modal
<div className="shadow-xl">...</div>

// Pressed Button
<button className="active:shadow-inset-sm">...</button>
```

---

## 🧩 Componentes

### Button

```tsx
import { Button } from "@/components/ui/button"

// Variant: Solid (default)
<Button>
  Criar Plano
</Button>

// Variant: Outline
<Button variant="outline">
  Cancelar
</Button>

// Variant: Ghost
<Button variant="ghost">
  Fechar
</Button>

// Disabled
<Button disabled>
  Salvando...
</Button>
```

**Estilos:**
- **Solid**: `bg-black text-white hover:bg-gray-900`
- **Outline**: `border-2 border-black bg-white hover:bg-gray-50`
- **Ghost**: `bg-transparent hover:bg-gray-100`
- **Disabled**: `bg-gray-300 text-gray-500 cursor-not-allowed`

---

### Input

```tsx
import { Input } from "@/components/ui/input"

<div className="space-y-2">
  <label className="label-form">Título do Plano</label>
  <Input 
    placeholder="Digite o título..."
    className="focus-ring"
  />
  <p className="text-helper">Máximo 100 caracteres</p>
</div>
```

**Estilos:**
- Base: `bg-white border border-gray-light rounded-md p-3`
- Focus: `border-black ring-2 ring-black`
- Error: `border-black bg-red-50` (usar preto + fundo levemente avermelhado)
- Disabled: `bg-gray-100 text-gray-500 cursor-not-allowed`

---

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Default Card
<Card>
  <CardHeader>
    <CardTitle>Plano de Matemática</CardTitle>
  </CardHeader>
  <CardContent>
    Conteúdo do card...
  </CardContent>
</Card>

// Elevated (hover)
<Card className="hover-elevate cursor-pointer">
  ...
</Card>
```

**Estilos:**
- Base: `bg-white border border-gray-light rounded-lg p-6 shadow-base`
- Elevated: `shadow-md hover:shadow-lg transition-shadow`
- Flat: `shadow-none border-gray-200`

---

### Badge

```tsx
// Default
<span className="badge-base">Novo</span>

// Outline
<span className="badge-outline">Em Progresso</span>

// Solid
<span className="badge-solid">Concluído</span>
```

**Classes Utilitárias:**
```css
.badge-base      → bg-gray-200 text-black rounded-full px-3 py-1
.badge-outline   → border border-black bg-white rounded-full
.badge-solid     → bg-black text-white rounded-full
```

---

### Select

```tsx
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Selecione a série" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">1º Ano</SelectItem>
    <SelectItem value="2">2º Ano</SelectItem>
    <SelectItem value="3">3º Ano</SelectItem>
  </SelectContent>
</Select>
```

**Estilos:**
- Trigger: mesmo estilo do Input
- Dropdown: `bg-white shadow-xl rounded-md`
- Item Hover: `bg-gray-200`
- Item Selected: `bg-black text-white`

---

### Alert / Toast

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// Info
<Alert>
  <AlertTitle>Informação</AlertTitle>
  <AlertDescription>
    Seu plano foi salvo com sucesso.
  </AlertDescription>
</Alert>

// Success
<Alert className="border-l-4 border-black">
  <AlertTitle>Sucesso!</AlertTitle>
  <AlertDescription>
    Operação concluída.
  </AlertDescription>
</Alert>

// Error
<Alert className="border-l-4 border-black bg-white">
  <AlertTitle>Erro</AlertTitle>
  <AlertDescription>
    Algo deu errado.
  </AlertDescription>
</Alert>
```

---

### Dialog / Modal

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog>
  <DialogContent className="shadow-xl rounded-lg">
    <DialogHeader>
      <DialogTitle>Confirmar Exclusão</DialogTitle>
    </DialogHeader>
    <p>Tem certeza que deseja excluir este plano?</p>
    <div className="flex gap-4 justify-end">
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar</Button>
    </div>
  </DialogContent>
</Dialog>
```

**Estilos:**
- Overlay: `bg-black/50`
- Content: `bg-white rounded-lg shadow-xl border border-gray-light`

---

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">Todos</TabsTrigger>
    <TabsTrigger value="active">Ativos</TabsTrigger>
    <TabsTrigger value="archived">Arquivados</TabsTrigger>
  </TabsList>
  <TabsContent value="all">
    Conteúdo...
  </TabsContent>
</Tabs>
```

**Estilos:**
- Inactive: `text-gray-600 border-b-2 border-transparent`
- Active: `text-black border-b-2 border-black font-semibold`
- Hover: `text-black border-gray-300`

---

### Skeleton (Loading)

```tsx
<div className="skeleton h-4 w-full" />
<div className="skeleton h-20 w-full mt-2" />
<div className="skeleton h-4 w-3/4 mt-2" />
```

**Classe:**
```css
.skeleton {
  @apply bg-gray-light animate-pulse rounded-md;
}
```

---

## 🎯 Estados Interativos

### Hover

```tsx
// Elevação
<div className="hover-elevate">
  Passa o mouse
</div>

// Background
<button className="hover:bg-gray-50 transition-colors">
  Botão
</button>

// Combinado
<Card className="shadow-base hover:shadow-md hover:bg-gray-50 transition-all">
  Card Interativo
</Card>
```

---

### Focus

**Todos os elementos interativos devem ter focus ring visível:**

```tsx
<input className="focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2" />

// Ou usar classe utilitária
<input className="focus-ring" />
```

**Classe Global:**
```css
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2;
}
```

---

### Active / Pressed

```tsx
<button className="active:shadow-inset-sm active:scale-[0.98] transition-transform">
  Clique Aqui
</button>
```

---

### Disabled

```tsx
<button disabled className="disabled:opacity-50 disabled:cursor-not-allowed">
  Desabilitado
</button>

<input disabled className="disabled-state" />
```

**Classe Utilitária:**
```css
.disabled-state {
  @apply opacity-50 cursor-not-allowed;
}
```

---

## ♿ Acessibilidade

### Contraste de Cores

✅ **Todas as combinações atendem WCAG 2.1 AA:**

- Preto (#000000) em Branco (#FFFFFF): **21:1** (AAA)
- Branco (#FFFFFF) em Preto (#000000): **21:1** (AAA)
- Cinza Escuro (#4A4A4A) em Branco: **9.3:1** (AA)

### Focus Indicators

**Sempre visível e com contraste alto:**

```css
*:focus-visible {
  outline: none;
  ring: 2px solid #000000;
  ring-offset: 2px;
}
```

### Screen Reader Support

```tsx
// Texto acessível apenas para leitores de tela
<span className="sr-only">
  Fechar modal
</span>

// ARIA labels
<button aria-label="Deletar plano">
  <TrashIcon />
</button>
```

### Prefers Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  * {
    border-color: #000000;
  }
}
```

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install tailwindcss postcss autoprefixer
npm install tailwindcss-animate
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot
```

### 2. Configurar Tailwind

Copie o arquivo `tailwind.config.js` para a raiz do projeto.

### 3. Configurar shadcn/ui

Copie o arquivo `components.json` para a raiz do projeto.

### 4. Importar Estilos Globais

No seu arquivo principal (ex: `_app.tsx` ou `layout.tsx`):

```tsx
import "@/styles/globals.css"
```

### 5. Instalar Componentes shadcn/ui

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
```

---

## 🚀 Uso

### Estrutura Básica

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="container-plania">
      <h1 className="text-3xl font-semibold text-black mb-8">
        Meus Planos de Ensino
      </h1>

      <Card className="shadow-base hover-elevate">
        <CardHeader>
          <CardTitle className="text-xl">Novo Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="label-form">Título</label>
              <Input 
                placeholder="Digite o título..."
                className="focus-ring mt-2"
              />
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline">Cancelar</Button>
              <Button>Criar Plano</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎨 Classes Utilitárias Customizadas

### Container

```tsx
<div className="container-plania">
  // max-w-7xl mx-auto px-8 py-6
</div>
```

### Cards

```tsx
<div className="card-plania">Default Card</div>
<div className="card-plania-elevated">Elevated Card</div>
<div className="card-plania-flat">Flat Card</div>
```

### Texto

```tsx
<p className="text-helper">Helper text</p>
<p className="text-placeholder">Placeholder</p>
<p className="text-disabled">Disabled</p>
<label className="label-form">Label</label>
```

### Badges

```tsx
<span className="badge-base">Default</span>
<span className="badge-outline">Outline</span>
<span className="badge-solid">Solid</span>
```

### Outros

```tsx
<div className="skeleton h-4 w-full" />
<hr className="divider" />
```

---

## 🌙 Dark Mode (Preparado para Futuro)

O Design System já está preparado para dark mode. Para ativar:

```tsx
<html className="dark">
  ...
</html>
```

As variáveis CSS serão automaticamente invertidas:
- Background: `#000000`
- Foreground: `#FFFFFF`
- Borders: `#404040`
- Shadows: `rgba(255, 255, 255, 0.1)`

---

## 📊 Resumo Rápido

| Elemento | Valor Padrão |
|----------|--------------|
| **Fonte** | Inter 15px/1.5 |
| **Espaçamento** | 8px/16px/24px |
| **Border Radius** | 6px (base), 8px (buttons), 12px (cards) |
| **Shadow** | `0 2px 4px rgba(0,0,0,0.12)` |
| **Focus Ring** | `2px solid #000000` |
| **Contraste** | 21:1 (preto/branco) |

---

## 📝 Licença

Este Design System foi criado para o projeto **PlanIA**.

---

## 🤝 Contribuindo

Para adicionar novos componentes ou modificar tokens:

1. Edite `tailwind.config.js` para tokens de design
2. Edite `globals.css` para variáveis CSS
3. Crie/modifique componentes em `src/components/ui/`
4. Documente mudanças neste README

---

## 📮 Contato

Para dúvidas ou sugestões sobre o Design System, entre em contato com a equipe de desenvolvimento.

---

**Versão:** 1.0.0  
**Última Atualização:** Dezembro 2025  
**Status:** ✅ Pronto para Produção
