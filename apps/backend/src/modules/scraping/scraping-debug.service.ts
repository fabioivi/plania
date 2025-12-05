import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ScrapingDebug } from './scraping-debug.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Page } from 'playwright';

export interface CacheScrapingOptions {
  externalId: string;
  scrapeType: 'teaching_plan' | 'diary' | 'proposta_trabalho';
  url: string;
  page: Page;
  extractedData?: any;
  warnings?: string[];
  errors?: string[];
  fieldMetrics?: {
    total: number;
    extracted: number;
    missing: string[];
    completeness: number;
  };
  selectorAttempts?: {
    field: string;
    attempted: string[];
    successful: string | null;
  }[];
  startTime: number;
  success: boolean;
  takeScreenshot?: boolean; // Optional parameter to control screenshot capture
}

@Injectable()
export class ScrapingDebugService {
  private readonly screenshotDir: string;

  constructor(
    @InjectRepository(ScrapingDebug)
    private debugRepo: Repository<ScrapingDebug>,
  ) {
    // Define screenshot directory relative to project root
    this.screenshotDir = path.join(
      process.cwd(),
      'storage',
      'scraping-debug',
      'screenshots',
    );
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  /**
   * Cache complete scraping attempt for later analysis
   */
  async cacheScraping(options: CacheScrapingOptions): Promise<void> {
    try {
      const {
        externalId,
        scrapeType,
        url,
        page,
        extractedData,
        warnings = [],
        errors = [],
        fieldMetrics,
        selectorAttempts,
        startTime,
        success,
        takeScreenshot = false, // Default to false
      } = options;

      // Capture HTML snapshot
      const htmlSnapshot = await page.content();

      // Take screenshot only if requested
      let screenshotPath: string | null = null;
      
      if (takeScreenshot) {
        const timestamp = Date.now();
        const screenshotFilename = `${scrapeType}_${externalId}_${timestamp}.png`;
        screenshotPath = path.join(this.screenshotDir, screenshotFilename);

        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      }

      // Get viewport and user agent
      const viewport = page.viewportSize();
      const userAgent = await page.evaluate(() => navigator.userAgent);

      // Calculate duration
      const scrapeDurationMs = Date.now() - startTime;

      // Save to database
      const debug = this.debugRepo.create({
        externalId,
        scrapeType,
        url,
        htmlSnapshot,
        screenshotPath,
        extractedData,
        extractionWarnings: warnings,
        extractionErrors: errors,
        fieldMetrics,
        selectorAttempts,
        userAgent,
        viewport,
        scrapeDurationMs,
        success,
      });

      await this.debugRepo.save(debug);

      console.log(
        `✅ Cached scraping debug data for ${scrapeType} ${externalId} (${scrapeDurationMs}ms)${takeScreenshot ? ' with screenshot' : ''}`,
      );
    } catch (error) {
      console.error('Failed to cache scraping debug:', error);
      // Don't throw - caching should not break scraping flow
    }
  }

  /**
   * Get latest cached scraping for analysis
   */
  async getLatestCache(
    externalId: string,
    scrapeType: string,
  ): Promise<ScrapingDebug | null> {
    return this.debugRepo.findOne({
      where: { externalId, scrapeType },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all failed scrapings for analysis
   */
  async getFailedScrapings(limit = 50): Promise<ScrapingDebug[]> {
    return this.debugRepo.find({
      where: { success: false },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Compare two scraping attempts (useful for diff analysis)
   */
  async compareScrapings(id1: string, id2: string): Promise<{
    differences: {
      field: string;
      value1: any;
      value2: any;
    }[];
    htmlDiff: {
      size1: number;
      size2: number;
      sizeDiff: number;
    };
  }> {
    const [scrape1, scrape2] = await Promise.all([
      this.debugRepo.findOneBy({ id: id1 }),
      this.debugRepo.findOneBy({ id: id2 }),
    ]);

    if (!scrape1 || !scrape2) {
      throw new Error('One or both scraping records not found');
    }

    const differences: { field: string; value1: any; value2: any }[] = [];

    // Compare extracted data
    const data1 = scrape1.extractedData || {};
    const data2 = scrape2.extractedData || {};

    const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);

    for (const key of allKeys) {
      if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
        differences.push({
          field: key,
          value1: data1[key],
          value2: data2[key],
        });
      }
    }

    return {
      differences,
      htmlDiff: {
        size1: scrape1.htmlSnapshot.length,
        size2: scrape2.htmlSnapshot.length,
        sizeDiff: scrape2.htmlSnapshot.length - scrape1.htmlSnapshot.length,
      },
    };
  }

  /**
   * Get extraction statistics
   */
  async getExtractionStats(scrapeType?: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgCompleteness: number;
    commonMissingFields: { field: string; count: number }[];
  }> {
    const where = scrapeType ? { scrapeType } : {};
    const scrapings = await this.debugRepo.find({ where });

    const successful = scrapings.filter((s) => s.success).length;
    const failed = scrapings.length - successful;

    // Calculate average completeness
    const completenessValues = scrapings
      .filter((s) => s.fieldMetrics?.completeness != null)
      .map((s) => s.fieldMetrics.completeness);

    const avgCompleteness =
      completenessValues.length > 0
        ? completenessValues.reduce((a, b) => a + b, 0) /
          completenessValues.length
        : 0;

    // Find common missing fields
    const missingFieldsMap = new Map<string, number>();

    scrapings.forEach((scraping) => {
      if (scraping.fieldMetrics?.missing) {
        scraping.fieldMetrics.missing.forEach((field) => {
          missingFieldsMap.set(field, (missingFieldsMap.get(field) || 0) + 1);
        });
      }
    });

    const commonMissingFields = Array.from(missingFieldsMap.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: scrapings.length,
      successful,
      failed,
      avgCompleteness,
      commonMissingFields,
    };
  }

  /**
   * Clean old cache entries (older than 30 days)
   */
  async cleanOldCache(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldEntries = await this.debugRepo.find({
      where: {
        createdAt: LessThanOrEqual(thirtyDaysAgo),
      },
    });

    // Delete screenshots
    for (const entry of oldEntries) {
      if (entry.screenshotPath) {
        try {
          await fs.unlink(entry.screenshotPath);
        } catch (error) {
          console.warn(`Failed to delete screenshot: ${entry.screenshotPath}`);
        }
      }
    }

    // Delete database entries
    const result = await this.debugRepo.delete({
      createdAt: LessThanOrEqual(thirtyDaysAgo),
    });

    return result.affected || 0;
  }
}
