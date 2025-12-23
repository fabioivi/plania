'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminService, AuditLog } from '@/services/api/admin.service';
import { AdminDataTable } from '@/components/ui/admin-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { Loader2, Eye, FileJson, FileText, Globe, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        try {
            const data = await adminService.getAuditLogs();
            setLogs(data);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast.error('Erro ao carregar logs de auditoria.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns: ColumnDef<AuditLog>[] = useMemo(() => [
        {
            accessorKey: "createdAt",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Data/Hora</span>,
            cell: ({ row }) => {
                return <span className="text-xs font-mono text-slate-500 whitespace-nowrap">{format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</span>
            }
        },
        {
            accessorKey: "user.email",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Usuário</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                        {row.original.user?.name?.charAt(0) || 'S'}
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {row.original.user?.email || <span className="text-muted-foreground">Sistema</span>}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "action",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Ação</span>,
            cell: ({ row }) => {
                const action = row.original.action;
                let variantClass = "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800";

                if (action.includes('CREATE')) variantClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50";
                if (action.includes('UPDATE')) variantClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50";
                if (action.includes('DELETE')) variantClass = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
                if (action.includes('LOGIN')) variantClass = "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-900/50";

                return (
                    <Badge variant="outline" className={`text-[10px] font-semibold uppercase tracking-wide ${variantClass}`}>
                        {action}
                    </Badge>
                )
            }
        },
        {
            accessorKey: "module",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Módulo</span>,
            cell: ({ row }) => (
                <Badge variant="secondary" className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900/50">
                    {row.original.module}
                </Badge>
            )
        },
        {
            accessorKey: "resourceId",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Recurso</span>,
            cell: ({ row }) => <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">{row.original.resourceId?.slice(0, 8) || '-'}</span>
        },
        {
            accessorKey: "ipAddress",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Origem</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-slate-400" title={row.original.userAgent || ''}>
                    <Globe className="h-3 w-3" />
                    <span className="text-xs font-mono">{row.original.ipAddress || '-'}</span>
                </div>
            )
        },
        {
            id: "details",
            header: () => <span className="text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Detalhes</span>,
            cell: ({ row }) => {
                const details = row.original.details;
                return (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 text-slate-400 hover:text-indigo-600">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-slate-800">
                                    <FileJson className="h-5 w-5 text-indigo-600" />
                                    Detalhes da Auditoria
                                </DialogTitle>
                            </DialogHeader>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-800">
                                <pre>{JSON.stringify(details, null, 2)}</pre>
                            </div>
                        </DialogContent>
                    </Dialog>
                )
            }
        }
    ], []);

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-border bg-white dark:bg-card overflow-hidden">
                <div className="bg-slate-50/80 dark:bg-secondary/30 p-6 border-b border-slate-100 dark:border-border flex items-center gap-3">
                    <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-foreground">Logs de Auditoria</h2>
                        <p className="text-sm text-slate-500 dark:text-muted-foreground">Rastreabilidade completa de ações e segurança</p>
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
                                    <Skeleton className="h-6 w-24" />
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="p-4 border-b border-slate-100 dark:border-slate-800 last:border-0 flex gap-4 items-center">
                                        <Skeleton className="h-4 w-24" />
                                        <div className="flex items-center gap-2 flex-1">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-20" />
                                        <Skeleton className="h-6 w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AdminDataTable
                            columns={columns}
                            data={logs}
                            placeholder="Buscar em todos os campos..."
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
