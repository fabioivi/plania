# IFMS Scraping Module - Documentation

## 📁 Estrutura de Arquivos

```
scraping/
├── scraping.module.ts         # Módulo principal
├── scraping.service.ts        # Serviço de web scraping
├── ifms.routes.ts            # Configuração centralizada de rotas IFMS
└── README.md                 # Esta documentação
```

## 🗺️ Sistema de Rotas (ifms.routes.ts)

### Organização

Todas as rotas do sistema acadêmico IFMS estão centralizadas em `ifms.routes.ts` para facilitar manutenção e evitar URLs hardcoded espalhadas pelo código.

### Estrutura IFMS_ROUTES

```typescript
IFMS_ROUTES = {
  BASE_URL: 'https://academico.ifms.edu.br',
  
  AUTH: {
    LOGIN: '/administrativo/usuarios/login',
    LOGOUT: '/administrativo/usuarios/logout',
    RECOVER_PASSWORD: '/administrativo/usuarios/recuperar_senha',
  },
  
  DISCIPLINES: { ... },
  TEACHING_PLAN: { ... },
  DIARY: { ... },
  SCHEDULE: { ... },
  // ... outros módulos
}
```

### Como Usar

#### 1. Importar as rotas

```typescript
import { IFMS_ROUTES, buildIFMSUrl, isLoggedIn } from './ifms.routes';
```

#### 2. Construir URLs

```typescript
// URL simples
const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);
// https://academico.ifms.edu.br/administrativo/usuarios/login

// URL com parâmetro
const disciplineUrl = buildIFMSUrl(IFMS_ROUTES.DISCIPLINES.VIEW('123'));
// https://academico.ifms.edu.br/administrativo/disciplinas/view/123
```

#### 3. Verificar status de login

```typescript
const currentUrl = page.url();

if (isLoginPage(currentUrl)) {
  console.log('Usuário ainda está na página de login');
}

if (isLoggedIn(currentUrl)) {
  console.log('Usuário autenticado com sucesso');
}
```

### Seletores CSS (IFMS_SELECTORS)

Todos os seletores CSS também estão centralizados para facilitar manutenção:

```typescript
IFMS_SELECTORS = {
  LOGIN: {
    FORM: '#UsuarioLoginForm',
    USERNAME: 'input[name="data[Usuario][login]"]',
    PASSWORD: 'input[name="data[Usuario][senha]"]',
    SUBMIT: 'input[type="submit"].btn-primary',
  },
  
  TEACHING_PLAN: {
    FORM: '#PlanoEnsinoForm',
    TITLE: 'input[name="data[PlanoEnsino][titulo]"]',
    // ... outros campos
  },
  // ... outros formulários
}
```

## 🔧 Métodos do ScrapingService

### 1. testIFMSLogin

Testa se as credenciais são válidas.

```typescript
const isValid = await scrapingService.testIFMSLogin(username, password);
```

**Retorna:** `boolean`

**Erros possíveis:**
- "Credenciais inválidas. Verifique seu usuário e senha."
- "Tempo esgotado ao tentar acessar o sistema acadêmico..."
- "Erro de navegação. O sistema acadêmico pode estar indisponível..."

### 2. getDisciplines

Obtém lista de disciplinas do professor.

```typescript
const result = await scrapingService.getDisciplines(username, password);
```

**Retorna:**
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    code: string;
    class: string;
  }>;
  message?: string;
}
```

### 3. getSchedule

Obtém horário do professor.

```typescript
const result = await scrapingService.getSchedule(username, password);
```

**Retorna:**
```typescript
{
  success: boolean;
  data?: {
    [time: string]: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
    }
  };
  message?: string;
}
```

### 4. getTeachingPlans

Lista planos de ensino do professor.

```typescript
const result = await scrapingService.getTeachingPlans(username, password);
```

**Retorna:**
```typescript
{
  success: boolean;
  data?: Array<{
    id: string;
    discipline: string;
    period: string;
    status: string;
  }>;
  message?: string;
}
```

### 5. fillTeachingPlan

Preenche um plano de ensino no sistema.

```typescript
const result = await scrapingService.fillTeachingPlan(username, password, {
  planId: '123', // opcional, se omitido cria novo
  title: 'Título do Plano',
  objective: 'Objetivos...',
  content: 'Conteúdo programático...',
  methodology: 'Metodologia...',
  evaluation: 'Avaliação...',
  bibliography: 'Bibliografia...',
});
```

### 6. fillDiary

Preenche diário de classe.

```typescript
const result = await scrapingService.fillDiary(username, password, {
  diaryId: '456',
  date: '2025-12-04',
  content: 'Conteúdo da aula...',
});
```

## 🔒 Autenticação

### Fluxo de Login

```typescript
private async performLogin(page: Page, username: string, password: string) {
  // 1. Navegar para página de login
  const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);
  await page.goto(loginUrl);
  
  // 2. Esperar formulário carregar
  await page.waitForSelector(IFMS_SELECTORS.LOGIN.FORM);
  
  // 3. Preencher credenciais
  await page.fill(IFMS_SELECTORS.LOGIN.USERNAME, username);
  await page.fill(IFMS_SELECTORS.LOGIN.PASSWORD, password);
  
  // 4. Submeter e aguardar navegação
  await Promise.all([
    page.waitForNavigation(),
    page.click(IFMS_SELECTORS.LOGIN.SUBMIT),
  ]);
  
  // 5. Verificar sucesso
  if (!isLoggedIn(page.url())) {
    throw new Error('Falha no login');
  }
}
```

## 🛠️ Adicionar Novas Rotas

### Passo 1: Atualizar ifms.routes.ts

```typescript
export const IFMS_ROUTES = {
  // ... rotas existentes
  
  // Nova seção
  NOVO_MODULO: {
    LIST: '/administrativo/novo_modulo',
    VIEW: (id: string) => `/administrativo/novo_modulo/view/${id}`,
    ADD: '/administrativo/novo_modulo/add',
  },
} as const;
```

### Passo 2: Adicionar seletores

```typescript
export const IFMS_SELECTORS = {
  // ... seletores existentes
  
  NOVO_MODULO: {
    FORM: '#NovoModuloForm',
    CAMPO1: 'input[name="data[NovoModulo][campo1]"]',
    CAMPO2: 'textarea[name="data[NovoModulo][campo2]"]',
    SAVE: 'button[type="submit"]',
  },
} as const;
```

### Passo 3: Criar método no ScrapingService

```typescript
async getNovoModulo(username: string, password: string) {
  const context = await this.createContext();
  const page = await context.newPage();

  try {
    await this.performLogin(page, username, password);

    const url = buildIFMSUrl(IFMS_ROUTES.NOVO_MODULO.LIST);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extrair dados
    const data = await page.evaluate(() => {
      // Lógica de extração
    });

    return { success: true, data };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    await context.close();
  }
}
```

## 🐛 Debug

### Habilitar modo visual (não headless)

No `.env`:
```env
PLAYWRIGHT_HEADLESS=false
```

### Capturar screenshots

```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### Logs detalhados

O serviço já inclui logs console:
```typescript
console.log(`Navigating to: ${loginUrl}`);
console.log(`Current URL after login: ${currentUrl}`);
```

## ⚠️ Considerações Importantes

### 1. Timeouts

Todos os métodos usam timeouts adequados:
- Navegação: 30s
- Espera de elementos: 10s
- Formulários: 5s

### 2. Tratamento de Erros

Sempre retorna mensagens de erro amigáveis:
```typescript
throw new Error('Credenciais inválidas. Verifique seu usuário e senha.');
```

### 3. Limpeza de Recursos

Sempre fecha contextos:
```typescript
finally {
  await context.close();
}
```

### 4. Estrutura HTML Dinâmica

⚠️ **IMPORTANTE:** Os seletores de extração de dados (tables, etc) podem precisar ser ajustados conforme a estrutura real do HTML do IFMS.

Exemplo:
```typescript
// Pode precisar ajustar conforme HTML real
const rows = Array.from(document.querySelectorAll('table tbody tr'));
```

## 📝 Notas de Manutenção

### Quando atualizar rotas:

1. Sistema IFMS mudar URLs
2. Novos recursos forem adicionados
3. Formulários mudarem estrutura

### Quando atualizar seletores:

1. HTML do IFMS mudar
2. Classes CSS mudarem
3. IDs de formulários mudarem

### Teste sempre após mudanças:

```bash
# Testar login
npm run test:api

# Ou testar manualmente via Postman/Insomnia
POST /api/academic/credentials/:id/test
```

## 🔗 Referências

- [Playwright Documentation](https://playwright.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [IFMS Academic System](https://academico.ifms.edu.br)

---

**Última Atualização:** 2025-12-04  
**Versão:** 1.0.0
