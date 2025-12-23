import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    async log(
        action: string,
        module: string,
        userId: string | null = null,
        details: any = null,
        ipAddress: string | null = null,
        userAgent: string | null = null,
    ): Promise<AuditLog> {
        const log = this.auditLogRepository.create({
            action,
            module,
            userId,
            details,
            ipAddress,
            userAgent,
        });
        return this.auditLogRepository.save(log);
    }

    async findAll() {
        return this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
            take: 100,
            relations: ['user'],
        });
    }
}
