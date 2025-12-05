# 🧪 Guia de Teste: Sistema de Debug de Scraping

## 📋 Pré-requisitos

1. ✅ Backend rodando: `npm run dev`
2. ✅ Frontend rodando: `cd apps/frontend && npm run dev`
3. ✅ PostgreSQL ativo
4. ✅ Credenciais IFMS válidas

## 🚀 Passo a Passo

### 1. Fazer Login e Obter Token

```bash
# 1. Abra o frontend
http://localhost:3000

# 2. Faça login com suas credenciais IFMS

# 3. Abra DevTools (F12)
# 4. Vá em: Application > Local Storage > http://localhost:3000
# 5. Copie o valor de "token"
```

### 2. Executar Scraping com Debug

```bash
cd apps/backend

# Substitua SEU_TOKEN_AQUI pelo token copiado
TOKEN="SEU_TOKEN_AQUI" npx ts-node scripts/test-scraping-debug.ts
```

**O que acontece:**
- ✅ Sincroniza diários e planos do IFMS
- ✅ Captura HTML completo de cada página
- ✅ Tira screenshot full-page
- ✅ Registra métricas de completeness
- ✅ Salva warnings e errors

**Output esperado:**
```
🚀 Testando scraping com debug...

📄 Sincronizando...

⏳ Aguardando 10s...

📈 142/150 sucesso (94.50%)

⚠️  Campos faltantes:
   propostaTrabalho: 12x
   historico: 8x
   bibliografiaComplementar: 3x

✅ Concluído! Use analyze-scraping-cache.ts para detalhes.
```

### 3. Analisar Cache de um Plano Específico

```bash
# Substitua 46332 pelo ID do plano que você quer analisar
# (Você pode ver os IDs no frontend em /disciplines)
npx ts-node scripts/analyze-scraping-cache.ts 46332
```

**O que acontece:**
- ✅ Busca último cache do plano
- ✅ Exibe métricas detalhadas
- ✅ Lista campos extraídos vs faltantes
- ✅ **Exporta HTML para arquivo local**
- ✅ Mostra caminho do screenshot

**Output esperado:**
```
🔍 Analisando cache do plano 46332...

✅ Cache encontrado!

📊 Informações:
   ID: uuid-aqui
   External ID: 46332
   URL: https://academico.ifms.edu.br/...
   Sucesso: ✅
   Duração: 3245ms
   Data: 12/5/2025, 10:30:15

📈 Métricas de Extração:
   Total de campos: 27
   Campos extraídos: 25
   Completeness: 92.59%

   ❌ Campos faltantes:
      - propostaTrabalho
      - historico

📄 Dados Extraídos:
   campus: ✅ 22 chars
   curso: ✅ 45 chars
   unidadeCurricular: ✅ 67 chars
   professores: ✅ 23 chars
   ementa: ✅ 456 chars
   objetivoGeral: ✅ 234 chars
   objetivosEspecificos: ✅ 5 itens
   bibliografiaBasica: ✅ 3 itens
   bibliografiaComplementar: ✅ 2 itens
   propostaTrabalho: ❌ NULL
   historico: ❌ NULL

💾 HTML exportado:
   C:\...\storage\scraping-debug\html-exports\plan_46332_1733399280000.html

🖼️  Screenshot:
   C:\...\storage\scraping-debug\screenshots\teaching_plan_46332_1733399280000.png
   ✅ Arquivo existe e pode ser aberto

📋 Proposta de Trabalho:
   ❌ Não extraída
   💡 Abra o HTML exportado e procure por:
      - table#proposta_trabalho
      - table com th "Metodologia"
      - table com th "Período em dias"

🔍 Próximos passos para debug:
   1. Abra o HTML exportado no navegador
   2. Inspecione a estrutura da tabela de proposta
   3. Teste seletores no console do browser:
      document.querySelector("table#proposta_trabalho")
   4. Ajuste seletores em ifms.selectors.config.ts
   5. Re-execute o scraping e compare
```

### 4. Analisar HTML Exportado

```bash
# 1. Abra o arquivo HTML exportado no navegador
# Caminho: storage/scraping-debug/html-exports/plan_46332_*.html

# 2. Abra DevTools (F12) > Console

# 3. Teste seletores para encontrar a tabela de proposta:
document.querySelector('table#proposta_trabalho')
document.querySelector('table:has(th:contains("Metodologia"))')
document.querySelectorAll('table.table')  // Ver todas as tabelas

# 4. Inspecione a estrutura:
const tables = document.querySelectorAll('table');
console.log('Total de tabelas:', tables.length);
tables.forEach((t, i) => {
  const header = t.querySelector('th')?.textContent;
  console.log(`Tabela ${i}: ${header}`);
});

# 5. Encontrou? Copie o seletor que funcionou!
```

### 5. Ajustar Seletores

Se você encontrou a tabela no HTML, ajuste em:

```typescript
// apps/backend/src/modules/scraping/ifms.selectors.config.ts

PROPOSTA_TRABALHO_INNER: {
  primary: 'SEU_SELETOR_AQUI',  // <-- Cole o seletor que funcionou
  fallbacks: [
    'table#proposta_trabalho',
    'table.data-table:has(th:contains("Metodologia"))',
  ],
},
```

### 6. Re-testar

```bash
# Após ajustar seletores, re-execute:
TOKEN="seu_token" npx ts-node scripts/test-scraping-debug.ts

# E analise novamente:
npx ts-node scripts/analyze-scraping-cache.ts 46332

# Compare se propostaTrabalho agora está ✅
```

## 📊 Ver Estatísticas Gerais

Via API (com token):

```bash
# PowerShell
$token = "seu_token"
$headers = @{ Authorization = "Bearer $token" }

# Stats gerais
Invoke-RestMethod -Uri "http://localhost:3001/api/scraping-debug/stats" -Headers $headers | ConvertTo-Json

# Falhas recentes
Invoke-RestMethod -Uri "http://localhost:3001/api/scraping-debug/failed?limit=10" -Headers $headers | ConvertTo-Json

# Cache específico
Invoke-RestMethod -Uri "http://localhost:3001/api/scraping-debug/latest/46332/teaching_plan" -Headers $headers | ConvertTo-Json
```

## 🔍 Dicas de Debug

### Proposta de Trabalho não Extraindo?

1. ✅ Verifique se a tabela existe no HTML exportado
2. ✅ Conte quantas `<table>` existem: `document.querySelectorAll('table').length`
3. ✅ A proposta pode estar em uma tabela aninhada: `table table`
4. ✅ O ID pode ter mudado: procure por atributos `id`, `class`, `data-*`
5. ✅ Pode estar em um accordion colapsado: procure por `#accordion_*`

### HTML está vazio ou incompleto?

1. ✅ Conteúdo pode carregar via JavaScript após page load
2. ✅ Aumente `waitForTimeout` em `scraping.service.ts`
3. ✅ Use `waitForSelector` para elemento específico

### Screenshot mostra página diferente?

1. ✅ Pode ter redirecionado para login (sessão expirou)
2. ✅ URL pode estar incorreta
3. ✅ Permissões insuficientes no IFMS

## 📁 Estrutura de Arquivos

```
storage/
└── scraping-debug/
    ├── screenshots/
    │   ├── teaching_plan_46332_1733399280000.png
    │   └── teaching_plan_46333_1733399285000.png
    └── html-exports/
        ├── plan_46332_1733399280000.html
        └── plan_46333_1733399285000.html
```

## 🧹 Limpeza

```bash
# Limpar cache > 30 dias
curl -X GET http://localhost:3001/api/scraping-debug/clean-old \
  -H "Authorization: Bearer seu_token"

# Resposta:
{ "deleted": 42 }
```

## ❓ Troubleshooting

**"Token não fornecido"**
- Certifique-se de passar TOKEN="..." antes do comando
- Token deve estar entre aspas

**"Cannot find module 'axios'"**
```bash
cd apps/backend
npm install axios
```

**"Nenhum cache encontrado"**
- Execute primeiro o scraping com test-scraping-debug.ts
- Aguarde pelo menos 10 segundos

**"Screenshot path not found"**
- Diretório pode não ter sido criado
- Execute: `mkdir -p storage/scraping-debug/screenshots`

## 🎯 Objetivo Final

Após seguir este guia, você terá:

✅ HTMLs salvos de cada tentativa de scraping  
✅ Screenshots para contexto visual  
✅ Métricas de completeness para tracking  
✅ Identificação de campos problemáticos  
✅ Base para ajustar seletores e melhorar extração  

**Meta: 100% de completeness em todos os campos!** 🚀
