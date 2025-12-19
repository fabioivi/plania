# PlanIA - Design System

Design System monocromático completo para a plataforma PlanIA.

## 📁 Estrutura do Projeto

```
PlanIA/
├── design-system/
│   └── README.md              # Documentação completa
├── src/
│   ├── components/ui/         # Componentes shadcn/ui customizados
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   └── skeleton.tsx
│   ├── lib/
│   │   └── utils.ts           # Utilitários (cn function)
│   ├── styles/
│   │   └── globals.css        # Estilos globais e tokens CSS
│   └── examples/
│       └── example-page.tsx   # Página exemplo completa
├── tailwind.config.js         # Configuração do Tailwind
├── components.json            # Configuração do shadcn/ui
├── postcss.config.js          # Configuração do PostCSS
├── tsconfig.json              # Configuração do TypeScript
└── package.json               # Dependências
```

## 🚀 Início Rápido

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar Projeto

```bash
npm run dev
```

### 3. Ver Documentação Completa

Acesse: `design-system/README.md`

## 📦 O que foi Criado

✅ **Configurações Base**
- Tailwind CSS configurado com paleta monocromática
- shadcn/ui configurado
- PostCSS e Autoprefixer
- TypeScript configurado
- Path aliases (@/components, @/lib, @/styles)

✅ **Tokens de Design**
- Paleta de cores monocromática (8 tons)
- Tipografia (Inter font, 8 tamanhos)
- Espaçamento (12 valores)
- Border radius (6 valores)
- Shadows (7 níveis)

✅ **Componentes UI**
- Button (4 variantes + tamanhos)
- Input & Textarea
- Card (com Header, Title, Content, Footer)
- Badge (4 variantes)
- Label
- Skeleton (loading states)

✅ **Estilos Globais**
- CSS Variables (light + dark mode preparado)
- Utilitários customizados
- Acessibilidade (WCAG 2.1 AA)
- Focus states
- Hover states
- Disabled states

✅ **Documentação**
- README completo com exemplos
- Guia de uso para cada componente
- Exemplos de código
- Boas práticas de acessibilidade

✅ **Exemplo Prático**
- Página completa (`src/examples/example-page.tsx`)
- Demonstração de todos os componentes
- Casos de uso reais

## 🎨 Paleta de Cores

```css
Preto Puro:         #000000
Preto Escuro:       #1A1A1A
Cinza Muito Escuro: #2D2D2D
Cinza Escuro:       #4A4A4A
Cinza Médio:        #808080
Cinza Claro:        #D3D3D3
Cinza Muito Claro:  #F5F5F5
Branco Puro:        #FFFFFF
```

## 🧩 Componentes Disponíveis

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
```

## 📖 Exemplo de Uso

```tsx
<Card className="shadow-base">
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    <Label>Nome</Label>
    <Input placeholder="Digite seu nome..." />
  </CardContent>
  <CardFooter>
    <Button>Salvar</Button>
  </CardFooter>
</Card>
```

## ♿ Acessibilidade

✅ Contraste mínimo: 21:1 (AAA)
✅ Focus indicators visíveis
✅ Suporte a screen readers
✅ Suporte a prefers-reduced-motion
✅ Suporte a high contrast mode

## 📝 Próximos Passos

Para adicionar mais componentes shadcn/ui:

```bash
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dropdown-menu
```

## 📚 Recursos

- [Documentação Completa](./design-system/README.md)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Versão:** 1.0.0  
**Status:** ✅ Pronto para Produção

## 🚀 Configuração de Deploy Automático (CI/CD)

Este projeto usa GitHub Actions para construir e publicar imagens Docker, e webhooks para atualizar automaticamente o Portainer.

### 1. Obter o Webhook no Portainer
1. Acesse seu **Portainer**.
2. Vá para **Stacks** e selecione a Stack do PlanIA.
3. Clique na aba **Editor**.
4. Ative a opção **"Webhook"** (ou "Git Repository" > "Automatic updates" > "Webhook").
5. Copie a URL gerada (ex: `https://portainer.seu-dominio.com/api/stacks/webhooks/...`).

### 2. Configurar o Secret no GitHub
1. No repositório do GitHub, vá em **Settings** > **Secrets and variables** > **Actions**.
2. Clique em **New repository secret**.
3. **Name**: `PORTAINER_WEBHOOK`
4. **Value**: Cole a URL do webhook que você copiou do Portainer.
5. Clique em **Add secret**.

Agora, sempre que você fizer um *push* de uma nova versão ou tag, o GitHub Actions irá:
1. Construir as imagens Docker.
2. Publicar no GitHub Container Registry (GHCR).
3. Acionar o Portainer para baixar a nova imagem e atualizar a Stack automaticamente.
