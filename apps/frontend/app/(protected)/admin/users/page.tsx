'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminService, User, Role } from '@/services/api/admin.service';
import { AdminDataTable } from '@/components/ui/admin-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { Users } from 'lucide-react';

import { Skeleton } from "@/components/ui/skeleton";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const fetchUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Erro ao carregar usuários.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusToggle = async (user: User) => {
        const newStatus = !user.isActive;
        setUpdatingIds(prev => new Set(prev).add(user.id));
        try {
            await adminService.toggleUserStatus(user.id, newStatus);
            toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao alterar status do usuário.');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(user.id);
                return next;
            });
        }
    };

    const handleRoleChange = async (userId: string, newRole: Role) => {
        setUpdatingIds(prev => new Set(prev).add(userId));
        try {
            await adminService.changeUserRole(userId, newRole);
            toast.success('Função do usuário alterada com sucesso.');
            fetchUsers();
        } catch (error) {
            toast.error('Erro ao alterar função do usuário.');
        } finally {
            setUpdatingIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    const columns: ColumnDef<User>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Nome do Usuário</span>,
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-700 dark:text-foreground">{row.original.name}</span>
                    <span className="text-xs text-slate-400 dark:text-muted-foreground">ID: {row.original.id.slice(0, 8)}...</span>
                </div>
            )
        },
        {
            accessorKey: "email",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Email</span>,
            cell: ({ row }) => (
                <div className="text-sm font-medium text-slate-600 dark:text-muted-foreground">
                    {row.original.email}
                </div>
            )
        },
        {
            accessorKey: "role",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Função</span>,
            cell: ({ row }) => {
                const user = row.original;
                const isUpdating = updatingIds.has(user.id);

                const roleColors = {
                    [Role.USER]: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                    [Role.ADMIN]: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
                    [Role.SUPER_ADMIN]: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                };

                return (
                    <Select
                        disabled={isUpdating}
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as Role)}
                    >
                        <SelectTrigger className={`w-[140px] h-8 text-xs font-semibold border transition-all ${roleColors[user.role as Role] || "bg-slate-50 border-slate-200"}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={Role.USER}>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                    Usuário
                                </div>
                            </SelectItem>
                            <SelectItem value={Role.ADMIN}>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Admin
                                </div>
                            </SelectItem>
                            <SelectItem value={Role.SUPER_ADMIN}>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Super Admin
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )
            }
        },
        {
            accessorKey: "isActive",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Status</span>,
            cell: ({ row }) => {
                const user = row.original;
                const isUpdating = updatingIds.has(user.id);
                const isActive = user.isActive;

                const statusStyles = isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50"
                    : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";

                return (
                    <Select
                        disabled={isUpdating}
                        value={isActive ? "active" : "inactive"}
                        onValueChange={() => handleStatusToggle(user)}
                    >
                        <SelectTrigger className={`w-[110px] h-8 text-xs font-semibold border transition-all ${statusStyles}`}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Ativo
                                </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Inativo
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )
            }
        }
    ], [updatingIds]);

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
                <div className="bg-slate-50/80 dark:bg-secondary/30 p-6 border-b border-slate-100 dark:border-border flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                        <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-foreground">Gerenciamento de Usuários</h2>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground">Visualize e gerencie as permissões e acesso dos usuários</p>
                    </div>
                </div>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-10 w-[300px]" />
                            </div>
                            <div className="rounded-md border border-slate-200 dark:border-slate-800">
                                <div className="h-10 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 p-2 flex gap-4">
                                    <Skeleton className="h-6 w-1/4" />
                                    <Skeleton className="h-6 w-1/4" />
                                    <Skeleton className="h-6 w-1/4" />
                                    <Skeleton className="h-6 w-1/4" />
                                </div>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 flex gap-4 items-center">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-8 w-1/4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AdminDataTable
                            columns={columns}
                            data={users}
                            placeholder="Buscar em todos os campos..."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
