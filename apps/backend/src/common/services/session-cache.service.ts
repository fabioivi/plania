import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service for managing IFMS session cookies in Redis cache
 *
 * Benefits:
 * - Persistent session cache across server restarts
 * - Shared cache between multiple worker instances
 * - Automatic TTL (Time To Live) for session expiration
 * - Thread-safe concurrent access
 */
@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  private readonly redis: Redis;

  // Cache key prefix to avoid conflicts with other Redis data
  private readonly KEY_PREFIX = 'ifms:session:';

  // Default session TTL: 1 hour (IFMS sessions typically last 1-2 hours)
  private readonly DEFAULT_TTL_SECONDS = 3600;

  constructor(private configService: ConfigService) {
    // Create dedicated Redis connection for session cache
    // Using separate connection from Bull queues to avoid conflicts
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: 1, // Use DB 1 for sessions (Bull uses DB 0 by default)
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('✅ Conectado ao Redis para cache de sessões IFMS');
    });

    this.redis.on('error', (error) => {
      this.logger.error('❌ Erro no Redis:', error.message);
    });
  }

  /**
   * Get cached session cookies for a username
   * @param username - IFMS username
   * @returns Cached cookies array or null if not found/expired
   */
  async getSession(username: string): Promise<any[] | null> {
    try {
      const key = this.buildKey(username);
      const cached = await this.redis.get(key);

      if (!cached) {
        this.logger.debug(`📭 Cache miss para usuário: ${username}`);
        return null;
      }

      // Parse and validate cookies structure
      let cookies;
      try {
        cookies = JSON.parse(cached);
      } catch (parseError) {
        this.logger.warn(
          `⚠️ JSON corrompido no cache para ${username}, invalidando... (${parseError.message})`,
        );
        // Auto-invalidate corrupted cache
        await this.redis.del(key);
        return null;
      }

      // Validate cookies array structure
      if (!Array.isArray(cookies)) {
        this.logger.warn(`⚠️ Cookies inválidos (não é array) para ${username}, invalidando...`);
        await this.redis.del(key);
        return null;
      }

      // Validate cookie objects have required fields
      const hasValidCookies = cookies.every(
        (cookie) =>
          cookie &&
          typeof cookie === 'object' &&
          typeof cookie.name === 'string' &&
          typeof cookie.value === 'string',
      );

      if (!hasValidCookies || cookies.length === 0) {
        this.logger.warn(`⚠️ Cookies com estrutura inválida para ${username}, invalidando...`);
        await this.redis.del(key);
        return null;
      }

      this.logger.debug(`♻️ Cache hit para usuário: ${username} (${cookies.length} cookies)`);
      return cookies;
    } catch (error) {
      // Handle Redis connection errors gracefully
      if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
        this.logger.error(`❌ Redis indisponível: ${error.message} (usando fallback sem cache)`);
      } else {
        this.logger.error(`Erro ao recuperar sessão do cache: ${error.message}`);
      }
      return null; // Fail gracefully - will trigger fresh login
    }
  }

  /**
   * Save session cookies to cache with TTL
   * @param username - IFMS username
   * @param cookies - Array of cookie objects from Playwright
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   */
  async setSession(
    username: string,
    cookies: any[],
    ttlSeconds: number = this.DEFAULT_TTL_SECONDS,
  ): Promise<void> {
    try {
      const key = this.buildKey(username);
      const serialized = JSON.stringify(cookies);

      await this.redis.setex(key, ttlSeconds, serialized);

      this.logger.log(
        `💾 Sessão salva em cache para ${username} ` +
        `(${cookies.length} cookies, TTL: ${ttlSeconds}s = ${(ttlSeconds / 60).toFixed(1)}min)`,
      );
    } catch (error) {
      this.logger.error(`Erro ao salvar sessão no cache: ${error.message}`);
      // Don't throw - session caching is an optimization, not critical
    }
  }

  /**
   * Invalidate (delete) cached session for a username
   * @param username - IFMS username
   */
  async invalidateSession(username: string): Promise<void> {
    try {
      const key = this.buildKey(username);
      const deleted = await this.redis.del(key);

      if (deleted > 0) {
        this.logger.log(`🗑️ Sessão invalidada para ${username}`);
      } else {
        this.logger.debug(`⚠️ Tentativa de invalidar sessão inexistente para ${username}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao invalidar sessão: ${error.message}`);
    }
  }

  /**
   * Check if session exists in cache (without retrieving it)
   * @param username - IFMS username
   * @returns true if session exists, false otherwise
   */
  async hasSession(username: string): Promise<boolean> {
    try {
      const key = this.buildKey(username);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Erro ao verificar existência de sessão: ${error.message}`);
      return false;
    }
  }

  /**
   * Get remaining TTL for a session
   * @param username - IFMS username
   * @returns Remaining seconds or -1 if not found, -2 if no expiration
   */
  async getSessionTTL(username: string): Promise<number> {
    try {
      const key = this.buildKey(username);
      const ttl = await this.redis.ttl(key);
      return ttl;
    } catch (error) {
      this.logger.error(`Erro ao obter TTL da sessão: ${error.message}`);
      return -1;
    }
  }

  /**
   * Clear all cached sessions (admin/maintenance operation)
   * @returns Number of sessions cleared
   */
  async clearAllSessions(): Promise<number> {
    try {
      const pattern = `${this.KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        this.logger.log('ℹ️ Nenhuma sessão em cache para limpar');
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      this.logger.warn(`🗑️ ${deleted} sessões removidas do cache`);
      return deleted;
    } catch (error) {
      this.logger.error(`Erro ao limpar todas as sessões: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get statistics about cached sessions
   * @returns Object with session cache statistics
   */
  async getStats(): Promise<{
    totalSessions: number;
    sessions: Array<{ username: string; ttl: number }>;
  }> {
    try {
      const pattern = `${this.KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      const sessions = await Promise.all(
        keys.map(async (key) => {
          const username = key.replace(this.KEY_PREFIX, '');
          const ttl = await this.redis.ttl(key);
          return { username, ttl };
        }),
      );

      return {
        totalSessions: keys.length,
        sessions,
      };
    } catch (error) {
      this.logger.error(`Erro ao obter estatísticas: ${error.message}`);
      return { totalSessions: 0, sessions: [] };
    }
  }

  /**
   * Build Redis key for a username
   * @param username - IFMS username
   * @returns Prefixed Redis key
   */
  private buildKey(username: string): string {
    // Sanitize username to prevent injection attacks
    const sanitized = username.replace(/[^a-zA-Z0-9._@-]/g, '_');
    return `${this.KEY_PREFIX}${sanitized}`;
  }

  /**
   * Health check for Redis connection
   * @returns true if Redis is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`❌ Redis health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get Redis connection status
   * @returns Connection status object
   */
  getConnectionStatus(): {
    status: string;
    host: string;
    port: number;
    db: number;
  } {
    return {
      status: this.redis.status, // 'connecting' | 'connect' | 'ready' | 'reconnecting' | 'end'
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      db: 1,
    };
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('🔌 Conexão Redis para cache de sessões encerrada');
  }
}
