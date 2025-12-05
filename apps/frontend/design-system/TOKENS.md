# Design Tokens - PlanIA

## 📐 Referência Rápida de Tokens

### Cores (Tailwind Classes)

```tsx
// Background
bg-white           // #FFFFFF - Background principal
bg-gray-very-light // #F5F5F5 - Background secundário
bg-gray-light      // #D3D3D3 - Borders, dividers
bg-gray-medium     // #808080 - Placeholders
bg-black-pure      // #000000 - Primary actions

// Text
text-black         // #000000 - Texto principal
text-gray-dark     // #4A4A4A - Texto secundário
text-gray-medium   // #808080 - Placeholders
text-white         // #FFFFFF - Texto em backgrounds escuros

// Borders
border-gray-light  // #D3D3D3 - Border padrão
border-black       // #000000 - Border destaque/focus
```

### Tipografia

```tsx
// Tamanhos
text-xs    // 11px - Captions
text-sm    // 13px - Helper text
text-base  // 15px - Body (padrão)
text-lg    // 17px - Large body
text-xl    // 19px - Subheadings
text-2xl   // 22px - Headings
text-3xl   // 28px - Page titles
text-4xl   // 36px - Hero titles

// Pesos
font-regular  // 400 - Body text
font-medium   // 500 - Labels
font-semibold // 600 - Headings
font-bold     // 700 - Main titles
```

### Espaçamento

```tsx
// Padding/Margin
p-2   // 4px   - Tight
p-3   // 6px   - Form fields
p-4   // 8px   - Tight standard
p-6   // 12px  - Small
p-8   // 16px  - Standard
p-12  // 24px  - Cards (padrão)
p-16  // 32px  - Large sections

// Gap (Flexbox/Grid)
gap-2  // 4px
gap-4  // 8px
gap-6  // 12px
gap-8  // 16px - Standard
```

### Radius

```tsx
rounded-sm   // 4px  - Subtle
rounded-base // 6px  - Padrão
rounded-md   // 8px  - Buttons
rounded-lg   // 12px - Cards, modals
rounded-full // Pill - Badges, avatars
```

### Shadows

```tsx
shadow-none      // Flat design
shadow-sm        // Subtle
shadow-base      // Cards (padrão)
shadow-md        // Hover state
shadow-lg        // Elevated
shadow-xl        // Modals
shadow-2xl       // Highest
shadow-inset-sm  // Pressed state
```

## 🎯 Padrões de Uso

### Layouts

```tsx
// Container Principal
<div className="container-plania">
  // max-w-7xl mx-auto px-8 py-6
</div>

// Section
<section className="py-12 space-y-8">
  ...
</section>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  ...
</div>
```

### Formulários

```tsx
// Field Container
<div className="space-y-2">
  <Label>Campo</Label>
  <Input className="focus-ring" />
  <p className="text-xs text-gray-medium">Helper text</p>
</div>

// Form Layout
<form className="space-y-6">
  ...
</form>
```

### Cards

```tsx
// Default Card
<Card className="shadow-base">
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Interactive Card
<Card className="shadow-base hover:shadow-md transition-shadow cursor-pointer">
  ...
</Card>
```

### Botões

```tsx
// Primary Action
<Button>Ação Principal</Button>

// Secondary Action
<Button variant="outline">Ação Secundária</Button>

// Tertiary Action
<Button variant="ghost">Ação Terciária</Button>

// Group
<div className="flex gap-2 justify-end">
  <Button variant="outline">Cancelar</Button>
  <Button>Confirmar</Button>
</div>
```

### Estados

```tsx
// Hover Elevação
className="hover:shadow-md transition-shadow"

// Hover Background
className="hover:bg-gray-50 transition-colors"

// Focus (todos os interativos)
className="focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"

// Active
className="active:shadow-inset-sm active:scale-[0.98]"

// Disabled
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

## 📋 Checklist de Acessibilidade

### Contraste

- ✅ Texto preto (#000) em fundo branco (#FFF): 21:1 (AAA)
- ✅ Texto branco (#FFF) em fundo preto (#000): 21:1 (AAA)
- ✅ Cinza escuro (#4A4A4A) em branco: 9.3:1 (AA)

### Interatividade

- ✅ Focus ring visível em todos os elementos interativos
- ✅ Contraste de 3:1 para focus indicators
- ✅ Área mínima de toque: 44x44px (mobile)
- ✅ Estados hover, focus, active bem definidos

### Semântica

```tsx
// Headings hierárquicos
<h1>Título Principal</h1>
<h2>Seção</h2>
<h3>Subseção</h3>

// Labels para inputs
<Label htmlFor="field">Campo</Label>
<Input id="field" />

// ARIA quando necessário
<button aria-label="Fechar modal">
  <X />
</button>

// Screen reader only
<span className="sr-only">
  Texto acessível
</span>
```

## 🎨 Combinações Recomendadas

### Página Padrão

```tsx
<div className="min-h-screen bg-white">
  <header className="border-b border-gray-light">
    <div className="container-plania">
      // Header content
    </div>
  </header>
  
  <main className="container-plania py-8">
    <h1 className="text-3xl font-semibold text-black mb-8">
      Título da Página
    </h1>
    // Content
  </main>
</div>
```

### Card de Conteúdo

```tsx
<Card className="shadow-base hover:shadow-md transition-shadow">
  <CardHeader>
    <div className="flex items-center justify-between mb-2">
      <Badge variant="solid">Status</Badge>
      <span className="text-xs text-gray-medium">Data</span>
    </div>
    <CardTitle>Título do Card</CardTitle>
    <CardDescription>Descrição breve</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-dark">
      Conteúdo...
    </p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="outline" size="sm">Editar</Button>
    <Button size="sm">Ver Mais</Button>
  </CardFooter>
</Card>
```

### Formulário Completo

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título do Formulário</CardTitle>
    <CardDescription>Descrição do objetivo</CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="field1">Campo Obrigatório *</Label>
        <Input 
          id="field1"
          placeholder="Placeholder..."
          className="focus-ring"
        />
        <p className="text-xs text-gray-medium">
          Helper text
        </p>
      </div>
      // Mais campos...
    </form>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="ghost">Cancelar</Button>
    <div className="flex gap-2">
      <Button variant="outline">Rascunho</Button>
      <Button>Enviar</Button>
    </div>
  </CardFooter>
</Card>
```

## 🔧 Classes Utilitárias Customizadas

```css
/* Container */
.container-plania
  → max-w-7xl mx-auto px-8 py-6

/* Cards */
.card-plania
  → bg-white border border-gray-light rounded-lg p-6 shadow-base

.card-plania-elevated
  → card-plania + shadow-md hover:shadow-lg transition-shadow

.card-plania-flat
  → bg-white border border-gray-200 rounded-lg p-6 shadow-none

/* Texto */
.text-helper
  → text-sm font-regular text-gray-dark

.text-placeholder
  → text-base font-regular text-gray-medium

.text-disabled
  → text-base font-regular text-gray-dark opacity-60

.label-form
  → text-sm font-medium text-black

/* Badges */
.badge-base
  → bg-gray-200 text-black rounded-full px-3 py-1

.badge-outline
  → border border-black bg-white text-black rounded-full px-3 py-1

.badge-solid
  → bg-black text-white rounded-full px-3 py-1

/* Estados */
.hover-elevate
  → transition-shadow hover:shadow-md

.hover-bg
  → transition-colors hover:bg-gray-very-light

.focus-ring
  → focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2

.disabled-state
  → opacity-50 cursor-not-allowed

.active-pressed
  → active:shadow-inset-sm active:scale-[0.98] transition-transform

/* Outros */
.skeleton
  → bg-gray-light animate-pulse rounded-md

.divider
  → border-t border-gray-light my-6

.sr-only
  → Oculto visualmente, acessível para screen readers
```

---

**Versão:** 1.0.0  
**Atualizado:** Dezembro 2025
