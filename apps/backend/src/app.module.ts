import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from './modules/auth/auth.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { PlansModule } from './modules/plans/plans.module';
import { QueueModule } from './modules/queue/queue.module';
import { CryptoService } from './common/services/crypto.service';

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
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
  ],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class AppModule {}
