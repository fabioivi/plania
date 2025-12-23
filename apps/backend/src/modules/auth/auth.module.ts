import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { LLMConfig } from './llm-config.entity';
import { JwtStrategy } from './jwt.strategy';
import { CryptoService } from '../../common/services/crypto.service';
import { LLMConfigService } from './llm-config.service';
import { LLMConfigController } from './llm-config.controller';
import { AdminController } from './admin.controller';
import { AuditModule } from '../audit/audit.module';

import { UserBootstrapService } from './user-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, LLMConfig]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    AuditModule,
  ],
  controllers: [AuthController, LLMConfigController, AdminController],
  providers: [
    AuthService,
    JwtStrategy,
    CryptoService,
    LLMConfigService,
    UserBootstrapService,
  ],
  exports: [AuthService, LLMConfigService],
})
export class AuthModule { }
