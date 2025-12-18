'use client';

import React from 'react';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
    onMenuClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : 'Professor';

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between transition-all duration-200">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 mr-4 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <h2 className="text-lg font-bold text-slate-700 hidden sm:block">
                    Área do Professor
                </h2>
            </div>

            <div className="flex items-center space-x-4 sm:space-x-6">
                <button className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="flex items-center space-x-3 pl-6 border-l border-slate-100">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900">{user?.name || 'Usuário'}</p>
                        <p className="text-xs font-semibold text-slate-400 truncate max-w-[150px]">{user?.email}</p>
                    </div>
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                        {firstName[0]}
                    </div>
                </div>
            </div>
        </header>
    );
};
