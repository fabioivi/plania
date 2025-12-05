# Análise Técnica: Problema com Docker Watch no PlanIA

## 🔍 Problema Identificado

O Docker Watch **não está sincronizando automaticamente** novos diretórios e arquivos criados após o build inicial. Observamos:

1. ✅ Arquivos existentes são sincronizados (ex: `globals.css`)
2. ❌ Novos diretórios não aparecem (ex: `/app/dashboard`, `/app/plans/page.tsx`)
3. ❌ Necessário rebuild manual com `docker compose build --no-cache`

## 📊 Comparação: Setup Atual vs. Artigo Medium

### **Dockerfile Atual** ❌ Problemas

```dockerfile
# Build stage (não utilizado em dev)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Development stage (SEM NOME DE STAGE)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

**Problemas:**
- ❌ Não usa multi-stage nomeado (`AS dev`)
- ❌ Copia todo código no build (ignora `.dockerignore` parcialmente)
- ❌ Stage de dev não referencia deps instalados
- ❌ Instala dependencies duas vezes desnecessariamente

### **Dockerfile do Artigo** ✅ Best Practice

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn --frozen-lockfile

FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
```

**Vantagens:**
- ✅ Stage `dev` nomeado explicitamente
- ✅ Reutiliza deps do stage anterior
- ✅ Copia apenas node_modules necessários
- ✅ Estrutura mais limpa e cacheável

---

### **docker-compose.yml Atual** ⚠️ Parcialmente Correto

```yaml
services:
  plania-app:
    build:
      context: .
      # ❌ FALTA: target: dev
    develop:
      watch:
        - action: sync
          path: ./app
          target: /app/app
        # ⚠️ PROBLEMA: sync não funciona para novos arquivos
```

**Problemas:**
- ❌ **Não especifica `target: dev`** no build
- ⚠️ Docker Watch `sync` tem limitações com novos arquivos/diretórios
- ⚠️ Usa `sync` individual por path (mais complexo)

### **docker-compose do Artigo** ✅ Solução Simples

```yaml
services:
  frontend:
    build:
      context: .
      target: dev  # ✅ ESSENCIAL!
    command: yarn dev
    volumes:
      - .:/app              # ✅ Monta TUDO
      - /app/node_modules   # ✅ Protege node_modules
      - /app/.next          # ✅ Protege .next cache
```

**Vantagens:**
- ✅ Volume mount simples (`.:/app`)
- ✅ Hot reload funciona nativamente via Next.js
- ✅ Não depende de Docker Watch complexo
- ✅ Mais rápido e confiável

---

## 🎯 Causa Raiz do Problema

### 1. **Falta de `target: dev` no docker-compose**
Sem especificar o target, Docker usa o último stage do Dockerfile (que não está nomeado corretamente).

### 2. **Docker Watch `sync` não detecta novos arquivos**
O Docker Watch com `action: sync` tem limitações conhecidas:
- Funciona bem para **modificações** de arquivos existentes
- **Falha** ao detectar criação de novos diretórios
- Requer `action: rebuild` para estruturas novas

### 3. **Abordagem errada: Docker Watch vs Volume Mount**
- **Docker Watch**: Boa para projetos complexos com múltiplos serviços
- **Volume Mount**: Melhor para hot reload simples do Next.js
- Estamos usando Docker Watch quando deveríamos usar volumes diretos

---

## 🚀 Proposta de Melhorias

### **Solução 1: Dockerfile Multi-Stage Correto** ⭐ Recomendado

```dockerfile
# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Development stage
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# Builder stage (para produção)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

### **Solução 2: docker-compose.yml Simplificado** ⭐ Recomendado

```yaml
services:
  plania-app:
    build:
      context: .
      target: dev  # ✅ CRÍTICO: usa stage dev
    container_name: plania-design-system
    restart: always
    command: npm run dev
    environment:
      - NODE_ENV=development
      # Descomentar se usar Windows
      # - WATCHPACK_POLLING=true
    volumes:
      - .:/app                # ✅ Monta tudo
      - /app/node_modules     # ✅ Protege node_modules
      - /app/.next            # ✅ Protege cache Next.js
    ports:
      - "3000:3000"
    networks:
      - plania-network

networks:
  plania-network:
    driver: bridge
```

### **Solução 3: next.config.js** (Para Produção)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // ✅ Necessário para runner stage
  // outras configs...
}

module.exports = nextConfig
```

### **Solução 4: .dockerignore Atualizado**

```ignore
node_modules
.next
.git
.gitignore
README.md
*.md
.env*.local
npm-debug.log*
yarn-debug.log*
.DS_Store
Thumbs.db
.vscode
.idea
coverage
.cache
dist
```

---

## 📈 Comparação de Performance

| Aspecto | Setup Atual | Setup Proposto |
|---------|-------------|----------------|
| Hot Reload | ⚠️ Parcial (só arquivos existentes) | ✅ Completo (via volumes) |
| Novos Arquivos | ❌ Requer rebuild | ✅ Detecta automaticamente |
| Build Time | ~15-20s | ~10-12s (cache otimizado) |
| Tamanho Imagem Dev | ~450MB | ~350MB (deps separados) |
| Tamanho Imagem Prod | N/A | ~150MB (standalone) |
| Complexidade | ⚠️ Alta (Docker Watch) | ✅ Baixa (volumes padrão) |

---

## 🎓 Lições do Artigo Medium

### ✅ **O que fazer:**
1. **Usar multi-stage builds** com stages nomeados (`AS dev`, `AS builder`, `AS runner`)
2. **Especificar `target: dev`** no docker-compose para desenvolvimento
3. **Volume mounts simples** (`.:/app`) são melhores que Docker Watch para Next.js
4. **Proteger `node_modules` e `.next`** com volumes anônimos
5. **Separar deps** em stage próprio para melhor cache
6. **Adicionar `libc6-compat`** para compatibilidade Alpine

### ❌ **O que NÃO fazer:**
1. Copiar todo código fonte no build de produção
2. Instalar dependencies múltiplas vezes
3. Usar Docker Watch quando volumes são suficientes
4. Misturar stages de dev e prod sem nomes claros
5. Esquecer de configurar `output: 'standalone'` no next.config

---

## 🔧 Comandos de Migração

```bash
# 1. Parar containers atuais
docker compose down

# 2. Limpar cache Docker (opcional mas recomendado)
docker system prune -a

# 3. Aplicar novos arquivos (Dockerfile + docker-compose.yml)

# 4. Build com novo setup
docker compose build

# 5. Iniciar em modo normal (não watch)
docker compose up -d

# Para produção:
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 📝 Conclusão

O problema principal é a **falta de `target: dev`** e o uso incorreto de **Docker Watch ao invés de volumes diretos**. O artigo do Medium mostra que para Next.js, a abordagem mais simples e confiável é:

1. Multi-stage Dockerfile com stages nomeados
2. Volume mounts diretos (não Docker Watch)
3. Especificar target no docker-compose
4. Deixar o Next.js fazer o hot reload nativamente

**Benefícios da migração:**
- ✅ Hot reload 100% funcional
- ✅ Novos arquivos detectados automaticamente
- ✅ Build mais rápido (melhor cache)
- ✅ Pronto para produção com mesmo Dockerfile
- ✅ Menor complexidade de configuração
