import { Controller, Get, Param, Query, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrapingDebugService } from './scraping-debug.service';
import { SessionCacheService } from '../../common/services/session-cache.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Scraping Debug')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scraping-debug')
export class ScrapingDebugController {
  constructor(
    private debugService: ScrapingDebugService,
    private sessionCache: SessionCacheService,
  ) {}

  @Get('failed')
  @ApiOperation({ summary: 'Get failed scraping attempts' })
  async getFailedScrapings(@Query('limit') limit = 50) {
    return this.debugService.getFailedScrapings(Number(limit));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get scraping statistics' })
  async getStats(@Query('type') type?: string) {
    return this.debugService.getExtractionStats(type);
  }

  @Get('latest/:externalId/:type')
  @ApiOperation({ summary: 'Get latest cache for specific item' })
  async getLatestCache(
    @Param('externalId') externalId: string,
    @Param('type') type: string,
  ) {
    return this.debugService.getLatestCache(externalId, type);
  }

  @Get('compare/:id1/:id2')
  @ApiOperation({ summary: 'Compare two scraping attempts' })
  async compare(@Param('id1') id1: string, @Param('id2') id2: string) {
    return this.debugService.compareScrapings(id1, id2);
  }

  @Get('clean-old')
  @ApiOperation({ summary: 'Clean cache older than 30 days' })
  async cleanOld() {
    const deleted = await this.debugService.cleanOldCache();
    return { deleted };
  }

  // ============================================
  // Session Cache Management Endpoints
  // ============================================

  @Get('sessions/stats')
  @ApiOperation({ summary: 'Get session cache statistics' })
  async getSessionStats() {
    const stats = await this.sessionCache.getStats();
    return {
      success: true,
      data: stats,
      message: `${stats.totalSessions} sessão(ões) em cache`,
    };
  }

  @Get('sessions/:username/ttl')
  @ApiOperation({ summary: 'Get TTL for specific session' })
  async getSessionTTL(@Param('username') username: string) {
    const ttl = await this.sessionCache.getSessionTTL(username);
    const hasSession = await this.sessionCache.hasSession(username);

    return {
      success: true,
      data: {
        username,
        hasSession,
        ttl,
        expiresIn: ttl > 0 ? `${Math.floor(ttl / 60)} minutos` : 'N/A',
      },
    };
  }

  @Delete('sessions/:username')
  @ApiOperation({ summary: 'Invalidate session for specific user' })
  async invalidateSession(@Param('username') username: string) {
    await this.sessionCache.invalidateSession(username);
    return {
      success: true,
      message: `Sessão de ${username} invalidada com sucesso`,
    };
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Clear all cached sessions (admin only)' })
  async clearAllSessions() {
    const deleted = await this.sessionCache.clearAllSessions();
    return {
      success: true,
      data: { deleted },
      message: `${deleted} sessão(ões) removida(s) do cache`,
    };
  }

  @Get('sessions/health')
  @ApiOperation({ summary: 'Check Redis health for session cache' })
  async checkRedisHealth() {
    const isHealthy = await this.sessionCache.isHealthy();
    const connectionStatus = this.sessionCache.getConnectionStatus();

    return {
      success: isHealthy,
      data: {
        healthy: isHealthy,
        connection: connectionStatus,
      },
      message: isHealthy
        ? '✅ Redis está saudável e pronto para cache de sessões'
        : '❌ Redis não está respondendo - cache de sessões indisponível (fallback: login direto)',
    };
  }
}
