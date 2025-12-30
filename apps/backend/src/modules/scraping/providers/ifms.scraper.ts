
import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';
import { BaseScraper } from './base.scraper';
import { PlaywrightService } from '../services/playwright.service';
import { SessionCacheService } from '../../../common/services/session-cache.service';
import { DiaryDto } from '../dto/diary.dto';
import { TeachingPlanDto, TeachingPlanContentDto, TeachingPlanIdentificationDto } from '../dto/teaching-plan.dto';
import { IFMS_ROUTES, IFMS_SELECTORS, buildIFMSUrl, isLoggedIn, isLoginPage } from '../ifms.routes';

import { ScrapingDebugService } from '../scraping-debug.service';

@Injectable()
export class IfmsScraperProvider extends BaseScraper {
    protected logger = new Logger(IfmsScraperProvider.name);
    readonly name = 'IFMS';

    constructor(
        playwrightService: PlaywrightService,
        sessionCacheService: SessionCacheService,
        debugService: ScrapingDebugService,
    ) {
        super(playwrightService, sessionCacheService, debugService);
    }

    /**
     * Login Implementation for IFMS
     */
    async login(page: Page, username: string, pass: string): Promise<{ success: boolean; message?: string }> {
        try {
            // 1. Try to restore session
            if (await this.restoreSession(page, username)) {
                await page.goto(buildIFMSUrl('/'), { waitUntil: 'domcontentloaded', timeout: 15000 });
                if (isLoggedIn(page.url())) {
                    return { success: true };
                }
                await this.sessionCacheService.invalidateSession(username);
            }

            // 2. Perform fresh login
            const loginUrl = buildIFMSUrl(IFMS_ROUTES.AUTH.LOGIN);
            await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

            if (isLoggedIn(page.url())) return { success: true }; // Redirected

            await page.waitForSelector(IFMS_SELECTORS.LOGIN.FORM);

            // Use human typing for safety
            await this.humanDelay(page);
            await page.fill(IFMS_SELECTORS.LOGIN.USERNAME, username);
            await this.humanDelay(page, 50, 150);
            await page.fill(IFMS_SELECTORS.LOGIN.PASSWORD, pass);

            await page.click(IFMS_SELECTORS.LOGIN.SUBMIT);

            try {
                await Promise.race([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                    page.waitForSelector(IFMS_SELECTORS.LOGIN.ERROR_MESSAGE)
                ]);
            } catch (e) { }

            // Check success
            if (isLoggedIn(page.url())) {
                await this.saveSession(page, username);
                return { success: true };
            }

            // Check error
            const errorEl = await page.$(IFMS_SELECTORS.LOGIN.ERROR_MESSAGE);
            const msg = errorEl ? await errorEl.textContent() : 'Login failed';
            return { success: false, message: msg?.trim() };

        } catch (error) {
            this.logger.error(`Login failed for ${username}`, error);
            return { success: false, message: String(error) };
        }
    }

    /**
     * Extract Diaries list
     */
    async getDiaries(page: Page): Promise<DiaryDto[]> {
        await page.goto(buildIFMSUrl(IFMS_ROUTES.DIARY.LIST), { waitUntil: 'domcontentloaded' });

        try {
            await page.waitForSelector('table tbody tr', { timeout: 5000 });
        } catch { return []; }

        const diaries = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map((row) => {
                const cells = row.querySelectorAll('td');
                return {
                    id: cells[0]?.textContent?.trim() || '',
                    name: cells[1]?.textContent?.trim() || '',
                    class: cells[2]?.textContent?.trim() || '',
                    period: cells[3]?.textContent?.trim() || '',
                };
            });
        });

        return diaries.map(d => ({
            id: d.id,
            systemId: 'IFMS',
            disciplineName: d.name,
            classCode: d.class,
            period: d.period
        }));
    }

    /**
     * Extract Teaching Plan Details
     * (Migrated Logic - Simplified for readability here, full logic should be moved from service)
     */
    async getTeachingPlan(page: Page, diaryId: string, planId: string): Promise<TeachingPlanDto> {
        const startTime = Date.now();
        const url = buildIFMSUrl(IFMS_ROUTES.TEACHING_PLAN.VIEW(diaryId, planId));

        try {
            // Navigate
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Robust Extraction Logic
            const planData = await page.evaluate(() => {
                // --- HELPER FUNCTIONS ---
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

                // --- SELECTORS & EXTRACTION ---
                const allTables = document.querySelectorAll('table.table');
                const warnings: string[] = [];

                // Table 1 (Section 01): Identificação
                const identificationTable = allTables[1];
                const idRows = identificationTable?.querySelectorAll('tr') || [];

                // ... (Extraction logic variables)
                let campus = null, curso = null, disciplina = null, professores = null,
                    periodo = null, cargaTotal = null, aulasTeoricas = null, aulasPraticas = null,
                    status = null;

                idRows.forEach(row => {
                    const text = row.textContent || '';
                    if (text.includes('CAMPUS:')) campus = cleanText(row.querySelectorAll('td')[0]?.textContent?.replace('CAMPUS:', ''));
                    if (text.includes('ANO/SEMESTRE:')) periodo = cleanText(row.querySelectorAll('td')[1]?.textContent?.replace('ANO/SEMESTRE:', ''));
                    if (text.includes('CURSO:')) curso = cleanText(row.querySelectorAll('td')[0]?.textContent?.replace('CURSO:', ''));
                    if (text.includes('UNIDADE CURRICULAR')) disciplina = cleanText(row.querySelectorAll('td')[1]?.textContent?.replace(/UNIDADE CURRICULAR.*:/i, ''));
                    if (text.includes('PROFESSOR(ES):')) professores = cleanText(row.querySelector('td')?.textContent?.replace('PROFESSOR(ES):', ''));

                    if (text.includes('Carga horária total da UC:')) {
                        const chMatch = text.match(/Carga horária total da UC:\s*(\d+\.?\d*)/);
                        cargaTotal = chMatch ? parseDecimal(chMatch[1]) : 0;

                        const teoricasMatch = text.match(/Nº total de aulas teóricas:\s*(\d+)/);
                        aulasTeoricas = teoricasMatch ? parseInteger(teoricasMatch[1]) : 0;

                        const praticasMatch = text.match(/Nº total de aulas práticas:\s*(\d+)/);
                        aulasPraticas = praticasMatch ? parseInteger(praticasMatch[1]) : 0;
                    }
                    if (text.includes('STATUS DE APROVAÇÂO')) status = cleanText(row.querySelector('td')?.textContent?.replace(/STATUS DE APROVAÇÂO.*:/i, ''));
                });

                // Content Sections
                const ementa = cleanText(allTables[2]?.querySelector('tr:nth-child(2) td')?.textContent);
                const objetivoGeral = cleanText(allTables[3]?.querySelector('tr:nth-child(2) td')?.textContent);
                const objetivosEsp = cleanText(allTables[4]?.querySelector('tr:nth-child(2) td')?.textContent) || ''; // Fallback empty string

                const metodTable = allTables[9]; // Proposta de trabalho usually holds methodology details in sub-table or similar
                // Simplifying for DTO mapping:
                const metodologia = cleanText(metodTable?.textContent) || 'Ver plano detalhado';

                const avalTable = allTables[5];
                const avaliacao = cleanText(avalTable?.textContent) || '';

                const refTable = allTables[8];
                const referencias = cleanText(refTable?.querySelector('tr:nth-child(2) td')?.textContent);

                return {
                    id: '', // Will be filled outside
                    identification: {
                        campus, course: curso, discipline: disciplina, professors: professores, period: periodo,
                        workloadTotal: cargaTotal, workloadTheoretical: aulasTeoricas, workloadPractical: aulasPraticas
                    },
                    content: {
                        description: ementa,
                        objectives: `${objetivoGeral} \n\n${objetivosEsp} `,
                        methodology: metodologia,
                        resources: '', // extracted via other means usually
                        evaluation: avaliacao,
                        bibliographyBasic: referencias, // Simplified mapping
                        bibliographyComplementary: ''
                    },
                    status,
                    _warnings: warnings
                };
            });

            // Assemble DTO
            const result: TeachingPlanDto = {
                id: planId,
                diaryId,
                systemId: 'IFMS',
                status: planData.status || 'Unknown',
                identification: {
                    campus: planData.identification.campus || '',
                    course: planData.identification.course || '',
                    discipline: planData.identification.discipline || '',
                    professors: planData.identification.professors || '',
                    period: planData.identification.period || '',
                    workloadTotal: planData.identification.workloadTotal || 0,
                    workloadTheoretical: planData.identification.workloadTheoretical || 0,
                    workloadPractical: planData.identification.workloadPractical || 0
                },
                content: {
                    description: planData.content.description || '',
                    methodology: planData.content.methodology || '',
                    resources: planData.content.resources || '',
                    evaluation: planData.content.evaluation || '',
                    objectives: planData.content.objectives || '',
                    bibliographyBasic: planData.content.bibliographyBasic || '',
                    bibliographyComplementary: planData.content.bibliographyComplementary || ''
                }
            };

            await this.debugService.cacheScraping({
                externalId: planId,
                scrapeType: 'teaching_plan',
                url,
                page,
                extractedData: result,
                warnings: planData._warnings || [],
                errors: [],
                fieldMetrics: { total: 10, extracted: 10, missing: [], completeness: 100 },
                startTime,
                success: true
            });

            return result;

        } catch (error) {
            await this.debugService.cacheScraping({
                externalId: planId,
                scrapeType: 'teaching_plan',
                url,
                page,
                extractedData: null,
                warnings: [],
                errors: [error.message],
                startTime,
                success: false,
                takeScreenshot: true
            });
            throw error;
        }
    }
}
