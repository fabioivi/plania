# Quick Start - PlanIA Backend MVP

## 🚀 Início Rápido

### 1. Iniciar Banco de Dados
```bash
cd c:\Users\fabioivi\Documents\GitHub\PlanIA
npm run docker:up
```

Isso iniciará:
- PostgreSQL na porta **5433**
- Redis na porta **6380**

### 2. Rodar Frontend e Backend
```bash
npm run dev
```

Ou separadamente:
```bash
npm run dev:backend   # Backend na porta 3001
npm run dev:frontend  # Frontend na porta 3000
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Bull Board** (Dashboard de Filas): http://localhost:3001/admin/queues

## 📡 Endpoints Disponíveis

### Autenticação
```bash
# Registrar usuário
POST http://localhost:3001/api/auth/register
Body: {
  "email": "usuario@example.com",
  "password": "Senha123!",
  "name": "Nome do Usuário"
}

# Login
POST http://localhost:3001/api/auth/login
Body: {
  "email": "usuario@example.com",
  "password": "Senha123!"
}
```

### Credenciais Acadêmicas (Requer Token JWT)
```bash
# Salvar credencial (criptografada com AES-256-GCM)
POST http://localhost:3001/api/academic/credentials
Headers: Authorization: Bearer <seu-token>
Body: {
  "system": "ifms",
  "username": "seu.usuario",
  "password": "sua.senha"
}

# Listar credenciais
GET http://localhost:3001/api/academic/credentials
Headers: Authorization: Bearer <seu-token>

# Testar credencial (envia para fila)
POST http://localhost:3001/api/academic/credentials/:id/test
Headers: Authorization: Bearer <seu-token>
```

## 🧪 Testes

### Testar Criptografia
```bash
cd apps/backend
npm run test:crypto
```

### Testar com PowerShell
```powershell
# Registrar usuário
$body = @{
  email = "teste@example.com"
  password = "Teste123456!"
  name = "Usuário Teste"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$token = $response.accessToken

# Salvar credencial acadêmica
$credBody = @{
  system = "ifms"
  username = "professor@ifms.edu.br"
  password = "MinhasenhaIFMS123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/academic/credentials" -Method Post -Body $credBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
```

## 🔐 Segurança

- **Senhas de usuários**: Hash bcrypt (irreversível)
- **Credenciais acadêmicas**: Criptografia AES-256-GCM (reversível para automação)
- **JWT**: Tokens com expiração de 7 dias
- **ENCRYPTION_KEY**: Deve ter exatamente 32 caracteres

## 🐳 Docker

```bash
# Iniciar todos os serviços
npm run docker:up

# Ver logs
npm run docker:logs

# Parar serviços
npm run docker:down
```

## 📁 Estrutura do Projeto

```
PlanIA/
├── apps/
│   ├── frontend/          # Next.js 14
│   └── backend/           # NestJS 10
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── common/
│       │   │   └── services/
│       │   │       └── crypto.service.ts
│       │   └── modules/
│       │       ├── auth/           # JWT Authentication
│       │       ├── academic/       # Credential Management
│       │       ├── scraping/       # Playwright
│       │       ├── plans/          # Teaching Plans
│       │       └── queue/          # Bull Processors
│       └── scripts/
│           ├── test-encryption.ts
│           └── test-api.ts
├── docker-compose.yml
└── package.json          # Workspace root
```

## ⚙️ Variáveis de Ambiente

O arquivo `.env` já está configurado em `apps/backend/.env`:

```env
NODE_ENV=development
PORT=3001

# Database (Docker)
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=plania

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6380

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-32chars-minimum
ENCRYPTION_KEY=my-32-character-encryption-key!!

# Playwright
PLAYWRIGHT_HEADLESS=true

# IFMS
IFMS_BASE_URL=https://academico.ifms.edu.br
```

## ✅ Checklist de Implementação

- [x] NestJS configurado com TypeScript
- [x] TypeORM + PostgreSQL
- [x] Bull + Redis para filas
- [x] JWT Authentication
- [x] AES-256-GCM Encryption
- [x] Playwright Service
- [x] Auth Module (register/login)
- [x] Academic Module (CRUD de credenciais)
- [x] Queue Processors (verificação de credenciais)
- [x] Scraping Service (teste de login IFMS)
- [x] Docker Compose
- [x] Scripts de teste

## 🔧 Troubleshooting

### Erro: Port 5432 already in use
As portas foram alteradas para evitar conflito:
- PostgreSQL: **5433** (não 5432)
- Redis: **6380** (não 6379)

### Erro: Cannot connect to database
1. Verifique se os containers Docker estão rodando: `docker ps`
2. Reinicie os containers: `npm run docker:down && npm run docker:up`
3. Aguarde 5-10 segundos antes de iniciar o backend

### Erro no frontend: tsconfig.node.json not found
Já foi corrigido. Se persistir, feche e reabra o VSCode.

### Backend não inicia
1. Verifique se as dependências foram instaladas: `cd apps/backend && npm install`
2. Verifique os logs: `docker logs plania-postgres`
3. Verifique o arquivo `.env` existe em `apps/backend/.env`

## 📊 Status da Implementação

✅ **MVP COMPLETO E FUNCIONAL!**

- Backend rodando na porta 3001
- Todas as rotas mapeadas
- Criptografia testada e funcionando
- Banco de dados criado automaticamente
- Filas configuradas
- Pronto para integração com frontend!
