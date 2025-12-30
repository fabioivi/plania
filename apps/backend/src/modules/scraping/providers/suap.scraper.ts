import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'playwright';
import { BaseScraper } from './base.scraper';
import { PlaywrightService } from '../services/playwright.service';
import { SessionCacheService } from '../../../common/services/session-cache.service';
import { ScrapingDebugService } from '../scraping-debug.service';
import { DiaryDto } from '../dto/diary.dto';
import { TeachingPlanDto } from '../dto/teaching-plan.dto';
import { SUAP_ROUTES, SUAP_SELECTORS, buildSuapUrl, isSuapLoggedIn, isSuapLoginPage } from '../suap.selectors.config';

@Injectable()
export class SuapScraperProvider extends BaseScraper {
    protected logger = new Logger(SuapScraperProvider.name);
    readonly name = 'SUAP';

    constructor(
        playwrightService: PlaywrightService,
        sessionCacheService: SessionCacheService,
        debugService: ScrapingDebugService,
    ) {
        super(playwrightService, sessionCacheService, debugService);
    }

    async login(page: Page, username: string, pass: string): Promise<{ success: boolean; message?: string }> {
        try {
            // 0. Try to restore session first to avoid CAPTCHA/blocking on re-tests
            const cachedCookies = await this.sessionCacheService.getSession(username);
            if (cachedCookies) {
                this.logger.log(`Attempting to restore session for ${username}`);
                await page.context().addCookies(cachedCookies);

                // Go to dashboard instead of login
                const dashboardUrl = buildSuapUrl(SUAP_ROUTES.AUTH.DASHBOARD);
                await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

                // Check if restoration worked
                try {
                    const logoutLink = await page.waitForSelector(SUAP_SELECTORS.DASHBOARD.LOGOUT_LINK, { timeout: 3000 }).catch(() => null);
                    if (logoutLink) {
                        this.logger.log('Session restored successfully from cache!');
                        return { success: true };
                    }
                } catch (e) {
                    this.logger.warn('Session restoration verification failed, proceeding to fresh login');
                    await page.context().clearCookies(); // Clear potentially partial/stale state
                }
            } else {
                // Ensure clean slate if no session found (optional but safe)
                await page.context().clearCookies();
            }

            const loginUrl = buildSuapUrl(SUAP_ROUTES.AUTH.LOGIN);
            this.logger.log(`Navigating to SUAP login: ${loginUrl}`);

            await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Check if already logged in (redirect) or via session restore check
            if (isSuapLoggedIn(page.url())) {
                this.logger.log('Already logged in (redirected)');
                return { success: true };
            }

            await page.waitForSelector(SUAP_SELECTORS.LOGIN.FORM, { timeout: 10000 });

            this.logger.log(`Filling credentials for user: ${username}`);
            // await this.humanDelay(page); // Reduced delay for testing
            await page.fill(SUAP_SELECTORS.LOGIN.USERNAME, username);
            // await this.humanDelay(page, 50, 150);
            await page.fill(SUAP_SELECTORS.LOGIN.PASSWORD, pass);


            this.logger.log('Submitting login form...');

            await page.click(SUAP_SELECTORS.LOGIN.SUBMIT);

            // Wait for either navigation (success) or error message (failure)
            try {
                await Promise.race([
                    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
                    page.waitForSelector(SUAP_SELECTORS.LOGIN.ERROR_MESSAGE, { timeout: 15000 })
                ]);
            } catch (e) {
                this.logger.warn('Login race timed out or failed (page might have just reloaded)');
            }

            // 1. Check for success via Logout Link (strongest proof)
            try {
                const logoutLink = await page.waitForSelector(SUAP_SELECTORS.DASHBOARD.LOGOUT_LINK, { timeout: 5000 }).catch(() => null);
                if (logoutLink) {
                    this.logger.log('Login successful! (Logout link found)');
                    await this.saveSession(page, username);
                    return { success: true };
                }
            } catch (e) { }

            // 2. Check for URL change
            const currentUrl = page.url();
            if (isSuapLoggedIn(currentUrl)) {
                this.logger.log('Login successful! (URL check)');
                await this.saveSession(page, username);
                return { success: true };
            }

            // 3. Extract error message if present
            const errorElement = await page.$(SUAP_SELECTORS.LOGIN.ERROR_MESSAGE);
            if (errorElement) {
                const errorText = await errorElement.textContent();
                this.logger.warn(`Login failed with error: ${errorText}`);
                if (errorText && errorText.includes('corretamente')) {
                    return { success: false, message: 'Usuário ou senha inválidos.' };
                }
                return { success: false, message: errorText?.trim() || 'Erro ao realizar login' };
            } else {
                // Fallback check: if we are still on login page and no error message found
                if (isSuapLoginPage(currentUrl)) {
                    // Try one last check for dashboard elements in case URL is stale/weird
                    const logoutLink = await page.$(SUAP_SELECTORS.DASHBOARD.LOGOUT_LINK);
                    if (logoutLink) {
                        this.logger.log('Login successful! (Logout link found despite URL)');
                        await this.saveSession(page, username);
                        return { success: true };
                    }

                    return { success: false, message: 'Login falhou. Verifique suas credenciais.' };
                }
                // If we are somewhere else but not satisfying "isSuapLoggedIn" (unlikely with current loose check), strictly check
                return { success: true }; // Assume success if redirected away from login
            }

        } catch (error) {
            this.logger.error('SUAP Login failed', error);
            return { success: false, message: error instanceof Error ? error.message : String(error) };
        }
    }

    async getDiaries(page: Page): Promise<DiaryDto[]> {
        this.logger.warn('getDiaries not fully implemented for SUAP yet');
        // TODO: Implement scrapping logic for SUAP diaries
        return [];
    }

    async getTeachingPlan(page: Page, diaryId: string, planId: string): Promise<TeachingPlanDto> {
        this.logger.warn('getTeachingPlan not fully implemented for SUAP yet');
        // TODO: Implement scrapping logic for SUAP teaching plans
        return {
            id: planId,
            diaryId,
            systemId: 'SUAP',
            status: 'Pending Implementation',
            identification: {
                campus: '',
                course: '',
                discipline: '',
                professors: '',
                period: '',
                workloadTotal: 0,
                workloadTheoretical: 0,
                workloadPractical: 0
            },
            content: {
                description: '',
                methodology: '',
                resources: '',
                evaluation: '',
                objectives: '',
                bibliographyBasic: '',
                bibliographyComplementary: ''
            }
        };
    }
}
