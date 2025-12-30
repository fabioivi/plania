import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { chromium, Browser, BrowserContext } from 'playwright';

@Injectable()
export class PlaywrightService implements OnModuleInit, OnModuleDestroy {
    private browser: Browser | null = null;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        // Optional: Pre-launch browser
    }

    async onModuleDestroy() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async getBrowser(): Promise<Browser> {
        if (!this.browser || !this.browser.isConnected()) {
            const isDev = this.configService.get<string>('NODE_ENV') === 'development';
            // Default to visible browser in dev, headless in prod
            const headless = this.configService.get<string>('PLAYWRIGHT_HEADLESS', isDev ? 'false' : 'true') === 'true';
            const executablePath = this.configService.get<string>('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH');

            this.browser = await chromium.launch({
                headless,
                executablePath: executablePath || undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ],
            });
        }
        return this.browser;
    }

    async createContext(): Promise<BrowserContext> {
        const browser = await this.getBrowser();
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });

        // Block unnecessary resources - DISABLED to avoid bot detection (CAPTCHA)
        // await context.route('**/*.{png,jpg,jpeg,gif,css,woff,woff2,svg,ico,ttf}', (route) => route.abort());

        return context;
    }
}
