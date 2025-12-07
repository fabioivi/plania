'use client'

import { useState } from 'react'
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
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Upload, AlertTriangle, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react"
import { academicApi, DiaryContent } from "@/services/api"
import { toast } from "sonner"

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
  onComplete,
}: SendProgressDialogProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentItem, setCurrentItem] = useState('')
  const [succeeded, setSucceeded] = useState(0)
  const [failed, setFailed] = useState(0)
  const [errors, setErrors] = useState<Array<{ contentId: string; message: string }>>([])

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
      toast.error('Nenhum conteúdo para enviar')
      return
    }

    setSending(true)
    setProgress(0)
    setSucceeded(0)
    setFailed(0)
    setErrors([])

    try {
      // Enviar em lote via backend
      const result = await academicApi.sendDiaryContentBulkToSystem(diaryId, contentIds)

      setProgress(100)
      setSucceeded(result.succeeded)
      setFailed(result.failed)

      // Coletar erros
      const errorList = result.results
        .filter(r => !r.success)
        .map(r => ({ contentId: r.contentId, message: r.message || 'Erro desconhecido' }))
      setErrors(errorList)

      if (result.succeeded > 0) {
        toast.success(`${result.succeeded} conteúdo(s) enviado(s) com sucesso!`)
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} conteúdo(s) falharam`)
      }

      // Aguardar um pouco antes de fechar
      if (result.failed === 0) {
        setTimeout(() => {
          setOpen(false)
          onComplete?.()
        }, 2000)
      }
    } catch (error: any) {
      console.error('Erro ao enviar conteúdos:', error)
      toast.error(error.response?.data?.message || 'Erro ao enviar conteúdos')
      setErrors([{ contentId: 'GERAL', message: error.message || 'Erro desconhecido' }])
    } finally {
      setSending(false)
    }
  }

  const contentsToSend = getContentsToSend()
  const totalToSend = contentsToSend.length

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          disabled={disabled || contents.length === 0}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Enviar para o Sistema
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {!sending && succeeded === 0 && failed === 0 && (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirmar Envio ao Sistema Acadêmico
              </>
            )}
            {sending && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                Enviando Conteúdos...
              </>
            )}
            {!sending && (succeeded > 0 || failed > 0) && (
              <>
                {failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                Envio Concluído
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!sending && succeeded === 0 && failed === 0 && (
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
                        <li>Tempo estimado: <strong>~{Math.ceil(totalToSend * 3)} segundos</strong> (~3s por item)</li>
                        <li>Haverá delays aleatórios entre os envios (1-3 segundos)</li>
                        <li>Isso simula preenchimento humano e evita sobrecarga no sistema IFMS</li>
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

            {sending && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Progresso</span>
                  <span className="text-muted-foreground">
                    {succeeded + failed} / {totalToSend}
                  </span>
                </div>
                <Progress value={(succeeded + failed) / totalToSend * 100} className="h-2" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Enviados: <strong>{succeeded}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Falharam: <strong>{failed}</strong></span>
                  </div>
                </div>

                {currentItem && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    Enviando: {currentItem}
                  </div>
                )}
              </div>
            )}

            {!sending && (succeeded > 0 || failed > 0) && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Enviados: <strong>{succeeded}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>Falharam: <strong>{failed}</strong></span>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold text-red-800 mb-2">Erros encontrados:</p>
                    <ul className="space-y-2 text-xs text-red-700">
                      {errors.map((err, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-mono">{err.contentId}:</span>
                          <span>{err.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!sending && succeeded === 0 && failed === 0 && (
            <>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSend} className="bg-primary">
                Sim, Enviar Agora
              </AlertDialogAction>
            </>
          )}
          {!sending && (succeeded > 0 || failed > 0) && (
            <Button onClick={() => setOpen(false)} className="w-full">
              Fechar
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
