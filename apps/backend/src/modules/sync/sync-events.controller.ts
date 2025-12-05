import { Controller, Get, Res, UseGuards, Request, Query, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncEventsService } from './sync-events.service';
import { JwtService } from '@nestjs/jwt';

@ApiTags('sync')
@Controller('sync')
export class SyncEventsController {
  constructor(
    private syncEventsService: SyncEventsService,
    private jwtService: JwtService,
  ) {}

  @Get('events')
  @ApiQuery({ name: 'token', required: false, description: 'JWT token como query parameter (opcional)' })
  async events(
    @Request() req, 
    @Query('token') tokenParam: string,
    @Res() res: Response
  ) {
    let userId: string;
    
    // Tentar autenticar via guard (cookie ou header)
    if (req.user?.id) {
      userId = req.user.id;
      console.log('🔐 SSE: Autenticação via cookie/header OK - userId:', userId);
    } 
    // Fallback: token via query parameter
    else if (tokenParam) {
      try {
        const payload = this.jwtService.verify(tokenParam);
        userId = payload.sub;
        console.log('🔐 SSE: Autenticação via query parameter OK - userId:', userId);
      } catch (error) {
        console.error('❌ SSE: Token inválido no query parameter');
        throw new UnauthorizedException('Token inválido');
      }
    } 
    // Sem autenticação
    else {
      console.error('❌ SSE: Nenhuma autenticação fornecida');
      throw new UnauthorizedException('Autenticação necessária');
    }
    
    this.syncEventsService.addClient(userId, res);
  }
}
