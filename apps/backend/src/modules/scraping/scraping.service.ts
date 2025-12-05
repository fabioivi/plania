import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ScrapingService {
  private browser: Browser | null = null;

  constructor(
    private configService: ConfigService,
    private debugService: ScrapingDebugService,
  ) {}

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      const headless =
        this.configService.get<string>('PLAYWRIGHT_HEADLESS') === 'true';

      this.browser = await chromium.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browser;
  }

  async createContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    return browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
  }

  async testIFMSLogin(username: string, password: string): Promise<boolean> {
    const context = await this.createContext();
    const page = await context.newPage();

    try {
      // Navigate to login page
      const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);
      console.log(`Navigating to: ${loginUrl}`);
      
      await page.goto(loginUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });

      // Wait for form to be visible
      await page.waitForSelector(IFMS_SELECTORS.LOGIN.FORM, { 
        state: 'visible', 
        timeout: 10000 
      });

      // Fill login form with correct field names
      console.log(`Filling username: ${username}`);
      await page.fill(IFMS_SELECTORS.LOGIN.USERNAME, username, { timeout: 5000 });
      
      console.log('Filling password');
      await page.fill(IFMS_SELECTORS.LOGIN.PASSWORD, password, { timeout: 5000 });

      // Take screenshot before submit (for debugging)
      // await page.screenshot({ path: 'before-login.png' });

      // Submit form and wait for response
      console.log('Submitting form');
      await page.click(IFMS_SELECTORS.LOGIN.SUBMIT);
      
      // Wait for navigation or error message
      await page.waitForTimeout(3000);

      // Check current URL
      const currentUrl = page.url();
      console.log(`Current URL after login: ${currentUrl}`);

      // First, check for error message (higher priority)
      const errorElement = await page.$(IFMS_SELECTORS.LOGIN.ERROR_MESSAGE);
      if (errorElement) {
        const errorText = await errorElement.textContent();
        console.log(`Error message found: ${errorText}`);
        
        // Check if it's the specific invalid credentials message
        if (errorText && errorText.includes('Login e/ou senha inválido')) {
          throw new Error('Login e/ou senha inválido(s). Verifique suas credenciais.');
        }
        
        throw new Error('Erro ao fazer login. Verifique suas credenciais.');
      }

      // Check if still on login page (form still visible)
      const formStillVisible = await page.$(IFMS_SELECTORS.LOGIN.FORM);
      if (formStillVisible && isLoginPage(currentUrl)) {
        throw new Error('Credenciais inválidas. Verifique seu usuário e senha.');
      }

      // Check if login was successful by URL
      const loginSuccess = isLoggedIn(currentUrl);
      if (!loginSuccess) {
        throw new Error('Não foi possível verificar o login. Tente novamente.');
      }

      console.log('Login successful!');
      return true;

    } catch (error) {
      console.error('IFMS login test failed:', error);
      
      // Customizar mensagens de erro
      if (error.message.includes('Timeout') || error.message.includes('timeout')) {
        throw new Error('Tempo esgotado ao tentar acessar o sistema acadêmico. Verifique sua conexão ou tente novamente mais tarde.');
      }
      
      if (error.message.includes('navigation')) {
        throw new Error('Erro de navegação. O sistema acadêmico pode estar indisponível no momento.');
      }

      if (error.message.includes('Credenciais inválidas')) {
        throw error;
      }

      if (error.message.includes('Não foi possível verificar')) {
        throw error;
      }
      
      throw new Error(`Erro ao conectar com o sistema acadêmico: ${error.message}`);
      
    } finally {
      await context.close();
    }
  }

  /**
   * Helper method to perform login
   */
  private async performLogin(
    page: Page,
    username: string,
    password: string,
  ): Promise<void> {
    const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);
    
    await page.goto(loginUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });

    await page.waitForSelector(IFMS_SELECTORS.LOGIN.FORM, { 
      state: 'visible', 
      timeout: 10000 
    });

    await page.fill(IFMS_SELECTORS.LOGIN.USERNAME, username, { timeout: 5000 });
    await page.fill(IFMS_SELECTORS.LOGIN.PASSWORD, password, { timeout: 5000 });

    await page.click(IFMS_SELECTORS.LOGIN.SUBMIT);
    await page.waitForTimeout(3000);

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
      throw new Error('Falha no login. Credenciais inválidas.');
    }
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
      await this.performLogin(page, username, password);

      const diariesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.LIST);
      await page.goto(diariesUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForTimeout(2000);

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
      console.error('Get diaries failed:', error);
      return {
        success: false,
        message: error.message,
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
      await this.performLogin(page, username, password);

      const contentUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.CONTENT(diaryId));
      await page.goto(contentUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForTimeout(2000);

      // Extract content - structure to be adjusted
      const content = await page.evaluate(() => {
        return {
          title: document.querySelector('h1, h2')?.textContent?.trim(),
          description: document.querySelector('.description, .content')?.textContent?.trim(),
        };
      });

      return {
        success: true,
        data: content,
      };
    } catch (error) {
      console.error('Get diary content failed:', error);
      return {
        success: false,
        message: error.message,
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
      await this.performLogin(page, username, password);

      const avaliacoesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.AVALIACOES(diaryId));
      await page.goto(avaliacoesUrl, { waitUntil: 'domcontentloaded' });

      await page.waitForTimeout(2000);

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
      console.error('Get diary avaliacoes failed:', error);
      return {
        success: false,
        message: error.message,
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
      console.log(`Navigating to teaching plans: ${teachingPlansUrl}`);
      
      await page.goto(teachingPlansUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      await page.waitForTimeout(2000);

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

      console.log(`Found ${plans.length} teaching plans for diary ${diaryId}`);

      return {
        success: true,
        data: plans,
      };
    } catch (error) {
      console.error(`Get teaching plans for diary ${diaryId} failed:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get detailed information from a teaching plan with robust extraction
   */
  async getTeachingPlanDetails(
    page: Page,
    diaryId: string,
    planId: string,
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    const startTime = Date.now();
    const url = buildIFMSUrl(IFMS_ROUTES.TEACHING_PLAN.VIEW(diaryId, planId));
    
    try {
      console.log(`Navigating to teaching plan details: ${url}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      await page.waitForTimeout(2000);

      // Extract all data from the teaching plan with robust selectors
      const planData = await page.evaluate(() => {
        // ============================================
        // UTILITY FUNCTIONS
        // ============================================
        const cleanText = (text: string | null | undefined): string | null => {
          if (!text) return null;
          const cleaned = text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
          return cleaned.length > 0 ? cleaned : null;
        };

        const parseDecimal = (str: string): number | null => {
          if (!str) return null;
          const normalized = str.replace(',', '.').replace(/[^\d.]/g, '');
          const parsed = parseFloat(normalized);
          return isNaN(parsed) ? null : parsed;
        };

        const parseInteger = (str: string): number | null => {
          if (!str) return null;
          const parsed = parseInt(str.replace(/\D/g, ''));
          return isNaN(parsed) ? null : parsed;
        };

        const parseMetodologia = (innerHTML: string) => {
          const parts = innerHTML.split(/<br\s*\/?>\s*<br\s*\/?>/i);
          let tecnicas: string[] = [];
          let recursos: string[] = [];
          
          for (const part of parts) {
            const cleanPart = part.replace(/<[^>]+>/g, '').trim();
            
            if (cleanPart.includes('Técnicas de Ensino:')) {
              const text = cleanPart.replace('Técnicas de Ensino:', '').trim();
              tecnicas = text.split(',').map(t => t.trim()).filter(t => t.length > 0);
            }
            
            if (cleanPart.includes('Recursos de Ensino:')) {
              const text = cleanPart.replace('Recursos de Ensino:', '').trim();
              recursos = text.split(',').map(r => r.trim()).filter(r => r.length > 0);
            }
          }
          
          const raw = innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          return { tecnicasEnsino: tecnicas, recursosEnsino: recursos, raw };
        };

        const warnings: string[] = [];

        // ============================================
        // GET ALL TABLES
        // ============================================
        const allTables = document.querySelectorAll('table.table');
        console.log(`Found ${allTables.length} tables with class 'table'`);

        if (allTables.length < 8) {
          warnings.push(`Expected at least 9 tables, found ${allTables.length}`);
        }

        // ============================================
        // TABLE 0: DIARY HEADER (classe, professor, aulas criadas)
        // ============================================
        let classeCompleta: string | null = null;
        let unidadeCurricularCodigo: string | null = null;
        let aulasNormaisCriadas: number | null = null;
        let duracaoAula: string | null = null;

        const diaryHeaderTable = allTables[0];
        if (diaryHeaderTable) {
          const headerRows = diaryHeaderTable.querySelectorAll('tr');
          headerRows.forEach(row => {
            const text = row.textContent || '';
            
            if (text.includes('Classe:')) {
              const cells = row.querySelectorAll('td');
              classeCompleta = cleanText(cells[0]?.textContent);
            }
            
            if (text.includes('Unidade Curricular (Código)')) {
              const cells = row.querySelectorAll('td');
              const ucText = cleanText(cells[1]?.textContent);
              if (ucText) {
                const codeMatch = ucText.match(/\(([^)]+)\)/);
                unidadeCurricularCodigo = codeMatch ? codeMatch[1] : null;
              }
            }
            
            if (text.includes('Aulas Normais Criadas')) {
              const cells = row.querySelectorAll('td');
              const aulasText = cleanText(cells[2]?.textContent);
              if (aulasText) {
                const aulasMatch = aulasText.match(/(\d+)\s*\((\d+min)\)/);
                if (aulasMatch) {
                  aulasNormaisCriadas = parseInteger(aulasMatch[1]);
                  duracaoAula = aulasMatch[2];
                }
              }
            }
          });
        }

        // ============================================
        // TABLE 1 (Section 01): IDENTIFICAÇÃO
        // ============================================
        const identificationTable = allTables[1];
        const idRows = identificationTable?.querySelectorAll('tr') || [];
        
        let campus: string | null = null;
        let anoSemestre: string | null = null;
        let curso: string | null = null;
        let unidadeCurricular: string | null = null;
        let professores: string | null = null;
        let cargaHorariaTotal: number | null = null;
        let numSemanas: number | null = null;
        let numAulasTeorica: number | null = null;
        let numAulasPraticas: number | null = null;
        let status: string | null = null;
        let statusCoord: string | null = null;

        idRows.forEach(row => {
          const text = row.textContent || '';
          
          if (text.includes('CAMPUS:')) {
            const cells = row.querySelectorAll('td');
            const campusText = cells[0]?.textContent?.replace('CAMPUS:', '').trim();
            campus = cleanText(campusText);
            const anoText = cells[1]?.textContent?.replace('ANO/SEMESTRE:', '').trim();
            anoSemestre = cleanText(anoText);
          }
          
          if (text.includes('CURSO:')) {
            const cells = row.querySelectorAll('td');
            const cursoText = cells[0]?.textContent?.replace('CURSO:', '').trim();
            curso = cleanText(cursoText);
            const ucText = cells[1]?.textContent?.replace(/UNIDADE CURRICULAR.*:/i, '').trim();
            unidadeCurricular = cleanText(ucText);
          }
          
          if (text.includes('PROFESSOR(ES):')) {
            const cell = row.querySelector('td');
            const profText = cell?.textContent?.replace('PROFESSOR(ES):', '').trim();
            professores = cleanText(profText);
          }
          
          if (text.includes('Carga horária total da UC:')) {
            const cells = row.querySelectorAll('td');
            const chText = cells[0]?.textContent || '';
            const chMatch = chText.match(/Carga horária total da UC:\s*(\d+\.?\d*)/);
            cargaHorariaTotal = chMatch ? parseDecimal(chMatch[1]) : null;
            
            const semanasMatch = chText.match(/Nº de semanas:\s*(\d+)/);
            numSemanas = semanasMatch ? parseInteger(semanasMatch[1]) : null;
            
            const cell2Text = cells[1]?.textContent || '';
            const teoricasMatch = cell2Text.match(/Nº total de aulas teóricas:\s*(\d+)/);
            numAulasTeorica = teoricasMatch ? parseInteger(teoricasMatch[1]) : null;
            
            const praticasMatch = cell2Text.match(/Nº total de aulas práticas:\s*(\d+)/);
            numAulasPraticas = praticasMatch ? parseInteger(praticasMatch[1]) : null;
          }
          
          if (text.includes('STATUS DE APROVAÇÂO')) {
            const cell = row.querySelector('td');
            const statusText = cell?.textContent?.replace(/STATUS DE APROVAÇÂO.*:/i, '').trim();
            status = cleanText(statusText);
          }
          
          if (text.includes('STATUS DO/PARA COORD')) {
            const cell = row.querySelector('td');
            const coordText = cell?.textContent?.replace(/STATUS DO\/PARA COORD.*/i, '').trim();
            statusCoord = cleanText(coordText);
          }
        });

        // ============================================
        // TABLE 2 (Section 02): EMENTA
        // ============================================
        const ementaTable = allTables[2];
        const ementaCell = ementaTable?.querySelector('tr:nth-child(2) td');
        const ementa = cleanText(ementaCell?.textContent);

        // ============================================
        // TABLE 3 (Section 03): OBJETIVO GERAL
        // ============================================
        const objetivoTable = allTables[3];
        const objetivoCell = objetivoTable?.querySelector('tr:nth-child(2) td');
        const objetivoGeral = cleanText(objetivoCell?.textContent);

        // ============================================
        // TABLE 4 (Section 04): OBJETIVOS ESPECÍFICOS
        // ============================================
        const objEspTable = allTables[4];
        const objEspCell = objEspTable?.querySelector('tr:nth-child(2) td');
        const objetivosEspecificos = cleanText(objEspCell?.textContent);

        // ============================================
        // TABLE 5 (Section 05): AVALIAÇÃO DA APRENDIZAGEM
        // ============================================
        const avalTable = allTables[5];
        const avalTableInner = avalTable?.querySelector('table.diario');
        const avalRows = avalTableInner?.querySelectorAll('tbody tr') || [];
        
        const avaliacaoAprendizagem = Array.from(avalRows).map(row => {
          const cells = row.querySelectorAll('td');
          return {
            etapa: cleanText(cells[0]?.textContent) || '',
            avaliacao: cleanText(cells[1]?.textContent) || '',
            instrumentos: cleanText(cells[2]?.textContent) || '',
            dataPrevista: cleanText(cells[3]?.textContent) || '',
            valorMaximo: cleanText(cells[4]?.textContent) || '',
          };
        });
        
        // Try to find observações in multiple ways
        let observacoesAvaliacoes: string | null = null;
        const obsElements = avalTable?.querySelectorAll('p');
        if (obsElements && obsElements.length > 1) {
          const obsText = obsElements[1]?.textContent || '';
          observacoesAvaliacoes = cleanText(obsText);
        }

        // ============================================
        // TABLE 6 (Section 06): RECUPERAÇÃO DA APRENDIZAGEM
        // ============================================
        const recupTable = allTables[6];
        const recupCell = recupTable?.querySelector('tr:nth-child(2) td');
        const recuperacaoAprendizagem = cleanText(recupCell?.textContent);

        // ============================================
        // TABLE 8 (Section 07): REFERÊNCIAS
        // ============================================
        const refTable = allTables[8];
        const refCell = refTable?.querySelector('tr:nth-child(2) td div.controls');
        const refHtml = refCell?.innerHTML || '';
        
        // Parse references into structured data
        let bibliografiaBasica: string[] = [];
        let bibliografiaComplementar: string[] = [];
        
        if (refHtml) {
          // Split by <br> tags which separate references
          const parts = refHtml.split(/<br\s*\/?>/);
          let isBasica = false;
          let isComplementar = false;
          
          for (const part of parts) {
            const text = part.replace(/<[^>]+>/g, '').trim();
            
            if (/Bibliografia\s+Básica/i.test(text)) {
              isBasica = true;
              isComplementar = false;
              continue;
            }
            
            if (/Bibliografia\s+Complementar/i.test(text)) {
              isBasica = false;
              isComplementar = true;
              continue;
            }
            
            // Valid references start with uppercase letter and have minimum length
            if (text.length > 10 && /^[A-ZÀ-Ú]/.test(text)) {
              if (isBasica) bibliografiaBasica.push(text);
              if (isComplementar) bibliografiaComplementar.push(text);
            }
          }
        }
        
        const referencias = cleanText(refCell?.textContent);

        // ============================================
        // TABLE 9 (Section 08): PROPOSTA DE TRABALHO
        // ============================================
        const propTable = allTables[9];
        let propTableInner = propTable?.querySelector('table#proposta_trabalho');
        
        // Fallback: try finding by other selectors
        if (!propTableInner) {
          propTableInner = propTable?.querySelector('table.data-table');
        }
        
        if (!propTableInner) {
          warnings.push('Proposta de trabalho: tabela interna não encontrada (table#proposta_trabalho)');
        }
        
        const propRows = propTableInner?.querySelectorAll('tbody tr') || [];
        
        if (propRows.length === 0 && propTable) {
          warnings.push(`Proposta de trabalho: 0 linhas encontradas na tabela`);
        }
        
        const propostaTrabalho = Array.from(propRows).map((row, index) => {
          const cells = row.querySelectorAll('td');
          
          if (cells.length < 6) {
            warnings.push(`Proposta row ${index} has only ${cells.length} cells (expected 6)`);
            return null;
          }
          
          const mes = cleanText(cells[0]?.textContent);
          const periodo = cleanText(cells[1]?.textContent);
          const numAulas = cleanText(cells[2]?.textContent);
          const observacoes = cleanText(cells[3]?.textContent);
          const conteudo = cleanText(cells[4]?.textContent);
          
          // Parse metodologia (complex field)
          const metodologiaCell = cells[5];
          const metodologiaData = parseMetodologia(metodologiaCell?.innerHTML || '');
          
          return {
            mes: mes || '',
            periodo: periodo || '',
            numAulas: numAulas || '',
            observacoes: observacoes,
            conteudo: conteudo,
            metodologia: metodologiaData.raw,
            tecnicasEnsino: metodologiaData.tecnicasEnsino,
            recursosEnsino: metodologiaData.recursosEnsino,
          };
        }).filter(item => item !== null);

        // ============================================
        // SECTION 09: HISTÓRICO
        // ============================================
        const historicoTable = document.querySelector('#accordion_historico table.diario');
        const historicoRows = historicoTable?.querySelectorAll('tbody tr') || [];
        
        const historico = Array.from(historicoRows).map(row => {
          const cells = row.querySelectorAll('td');
          return {
            eventId: cleanText(cells[0]?.textContent) || '',
            situacao: cleanText(cells[1]?.textContent) || '',
            observacoes: cleanText(cells[2]?.textContent) || '',
            usuario: cleanText(cells[3]?.textContent) || '',
            dataEvento: cleanText(cells[4]?.textContent) || '',
          };
        });

        return {
          // Diary header
          classeCompleta,
          unidadeCurricularCodigo,
          aulasNormaisCriadas,
          duracaoAula,
          // Identification
          campus,
          anoSemestre,
          curso,
          unidadeCurricular,
          professores,
          cargaHorariaTotal,
          numSemanas,
          numAulasTeorica,
          numAulasPraticas,
          status,
          statusCoord,
          // Content sections
          ementa,
          objetivoGeral,
          objetivosEspecificos,
          avaliacaoAprendizagem,
          observacoesAvaliacoes,
          recuperacaoAprendizagem,
          referencias,
          bibliografiaBasica,
          bibliografiaComplementar,
          propostaTrabalho,
          historico,
          // Metadata
          _warnings: warnings,
          _extractedAt: new Date().toISOString(),
        };
      });

      console.log(`✅ Successfully extracted teaching plan #${planId}`);
      if (planData._warnings && planData._warnings.length > 0) {
        console.warn(`⚠️ Extraction warnings:`, planData._warnings);
      }

      // Cache scraping for debug analysis
      const extractedFields = Object.keys(planData).filter(k => !k.startsWith('_'));
      const totalFields = 27; // Expected total fields
      const missingFields = extractedFields.filter(f => planData[f] === null || planData[f] === undefined || planData[f] === '');
      
      // Cache scraping result (screenshot disabled by default for performance)
      // To enable screenshot, add: takeScreenshot: true
      await this.debugService.cacheScraping({
        externalId: planId,
        scrapeType: 'teaching_plan',
        url,
        page,
        extractedData: planData,
        warnings: planData._warnings || [],
        errors: [],
        fieldMetrics: {
          total: totalFields,
          extracted: extractedFields.length,
          missing: missingFields,
          completeness: (extractedFields.length / totalFields) * 100,
        },
        startTime,
        success: true,
        // takeScreenshot: true, // Uncomment to enable screenshot capture
      });

      return {
        success: true,
        data: planData,
      };
    } catch (error) {
      console.error(`❌ Get teaching plan details failed for plan ${planId}:`, error);
      
      // Cache failed scraping attempt for analysis (with screenshot for debugging)
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
        takeScreenshot: true, // Enable screenshot on errors for debugging
      });
      
      return {
        success: false,
        message: error.message,
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
      await this.performLogin(page, username, password);

      const diariesUrl = buildIFMSUrl(IFMS_ROUTES.DIARY.LIST);
      console.log(`Navigating to diaries: ${diariesUrl}`);
      
      await page.goto(diariesUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait for table to load
      await page.waitForTimeout(2000);

      // Extract diaries data from table
      const diaries = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table.table tbody tr'));
        
        return rows.map((row) => {
          const cells = row.querySelectorAll('td');
          
          // Extract diary ID from link
          const linkElement = cells[0]?.querySelector('a');
          const href = linkElement?.getAttribute('href') || '';
          const idMatch = href.match(/\/diario\/(\d+)/);
          const externalId = idMatch ? idMatch[1] : '';
          
          // Get text content from cells
          const disciplina = cells[0]?.textContent?.trim() || '';
          const curso = cells[1]?.textContent?.trim() || '';
          const turma = cells[2]?.textContent?.trim() || '';
          const periodo = cells[3]?.textContent?.trim() || '';
          
          // Extract numbers from status column (Aprovados/Reprovados/Em curso)
          const statusText = cells[4]?.textContent?.trim() || '';
          const statusMatch = statusText.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
          
          const aprovados = statusMatch ? parseInt(statusMatch[1]) : 0;
          const reprovados = statusMatch ? parseInt(statusMatch[2]) : 0;
          const emCurso = statusMatch ? parseInt(statusMatch[3]) : 0;
          
          // Check if diary is approved (has "Aprovado" badge/text)
          const isApproved = row.querySelector('.badge-success, .label-success') !== null ||
                            statusText.toLowerCase().includes('aprovado');
          
          return {
            externalId,
            disciplina,
            curso,
            turma,
            periodo,
            aprovados,
            reprovados,
            emCurso,
            aprovado: isApproved,
          };
        }).filter(d => d.externalId); // Filter out rows without ID
      });

      console.log(`Found ${diaries.length} diaries`);

      return {
        success: true,
        data: diaries,
      };
    } catch (error) {
      console.error('Get all diaries failed:', error);
      return {
        success: false,
        message: error.message,
      };
    } finally {
      await context.close();
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
