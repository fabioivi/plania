import { Injectable, NotFoundException } from '@nestjs/common';
import { IScrapingProvider } from '../interfaces/scraping-provider.interface';
import { IfmsScraperProvider } from '../providers/ifms.scraper';
import { SuapScraperProvider } from '../providers/suap.scraper';

@Injectable()
export class ScraperFactory {
    constructor(
        private ifmsScraper: IfmsScraperProvider,
        private suapScraper: SuapScraperProvider,
    ) { }

    /**
     * Get the appropriate provider for the given system type
     */
    getProvider(systemType: string): IScrapingProvider {
        const type = systemType.toUpperCase();

        switch (type) {
            case 'IFMS':
                return this.ifmsScraper;
            case 'SUAP':
                return this.suapScraper;
            default:
                throw new NotFoundException(`Scraping provider for system type '${systemType}' not found`);
        }
    }
}
