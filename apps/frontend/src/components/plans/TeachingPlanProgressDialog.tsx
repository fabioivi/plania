'use client'

import { useState, useEffect } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Upload, AlertTriangle, Clock, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"
import { useSendTeachingPlan } from "@/hooks/api"
import { useSSE } from "@/hooks/shared/useSSE"

interface TeachingPlanProgressDialogProps {
    planId: string
    disabled?: boolean
    onSuccess?: () => void
}

export function TeachingPlanProgressDialog({
    planId,
    disabled = false,
    onSuccess
}: TeachingPlanProgressDialogProps) {
    const [open, setOpen] = useState(false)
    const { mutate: sendPlan, isPending: isStarting } = useSendTeachingPlan()
    const { state: syncState, startSync, updateProgress, complete, error, reset } = useSyncState('upload')
    const [isProcessing, setIsProcessing] = useState(false)

    // SSE logic
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    const sseUrl = `${baseUrl}/sync/events?token=${token}`

    const { isConnected, connect, disconnect } = useSSE({
        url: sseUrl,
        enabled: false, // Connect manually
        autoConnect: false,
        onMessage: (data: any) => {
            // Filter only if needed, but teaching plan events are generic "SyncProgress"
            if (data.userId && !isProcessing) return // Ignore if not processing

            if (data.stage === 'starting') {
                updateProgress(0, data.message || 'Iniciando...')
            } else if (data.stage === 'processing') {
                // Estimate progress or just show processing
                updateProgress(50, data.message || 'Processando...')
            } else if (data.stage === 'completed') {
                complete(data.message || 'Plano enviado com sucesso!')
                setIsProcessing(false)
                disconnect()
                onSuccess?.()
            } else if (data.stage === 'error') {
                error(data.message || 'Erro ao enviar plano')
                setIsProcessing(false)
                disconnect()
            }
        },
        onError: (err) => {
            console.error('SSE Error:', err)
            // Only error if we were expecting connection
            if (isProcessing) {
                // Don't fail immediately on SSE error, maybe just log?
                // But if connection drops, we lose progress updates.
            }
        }
    })

    const handleSend = () => {
        reset()
        setIsProcessing(true)
        startSync(1, 'Iniciando conexão...')

        // 1. Connect to SSE to listen for updates
        connect()

        // 2. Trigger the job
        sendPlan(planId, {
            onError: (err: any) => {
                setIsProcessing(false)
                disconnect()
                error(err.message || 'Falha ao iniciar envio')
                toast.error('Erro ao iniciar envio: ' + err.message)
            },
            onSuccess: () => {
                // Job started successfully, now we wait for SSE events
                updateProgress(10, 'Aguardando processamento...')
            }
        })
    }

    // Cleanup
    useEffect(() => {
        if (!open) {
            if (isProcessing) {
                disconnect()
                setIsProcessing(false)
            }
            reset()
        }
    }, [open, reset, disconnect, isProcessing])

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    disabled={disabled || isProcessing}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                        </>
                    ) : syncState?.status === 'completed' ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            Plano Enviado!
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4" />
                            Enviar Plano para IFMS
                        </>
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {!isProcessing && !syncState && (
                            <>
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Confirmar Envio
                            </>
                        )}
                        {isProcessing && (
                            <>Enviando Plano...</>
                        )}
                        {!isProcessing && syncState?.status === 'completed' && (
                            <>Envio Concluído</>
                        )}
                        {!isProcessing && syncState?.status === 'error' && (
                            <>Erro no Envio</>
                        )}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                        {!isProcessing && !syncState && (
                            <>
                                <p>
                                    Você está prestes a enviar este plano de ensino para o sistema acadêmico do IFMS.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-semibold mb-1">⏱️ O processo pode levar alguns segundos.</p>
                                            <ul className="list-disc list-inside space-y-1 ml-2">
                                                <li>O sistema preencherá os campos automaticamente.</li>
                                                <li>Você verá o progresso em tempo real.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-orange-600 font-medium">
                                    ⚠️ ATENÇÃO: Esta ação irá <strong>substituir</strong> o conteúdo existente no sistema acadêmico.
                                </p>
                            </>
                        )}

                        {(isProcessing || syncState) && (
                            <SyncProgressDisplay
                                state={syncState}
                                isConnected={isConnected}
                                className="mt-4"
                            />
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {(!syncState || (syncState.status !== 'completed' && !isProcessing)) && (
                        <>
                            <AlertDialogCancel disabled={isProcessing}>
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSend}
                                disabled={isProcessing}
                                className="bg-primary"
                            >
                                {isStarting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Iniciando...
                                    </>
                                ) : (
                                    'Sim, Enviar Agora'
                                )}
                            </AlertDialogAction>
                        </>
                    )}
                    {(syncState?.status === 'completed' || syncState?.status === 'error') && !isProcessing && (
                        <Button onClick={() => setOpen(false)} className="w-full">
                            Fechar
                        </Button>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
