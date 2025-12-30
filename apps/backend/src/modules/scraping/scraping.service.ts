import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import {
  IFMS_ROUTES,
  IFMS_SELECTORS,
  buildIFMSUrl,
  isLoggedIn,
  isLoginPage,
} from './ifms.routes';
import {
  TEACHING_PLAN_SELECTORS,
  getTableBySection,
} from './ifms.selectors.config';
import { ExtractionUtils } from './extraction.utils';
import { ScrapingDebugService } from './scraping-debug.service';
import { SessionCacheService } from '../../common/services/session-cache.service';
import { PlaywrightService } from './services/playwright.service';
import { ScraperFactory } from './factories/scraper.factory';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);
  // private browser: Browser | null = null; // Managed by PlaywrightService now

  // Configuration constants for delays (in milliseconds)
  private readonly ENABLE_HUMAN_DELAYS = false; // Set to false to disable all delays

  // Typing delays
  private readonly TYPING_DELAY_MIN = 30;
  private readonly TYPING_DELAY_MAX = 80;

  // Navigation delays
  private readonly PAGE_LOAD_DELAY_MIN = 200;
  private readonly PAGE_LOAD_DELAY_MAX = 500;

  // Interaction delays
  private readonly BEFORE_INTERACT_DELAY_MIN = 100;
  private readonly BEFORE_INTERACT_DELAY_MAX = 300;

  private readonly BETWEEN_FIELDS_DELAY_MIN = 150;
  private readonly BETWEEN_FIELDS_DELAY_MAX = 400;

  private readonly BEFORE_SUBMIT_DELAY_MIN = 200;
  private readonly BEFORE_SUBMIT_DELAY_MAX = 500;

  private readonly AFTER_SUBMIT_DELAY_MIN = 1000;
  private readonly AFTER_SUBMIT_DELAY_MAX = 2000;

  private readonly BEFORE_CONTENT_SEND_DELAY_MIN = 300;
  private readonly BEFORE_CONTENT_SEND_DELAY_MAX = 800;

  constructor(
    private configService: ConfigService,
    private debugService: ScrapingDebugService,
    private sessionCache: SessionCacheService,
    private playwrightService: PlaywrightService,
    private scraperFactory: ScraperFactory,
  ) { }

  /**
   * Generate random delay to simulate human behavior
   * @param min - Minimum delay in milliseconds
   * @param max - Maximum delay in milliseconds
   */
  private randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Wait for a random amount of time (human-like behavior)
   * @param page - Playwright page instance
   * @param min - Minimum delay in milliseconds (default: 100ms)
   * @param max - Maximum delay in milliseconds (default: 400ms)
   */
  private async humanDelay(page: Page, min: number = 100, max: number = 400): Promise<void> {
    if (!this.ENABLE_HUMAN_DELAYS) {
      return; // Skip delay if disabled
    }
    const delay = this.randomDelay(min, max);
    this.logger.debug(`⏳ Aguardando ${delay}ms...`);
    await page.waitForTimeout(delay);
  }

  /**
   * Type text with random delays between keystrokes (simulates human typing)
   * @param page - Playwright page instance
   * @param selector - CSS selector
   * @param text - Text to type
   */
  private async humanType(page: Page, selector: string, text: string): Promise<void> {
    await page.focus(selector);

    if (!this.ENABLE_HUMAN_DELAYS) {
      // Type instantly without delays
      await page.fill(selector, text);
      return;
    }

    // Type character by character with delays
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(this.randomDelay(this.TYPING_DELAY_MIN, this.TYPING_DELAY_MAX));
    }
  }

  /**
   * Format error message based on environment
   * In production, returns user-friendly messages for system failures
   */
  private formatErrorMessage(error: any): string {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isDev = nodeEnv === 'development';
    const originalMessage = error.message || String(error);

    // In development, return the full raw error
    if (isDev) {
      return originalMessage;
    }

    // Production: User-friendly messages
    const lowerMsg = originalMessage.toLowerCase();

    // Timeouts
    if (lowerMsg.includes('timeout') || lowerMsg.includes('time out') || lowerMsg.includes('tempo esgotado')) {
      return 'O Sistema Acadêmico do IFMS está demorando para responder. O sistema pode estar lento ou instável no momento.';
    }

    // Navigation / Connection
    if (lowerMsg.includes('net::err_') || lowerMsg.includes('navigation') || lowerMsg.includes('failed to navigate')) {
      return 'Não foi possível conectar ao Sistema Acadêmico do IFMS. O portal parece estar fora do ar.';
    }

    // Rate Limiting / WAF (if applicable, generic)
    if (lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
      return 'Muitas requisições ao sistema do IFMS. Aguarde um momento e tente novamente.';
    }

    // Login (Keep specific auth errors)
    if (lowerMsg.includes('inválido') || lowerMsg.includes('invalid') || lowerMsg.includes('incorreta')) {
      return originalMessage; // Credential errors are safe to show
    }

    // Generic fallback for production
    return 'Ocorreu um erro inesperado na comunicação com o sistema do IFMS. O problema pode ser instabilidade no portal.';
  }

  async getBrowser(): Promise<Browser> {
    return this.playwrightService.getBrowser();
  }

  async createContext(): Promise<BrowserContext> {
    return this.playwrightService.createContext();
  }

  async testLogin(system: string, username: string, password: string): Promise<boolean> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      const provider = this.scraperFactory.getProvider(system);
      this.logger.log(`🔐 Testing login for system: ${system}`);
      this.logger.debug(`🔎 [testLogin] Provider obtained for ${system}. Calling login...`);
      const result = await provider.login(page, username, password);
      this.logger.debug(`🔎 [testLogin] Provider login result: ${JSON.stringify(result)}`);

      if (!result.success) {
        this.logger.warn(`🔎 [testLogin] Login failed! Throwing error.`);
        throw new Error(result.message || 'Login falhou sem mensagem específica');
      }

      this.logger.log(`🔎 [testLogin] Login success! Returning true.`);
      return true;
    } catch (error) {
      this.logger.error(`${system} login test failed:`, error);
      throw new Error(this.formatErrorMessage(error));
    } finally {
      await context.close();
    }
  }

  async testIFMSLogin(username: string, password: string): Promise<boolean> {
    return this.testLogin('IFMS', username, password);
  }

  /**
   * Ensure the browser is logged in, reusing session from Redis cache if possible
   *
   * Benefits of Redis-based session cache:
   * - Sessions persist across server restarts
   * - Shared cache between multiple worker instances
   * - Automatic expiration via TTL (1 hour default)
   * - Thread-safe concurrent access
   */
  async ensureLoggedIn(
    page: Page,
    username: string,
    password: string,
  ): Promise<void> {
    const context = page.context();

    // 1. Try to restore session from Redis cache
    const cachedCookies = await this.sessionCache.getSession(username);
    if (cachedCookies) {
      this.logger.debug(`♻️  Reutilizando sessão do Redis para ${username}`);
      await context.addCookies(cachedCookies);

      // Navigate to a protected page to verify session (e.g. Home/Dashboard)
      // IFMS usually redirects to /administrativo after login
      try {
        await page.goto('https://academico.ifms.edu.br/administrativo', {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        if (isLoggedIn(page.url())) {
          this.logger.log('✅ Sessão restaurada com sucesso do Redis!');
          return;
        }

        this.logger.warn('⚠️ Sessão expirada ou inválida, invalidando cache e realizando novo login...');
        await this.sessionCache.invalidateSession(username);
      } catch (error) {
        this.logger.warn(`⚠️ Erro ao verificar sessão (${error.message}), invalidando cache...`);
        await this.sessionCache.invalidateSession(username);
      }
    } else {
      this.logger.log(`🔑 Nenhuma sessão em cache Redis para ${username}, realizando login...`);
    }

    // 2. Perform fresh login if needed
    const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);

    await page.goto(loginUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Check if we are already logged in (redirected)
    if (isLoggedIn(page.url())) {
      this.logger.log('✅ Já estava logado (redirect), salvando sessão no Redis...');
      const cookies = await context.cookies();
      await this.sessionCache.setSession(username, cookies);
      return;
    }

    await page.waitForSelector(IFMS_SELECTORS.LOGIN.FORM, {
      state: 'visible',
      timeout: 10000
    });

    await page.fill(IFMS_SELECTORS.LOGIN.USERNAME, username, { timeout: 5000 });
    await page.fill(IFMS_SELECTORS.LOGIN.PASSWORD, password, { timeout: 5000 });

    await page.click(IFMS_SELECTORS.LOGIN.SUBMIT);

    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }),
        page.waitForSelector(IFMS_SELECTORS.LOGIN.ERROR_MESSAGE, { timeout: 10000 })
      ]);
    } catch (e) {
      // Ignore timeout
    }

    // Check for error message
    const errorElement = await page.$(IFMS_SELECTORS.LOGIN.ERROR_MESSAGE);
    if (errorElement) {
      const errorText = await errorElement.textContent();
      if (errorText && errorText.includes('Login e/ou senha inválido')) {
        throw new Error('Login e/ou senha inválido(s). Credenciais incorretas.');
      }
      throw new Error('Falha no login. Verifique suas credenciais.');
    }

    const currentUrl = page.url();
    if (!isLoggedIn(currentUrl)) {
      throw new Error('Falha no login. Credenciais inválidas (URL Check).');
    }

    this.logger.log('✅ Login realizado com sucesso! Salvando sessão no Redis.');
    // 3. Save new session to Redis cache with 1-hour TTL
    const cookies = await context.cookies();
    await this.sessionCache.setSession(username, cookies, 3600);
  }

  /**
   * Get list of diaries from IFMS
   */
  async getDiaries(
    username: string,
    password: string,
  ): Promise<{ success: boolean; data?: any[]; message?: string }> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      await this.ensureLoggedIn(page, username, password);

      const diariesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.LIST);
      await page.goto(diariesUrl, { waitUntil: 'domcontentloaded' });

      // Wait for table instead of fixed time
      try {
        await page.waitForSelector('table tbody tr', { timeout: 5000 });
      } catch (e) {
        // Maybe no diaries, continue
      }

      // Extract diaries data - structure to be adjusted based on actual HTML
      const diaries = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map((row) => {
          const cells = row.querySelectorAll('td');
          return {
            id: cells[0]?.textContent?.trim(),
            discipline: cells[1]?.textContent?.trim(),
            class: cells[2]?.textContent?.trim(),
            period: cells[3]?.textContent?.trim(),
          };
        });
      });

      return {
        success: true,
        data: diaries,
      };
    } catch (error) {
      this.logger.error('Get diaries failed:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Get diary content by ID
   */
  async getDiaryContent(
    username: string,
    password: string,
    diaryId: string,
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      await this.ensureLoggedIn(page, username, password);

      const contentUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.CONTENT(diaryId));
      await page.goto(contentUrl, { waitUntil: 'domcontentloaded' });

      // Extract content - structure to be adjusted
      // Also extract metadata from the header table
      const result = await page.evaluate(() => {
        // Parse Header Table
        const headerTable = document.querySelector('table.diario');
        let metadata = null;

        if (headerTable) {
          const cells = headerTable.querySelectorAll('td');
          // Format expected:
          // <tr>
          //   <th>Classe:</th> <td>...</td>
          //   <th>Unidade Curricular...:</th> <td>NAME (CODE) - HOURS</td>
          //   <th>Turma:</th> <td>CODE</td>
          // </tr>

          // Based on the user provided snippet, we need to find the correct cells
          // We'll iterate to be safe or use specific indices if stable.
          // Looking at the snippet, it's all in one TR?
          // The snippet shows 3 pairs of th/td in one tr.

          let disciplinaText = '';
          let turmaText = '';

          const headers = headerTable.querySelectorAll('th');
          headers.forEach((th, index) => {
            const text = th.textContent?.trim() || '';
            if (text.includes('Unidade Curricular')) {
              // The next sibling or key-value pair logic
              // In the snippet, it matches <th>...</th><td>...</td> sequence.
              // `cells` might not map linearly if we just queryAll('td').
              // It's safer to traverse.
              const td = th.nextElementSibling as HTMLElement;
              if (td && td.tagName === 'TD') {
                disciplinaText = td.textContent?.trim() || '';
              }
            }
            if (text.includes('Turma:')) {
              const td = th.nextElementSibling as HTMLElement;
              if (td && td.tagName === 'TD') {
                turmaText = td.textContent?.trim() || '';
              }
            }
          });

          if (disciplinaText) {
            // Parse "GERÊNCIA ... (CODE) - 60.00h"
            // Regex to capture: Name (Code) - Hours
            const match = disciplinaText.match(/^(.*)\s+\((.*)\)\s+-\s+(.*)$/);
            if (match) {
              const name = match[1].trim();
              const code = match[2].trim();
              metadata = {
                name,
                code,
                turma: turmaText
              };
            }
          }
        }

        return {
          title: document.querySelector('h1, h2')?.textContent?.trim(),
          description: document.querySelector('.description, .content')?.textContent?.trim(),
          metadata
        };
      });

      return {
        success: true,
        data: result, // result contains { title, description, metadata }
      };
    } catch (error) {
      this.logger.error('Get diary content failed:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Get diary avaliacoes (assessments) by ID
   */
  async getDiaryAvaliacoes(
    username: string,
    password: string,
    diaryId: string,
  ): Promise<{ success: boolean; data?: any[]; message?: string }> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      await this.ensureLoggedIn(page, username, password);

      const avaliacoesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.AVALIACOES(diaryId));
      await page.goto(avaliacoesUrl, { waitUntil: 'domcontentloaded' });

      // await page.waitForTimeout(2000); // Removed fixed delay

      // Extract avaliacoes data - structure to be adjusted
      const avaliacoes = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return rows.map((row) => {
          const cells = row.querySelectorAll('td');
          return {
            id: cells[0]?.textContent?.trim(),
            name: cells[1]?.textContent?.trim(),
            date: cells[2]?.textContent?.trim(),
            weight: cells[3]?.textContent?.trim(),
          };
        });
      });

      return {
        success: true,
        data: avaliacoes,
      };
    } catch (error) {
      this.logger.error('Get diary avaliacoes failed:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Get all teaching plans for a specific diary
   */
  async getAllTeachingPlans(
    page: Page,
    diaryId: string,
  ): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const teachingPlansUrl = buildIFMSUrl(IFMS_ROUTES.TEACHING_PLAN.LIST(diaryId));
      this.logger.debug(`Navigating to teaching plans: ${teachingPlansUrl}`);

      await page.goto(teachingPlansUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // await page.waitForTimeout(2000); // Removed fixed delay, waiting for table
      try {
        await page.waitForSelector('table.table', { timeout: 5000 });
      } catch (e) {
        // Continue
      }

      // Extract teaching plans from table
      const plans = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.table tbody tr'));

        return rows.map((row) => {
          const cells = row.querySelectorAll('td');

          // Extract plan ID from link
          const linkElement = cells[0]?.querySelector('a');
          const linkText = linkElement?.textContent?.trim() || '';
          const idMatch = linkText.match(/#(\d+)/);
          const externalId = idMatch ? idMatch[1] : '';

          // Check if plan is deleted (has <del> tag)
          const isDeleted = cells[0]?.querySelector('del') !== null;

          // Get status text
          const statusText = cells[1]?.textContent?.trim() || '';

          // Extract professors
          const professores = cells[2]?.textContent?.trim() || '';

          return {
            externalId,
            excluido: isDeleted,
            status: statusText,
            professores,
          };
        }).filter(p => p.externalId && !p.excluido); // Filter deleted and invalid plans
      });

      this.logger.log(`Found ${plans.length} teaching plans for diary ${diaryId}`);

      return {
        success: true,
        data: plans,
      };
    } catch (error) {
      this.logger.error(`Get teaching plans for diary ${diaryId} failed:`, error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Get detailed information from a teaching plan with robust extraction
   */
  /**
   * Get detailed information from a teaching plan (Refactored to use Provider)
   */
  async getTeachingPlanDetails(
    page: Page,
    diaryId: string,
    planId: string,
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      this.logger.log('🔄 Delegating teaching plan extraction to IFMS Provider...');
      const provider = this.scraperFactory.getProvider('IFMS');
      const planDto = await provider.getTeachingPlan(page, diaryId, planId);

      return {
        success: true,
        data: planDto,
      };
    } catch (error) {
      this.logger.error(`❌ Factory delegation failed for plan ${planId}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get all diaries from professor
   */
  async getAllDiaries(
    username: string,
    password: string,
  ): Promise<{ success: boolean; data?: any[]; message?: string }> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      await this.ensureLoggedIn(page, username, password);

      const diariesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.LIST);
      this.logger.debug(`Navigating to diaries: ${diariesUrl}`);

      await page.goto(diariesUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for table to load
      await page.waitForTimeout(2000);

      // Extract diaries data from table
      const diaries = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.table tbody tr'));

        // Helper to parse date in format DD/MM/YYYY to ISO string
        const parseDateBR = (dateStr: string): string | null => {
          if (!dateStr || dateStr.trim() === '' || dateStr === '-') return null;
          const parts = dateStr.trim().match(/(\d{2})\/(\d{2})\/(\d{4})/);
          if (!parts) return null;
          const [, day, month, year] = parts;
          return `${year}-${month}-${day}`;
        };

        return rows.map((row) => {
          const cells = row.querySelectorAll('td');

          // Check if entry is inside <del> tag (closed diary)
          const isDeleted = cells[0]?.querySelector('del') !== null;

          // Extract diary ID from link in Classe column (cells[0])
          const linkElement = cells[0]?.querySelector('a');
          const href = linkElement?.getAttribute('href') || '';
          const idMatch = href.match(/\/diario\/(\d+)/);
          const externalId = idMatch ? idMatch[1] : '';

          // Get disciplina from Classe column (cells[0]) - remove "(FECHADA)" suffix
          const classeText = cells[0]?.textContent?.trim() || '';
          const disciplina = classeText.replace(/\s*\(FECHADA\)\s*$/, '').trim();

          // Get curso from Curso column (cells[1])
          const curso = cells[1]?.textContent?.trim() || '';

          // Check if diary is approved - Plano de Ensino column (cells[2])
          const planoEnsinoCell = cells[2];
          const isApproved = planoEnsinoCell?.querySelector('.label-success') !== null ||
            planoEnsinoCell?.textContent?.toLowerCase().includes('aprovado');

          // Extract opening date (data de abertura) - column 3
          const dataAberturaText = cells[3]?.textContent?.trim() || '';
          const dataAbertura = parseDateBR(dataAberturaText);

          // Extract closing date (data de fechamento) - column 4
          const dataFechamentoText = cells[4]?.textContent?.trim() || '';
          const dataFechamento = parseDateBR(dataFechamentoText);

          return {
            externalId,
            disciplina,
            curso,
            turma: '', // Not available in this table
            periodo: '', // Not available in this table
            aprovados: 0, // Not available in this table
            reprovados: 0, // Not available in this table
            emCurso: 0, // Not available in this table
            aprovado: isApproved,
            dataAbertura,
            dataFechamento,
            excluido: isDeleted,
          };
        }).filter(d => d.externalId); // Filter out rows without ID
      });

      this.logger.log(`Found ${diaries.length} diaries`);

      return {
        success: true,
        data: diaries,
      };
    } catch (error) {
      this.logger.error('Get all diaries failed:', error);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      await context.close();
    }
  }

  /**
   * Scrape class content from diary content page
   */
  async scrapeClassContent(
    page: Page,
    diaryId: string,
  ): Promise<{
    success: boolean;
    data?: any[];
    metadata?: any;
    message?: string;
  }> {
    try {
      const contentUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.CONTENT(diaryId));
      this.logger.log(`📚 Acessando conteúdo do diário: ${contentUrl}`);

      await page.goto(contentUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      await page.waitForTimeout(2000);

      // Check if table exists
      const tableExists = await page.locator('table.diario tbody').count();
      if (tableExists === 0) {
        this.logger.warn('⚠️ Tabela de conteúdo não encontrada');
        return {
          success: true,
          data: [],
          message: 'Nenhum conteúdo encontrado para este diário',
        };
      }

      // Extract all content rows AND metadata
      const result = await page.evaluate(() => {
        // 1. Extract Metadata from Header Table
        const headerTable = document.querySelector('table.diario');
        let metadata = null;

        if (headerTable) {
          let disciplinaText = '';
          let turmaText = '';

          const headers = headerTable.querySelectorAll('th');
          headers.forEach((th) => {
            const text = th.textContent?.trim() || '';
            if (text.includes('Unidade Curricular')) {
              const td = th.nextElementSibling as HTMLElement;
              if (td && td.tagName === 'TD') {
                disciplinaText = td.textContent?.trim() || '';
              }
            }
            if (text.includes('Turma:')) {
              const td = th.nextElementSibling as HTMLElement;
              if (td && td.tagName === 'TD') {
                turmaText = td.textContent?.trim() || '';
              }
            }
          });

          if (disciplinaText) {
            // Parse "GERÊNCIA ... (CODE) - 60.00h"
            const match = disciplinaText.match(/^(.*)\s+\((.*)\)\s+-\s+(.*)$/);
            if (match) {
              const clockHoursStr = match[3].replace('h', '').trim();
              const clockHours = parseFloat(clockHoursStr);
              const classHours = !isNaN(clockHours) ? Math.round((clockHours * 60) / 45) : 0;

              metadata = {
                name: match[1].trim(),
                code: match[2].trim(),
                cargaHorariaRelogio: clockHours,
                cargaHorariaAulas: classHours,
                turma: turmaText
              };
            }
          }
        }

        const rows = Array.from(document.querySelectorAll('table.diario tbody tr'));
        const results: any[] = [];
        let skipNext = false;

        for (let i = 0; i < rows.length; i++) {
          if (skipNext) {
            skipNext = false;
            continue;
          }

          const row = rows[i];
          const cells = row.querySelectorAll('td');

          // Check if this is a row with antecipation/reposição (has rowspan)
          const hasRowspan =
            cells[0]?.hasAttribute('rowspan') &&
            cells[0]?.getAttribute('rowspan') === '2';

          if (hasRowspan) {
            // This is an original class with antecipation
            // First row: original class (in italic)
            const originalDate = cells[1]?.textContent?.trim() || '';
            const originalTimeRange =
              cells[2]?.querySelector('center')?.textContent?.trim() || '';
            const originalType =
              cells[3]?.querySelector('a.popup')?.textContent?.trim() || 'N';

            const originalContentCell = cells[5];
            const originalContentId =
              originalContentCell?.getAttribute('id')?.replace('conteudo_', '') ||
              '';
            const originalContent =
              originalContentCell?.textContent
                ?.replace(/\s+/g, ' ')
                .replace(/<[^>]*>/g, '')
                .trim() || '';

            const originalObsCell = cells[6];
            const originalObsId =
              originalObsCell?.getAttribute('id')?.replace('obs_', '') || '';
            const originalObs =
              originalObsCell?.textContent
                ?.replace(/\s+/g, ' ')
                .replace(/<[^>]*>/g, '')
                .trim() || '';

            // Add original class
            results.push({
              contentId: originalContentId,
              obsId: originalObsId,
              date: originalDate,
              timeRange: originalTimeRange,
              type: originalType,
              isNonPresential: false,
              content: originalContent,
              observations: originalObs,
              isAntecipation: false,
              originalContentId: null,
              originalDate: null,
            });

            // Second row: antecipation class
            const nextRow = rows[i + 1];
            if (nextRow) {
              const nextCells = nextRow.querySelectorAll('td');

              const anteDate = nextCells[0]?.textContent?.trim() || '';
              const anteTimeRange =
                nextCells[1]?.querySelector('center')?.textContent?.trim() || '';
              const anteType =
                nextCells[2]?.querySelector('a.popup')?.textContent?.trim() ||
                'A';

              const anteCheckbox = nextCells[3]?.querySelector(
                'input[type="checkbox"]',
              );
              const anteIsNonPresential =
                (anteCheckbox as HTMLInputElement)?.checked || false;

              const anteContentCell = nextCells[4];
              const anteContentId =
                anteContentCell?.getAttribute('id')?.replace('conteudo_', '') ||
                '';
              const anteContent =
                anteContentCell?.textContent
                  ?.replace(/\s+/g, ' ')
                  .replace(/<[^>]*>/g, '')
                  .trim() || '';

              const anteObsCell = nextCells[5];
              const anteObsId =
                anteObsCell?.getAttribute('id')?.replace('obs_', '') || '';
              const anteObs =
                anteObsCell?.textContent
                  ?.replace(/\s+/g, ' ')
                  .replace(/<[^>]*>/g, '')
                  .trim() || '';

              results.push({
                contentId: anteContentId,
                obsId: anteObsId,
                date: anteDate,
                timeRange: anteTimeRange,
                type: anteType,
                isNonPresential: anteIsNonPresential,
                content: anteContent,
                observations: anteObs,
                isAntecipation: true,
                originalContentId: originalContentId,
                originalDate: originalDate,
              });

              skipNext = true; // Skip the next row since we already processed it
            }
          } else {
            // Normal class (single row)
            const date = cells[1]?.textContent?.trim() || '';
            const timeRange =
              cells[2]?.querySelector('center')?.textContent?.trim() || '';
            const type =
              cells[3]?.querySelector('a.popup')?.textContent?.trim() || 'N';

            const checkbox = cells[4]?.querySelector('input[type="checkbox"]');
            const isNonPresential =
              (checkbox as HTMLInputElement)?.checked || false;

            const contentCell = cells[5];
            const contentId =
              contentCell?.getAttribute('id')?.replace('conteudo_', '') || '';
            const content =
              contentCell?.textContent
                ?.replace(/\s+/g, ' ')
                .replace(/<[^>]*>/g, '')
                .trim() || '';

            const obsCell = cells[6];
            const obsId = obsCell?.getAttribute('id')?.replace('obs_', '') || '';
            const observations =
              obsCell?.textContent
                ?.replace(/\s+/g, ' ')
                .replace(/<[^>]*>/g, '')
                .trim() || '';

            results.push({
              contentId,
              obsId,
              date,
              timeRange,
              type,
              isNonPresential,
              content,
              observations,
              isAntecipation: false,
              originalContentId: null,
              originalDate: null,
            });
          }
        }

        return { contents: results, metadata };
      });

      console.log(`✅ Extraídos ${result.contents.length} conteúdos do diário`);

      // Filter out items without dates
      const validContents = result.contents.filter((item: any) => {
        if (!item.date || item.date.trim() === '') {
          console.warn(`⚠️ Item sem data ignorado: contentId=${item.contentId}`);
          return false;
        }
        return true;
      });

      if (validContents.length < result.contents.length) {
        console.log(`⚠️ ${result.contents.length - validContents.length} item(s) ignorado(s) por falta de data`);
      }

      return {
        success: true,
        data: validContents,
        metadata: result.metadata
      };

    } catch (error) {
      console.error('❌ Erro ao extrair conteúdo do diário:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    }
  }

  /**
   * Login to IFMS system using Redis session cache (for reuse in bulk operations)
   *
   * DEPRECATED: This method now delegates to ensureLoggedIn() to benefit from Redis cache
   *
   * Benefits:
   * - Reuses existing sessions from Redis cache
   * - Avoids unnecessary login delays when session is valid
   * - Automatically handles session expiration
   */
  private async loginToIFMS(
    page: any,
    username: string,
    password: string,
  ): Promise<void> {
    console.log(`🔐 Autenticando no sistema IFMS (com cache Redis)...`);

    // Delegate to ensureLoggedIn which handles Redis cache
    await this.ensureLoggedIn(page, username, password);

    console.log(`✅ Autenticação concluída`);
  }

  /**
   * Send diary content using an already authenticated page
   */
  private async sendContentWithAuthenticatedPage(
    page: any,
    contentId: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    console.log(`📤 Enviando conteúdo ${contentId}...`);

    // Wait before sending content (avoid rate limiting)
    await this.humanDelay(page, this.BEFORE_CONTENT_SEND_DELAY_MIN, this.BEFORE_CONTENT_SEND_DELAY_MAX);

    // Send POST request to save content
    const saveUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.SAVE_CONTENT(contentId));

    // Encode content and prepare form data
    const formData = new URLSearchParams();
    formData.append('conteudo', content);

    // Execute POST request
    const response = await page.request.post(saveUrl, {
      data: formData.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok()) {
      throw new Error(`Erro HTTP: ${response.status()} - ${response.statusText()}`);
    }

    console.log(`✅ Conteúdo ${contentId} enviado com sucesso!`);

    return {
      success: true,
      message: 'Conteúdo salvo no sistema acadêmico com sucesso',
    };
  }

  /**
   * Send single diary content to IFMS system (creates new session)
   */
  async sendDiaryContentToSystem(
    username: string,
    password: string,
    contentId: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      console.log(`🚀 Enviando conteúdo único para o sistema acadêmico...`);
      console.log(`   ContentId: ${contentId}`);
      console.log(`   Content length: ${content.length} caracteres`);

      // Login to IFMS
      await this.loginToIFMS(page, username, password);

      // Send content using authenticated page
      return await this.sendContentWithAuthenticatedPage(page, contentId, content);
    } catch (error) {
      console.error('❌ Erro ao enviar conteúdo para o sistema:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error),
      };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Send multiple diary contents to IFMS system using single login session
   */
  async sendDiaryContentBulkToSystem(
    username: string,
    password: string,
    contents: Array<{ contentId: string; content: string }>,
    onProgress?: (current: number, total: number, contentId: string, success: boolean, message: string) => void,
  ): Promise<Array<{ contentId: string; success: boolean; message?: string }>> {
    const context = await this.createContext();
    const page = await context.newPage();
    const results = [];

    try {
      console.log(`🚀 Enviando ${contents.length} conteúdos em lote (sessão única)...`);

      // Login once
      await this.loginToIFMS(page, username, password);

      // Send each content using the same authenticated session
      let current = 0;
      for (const { contentId, content } of contents) {
        current++;
        try {
          const result = await this.sendContentWithAuthenticatedPage(page, contentId, content);
          results.push({
            contentId,
            success: result.success,
            message: result.message,
          });

          // Notify progress
          if (onProgress) {
            onProgress(current, contents.length, contentId, result.success, result.message || '');
          }
        } catch (error) {
          console.error(`❌ Erro ao enviar conteúdo ${contentId}:`, error);
          const errorMessage = this.formatErrorMessage(error);
          results.push({
            contentId,
            success: false,
            message: errorMessage,
          });

          // Notify progress with error
          if (onProgress) {
            onProgress(current, contents.length, contentId, false, errorMessage);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Erro no envio em lote:', error);
      // If login fails, mark all as failed
      return contents.map(({ contentId }) => ({
        contentId,
        success: false,
        message: this.formatErrorMessage(error),
      }));
    } finally {
      await page.close();
      await context.close();
    }
  }

  async onModuleDestroy() {
    // Browser closing is now managed by PlaywrightService
  }
}

