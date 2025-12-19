'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Note: Removed isMounted check to allow instant render (SSR/Hydration)
    // This may cause a small layout shift on sidebar state but prevents white screen.

    // Initialize state from local storage on mount to avoid hydration mismatch
    useEffect(() => {
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') {
            setIsSidebarCollapsed(true);
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 dark:bg-background">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={toggleSidebar}
                />

                {/* Mobile Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                <div
                    className={cn(
                        "min-h-screen flex flex-col transition-all duration-300",
                        isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
                    )}
                >
                    <DashboardHeader onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                    <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full animate-fade-in transition-all">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
