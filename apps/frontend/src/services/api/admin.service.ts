import { apiClient } from './client';

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface AuditLog {
    id: string;
    action: string;
    module: string;
    resourceId: string | null;
    details: any;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string | null;
    user?: Partial<User>;
    createdAt: string;
}

export const adminService = {
    async getUsers(): Promise<User[]> {
        const response = await apiClient.get<User[]>('/admin/users');
        return response.data;
    },

    async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
        const response = await apiClient.patch<User>(`/admin/users/${id}/status`, { isActive });
        return response.data;
    },

    async changeUserRole(id: string, role: Role): Promise<User> {
        const response = await apiClient.patch<User>(`/admin/users/${id}/role`, { role });
        return response.data;
    },

    async getAuditLogs(): Promise<AuditLog[]> {
        const response = await apiClient.get<AuditLog[]>('/admin/audit-logs');
        return response.data;
    },
};
