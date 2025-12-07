import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          // Extrai token do cookie auth_token
          const token = request?.cookies?.auth_token;
          if (token) {
            console.log('🍪 JWT Strategy: Token encontrado no cookie');
            return token;
          }
          
          // Extrai token do query parameter (para SSE)
          const queryToken = request?.query?.token as string;
          if (queryToken) {
            console.log('🔗 JWT Strategy: Token encontrado no query parameter');
            return queryToken;
          }
          
          if (request?.headers?.authorization) {
            console.log('🔑 JWT Strategy: Token encontrado no header Authorization');
          } else {
            console.log('⚠️ JWT Strategy: Nenhum token encontrado');
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
