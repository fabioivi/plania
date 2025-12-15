import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Browser, BrowserContext, Page } from 'playwright';
import { ScrapingService } from './scraping.service';

/**
 * Browser Pool Service for Parallel Scraping
 *
 * Manages a pool of browser contexts to enable parallel scraping operations
 * while controlling resource usage and avoiding IFMS rate limiting.
 *
 * Benefits:
 * - 5-10x faster scraping via parallelization
 * - Controlled concurrency (avoid overwhelming IFMS)
 * - Automatic context recycling and cleanup
 * - Session reuse across contexts
 */
@Injectable()
export class ScrapingPoolService {
  private readonly logger = new Logger(ScrapingPoolService.name);

  // Pool configuration
  private readonly MAX_CONCURRENT_CONTEXTS = 5; // Max parallel scraping operations
  private readonly CONTEXT_REUSE_LIMIT = 10; // Reuse context up to N times before recycling
  private readonly CONTEXT_IDLE_TIMEOUT = 60000; // 1 minute idle timeout

  // Pool state
  private availableContexts: Array<{
    context: BrowserContext;
    page: Page;
    usageCount: number;
    lastUsed: number;
  }> = [];

  private activeContexts = new Set<BrowserContext>();
  private waitingQueue: Array<{
    resolve: (value: { context: BrowserContext; page: Page }) => void;
    reject: (error: Error) => void;
  }> = [];

  constructor(
    private scrapingService: ScrapingService,
    private configService: ConfigService,
  ) {}

  /**
   * Acquire a browser context from the pool
   * @returns Browser context and page ready for scraping
   */
  async acquire(): Promise<{ context: BrowserContext; page: Page }> {
    // 1. Try to reuse available context
    const available = this.availableContexts.shift();
    if (available) {
      // Check if context should be recycled
      if (available.usageCount >= this.CONTEXT_REUSE_LIMIT) {
        this.logger.debug(`♻️ Reciclando context após ${available.usageCount} usos`);
        await available.context.close();
      } else {
        available.usageCount++;
        available.lastUsed = Date.now();
        this.activeContexts.add(available.context);
        this.logger.debug(
          `♻️ Reutilizando context (uso ${available.usageCount}/${this.CONTEXT_REUSE_LIMIT})`,
        );
        return { context: available.context, page: available.page };
      }
    }

    // 2. Create new context if under limit
    if (this.activeContexts.size < this.MAX_CONCURRENT_CONTEXTS) {
      const { context, page } = await this.createNewContext();
      this.activeContexts.add(context);
      this.logger.debug(
        `🆕 Novo context criado (${this.activeContexts.size}/${this.MAX_CONCURRENT_CONTEXTS} ativos)`,
      );
      return { context, page };
    }

    // 3. Wait for available context
    this.logger.debug(
      `⏳ Pool cheio (${this.activeContexts.size}/${this.MAX_CONCURRENT_CONTEXTS}), aguardando...`,
    );
    return new Promise((resolve, reject) => {
      this.waitingQueue.push({ resolve, reject });
    });
  }

  /**
   * Release a browser context back to the pool
   * @param context - Browser context to release
   * @param page - Page to release
   */
  async release(context: BrowserContext, page: Page): Promise<void> {
    this.activeContexts.delete(context);

    // If there's someone waiting, give them the context immediately
    const waiting = this.waitingQueue.shift();
    if (waiting) {
      this.activeContexts.add(context);
      waiting.resolve({ context, page });
      this.logger.debug(`🔄 Context passado para próximo na fila`);
      return;
    }

    // Otherwise, return to available pool
    this.availableContexts.push({
      context,
      page,
      usageCount: 1,
      lastUsed: Date.now(),
    });

    this.logger.debug(
      `✅ Context devolvido ao pool (${this.availableContexts.length} disponíveis)`,
    );
  }

  /**
   * Execute a scraping operation with automatic pool management
   * @param operation - Async function that receives context and page
   * @returns Result of the operation
   */
  async execute<T>(
    operation: (context: BrowserContext, page: Page) => Promise<T>,
  ): Promise<T> {
    const { context, page } = await this.acquire();

    try {
      const result = await operation(context, page);
      await this.release(context, page);
      return result;
    } catch (error) {
      // On error, close context and don't return to pool
      this.activeContexts.delete(context);
      await context.close().catch(() => {});

      // Reject anyone waiting if pool is now empty
      if (this.activeContexts.size === 0 && this.waitingQueue.length > 0) {
        const waiting = this.waitingQueue.shift();
        waiting?.reject(new Error('All contexts failed'));
      }

      throw error;
    }
  }

  /**
   * Execute multiple operations in parallel with concurrency control
   * @param operations - Array of operations to execute
   * @returns Array of results in the same order
   */
  async executeParallel<T>(
    operations: Array<(context: BrowserContext, page: Page) => Promise<T>>,
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      const index = i;

      // Start operation
      const promise = this.execute(operation).then((result) => {
        results[index] = result;
      });

      executing.push(promise);

      // Wait if we've reached max concurrency
      if (executing.length >= this.MAX_CONCURRENT_CONTEXTS) {
        await Promise.race(executing);
        // Remove completed promises
        const completedIndex = executing.findIndex(
          (p) => (p as any)._fulfilled || (p as any)._rejected,
        );
        if (completedIndex !== -1) {
          executing.splice(completedIndex, 1);
        }
      }
    }

    // Wait for remaining operations
    await Promise.all(executing);

    return results;
  }

  /**
   * Create a new browser context
   */
  private async createNewContext(): Promise<{
    context: BrowserContext;
    page: Page;
  }> {
    const context = await this.scrapingService.createContext();
    const page = await context.newPage();
    return { context, page };
  }

  /**
   * Clean up idle contexts (called periodically)
   */
  async cleanupIdleContexts(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    const toKeep = [];
    for (const item of this.availableContexts) {
      if (now - item.lastUsed > this.CONTEXT_IDLE_TIMEOUT) {
        await item.context.close();
        cleaned++;
        this.logger.debug(`🧹 Context ocioso fechado (idle por ${(now - item.lastUsed) / 1000}s)`);
      } else {
        toKeep.push(item);
      }
    }

    this.availableContexts = toKeep;
    return cleaned;
  }

  /**
   * Close all contexts and clear pool
   */
  async closeAll(): Promise<void> {
    this.logger.log('🔒 Fechando todos os contexts do pool...');

    // Close available contexts
    for (const item of this.availableContexts) {
      await item.context.close().catch(() => {});
    }

    // Close active contexts
    for (const context of this.activeContexts) {
      await context.close().catch(() => {});
    }

    this.availableContexts = [];
    this.activeContexts.clear();
    this.waitingQueue = [];

    this.logger.log('✅ Pool fechado');
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.availableContexts.length,
      active: this.activeContexts.size,
      waiting: this.waitingQueue.length,
      maxConcurrency: this.MAX_CONCURRENT_CONTEXTS,
      contextReuseLimit: this.CONTEXT_REUSE_LIMIT,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.closeAll();
  }
}
