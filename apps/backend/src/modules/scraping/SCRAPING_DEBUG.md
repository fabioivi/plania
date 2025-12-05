# Sistema de Debug de Scraping

Sistema completo de cache e análise para debugging de extração de dados do IFMS.

## 🎯 Objetivo

Capturar e armazenar todas as tentativas de scraping (bem-sucedidas ou falhadas) para análise posterior, permitindo:

- **Debug offline**: Analisar HTML sem precisar re-scraping
- **Comparação**: Ver o que mudou entre tentativas
- **Métricas**: Tracking de completeness e campos faltantes
- **Screenshots**: Visualização exata do que o Playwright capturou

## 📊 Estrutura

### Entidade: `scraping_debug`

```typescript
{
  id: uuid,
  externalId: string,        // ID do plano ou diário
  scrapeType: string,         // 'teaching_plan', 'diary', 'proposta_trabalho'
  url: string,
  htmlSnapshot: text,         // HTML completo da página
  screenshotPath: string,     // Caminho para imagem
  extractedData: jsonb,       // Dados extraídos
  extractionWarnings: jsonb,  // Avisos durante extração
  extractionErrors: jsonb,    // Erros ocorridos
  fieldMetrics: {
    total: number,
    extracted: number,
    missing: string[],
    completeness: number      // Percentual 0-100
  },
  selectorAttempts: [{
    field: string,
    attempted: string[],
    successful: string | null
  }],
  userAgent: string,
  viewport: { width, height },
  scrapeDurationMs: number,
  success: boolean,
  createdAt: timestamp
}
```

## 🚀 Uso

### Automático

O sistema é automaticamente invocado em **toda tentativa de scraping** em `ScrapingService`:

```typescript
// Success
await this.debugService.cacheScraping({
  externalId: planId,
  scrapeType: 'teaching_plan',
  url,
  page,
  extractedData: planData,
  warnings: planData._warnings || [],
  errors: [],
  fieldMetrics: {
    total: 27,
    extracted: extractedFields.length,
    missing: missingFields,
    completeness: (extractedFields.length / 27) * 100,
  },
  startTime,
  success: true,
});

// Failure
await this.debugService.cacheScraping({
  externalId: planId,
  scrapeType: 'teaching_plan',
  url,
  page,
  extractedData: null,
  warnings: [],
  errors: [error.message, error.stack],
  startTime,
  success: false,
});
```

### Manual via API

#### Ver estatísticas gerais
```bash
GET /api/scraping-debug/stats
```

**Response:**
```json
{
  "total": 150,
  "successful": 142,
  "failed": 8,
  "avgCompleteness": 94.5,
  "commonMissingFields": [
    { "field": "propostaTrabalho", "count": 12 },
    { "field": "historico", "count": 8 },
    { "field": "bibliografiaComplementar", "count": 3 }
  ]
}
```

#### Ver falhas recentes
```bash
GET /api/scraping-debug/failed?limit=10
```

#### Ver cache específico
```bash
GET /api/scraping-debug/latest/46332/teaching_plan
```

**Response inclui:**
- HTML completo
- Screenshot path
- Dados extraídos
- Warnings e errors
- Métricas de completeness

#### Comparar duas tentativas
```bash
GET /api/scraping-debug/compare/{id1}/{id2}
```

**Response:**
```json
{
  "differences": [
    {
      "field": "propostaTrabalho",
      "value1": null,
      "value2": [/* array */]
    }
  ],
  "htmlDiff": {
    "size1": 45632,
    "size2": 48901,
    "sizeDiff": 3269
  }
}
```

#### Limpar cache antigo (>30 dias)
```bash
GET /api/scraping-debug/clean-old
```

## 📁 Arquivos

### Entidade
- `scraping-debug.entity.ts` - Definição TypeORM

### Service
- `scraping-debug.service.ts` - Lógica de cache e análise

### Controller
- `scraping-debug.controller.ts` - Endpoints REST

### Storage
Screenshots são salvos em:
```
/storage/scraping-debug/screenshots/
  └── teaching_plan_46332_1733399280000.png
```

## 🔍 Fluxo de Debug

### 1. Scraping Falha

```typescript
// Sistema automaticamente captura:
- HTML completo da página
- Screenshot full-page
- Stack trace do erro
- Timestamp e duração
- User agent e viewport
```

### 2. Análise Offline

```typescript
// Acesse via API ou database:
const debug = await debugService.getLatestCache('46332', 'teaching_plan');

// Você tem:
- HTML para inspecionar no browser
- Screenshot para ver layout
- Tentativas de seletores
- Métricas de completeness
```

### 3. Comparação

```typescript
// Compare scraping antes e depois de mudança no HTML:
const diff = await debugService.compareScrapings(id1, id2);

// Veja exatamente quais campos mudaram
```

### 4. Estatísticas

```typescript
// Identifique padrões de falhas:
const stats = await debugService.getExtractionStats('teaching_plan');

// Campos que falham com mais frequência
// Taxa de sucesso geral
// Completeness médio
```

## 🎨 Casos de Uso

### Debug de Proposta de Trabalho

Se extração de `propostaTrabalho` está falhando:

1. **Ver última tentativa**:
   ```bash
   GET /api/scraping-debug/latest/46332/teaching_plan
   ```

2. **Analisar HTML salvo**:
   - Copie `htmlSnapshot`
   - Cole em arquivo `.html`
   - Abra no browser
   - Inspecione tabela de proposta

3. **Verificar seletores tentados**:
   ```json
   "selectorAttempts": [{
     "field": "propostaTrabalho",
     "attempted": [
       "table#proposta_trabalho",
       "table.data-table",
       "table:has(th:contains('Metodologia'))"
     ],
     "successful": null
   }]
   ```

4. **Ajustar seletores** em `ifms.selectors.config.ts`

5. **Re-scrape e compare**

### Monitorar Qualidade

Dashboard simples:

```typescript
// Todo dia, check:
const stats = await debugService.getExtractionStats();

if (stats.avgCompleteness < 90) {
  // Alerta: Qualidade caindo!
  // Investigar campos em commonMissingFields
}

if (stats.failed > 10) {
  // Muitas falhas recentes
  // Ver detalhes em getFailedScrapings()
}
```

## 🧹 Manutenção

### Limpeza Automática

```typescript
// Recomendado: Cron job diário
await debugService.cleanOldCache();
// Remove entradas > 30 dias
// Deleta screenshots associados
```

### Tamanho do Database

**Estimativa por scraping:**
- HTML: ~50KB
- Screenshot: ~200KB
- Metadata: ~5KB
- **Total: ~255KB**

**Para 1000 scrapings: ~255MB**

Ajuste período de retenção conforme necessário.

## 🔐 Segurança

- ✅ Protegido com `JwtAuthGuard`
- ✅ Apenas usuários autenticados
- ⚠️ HTML pode conter dados sensíveis
- ⚠️ Não expor publicamente

## 📈 Próximas Melhorias

- [ ] Dashboard visual com gráficos
- [ ] Diff visual de HTML
- [ ] Alertas automáticos por email
- [ ] Exportar relatórios em PDF
- [ ] Integração com Sentry/monitoring
- [ ] Replay de scraping com HTML salvo

## 🐛 Troubleshooting

**Problema**: Screenshots não sendo salvos

```typescript
// Verificar permissões:
ls -la storage/scraping-debug/screenshots/

// Criar diretório manualmente se necessário:
mkdir -p storage/scraping-debug/screenshots
chmod 755 storage/scraping-debug/screenshots
```

**Problema**: Database crescendo muito

```typescript
// Reduzir período de retenção:
// Em scraping-debug.service.ts
const fifteenDaysAgo = new Date();
fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15); // Era 30
```

**Problema**: Queries lentas

```typescript
// Indexes já criados na migration:
- IDX_scraping_debug_external_id_type
- IDX_scraping_debug_success
- IDX_scraping_debug_created_at

// Se ainda lento, criar índices adicionais em campos JSONB
```

## 📚 Referências

- [Playwright Screenshots](https://playwright.dev/docs/screenshots)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [TypeORM JSONB](https://typeorm.io/entities#column-types-for-postgres)
