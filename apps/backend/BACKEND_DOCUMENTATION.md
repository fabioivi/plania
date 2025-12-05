# Backend Documentation - PlanIA

## 📋 Visão Geral

Backend desenvolvido com NestJS para gerenciamento de planos de ensino com automação via web scraping e processamento assíncrono de tarefas.

**Stack Principal:**
- NestJS 10.2.10
- TypeORM 0.3.17
- PostgreSQL 15
- Redis 7
- Bull 4.12.0 (Queue System)
- Playwright 1.40.0 (Web Scraping)
- Passport.js + JWT (Authentication)

---

## 🗂️ Estrutura de Diretórios

```
apps/backend/
├── src/
│   ├── common/
│   │   └── services/
│   │       └── crypto.service.ts          # Serviço de criptografia (AES-256-GCM + bcrypt)
│   │
│   ├── modules/
│   │   ├── auth/                          # Módulo de Autenticação
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.dto.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── user.entity.ts
│   │   │
│   │   ├── academic/                      # Módulo de Credenciais Acadêmicas
│   │   │   ├── academic.module.ts
│   │   │   ├── academic.controller.ts
│   │   │   ├── academic.service.ts
│   │   │   ├── academic.dto.ts
│   │   │   └── academic-credential.entity.ts
│   │   │
│   │   ├── scraping/                      # Módulo de Web Scraping
│   │   │   ├── scraping.module.ts
│   │   │   └── scraping.service.ts
│   │   │
│   │   ├── plans/                         # Módulo de Planos de Ensino
│   │   │   ├── plans.module.ts
│   │   │   └── plan.entity.ts
│   │   │
│   │   └── queue/                         # Módulo de Filas
│   │       ├── queue.module.ts
│   │       └── processors/
│   │           └── auth.processor.ts
│   │
│   ├── app.module.ts                      # Módulo raiz da aplicação
│   └── main.ts                            # Entry point da aplicação
│
├── scripts/
│   ├── test-encryption.ts                 # Script de teste de criptografia
│   └── test-api.ts                        # Script de teste de API
│
├── .env                                   # Variáveis de ambiente
├── .env.example                           # Exemplo de variáveis de ambiente
├── package.json                           # Dependências e scripts
├── tsconfig.json                          # Configuração TypeScript
└── Dockerfile                             # Container Docker

```

---

## 🔐 Módulo de Autenticação (`auth/`)

### **Entidade: User**
**Arquivo:** `user.entity.ts`

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;  // Hash bcrypt

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **DTOs**

**RegisterDto:**
```typescript
{
  email: string;      // Email válido
  name: string;       // Nome completo
  password: string;   // Mínimo 6 caracteres
}
```

**LoginDto:**
```typescript
{
  email: string;      // Email do usuário
  password: string;   // Senha em texto plano
}
```

**Resposta de Autenticação:**
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
  },
  accessToken: string;  // JWT válido por 7 dias
}
```

### **Endpoints**

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/api/auth/register` | ❌ Não | Criar novo usuário |
| POST | `/api/auth/login` | ❌ Não | Fazer login |

### **AuthService - Métodos Principais**

```typescript
async register(registerDto: RegisterDto): Promise<AuthResponse>
async login(loginDto: LoginDto): Promise<AuthResponse>
async validateUser(userId: string): Promise<User | null>
```

### **JWT Strategy**

- **Secret:** Definido em `JWT_SECRET` (.env)
- **Expiração:** 7 dias (`expiresIn: '7d'`)
- **Payload:** `{ sub: userId, email: userEmail }`
- **Validação:** Busca usuário no banco via `userId`

### **Guards**

- **JwtAuthGuard:** Protege rotas que requerem autenticação
- Uso: `@UseGuards(JwtAuthGuard)` nos controllers

---

## 🎓 Módulo de Credenciais Acadêmicas (`academic/`)

### **Entidade: AcademicCredential**
**Arquivo:** `academic-credential.entity.ts`

```typescript
@Entity('academic_credentials')
export class AcademicCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  institution: string;  // Ex: "IFMS"

  @Column()
  username: string;     // Login do sistema acadêmico

  @Column()
  encryptedPassword: string;  // Senha criptografada (AES-256-GCM)

  @Column()
  iv: string;           // Initialization Vector (hex)

  @Column()
  authTag: string;      // Authentication Tag (hex)

  @Column({ default: false })
  isVerified: boolean;  // Credencial foi testada?

  @Column({ nullable: true })
  lastVerifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### **Criptografia de Senhas Acadêmicas**

**Algoritmo:** AES-256-GCM (reversível para automação)

**Processo de Criptografia:**
1. Gera IV aleatório de 16 bytes
2. Cria cipher com algoritmo `aes-256-gcm`
3. Encripta a senha
4. Extrai authentication tag
5. Retorna: `{ encrypted, iv, authTag }` (todos em hex)

**Processo de Decriptografia:**
1. Converte hex para Buffer (encrypted, iv, authTag)
2. Cria decipher com algoritmo `aes-256-gcm`
3. Define authTag para validação
4. Decripta e retorna senha em texto plano

**IMPORTANTE:** 
- Chave de 32 caracteres em `ENCRYPTION_KEY` (.env)
- Diferentes de senhas de usuários (usam bcrypt)
- Necessário para automação com Playwright

### **DTOs**

**CreateAcademicCredentialDto:**
```typescript
{
  institution: string;  // Ex: "IFMS"
  username: string;     // Login do usuário no sistema acadêmico
  password: string;     // Senha em texto plano (será encriptada)
}
```

**UpdateAcademicCredentialDto:**
```typescript
{
  username?: string;    // Opcional
  password?: string;    // Opcional (será reencriptada)
}
```

### **Endpoints**

| Método | Rota | Autenticação | Descrição |
|--------|------|--------------|-----------|
| POST | `/api/academic/credentials` | ✅ JWT | Criar credencial |
| GET | `/api/academic/credentials` | ✅ JWT | Listar credenciais do usuário |
| GET | `/api/academic/credentials/:id` | ✅ JWT | Buscar credencial específica |
| POST | `/api/academic/credentials/:id/test` | ✅ JWT | Testar credencial (scraping) |
| DELETE | `/api/academic/credentials/:id` | ✅ JWT | Deletar credencial |

### **AcademicService - Métodos Principais**

```typescript
async create(userId: string, dto: CreateAcademicCredentialDto): Promise<AcademicCredential>
async findAll(userId: string): Promise<AcademicCredential[]>
async findOne(id: string, userId: string): Promise<AcademicCredential>
async testCredentials(id: string, userId: string): Promise<TestResult>
async remove(id: string, userId: string): Promise<void>
```

---

## 🤖 Módulo de Web Scraping (`scraping/`)

### **ScrapingService**
**Arquivo:** `scraping.service.ts`

**Responsabilidades:**
- Automação de login no sistema acadêmico IFMS
- Preenchimento de diários de classe
- Preenchimento de planos de ensino

### **Métodos Principais**

#### 1. **testIFMSLogin**
```typescript
async testIFMSLogin(username: string, password: string): Promise<boolean>
```
**Descrição:** Testa se as credenciais são válidas

**Fluxo:**
1. Abre navegador headless (Chromium)
2. Navega para portal IFMS
3. Preenche usuário e senha
4. Clica em "Entrar"
5. Verifica se login foi bem-sucedido
6. Retorna `true` ou `false`

**Timeout:** 30 segundos

#### 2. **fillDiary**
```typescript
async fillDiary(credentialId: string, diaryData: DiaryData): Promise<void>
```
**Descrição:** Preenche diário de classe automaticamente

**Parâmetros:**
- `credentialId`: ID da credencial acadêmica
- `diaryData`: Dados do diário a preencher

#### 3. **fillTeachingPlan**
```typescript
async fillTeachingPlan(credentialId: string, planData: PlanData): Promise<void>
```
**Descrição:** Preenche plano de ensino automaticamente

**Parâmetros:**
- `credentialId`: ID da credencial acadêmica
- `planData`: Dados do plano de ensino

### **Configuração do Playwright**

```typescript
const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

---

## 🗄️ Módulo de Planos (`plans/`)

### **Entidade: Plan**
**Arquivo:** `plan.entity.ts`

```typescript
@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  discipline: string;

  @Column({ nullable: true })
  semester: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Nota:** Entidade básica, sem endpoints implementados ainda.

---

## 📨 Sistema de Filas (`queue/`)

### **Filas Configuradas**

#### 1. **auth-queue**
- **Propósito:** Processar verificação de credenciais
- **Redis:** localhost:6380
- **Processador:** `auth.processor.ts`

#### 2. **scraping-queue**
- **Propósito:** Processar tarefas de scraping
- **Redis:** localhost:6380

#### 3. **plans-queue**
- **Propósito:** Processar geração de planos
- **Redis:** localhost:6380

### **AuthProcessor**
**Arquivo:** `processors/auth.processor.ts`

```typescript
@Processor('auth-queue')
export class AuthProcessor {
  @Process('verify-credentials')
  async handleCredentialVerification(job: Job) {
    // Verifica credenciais acadêmicas via scraping
  }
}
```

### **Bull Board**
**URL:** `http://localhost:3001/admin/queues`

**Funcionalidades:**
- Visualizar filas em tempo real
- Ver jobs pendentes/processados/falhados
- Reprocessar jobs manualmente
- Monitorar performance

---

## 🔒 Serviço de Criptografia (`common/services/`)

### **CryptoService**
**Arquivo:** `crypto.service.ts`

### **Métodos**

#### 1. **hashPassword**
```typescript
async hashPassword(password: string): Promise<string>
```
- **Algoritmo:** bcrypt
- **Salt Rounds:** 10
- **Uso:** Senhas de usuários (one-way)

#### 2. **comparePassword**
```typescript
async comparePassword(password: string, hash: string): Promise<boolean>
```
- **Uso:** Validação de login

#### 3. **encrypt**
```typescript
encrypt(text: string): { encrypted: string; iv: string; authTag: string }
```
- **Algoritmo:** AES-256-GCM
- **IV:** 16 bytes aleatórios
- **Uso:** Senhas acadêmicas (reversível)

#### 4. **decrypt**
```typescript
decrypt(encrypted: string, iv: string, authTag: string): string
```
- **Validação:** Authentication tag
- **Retorno:** Texto plano
- **Erro:** Lança exceção se authTag inválido

---

## 🌐 Configuração da Aplicação

### **main.ts**

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS para frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  // Prefixo global das rotas
  app.setGlobalPrefix('api');
  
  // Validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Porta
  await app.listen(3001);
}
```

### **app.module.ts**

**Módulos Importados:**
- ConfigModule (variáveis de ambiente)
- TypeOrmModule (PostgreSQL)
- BullModule (Redis/Queues)
- AuthModule
- AcademicModule
- ScrapingModule
- PlansModule
- QueueModule

**Configuração TypeORM:**
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, AcademicCredential, Plan],
  synchronize: true,  // ⚠️ Apenas em desenvolvimento
  logging: true,
})
```

**Configuração Bull:**
```typescript
BullModule.forRoot({
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  },
})
```

---

## 🔧 Variáveis de Ambiente (.env)

```bash
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=plania

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Encryption (32 caracteres exatos)
ENCRYPTION_KEY=your-32-char-encryption-key!!

# Application
PORT=3001
NODE_ENV=development
```

---

## 📊 Banco de Dados

### **Tabelas**

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  password VARCHAR NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### **academic_credentials**
```sql
CREATE TABLE academic_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR NOT NULL,
  username VARCHAR NOT NULL,
  "encryptedPassword" VARCHAR NOT NULL,
  iv VARCHAR NOT NULL,
  "authTag" VARCHAR NOT NULL,
  "isVerified" BOOLEAN DEFAULT false,
  "lastVerifiedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### **plans**
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  content TEXT,
  discipline VARCHAR,
  semester VARCHAR,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testes

### **Scripts Disponíveis**

#### 1. **test-encryption.ts**
```bash
npm run test:encryption
```
**Testa:**
- Criptografia AES-256-GCM
- Decriptografia
- Hash bcrypt
- Comparação de senhas

#### 2. **test-api.ts**
```bash
npm run test:api
```
**Testa:**
- Registro de usuário
- Login
- Criação de credencial acadêmica
- Teste de credencial

---

## 🚀 Scripts NPM

```json
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:encryption": "ts-node scripts/test-encryption.ts",
  "test:api": "ts-node scripts/test-api.ts"
}
```

---

## 🔄 Fluxos de Dados

### **Fluxo de Registro e Login**

```
1. Frontend envia POST /api/auth/register
2. AuthService valida email único
3. CryptoService faz hash da senha (bcrypt)
4. Salva User no banco
5. Gera JWT token (7 dias)
6. Retorna { user, accessToken }
```

### **Fluxo de Credencial Acadêmica**

```
1. Frontend envia POST /api/academic/credentials (JWT required)
2. AcademicService valida usuário
3. CryptoService encripta senha (AES-256-GCM)
4. Salva AcademicCredential no banco
5. Retorna credencial (sem senha decriptada)
```

### **Fluxo de Teste de Credencial**

```
1. Frontend envia POST /api/academic/credentials/:id/test
2. AcademicService busca credencial
3. CryptoService decripta senha
4. Adiciona job na fila 'auth-queue'
5. AuthProcessor processa job
6. ScrapingService testa login (Playwright)
7. Atualiza isVerified e lastVerifiedAt
8. Retorna resultado
```

---

## 🐳 Docker

### **Serviços no docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:15
    ports:
      - "5433:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: plania
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
```

---

## 🔍 Endpoints Completos

### **Autenticação**

```
POST   /api/auth/register    - Criar usuário
POST   /api/auth/login       - Fazer login
```

### **Credenciais Acadêmicas**

```
POST   /api/academic/credentials           - Criar credencial (JWT)
GET    /api/academic/credentials           - Listar credenciais (JWT)
GET    /api/academic/credentials/:id       - Buscar credencial (JWT)
POST   /api/academic/credentials/:id/test  - Testar credencial (JWT)
DELETE /api/academic/credentials/:id       - Deletar credencial (JWT)
```

### **Admin (Bull Board)**

```
GET    /admin/queues                       - Dashboard de filas
```

---

## ⚠️ Pontos de Atenção para Modificações

### **Ao Adicionar Nova Entidade:**
1. Criar arquivo `.entity.ts` no módulo
2. Adicionar no array `entities` do TypeORM (app.module.ts)
3. Criar DTOs de criação/atualização
4. Criar service com métodos CRUD
5. Criar controller com rotas
6. Adicionar guards se necessário

### **Ao Modificar Autenticação:**
1. Verificar JWT strategy
2. Atualizar guards
3. Verificar interceptors de resposta
4. Atualizar DTOs de auth
5. Verificar tempo de expiração do token

### **Ao Modificar Criptografia:**
1. Verificar ENCRYPTION_KEY tem 32 caracteres
2. Testar script test-encryption.ts
3. Verificar compatibilidade com dados existentes
4. Documentar mudanças no algoritmo

### **Ao Adicionar Nova Fila:**
1. Registrar fila no QueueModule
2. Criar processor dedicado
3. Definir tipos de jobs
4. Adicionar monitoramento no Bull Board
5. Configurar retry e timeout

### **Ao Modificar Scraping:**
1. Verificar seletores CSS
2. Testar em ambiente headless
3. Adicionar timeouts adequados
4. Tratar erros de navegação
5. Validar dados extraídos

---

## 📝 Convenções de Código

### **Nomenclatura:**
- Entities: PascalCase singular (ex: `User`, `Plan`)
- DTOs: PascalCase com sufixo Dto (ex: `CreateUserDto`)
- Services: PascalCase com sufixo Service (ex: `AuthService`)
- Controllers: PascalCase com sufixo Controller (ex: `AuthController`)
- Modules: PascalCase com sufixo Module (ex: `AuthModule`)

### **Estrutura de Arquivos:**
```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.dto.ts
├── entities/
│   └── entity-name.entity.ts
└── processors/
    └── processor-name.processor.ts
```

### **Decorators Comuns:**
- `@Controller('route')` - Define controller
- `@Get()`, `@Post()`, `@Put()`, `@Delete()` - Métodos HTTP
- `@UseGuards(JwtAuthGuard)` - Proteção JWT
- `@Body()` - Captura body da request
- `@Param()` - Captura parâmetros da URL
- `@Query()` - Captura query strings
- `@Req()` - Acessa request completo

---

## 🎯 Próximos Passos (Roadmap)

### **Funcionalidades Pendentes:**
1. ❌ CRUD completo de Planos de Ensino
2. ❌ Integração com IA para geração de planos
3. ❌ Sistema de templates de planos
4. ❌ Upload de arquivos/anexos
5. ❌ Geração de PDF dos planos
6. ❌ Sistema de notificações
7. ❌ Logs de auditoria
8. ❌ Testes unitários e E2E
9. ❌ Documentação Swagger/OpenAPI
10. ❌ Rate limiting
11. ❌ Refresh tokens
12. ❌ Recuperação de senha

---

## 📞 Troubleshooting

### **Erro: "Cannot find module"**
```bash
npm install
npm run build
```

### **Erro: "Port already in use"**
```bash
# Mudar porta no .env
PORT=3002
```

### **Erro: "Database connection failed"**
```bash
# Verificar se PostgreSQL está rodando
docker-compose up -d postgres
```

### **Erro: "Redis connection failed"**
```bash
# Verificar se Redis está rodando
docker-compose up -d redis
```

### **Erro: "Invalid encryption key"**
```bash
# Gerar nova chave de 32 caracteres
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 📚 Referências

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Playwright Documentation](https://playwright.dev/)
- [Passport.js Documentation](http://www.passportjs.org/)

---

**Última Atualização:** 2025-12-04  
**Versão do Backend:** 1.0.0  
**Autor:** PlanIA Team
