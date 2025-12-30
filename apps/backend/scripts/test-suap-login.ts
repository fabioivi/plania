import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SuapScraperProvider } from '../src/modules/scraping/providers/suap.scraper';

import { PlaywrightService } from '../src/modules/scraping/services/playwright.service';
import { SessionCacheService } from '../src/common/services/session-cache.service';
import { ScrapingDebugService } from '../src/modules/scraping/scraping-debug.service';

async function bootstrap() {
    console.log('🚀 Starting SUAP Login Test...');

    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env', // Assuming .env is in project root
            }),
        ],
        providers: [
            SuapScraperProvider,
            PlaywrightService,
            { provide: SessionCacheService, useValue: { getSession: () => null, setSession: () => { }, invalidateSession: () => { } } },
            { provide: ScrapingDebugService, useValue: { cacheScraping: () => { } } },
        ],
    }).compile();

    // Get services from DI container
    const suapService = moduleFixture.get<SuapScraperProvider>(SuapScraperProvider);
    const playService = moduleFixture.get<PlaywrightService>(PlaywrightService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);

    // Get credentials from env
    const username = configService.get<string>('SUAP_USERNAME');
    const password = configService.get<string>('SUAP_PASSWORD');

    console.log('--- DEBUG CREDENTIALS ---');
    console.log(`SUAP_USERNAME: '${username}'`);
    console.log(`SUAP_PASSWORD: ${password ? 'SET (Length: ' + password.length + ')' : 'NOT SET'}`);
    console.log('-------------------------');

    if (!username || !password) {
        console.error('❌ Missing credentials! Please set SUAP_USERNAME and SUAP_PASSWORD in apps/backend/.env');
        // Don't modify the file, just warn.
        process.exit(1);
    }

    console.log('🔑 Credentials found. Launching browser...');
    // Create browser context manually using PlaywrightService since BaseScraper.createContext is protected
    // or use public methods if exposed. BaseScraper exposes no public context creation, it manages it internally usually.
    // But for login test we need to pass a page.
    // Let's use PlaywrightService directly to create context and page.
    const context = await playService.createContext();
    const page = await context.newPage();

    let success = false;

    try {
        console.log('🔄 Attempting login...');
        const result = await suapService.login(page, username, password);

        if (result.success) {
            console.log('✅ LOGIN SUCCESS!');
            success = true;
        } else {
            console.error('❌ LOGIN FAILED!');
            console.error('Reason:', result.message);
        }

        // Keep browser open for a moment to see result if running headful
        // await page.waitForTimeout(5000);

    } catch (error) {
        console.error('❌ An unexpected error occurred:', error);
    } finally {
        await context.close();
        await moduleFixture.close();
    }

    if (!success) process.exit(1);
}

bootstrap();
