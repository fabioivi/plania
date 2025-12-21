'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body className="bg-slate-50 dark:bg-slate-950 flex items-center justify-center min-h-screen p-4 font-sans text-slate-900 dark:text-slate-100">
                <div className="max-w-md w-full text-center space-y-6">
                    <h1 className="text-6xl font-black text-indigo-600 dark:text-indigo-500">500</h1>
                    <h2 className="text-3xl font-bold tracking-tight">Algo deu errado!</h2>
                    <p className="text-muted-foreground">
                        Ocorreu um erro crítico no sistema. Nossa equipe já foi notificada.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Tentar novamente
                    </button>
                </div>
            </body>
        </html>
    );
}
