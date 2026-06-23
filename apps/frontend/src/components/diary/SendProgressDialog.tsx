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
import { Upload, AlertTriangle, Clock, Loader2 } from "lucide-react"
import { DiaryContent } from "@/services/api"
import { toast } from "sonner"
import { SyncProgressDisplay } from "@/components/sync"
import { useSyncState } from "@/hooks/useSyncState"

interface SendProgressDialogProps {
  diaryId: string
  contents: DiaryContent[]
  disabled?: boolean
  onComplete?: () => void
}

export function SendProgressDialog({
  diaryId,
  contents,
  disabled = false,
}: SendProgressDialogProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const { state: syncState, startSync, updateProgress, addItem, complete, error, reset } = useSyncState('upload')

  // Filtrar apenas conteúdos não-cancelados (que não têm antecipação)
  const getContentsToSend = () => {
    const anticipations = contents.filter(c => c.isAntecipation)
    const anticipatedIds = new Set(anticipations.map(a => a.originalContentId))
    return contents.filter(c => !anticipatedIds.has(c.contentId))
  }

  const handleSend = async () => {
    const contentsToSend = getContentsToSend()
    const contentIds = contentsToSend.map(c => c.contentId)

    if (contentIds.length === 0) {
      toast.error('Nada para enviar', { description: 'Selecione ou gere conteúdos primeiro.' })
      return
    }

    console.log('🚀 Iniciando envio de', contentIds.length, 'conteúdos')
    setSending(true)
    startSync(contentIds.length, 'Conectando ao servidor...')

    try {
      // Conectar ao SSE endpoint
      const token = localStorage.getItem('token')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const url = `${API_BASE_URL}/academic/diaries/${diaryId}/content/send-bulk-sse?contentIds=${contentIds.join(',')}&token=${token}`
      console.log('📡 Conectando ao SSE:', url)

      const eventSource = new EventSource(url)

      eventSource.onmessage = (event) => {
        console.log('📨 SSE Message:', event.data)
        const data = JSON.parse(event.data)

        if (data.type === 'progress') {
          console.log('📊 Progresso:', data.current, '/', data.total, '-', data.contentId)
          // Atualizar progresso em tempo real
          const content = contentsToSend.find(c => c.contentId === data.contentId)
          const contentName = content?.date || data.contentId

          // Atualizar progresso e adicionar item
          updateProgress(data.current, `Enviando ${data.current}/${data.total}: ${contentName}`)

          // Adicionar item à lista se tiver sucesso/falha
          if (data.success !== undefined) {
            addItem({
              id: data.contentId,
              name: contentName,
              success: data.success,
              message: data.message || (data.success ? 'Enviado com sucesso' : 'Erro ao enviar'),
            })
          }
        } else if (data.type === 'complete') {
          console.log('✅ Envio completo:', data)
          eventSource.close()

          const items = data.results.map((r: any) => ({
            id: r.contentId,
            name: contentsToSend.find(c => c.contentId === r.contentId)?.date || r.contentId,
            success: r.success,
            message: r.message,
          }))

          complete(
            data.failed === 0
              ? 'Todos os conteúdos foram enviados com sucesso!'
              : `Concluído: ${data.succeeded} enviados, ${data.failed} falhas`,
            items
          )

          if (data.succeeded > 0) {
            toast.success('Envio concluído', {
              description: `${data.succeeded} conteúdo(s) foram enviados com sucesso!`
            })
          }

          if (data.failed > 0) {
            toast.error('Falha no envio', {
              description: `${data.failed} conteúdo(s) falharam ao enviar.`
            })
          }

          setSending(false)

          // Aguardar um pouco antes de fechar (sem chamar onComplete)
          if (data.failed === 0) {
            setTimeout(() => {
              setOpen(false)
              // Nota: removido onComplete() para não disparar download automaticamente
            }, 2000)
          }
        } else if (data.type === 'error') {
          console.error('❌ Erro SSE:', data)
          eventSource.close()
          setSending(false)

          error(
            'Erro ao enviar conteúdos',
            [{
              id: 'ERROR',
              name: 'Erro geral',
              success: false,
              message: data.message || 'Erro desconhecido',
            }]
          )

          toast.error('Erro de processamento', { description: data.message || 'Erro ao enviar conteúdos' })
        }
      }

      eventSource.onerror = (err) => {
        console.error('❌ Erro no SSE:', err)
        eventSource.close()
        setSending(false)

        error(
          'Erro ao enviar conteúdos',
          [{
            id: 'ERROR',
            name: 'Erro de conexão',
            success: false,
            message: 'Erro ao conectar com o servidor',
          }]
        )

        toast.error('Erro de conexão', { description: 'Falha ao conectar com o servidor para envio.' })
      }
    } catch (err: any) {
      console.error('❌ Erro ao enviar conteúdos:', err)
      toast.error('Erro inesperado', {
        description: err.response?.data?.message || 'Ocorreu um erro ao iniciar o envio.'
      })
      setSending(false)

      error(
        'Erro ao enviar conteúdos',
        [{
          id: 'ERROR',
          name: 'Erro geral',
          success: false,
          message: err.response?.data?.message || err.message || 'Erro desconhecido',
        }]
      )
    }
  }

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      reset()
      setSending(false)
    }
  }, [open, reset])

  const contentsToSend = getContentsToSend()
  const totalToSend = contentsToSend.length

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={disabled || contents.length === 0 || sending}
          className="gap-2"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar para o Sistema
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {!sending && !syncState && (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirmar Envio ao Sistema Acadêmico
              </>
            )}
            {sending && (
              <>Enviando Conteúdos...</>
            )}
            {!sending && syncState && (
              <>Envio Concluído</>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!sending && !syncState && (
              <>
                <p>
                  Você está prestes a enviar <strong>{totalToSend} conteúdo(s)</strong> para o sistema acadêmico do IFMS.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">⏱️ Sobre o processo de envio:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>O sistema fará <strong>login uma única vez</strong> e reutilizará a sessão</li>
                        <li>Haverá delays aleatórios entre os envios para simular preenchimento humano</li>
                        <li>Tempo estimado: <strong>~{Math.ceil(totalToSend * 1)} segundos</strong></li>
                        <li>Você pode acompanhar o progresso em tempo real</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <p className="text-orange-600 font-medium">
                  ⚠️ ATENÇÃO: Esta ação irá <strong>substituir</strong> o conteúdo existente no sistema acadêmico.
                </p>
              </>
            )}

            {(sending || syncState) && (
              <SyncProgressDisplay
                state={syncState}
                isConnected={true}
                className="mt-4"
              />
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {(!syncState || syncState.status === 'syncing') && (
            <>
              <AlertDialogCancel disabled={sending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSend}
                disabled={sending}
                className="bg-primary"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Sim, Enviar Agora'
                )}
              </AlertDialogAction>
            </>
          )}
          {syncState?.status === 'completed' && (
            <Button onClick={() => setOpen(false)} className="w-full">
              Fechar
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
