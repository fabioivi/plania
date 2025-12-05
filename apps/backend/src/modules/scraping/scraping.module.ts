import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingService } from './scraping.service';
import { ScrapingDebugService } from './scraping-debug.service';
import { ScrapingDebugController } from './scraping-debug.controller';
import { ScrapingDebug } from './scraping-debug.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapingDebug])],
  controllers: [ScrapingDebugController],
  providers: [ScrapingService, ScrapingDebugService],
  exports: [ScrapingService, ScrapingDebugService],
})
export class ScrapingModule {}
