'use client';

import React from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from "next-themes";

interface DashboardHeaderProps {
    onMenuClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const firstName = user?.name ? user.name.split(' ')[0] : 'Professor';

    return (
        <header className="h-20 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-border sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between transition-all duration-200">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 mr-4 text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-secondary rounded-lg transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h2 className="text-lg font-bold text-slate-700 dark:text-foreground hidden sm:block">
                    Área do Professor
                </h2>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 rounded-full transition-all flex items-center justify-center h-10 w-10"
                    aria-label="Alternar tema"
                >
                    <Sun className="h-5 w-5 absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="h-5 w-5 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </button>

                <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 rounded-full transition-all">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-card"></span>
                </button>

                <div className="flex items-center space-x-3 pl-6 border-l border-slate-100 dark:border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-foreground">{user?.name || 'Usuário'}</p>
                        <p className="text-xs font-semibold text-slate-400 dark:text-muted-foreground truncate max-w-[150px]">{user?.email}</p>
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:shadow-none dark:ring-0">
                        {firstName[0]}
                    </div>
                </div>
            </div>
        </header>
    );
};
