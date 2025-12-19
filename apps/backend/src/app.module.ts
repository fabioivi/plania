import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { PlansModule } from './modules/plans/plans.module';
import { QueueModule } from './modules/queue/queue.module';
import { SyncModule } from './modules/sync/sync.module';
import { AIModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';
import { CryptoService } from './common/services/crypto.service';
import { SessionCacheService } from './common/services/session-cache.service';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = {
          type: 'postgres' as const,
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USERNAME'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true, // FORCED: Garantir sync do novo esquema
          logging: configService.get('NODE_ENV') === 'development' || configService.get('DB_LOGGING') === 'true',
        };
        console.log('Database Config:', {
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.username,
          db: dbConfig.database
        });
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Bull (Redis Queue)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Modules
    AuthModule,
    AcademicModule,
    ScrapingModule,
    PlansModule,
    QueueModule,
    SyncModule,
    AIModule,
    HealthModule,
  ],
  providers: [CryptoService, SessionCacheService],
  exports: [CryptoService, SessionCacheService],
})
export class AppModule { }
