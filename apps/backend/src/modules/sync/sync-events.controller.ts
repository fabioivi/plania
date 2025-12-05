import { Controller, Get, Res, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncEventsService } from './sync-events.service';

@ApiTags('sync')
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncEventsController {
  constructor(private syncEventsService: SyncEventsService) {}

  @Get('events')
  events(@Request() req, @Res() res: Response) {
    const userId = req.user.id;
    this.syncEventsService.addClient(userId, res);
  }
}
