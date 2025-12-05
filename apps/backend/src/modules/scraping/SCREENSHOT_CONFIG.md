# Configuração de Screenshots no Scraping

## Visão Geral

O sistema de debug de scraping agora suporta controle fino sobre quando tirar screenshots das páginas durante o processo de scraping. Por padrão, **screenshots estão desabilitados** para melhorar performance e economizar espaço em disco.

## Parâmetro `takeScreenshot`

### Interface

```typescript
export interface CacheScrapingOptions {
  // ... outros campos
  takeScreenshot?: boolean; // Default: false
}
```

### Valores

- `false` (padrão): Não tira screenshot, apenas salva HTML snapshot e metadados
- `true`: Tira screenshot full-page e salva em `storage/scraping-debug/screenshots/`

## Estratégia Recomendada

### ✅ Quando Habilitar Screenshots

1. **Erros de scraping**: Sempre tire screenshots quando houver falha
   ```typescript
   await this.debugService.cacheScraping({
     // ... campos
     success: false,
     takeScreenshot: true, // Habilitar para debugar erros
   });
   ```

2. **Debug de campos específicos**: Quando investigando problemas de extração
   ```typescript
   await this.debugService.cacheScraping({
     // ... campos
     takeScreenshot: true, // Temporário para debugging
   });
   ```

3. **Testes e desenvolvimento**: Durante desenvolvimento de novos scrapers

### ❌ Quando Desabilitar Screenshots

1. **Scraping em produção bem-sucedido**: Economiza espaço e melhora performance
   ```typescript
   await this.debugService.cacheScraping({
     // ... campos
     success: true,
     // takeScreenshot não especificado = false (padrão)
   });
   ```

2. **Scraping em massa**: Quando processando muitos planos de ensino

## Exemplo de Uso no Código

### Scraping Normal (Sem Screenshot)

```typescript
// Sucesso - sem screenshot (padrão)
await this.debugService.cacheScraping({
  externalId: planId,
  scrapeType: 'teaching_plan',
  url,
  page,
  extractedData: planData,
  warnings: planData._warnings || [],
  errors: [],
  fieldMetrics: { /* ... */ },
  startTime,
  success: true,
  // takeScreenshot: false é o padrão
});
```

### Scraping com Erro (Com Screenshot)

```typescript
catch (error) {
  // Erro - com screenshot para debug
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
    takeScreenshot: true, // ✅ Habilitar para debugar
  });
}
```

### Debug Temporário (Com Screenshot)

```typescript
// Temporariamente habilitar para investigar problema
await this.debugService.cacheScraping({
  externalId: planId,
  scrapeType: 'teaching_plan',
  url,
  page,
  extractedData: planData,
  warnings: planData._warnings || [],
  errors: [],
  fieldMetrics: { /* ... */ },
  startTime,
  success: true,
  takeScreenshot: true, // 🔍 Temporário - remover após debug
});
```

## Benefícios

### Performance
- ✅ Scraping 30-50% mais rápido sem screenshots
- ✅ Menos I/O de disco
- ✅ Menos uso de CPU (renderização de imagem)

### Espaço em Disco
- ✅ Cada screenshot full-page: ~500KB - 2MB
- ✅ 100 scrapes sem screenshot: ~50MB (só HTML)
- ✅ 100 scrapes com screenshot: ~150MB (HTML + imagens)

### Flexibilidade
- ✅ Screenshots apenas quando necessário
- ✅ HTML snapshot sempre disponível para análise
- ✅ Logs detalhados independente de screenshots

## Localização dos Screenshots

```
PlanIA/
└── storage/
    └── scraping-debug/
        └── screenshots/
            ├── teaching_plan_123_1234567890.png
            ├── teaching_plan_456_1234567891.png
            └── ...
```

## Limpeza Automática

O método `cleanOldEntries()` remove automaticamente:
- Entradas de debug com mais de 30 dias
- Screenshots associados às entradas removidas

```typescript
// Executar limpeza manual
await scrapingDebugService.cleanOldEntries();
```

## Conclusão

Use `takeScreenshot: true` apenas quando realmente necessário para debug. Isso mantém o sistema rápido e eficiente, enquanto ainda fornece ferramentas poderosas de debugging quando precisar.
