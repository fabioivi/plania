'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Settings,
    LogOut,
    BrainCircuit,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobileMenuOpen?: boolean;
    closeMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    toggleSidebar,
    isMobileMenuOpen = false,
    closeMobileMenu
}) => {
    const pathname = usePathname();
    const { logout } = useAuth();

    const menuItems = [
        { label: 'Visão Geral', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Disciplinas', icon: BookOpen, href: '/disciplines' },
        { label: 'Meus Planos', icon: FileText, href: '/plans' },
        { label: 'Configurações', icon: Settings, href: '/settings' },
    ];

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 bg-white dark:bg-card border-r border-slate-200 dark:border-border flex flex-col transition-transform duration-300",
                // Visibility:
                // Mobile: Translate based on isMobileMenuOpen
                // Desktop: Always show (reset translate)
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                // Width
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Brand */}
            <div className={cn(
                "h-20 flex items-center border-b border-slate-50 dark:border-border transition-all duration-300 relative",
                isCollapsed ? "justify-center px-0" : "px-8"
            )}>
                <div className="flex items-center space-x-3">
                    <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm flex-shrink-0">
                        <BrainCircuit className="h-5 w-5 text-white" />
                    </div>
                    <span className={cn(
                        "text-xl font-black text-slate-900 dark:text-foreground tracking-tighter transition-opacity duration-200 whitespace-nowrap",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                        Plania
                    </span>
                </div>

                {/* Mobile Close Button */}
                <button
                    onClick={closeMobileMenu}
                    className="lg:hidden absolute right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-muted-foreground dark:hover:text-foreground transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
                <p className={cn(
                    "px-4 text-xs font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider mb-4 transition-opacity duration-200 whitespace-nowrap",
                    isCollapsed ? "opacity-0 text-center" : "opacity-100"
                )}>
                    Menu
                </p>

                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => isMobileMenuOpen && closeMobileMenu?.()}
                            className={cn(
                                "flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 shadow-sm shadow-indigo-100 dark:shadow-none"
                                    : "text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-secondary hover:text-slate-900 dark:hover:text-foreground",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon className={cn(
                                "h-5 w-5 flex-shrink-0 transition-colors",
                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-muted-foreground group-hover:text-slate-600 dark:group-hover:text-foreground"
                            )} />
                            <span className={cn(
                                "font-semibold transition-opacity duration-200 whitespace-nowrap",
                                isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Toggle Button */}
            <div className="px-4 pb-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="w-full justify-center text-slate-400 dark:text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-border">
                <button
                    onClick={() => {
                        logout();
                        if (isMobileMenuOpen) closeMobileMenu?.();
                    }}
                    className={cn(
                        "flex items-center space-x-3 px-3 py-3 w-full rounded-xl text-slate-600 dark:text-muted-foreground hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group",
                        isCollapsed ? "justify-center" : ""
                    )}
                    title={isCollapsed ? "Sair da Conta" : undefined}
                >
                    <LogOut className="h-5 w-5 text-slate-400 dark:text-muted-foreground group-hover:text-red-500 dark:group-hover:text-red-400 flex-shrink-0" />
                    <span className={cn(
                        "font-semibold transition-all duration-200 whitespace-nowrap",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                    )}>
                        Sair
                    </span>
                </button>
            </div>
        </aside>
    );
};
