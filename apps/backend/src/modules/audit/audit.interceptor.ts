import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, params, query, ip, user } = req;

    // Log apenas mutações (POST, PUT, PATCH, DELETE)
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const handler = context.getHandler();

    // Tenta pegar o summary do Swagger ou formata método + URL
    const swaggerOp = this.reflector.get('swagger/apiOperation', handler);
    // usa req.path para evitar poluir com query parameters
    const reqPath = req.path || url.split('?')[0];
    const actionSummary = swaggerOp?.summary || `${method} ${reqPath}`;

    // Módulo baseado na URL
    const urlParts = reqPath.split('/');
    // Se a URL for /api/admin/users, pega 'admin'
    const module = (urlParts[2] || urlParts[1] || 'SISTEMA').toUpperCase();

    return next.handle().pipe(
      tap((resData) => {
        // Tenta pegar o user do request (autenticado) ou da resposta (ex: login)
        const userId = user?.id || resData?.user?.id || resData?.id || null;

        // Remove senhas dos detalhes
        const safeBody = { ...body };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.confirmPassword) safeBody.confirmPassword = '***';

        // Trata accessToken na resposta para não logar
        let safeResponse = resData;
        if (resData && typeof resData === 'object') {
           if (Array.isArray(resData)) {
               safeResponse = [...resData];
           } else {
               safeResponse = { ...resData };
               if (safeResponse.accessToken) safeResponse.accessToken = '***';
               if (safeResponse.password) safeResponse.password = '***';
           }
        }

        this.auditService.log(
          actionSummary,
          module,
          userId,
          {
            endpoint: url,
            method,
            body: safeBody,
            params,
            query,
            response: safeResponse
          },
          ip,
          req.headers['user-agent'],
        );
      }),
    );
  }
}
