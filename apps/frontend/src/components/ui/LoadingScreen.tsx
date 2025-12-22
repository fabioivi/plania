import React from 'react';
import { BrainCircuit } from 'lucide-react';

export function LoadingScreen() {
    return (
        <div className="fixed inset-0 w-full h-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[9999] pointer-events-none">
            {/* Debug Border to confirm container size */}
            <div className="relative flex flex-col items-center">

                {/* Icon Box - Bouncing Animation */}
                <div className="relative z-20 p-4 bg-indigo-600 rounded-2xl shadow-xl animate-bounce">
                    <BrainCircuit className="w-10 h-10 text-white" />
                </div>

                {/* Text - Bouncing with Logo */}
                <h1 className="relative z-20 mt-8 text-2xl font-black text-slate-900 dark:text-white tracking-tight animate-bounce">
                    Plania
                </h1>
            </div>
        </div>
    );
}
