# ⚡ Otimizações de Performance para Scraping IFMS

## 📊 **Situação Atual vs Otimizada**

### **Cenário: 10 diários, 3 planos cada = 30 planos**

| Métrica | Atual (Sequencial) | Otimizado (Paralelo) | Melhoria |
|---------|-------------------|---------------------|----------|
| **Login** | 3s | 3s | - |
| **Processar diários** | 120s (10 × 12s) | 24s (10 / 5 paralelo) | **80%** ⚡ |
| **Processar planos** | Incluído acima | Incluído acima | - |
| **Total** | **123s (2min 3s)** | **27s** | **78% mais rápido** 🚀 |

---

## 🎯 **OTIMIZAÇÕES PROPOSTAS**

### **🔴 CRÍTICO - Impacto ALTO (>60% redução)**

#### **1. ✅ Paralelização com Browser Pool**
**Status:** ✅ Implementado (`scraping-pool.service.ts`)

**Antes:**
```typescript
// ❌ Processa 1 diário por vez
for (const diary of diaries) {
  await scrapeDiary(diary);  // 12s cada
}
// Total: 10 × 12s = 120s
```

**Depois:**
```typescript
// ✅ Processa 5 diários em paralelo
await poolService.executeParallel(
  diaries.map(diary =>
    (context, page) => scrapeDiary(diary, page)
  )
);
// Total: 10 / 5 = 2 batches × 12s = 24s
```

**Ganho:** 80% mais rápido (120s → 24s)

**Implementação:**
```typescript
// auth-queue.processor.ts
import { ScrapingPoolService } from '../scraping/scraping-pool.service';

// Paralelizar scraping de diários
const diaryOperations = diaries.map(diary =>
  async (context: BrowserContext, page: Page) => {
    await this.scrapingService.ensureLoggedIn(page, username, password);

    // Scrape content
    const content = await this.scrapingService.scrapeClassContent(page, diary.externalId);
    await this.academicService.syncDiaryContent(userId, diary.id, content.data);

    // Scrape plans
    const plans = await this.scrapingService.getAllTeachingPlans(page, diary.externalId);
    for (const plan of plans.data) {
      const details = await this.scrapingService.getTeachingPlanDetails(
        page, diary.externalId, plan.externalId
      );
      await this.academicService.syncTeachingPlans(userId, diary.id, [details.data]);
    }
  }
);

// Execute em paralelo (máx 5 simultâneos)
await this.scrapingPoolService.executeParallel(diaryOperations);
```

---

#### **2. ⚡ Batch Database Operations**
**Status:** 🔶 Proposta

**Problema:** Salva 1 plano por vez no banco
**Solução:** Acumular e salvar em lote (batch insert)

**Antes:**
```typescript
// ❌ 30 queries separadas (30 × 100ms = 3s)
for (const plan of plans) {
  await this.teachingPlanRepository.save(plan);
}
```

**Depois:**
```typescript
// ✅ 1 query batch (1 × 100ms = 0.1s)
await this.teachingPlanRepository.save(plans); // TypeORM faz bulk insert
```

**Ganho:** 97% mais rápido (3s → 0.1s)

**Implementação:**
```typescript
// academic.service.ts
async syncTeachingPlans(userId: string, diaryId: string, plansData: any[]) {
  const plansToSave = [];

  for (const planData of plansData) {
    const plan = /* create or update */;
    plansToSave.push(plan);
  }

  // ✅ Salva todos de uma vez
  if (plansToSave.length > 0) {
    await this.teachingPlanRepository.save(plansToSave);
  }

  return plansToSave.length;
}
```

---

#### **3. 🎯 Incremental Sync (Delta Sync)**
**Status:** 🔶 Proposta

**Problema:** Sempre faz scraping completo, mesmo se dados não mudaram
**Solução:** Verificar última modificação e sincronizar apenas o que mudou

**Antes:**
```typescript
// ❌ Sempre scrape completo
const plans = await getAllTeachingPlans(diaryId);
for (const plan of plans) {
  const full = await getTeachingPlanDetails(plan.id); // Scrape completo
  await save(full);
}
```

**Depois:**
```typescript
// ✅ Scrape apenas o que mudou
const plans = await getAllTeachingPlans(diaryId);
for (const plan of plans) {
  // Verifica se já temos no cache
  const cached = await this.teachingPlanRepository.findOne({ externalId: plan.id });

  // Se existe e status não mudou, skip
  if (cached && cached.status === plan.status && cached.updatedAt > yesterday) {
    console.log(`⏭️ Plano ${plan.id} não modificado, pulando...`);
    continue;
  }

  // Só faz scraping se mudou
  const full = await getTeachingPlanDetails(plan.id);
  await save(full);
}
```

**Ganho:** 50-90% menos scraping (depende de quantos dados mudaram)

---

### **🟡 ALTO - Impacto MÉDIO (30-60% redução)**

#### **4. 🌐 Resource Blocking Otimizado**
**Status:** 🔶 Proposta

**Problema:** Playwright carrega recursos desnecessários (imagens, CSS, fonts)
**Solução:** Bloquear mais recursos e otimizar bloqueio

**Implementação:**
```typescript
// scraping.service.ts - createContext()
async createContext(): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: '...',
  });

  // ✅ Bloqueio agressivo de recursos
  await context.route('**/*', (route) => {
    const resourceType = route.request().resourceType();

    // Bloquear tudo exceto documento e XHR/fetch
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      route.abort();
    } else if (route.request().url().includes('analytics')) {
      route.abort(); // Bloquear analytics
    } else if (route.request().url().includes('ads')) {
      route.abort(); // Bloquear ads
    } else {
      route.continue();
    }
  });

  return context;
}
```

**Ganho:** 20-30% mais rápido (menos tempo de navegação)

---

#### **5. 💾 Cache de Dados Estáticos**
**Status:** 🔶 Proposta

**Problema:** Ementa, objetivos, referências raramente mudam, mas são sempre re-scrapados
**Solução:** Cachear dados estáticos com TTL longo

**Implementação:**
```typescript
// Cache de dados estáticos no Redis
async getTeachingPlanDetails(page: Page, diaryId: string, planId: string) {
  const cacheKey = `teaching-plan:${diaryId}:${planId}`;

  // Tentar cache (TTL: 7 dias)
  const cached = await this.redis.get(cacheKey);
  if (cached) {
    console.log(`♻️ Dados estáticos do plano ${planId} do cache (7 dias)`);
    return JSON.parse(cached);
  }

  // Scrape se não tiver cache
  const planData = await /* scrape completo */;

  // Cachear dados estáticos
  const staticData = {
    ementa: planData.ementa,
    objetivoGeral: planData.objetivoGeral,
    objetivosEspecificos: planData.objetivosEspecificos,
    referencias: planData.referencias,
  };

  await this.redis.setex(cacheKey, 7 * 24 * 3600, JSON.stringify(staticData));

  return planData;
}
```

**Ganho:** 30-50% em re-syncs (dados estáticos não precisam scraping)

---

#### **6. 🔄 Smart Retry com Circuit Breaker**
**Status:** 🔶 Proposta

**Problema:** Se IFMS estiver lento/offline, tenta repetidamente e desperdiça tempo
**Solução:** Circuit breaker para falhar rápido quando IFMS está com problemas

**Implementação:**
```typescript
import CircuitBreaker from 'opossum';

// Configure circuit breaker
const breakerOptions = {
  timeout: 10000, // 10s timeout
  errorThresholdPercentage: 50, // Abrir após 50% de falhas
  resetTimeout: 30000, // Tentar novamente após 30s
};

const breaker = new CircuitBreaker(scrapingFunction, breakerOptions);

breaker.on('open', () => {
  console.warn('⚠️ Circuit breaker ABERTO - IFMS está com problemas');
});

// Uso
try {
  const result = await breaker.fire(params);
} catch (error) {
  if (breaker.opened) {
    // Falhar rápido sem tentar
    throw new Error('IFMS indisponível, pulando sync');
  }
}
```

**Ganho:** Evita timeout cascata (10-30s salvos por falha)

---

### **🟢 MÉDIO - Impacto BAIXO (10-30% redução)**

#### **7. 📦 Connection Keep-Alive**
**Status:** 🔶 Proposta

**Problema:** Fecha browser context após cada operação
**Solução:** Manter contexts abertos e reutilizar (já implementado no pool)

**Implementação:** Já coberto pelo `ScrapingPoolService`

---

#### **8. 🗜️ Compression no Redis**
**Status:** 🔶 Proposta

**Problema:** Sessões e dados grandes ocupam muito espaço no Redis
**Solução:** Comprimir dados antes de armazenar

**Implementação:**
```typescript
import { gzip, ungzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const ungzipAsync = promisify(ungzip);

async setSession(username: string, cookies: any[]) {
  const serialized = JSON.stringify(cookies);
  const compressed = await gzipAsync(Buffer.from(serialized));
  await this.redis.setex(key, ttl, compressed.toString('base64'));
}

async getSession(username: string) {
  const compressed = await this.redis.get(key);
  if (!compressed) return null;

  const buffer = Buffer.from(compressed, 'base64');
  const decompressed = await ungzipAsync(buffer);
  return JSON.parse(decompressed.toString());
}
```

**Ganho:** 60-80% menos memória Redis, 5-10% mais rápido em redes lentas

---

#### **9. 📊 Database Indexes**
**Status:** 🔶 Proposta

**Problema:** Queries sem índices apropriados
**Solução:** Adicionar índices compostos

**Implementação:**
```typescript
// teaching-plan.entity.ts
@Entity()
@Index(['userId', 'externalId']) // ✅ Busca rápida por user + externalId
@Index(['userId', 'diaryId'])    // ✅ Busca rápida por user + diary
@Index(['updatedAt'])             // ✅ Ordena por data de update
export class TeachingPlan {
  // ...
}

// diary.entity.ts
@Entity()
@Index(['userId', 'externalId'])
@Index(['userId', 'dataFechamento']) // ✅ Filtra diários abertos rapidamente
export class Diary {
  // ...
}
```

**Ganho:** 50-90% mais rápido em queries (especialmente com muitos dados)

---

#### **10. ⚙️ Queue Priority**
**Status:** 🔶 Proposta

**Problema:** Sync de 100 diários bloqueia operações pequenas (sync de 1 diário)
**Solução:** Priorizar jobs menores

**Implementação:**
```typescript
// queue.module.ts
BullModule.registerQueue({
  name: 'auth-queue',
  defaultJobOptions: {
    priority: 10, // Prioridade padrão
  },
});

// Ao adicionar job
await this.authQueue.add('sync-diaries',
  { userId, credentialId },
  {
    priority: diaries.length > 10 ? 5 : 10, // Menor prioridade para syncs grandes
  }
);
```

**Ganho:** Melhor responsividade para operações pequenas

---

## 📈 **RESUMO DE GANHOS ESPERADOS**

| Otimização | Impacto | Esforço | Prioridade |
|------------|---------|---------|------------|
| 1. Browser Pool (Paralelização) | 🔴 **80%** | Médio | ⭐⭐⭐⭐⭐ |
| 2. Batch Database | 🔴 **60%** | Baixo | ⭐⭐⭐⭐⭐ |
| 3. Delta Sync | 🔴 **50-90%** | Alto | ⭐⭐⭐⭐ |
| 4. Resource Blocking | 🟡 **20-30%** | Baixo | ⭐⭐⭐⭐ |
| 5. Cache Estático | 🟡 **30-50%** | Médio | ⭐⭐⭐ |
| 6. Circuit Breaker | 🟡 **10-30%** | Médio | ⭐⭐⭐ |
| 7. Connection Keep-Alive | 🟢 **10%** | Baixo | ⭐⭐ |
| 8. Redis Compression | 🟢 **5-10%** | Baixo | ⭐⭐ |
| 9. Database Indexes | 🟢 **20-30%** | Baixo | ⭐⭐⭐ |
| 10. Queue Priority | 🟢 **UX** | Baixo | ⭐⭐ |

---

## 🚀 **ROADMAP DE IMPLEMENTAÇÃO**

### **Fase 1: Quick Wins (1-2 dias)**
1. ✅ Batch Database Operations → 60% ganho
2. ✅ Resource Blocking Otimizado → 25% ganho
3. ✅ Database Indexes → 20% ganho

**Ganho total Fase 1: ~70% redução no tempo**

### **Fase 2: Paralelização (3-5 dias)**
4. ✅ Browser Pool Service (já implementado)
5. ✅ Refatorar auth-queue.processor para usar pool
6. ✅ Testes de carga e ajuste de concurrency

**Ganho total Fase 2: ~85% redução no tempo**

### **Fase 3: Inteligência (5-7 dias)**
7. ✅ Delta Sync (incremental)
8. ✅ Cache de dados estáticos
9. ✅ Circuit Breaker

**Ganho total Fase 3: ~90%+ redução no tempo (re-syncs)**

---

## 🎯 **RESULTADO FINAL ESPERADO**

### **Sync Inicial (primeira vez):**
```
Antes: 123s (2min 3s)
Fase 1: 37s (-70%)
Fase 2: 18s (-85%)
Resultado: 85% mais rápido 🚀
```

### **Re-sync (segunda vez em diante):**
```
Antes: 123s
Com Delta Sync + Cache: 12s (-90%)
Resultado: 90% mais rápido 🚀🚀
```

### **Sync de 100 diários:**
```
Antes: ~20min
Otimizado: ~3min
Resultado: 85% mais rápido 🔥
```

---

## 📝 **PRÓXIMOS PASSOS**

1. **Implementar Fase 1 (Quick Wins)** - Começar com batch operations e indexes
2. **Testar Browser Pool** - Validar concurrency ideal (3, 5 ou 10 simultâneos)
3. **Implementar Delta Sync** - Reduzir re-syncs desnecessários
4. **Monitorar Métricas** - Adicionar timing logs em cada etapa
5. **Ajustar Concurrency** - Baseado em performance do IFMS

**Quer que eu implemente alguma dessas otimizações agora?**
