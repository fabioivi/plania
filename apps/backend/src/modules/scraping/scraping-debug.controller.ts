import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrapingDebugService } from './scraping-debug.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Scraping Debug')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scraping-debug')
export class ScrapingDebugController {
  constructor(private debugService: ScrapingDebugService) {}

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
}
