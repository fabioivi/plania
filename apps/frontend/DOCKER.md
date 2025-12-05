# PlanIA - Design System 🎨

## 🐳 Rodar com Docker

### Modo Desenvolvimento (com Docker Watch - Recomendado):

```bash
docker compose watch
```

Este comando ativa o **Docker Watch** que:
- 🔄 Sincroniza automaticamente mudanças em `./app`, `./src`, `./public`
- 🔨 Rebuilda o container quando `package.json` ou configs mudam
- ⚡ Hot reload instantâneo sem polling

### Iniciar o projeto (modo tradicional):

```bash
docker compose up
```

Acesse em: **http://localhost:3000**

### Parar o projeto:

```bash
docker compose down
```

### Rebuild (se necessário):

```bash
docker compose up --build
```

---

## 📦 Rodar Localmente (sem Docker)

### 1. Instalar dependências:

```bash
npm install
```

### 2. Iniciar servidor de desenvolvimento:

```bash
npm run dev
```

Acesse em: **http://localhost:3000**

---

## 📁 Estrutura

```
PlanIA/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial (showcase)
│   └── globals.css        # Import dos estilos
├── src/
│   ├── components/ui/     # Componentes UI
│   ├── styles/            # Estilos globais
│   └── examples/          # Exemplos adicionais
├── design-system/         # Documentação
├── docker-compose.yml     # Docker Compose
├── Dockerfile             # Docker config
└── tailwind.config.js     # Tailwind config
```

---

## 🎨 O que Você Verá

A página inicial mostra:

✅ **Paleta Monocromática** - 8 tons de cinza
✅ **Componentes** - Buttons, Badges, Inputs, Cards, Skeleton
✅ **Cards Interativos** - Com hover effects
✅ **Formulário Exemplo** - Campos completos
✅ **Estados** - Hover, Focus, Disabled

---

## 📖 Documentação

- **Completa**: `design-system/README.md`
- **Tokens**: `design-system/TOKENS.md`

---

## 🚀 Comandos Úteis

```bash
# Desenvolvimento com Hot Reload (Docker Watch)
docker compose watch

# Desenvolvimento tradicional
docker compose up

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint

# Docker - modo background
docker compose up -d

# Docker - ver logs
docker compose logs -f

# Docker - parar e remover volumes
docker compose down -v

# Docker - rebuild forçado
docker compose up --build
```

---

## 🔍 Docker Watch vs Polling

### Docker Watch (Recomendado)
- ✅ Mais rápido
- ✅ Menos uso de CPU
- ✅ Sincronização instantânea
- ✅ Suporta rebuild automático

### Polling (Tradicional)
- ⚠️ Usa mais CPU
- ⚠️ Delay de 1 segundo
- ✅ Funciona em todos os sistemas

---

**Versão:** 1.0.0  
**Status:** ✅ Pronto para uso
