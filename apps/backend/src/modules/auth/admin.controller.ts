import {
    Controller,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../auth/role.enum';
import { User } from '../auth/user.entity';
import { AuditService } from '../audit/audit.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(Role.ADMIN)
export class AdminController {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private auditService: AuditService,
    ) { }

    @Get('users')
    @ApiOperation({ summary: 'List all users' })
    async listUsers() {
        // Only return safe fields
        const users = await this.userRepository.find({
            order: { createdAt: 'DESC' },
            select: [
                'id',
                'name',
                'email',
                'role',
                'isActive',
                'lastLoginAt',
                'createdAt',
            ],
        });
        return users;
    }

    @Patch('users/:id/status')
    @ApiOperation({ summary: 'Toggle user active status' })
    async toggleUserStatus(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
        @Request() req,
    ) {
        if (req.user.id === id) {
            throw new ForbiddenException('You cannot change your own status');
        }

        await this.userRepository.update(id, { isActive });

        await this.auditService.log(
            'UPDATE_USER_STATUS',
            'ADMIN',
            req.user.id,
            { targetUserId: id, newStatus: isActive },
            req.ip,
            req.headers['user-agent'],
        );

        return { success: true };
    }

    @Patch('users/:id/role')
    @ApiOperation({ summary: 'Change user role' })
    async changeUserRole(
        @Param('id') id: string,
        @Body('role') role: Role,
        @Request() req,
    ) {
        if (req.user.id === id) {
            throw new ForbiddenException('You cannot change your own role');
        }

        if (!Object.values(Role).includes(role)) {
            throw new ForbiddenException('Invalid role');
        }

        await this.userRepository.update(id, { role });

        await this.auditService.log(
            'UPDATE_USER_ROLE',
            'ADMIN',
            req.user.id,
            { targetUserId: id, newRole: role },
            req.ip,
            req.headers['user-agent'],
        );

        return { success: true };
    }

    @Get('audit-logs')
    @ApiOperation({ summary: 'List audit logs' })
    async listAuditLogs() {
        return this.auditService.findAll();
    }
}
