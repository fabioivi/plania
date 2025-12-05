import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export interface SyncProgress {
  userId: string;
  stage: 'starting' | 'diaries' | 'plans' | 'completed' | 'error';
  message: string;
  current?: number;
  total?: number;
  diaryName?: string;
  planName?: string;
}

@Injectable()
export class SyncEventsService {
  private clients: Map<string, Response> = new Map();

  /**
   * Register a new SSE client
   */
  addClient(userId: string, response: Response) {
    this.clients.set(userId, response);

    // Setup SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');

    // Send initial connection message
    this.sendEvent(userId, {
      userId,
      stage: 'starting',
      message: 'Conexão estabelecida. Aguardando sincronização...',
    });

    // Handle client disconnect
    response.on('close', () => {
      this.clients.delete(userId);
    });
  }

  /**
   * Send progress event to specific user
   */
  sendEvent(userId: string, progress: SyncProgress) {
    const client = this.clients.get(userId);
    if (client) {
      const data = JSON.stringify(progress);
      client.write(`data: ${data}\n\n`);
    }
  }

  /**
   * Send event to all clients (broadcast)
   */
  broadcast(progress: SyncProgress) {
    this.clients.forEach((client) => {
      const data = JSON.stringify(progress);
      client.write(`data: ${data}\n\n`);
    });
  }

  /**
   * Remove client
   */
  removeClient(userId: string) {
    this.clients.delete(userId);
  }

  /**
   * Check if user has active connection
   */
  hasClient(userId: string): boolean {
    return this.clients.has(userId);
  }
}
