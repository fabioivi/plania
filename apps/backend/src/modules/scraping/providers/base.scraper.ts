import { BrowserContext, Page } from 'playwright';
import { IScrapingProvider } from '../interfaces/scraping-provider.interface';
import { PlaywrightService } from '../services/playwright.service';
import { SessionCacheService } from '../../../common/services/session-cache.service';
import { Logger } from '@nestjs/common';
import { DiaryDto } from '../dto/diary.dto';
import { TeachingPlanDto } from '../dto/teaching-plan.dto';
import { ScrapingDebugService } from '../scraping-debug.service';

export abstract class BaseScraper implements IScrapingProvider {
    protected abstract logger: Logger;
    abstract name: string;

    constructor(
        protected playwrightService: PlaywrightService,
        protected sessionCacheService: SessionCacheService,
        protected debugService: ScrapingDebugService,
    ) { }

    /**
     * Helper to create context using the main service config
     */
    protected async createContext(): Promise<BrowserContext> {
        return this.playwrightService.createContext();
    }

    /**
     * Abstract methods enforced by interface
     */
    abstract login(page: Page, username: string, pass: string): Promise<{ success: boolean; message?: string }>;
    abstract getDiaries(page: Page): Promise<DiaryDto[]>;
    abstract getTeachingPlan(page: Page, diaryId: string, planId: string): Promise<TeachingPlanDto>;

    /**
     * Shared Utility: Human-like delay
     */
    protected async humanDelay(page: Page, min = 100, max = 400): Promise<void> {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        await page.waitForTimeout(delay);
    }

    /**
     * Shared Utility: Restore session from Redis
     */
    protected async restoreSession(page: Page, username: string): Promise<boolean> {
        const cachedCookies = await this.sessionCacheService.getSession(username);
        if (cachedCookies) {
            await page.context().addCookies(cachedCookies);
            this.logger.debug(`♻️ Cookies restored for ${username}`);
            return true;
        }
        return false;
    }

    /**
     * Shared Utility: Save session to Redis
     */
    protected async saveSession(page: Page, username: string, ttlSeconds = 3600): Promise<void> {
        const cookies = await page.context().cookies();
        await this.sessionCacheService.setSession(username, cookies, ttlSeconds);
        this.logger.debug(`💾 Session saved for ${username}`);
    }
}
