import { Page } from 'playwright';
import { DiaryDto } from '../dto/diary.dto';
import { TeachingPlanDto } from '../dto/teaching-plan.dto';

export interface IScrapingProvider {
    /**
     * Provider Name (e.g., 'IFMS', 'SUAP')
     */
    readonly name: string;

    /**
     * Perform login with provided credentials.
     * Should handle session reuse/caching internally if applicable.
     */
    login(page: Page, username: string, pass: string): Promise<{ success: boolean; message?: string }>;

    /**
     * Retrieve list of diaries/disciplines available for the user.
     */
    getDiaries(page: Page): Promise<DiaryDto[]>;

    /**
     * Retrieve detailed teaching plan.
     */
    getTeachingPlan(page: Page, diaryId: string, planId: string): Promise<TeachingPlanDto>;
}
