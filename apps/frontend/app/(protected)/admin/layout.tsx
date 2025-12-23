'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, FileText } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
                router.push('/dashboard');
            }
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-8">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded mt-4" />
            </div>
        );
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return null;

    const navItems = [
        { href: '/admin/users', label: 'Usuários', icon: Users },
        { href: '/admin/audit-logs', label: 'Auditoria', icon: FileText },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
                <p className="text-muted-foreground">Gerencie usuários e visualize logs de auditoria.</p>
            </div>

            <div className="flex items-center space-x-2 border-b pb-4 overflow-x-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                size="sm"
                                className="gap-2"
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    )
                })}
            </div>

            <div className="min-h-[500px]">
                {children}
            </div>
        </div>
    );
}
