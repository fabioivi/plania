import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export interface SyncProgress {
  userId: string;
  stage: 'starting' | 'diaries' | 'plans' | 'completed' | 'error' | 'credential-status';
  message: string;
  current?: number;
  total?: number;
  diaryName?: string;
  planName?: string;
  duration?: number;
}

@Injectable()
export class SyncEventsService {
  private clients: Map<string, Response> = new Map();

  /**
   * Register a new SSE client
   */
  addClient(userId: string, response: Response) {
    console.log(`🔗 SSE: Cliente conectado - userId: ${userId}`);
    this.clients.set(userId, response);

    // Setup SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

    // Send initial connection message immediately
    this.sendEvent(userId, {
      userId,
      stage: 'starting',
      message: 'Conexão estabelecida. Aguardando sincronização...',
    });

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      if (this.clients.has(userId)) {
        response.write(': heartbeat\n\n');
      }
    }, 30000);

    // Handle client disconnect
    response.on('close', () => {
      console.log(`❌ SSE: Cliente desconectado - userId: ${userId}`);
      clearInterval(heartbeat);
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
      console.log(`📤 SSE: Enviando evento para ${userId}:`, progress.stage, progress.message);
      client.write(`data: ${data}\n\n`);

      // Force flush to ensure data is sent immediately
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } else {
      console.log(`⚠️ SSE: Cliente não encontrado - userId: ${userId}`);
      console.log(`📋 Clientes ativos:`, Array.from(this.clients.keys()));
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
