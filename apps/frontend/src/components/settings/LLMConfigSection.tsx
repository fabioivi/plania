'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, Eye, EyeOff, Trash2, Plus, Lock } from "lucide-react"
import { LLMConfig, llmConfigApi } from "@/services/api"
import { toast } from "sonner"

interface LLMConfigItemProps {
  config: LLMConfig
  onDelete: () => void
  onTest: () => void
  onActivate: () => void
  onDeactivate: () => void
  testing: boolean
}

const providerLabels: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (ChatGPT)',
  claude: 'Anthropic Claude',
  grok: 'xAI Grok',
  openrouter: 'OpenRouter (Deepseek Free)'
}

const providerColors: Record<string, string> = {
  gemini: 'text-blue-600',
  openai: 'text-green-600',
  claude: 'text-purple-600',
  grok: 'text-orange-600',
  openrouter: 'text-teal-600',
}

function LLMConfigItem({ config, onDelete, onTest, onActivate, onDeactivate, testing }: LLMConfigItemProps) {
  const providerColor = providerColors[config.provider] || 'text-gray-600'

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <Sparkles className={`h-5 w-5 ${providerColor}`} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{providerLabels[config.provider]}</p>
            {config.isActive && (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Ativo
              </span>
            )}
          </div>
          {config.modelName && (
            <p className="text-xs text-muted-foreground">{config.modelName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testing}
        >
          {testing ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar'
          )}
        </Button>
        {config.isActive ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onDeactivate}
            className="ml-2"
          >
            Desativar
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={onActivate}
            className="ml-2"
          >
            Definir como padrão
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function LLMConfigSection() {
  const [configs, setConfigs] = useState<LLMConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // Form state
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter'>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [modelName, setModelName] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const data = await llmConfigApi.getConfigs()
      setConfigs(data)
    } catch (err: any) {
      console.error('Erro ao carregar configurações:', err)
      toast.error('Erro ao carregar configurações de IA')
    } finally {
      setLoading(false)
    }
  }

  // Load configs on mount
  useEffect(() => {
    loadConfigs()
  }, [])

  const handleSave = async () => {
    if (!apiKey) {
      toast.error('Informe a chave de API')
      return
    }

    try {
      setSaving(true)
      const newConfig = await llmConfigApi.saveConfig({
        provider,
        apiKey,
        modelName: modelName || undefined,
        isActive: true,
      })

      setConfigs([...configs, newConfig])
      toast.success('Configuração salva com sucesso!')

      // Reset form
      setApiKey('')
      setModelName('')
      setShowAddForm(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (configId: string) => {
    try {
      setTestingId(configId)
      const result = await llmConfigApi.testApiKey(configId)

      if (result.success) {
        toast.success('✅ Chave de API válida!')
      } else {
        toast.error(`❌ ${result.message}`)
      }
    } catch (err: any) {
      toast.error('Erro ao testar chave de API')
    } finally {
      setTestingId(null)
    }
  }

  const handleActivate = async (configId: string) => {
    try {
      const activated = await llmConfigApi.activateConfig(configId)
      // update local state: set only the activated config as active
      setConfigs(configs.map(c => ({ ...c, isActive: c.id === activated.id })))
      toast.success('Configuração definida como padrão')
    } catch (err: any) {
      console.error('Erro ao ativar configuração:', err)
      toast.error('Erro ao definir configuração como padrão')
    }
  }

  const handleDeactivate = async (configId: string) => {
    try {
      // Set isActive = false for the config
      await llmConfigApi.updateConfig(configId, { isActive: false })
      setConfigs(configs.map(c => c.id === configId ? { ...c, isActive: false } : c))
      toast.success('Configuração desativada')
    } catch (err: any) {
      console.error('Erro ao desativar configuração:', err)
      toast.error('Erro ao desativar configuração')
    }
  }

  const handleDelete = async (configId: string) => {
    if (!confirm('Tem certeza que deseja remover esta configuração?')) {
      return
    }

    try {
      await llmConfigApi.deleteConfig(configId)
      setConfigs(configs.filter(c => c.id !== configId))
      toast.success('Configuração removida com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao remover configuração')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <p className="text-sm text-muted-foreground mt-2">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Existing configs */}
      {configs.length > 0 && (
        <div className="space-y-2">
          {configs.map(config => (
            <LLMConfigItem
              key={config.id}
              config={config}
              onDelete={() => handleDelete(config.id)}
              onTest={() => handleTest(config.id)}
              onActivate={() => handleActivate(config.id)}
              onDeactivate={() => handleDeactivate(config.id)}
              testing={testingId === config.id}
            />
          ))}
        </div>
      )}

      {/* Add new config */}
      {!showAddForm ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Provedor de IA
        </Button>
      ) : (
        <div className="border border-slate-200 dark:border-border rounded-2xl p-6 space-y-6 bg-slate-50/50 dark:bg-secondary/10 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-border/50 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-foreground">Nova Configuração</h4>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Adicione um modelo de linguagem</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false)
                setApiKey('')
                setModelName('')
              }}
              className="hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-slate-700 dark:text-slate-200 font-medium">Provedor</Label>
              <Select value={provider} onValueChange={(v: any) => setProvider(v)}>
                <SelectTrigger id="provider" className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      Google Gemini
                    </div>
                  </SelectItem>
                  <SelectItem value="openrouter">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-teal-600" />
                      OpenRouter (Deepseek Free)
                    </div>
                  </SelectItem>
                  <SelectItem value="openai">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      OpenAI (ChatGPT)
                    </div>
                  </SelectItem>
                  <SelectItem value="claude">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      Anthropic Claude
                    </div>
                  </SelectItem>
                  <SelectItem value="grok">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      xAI Grok
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-slate-700 dark:text-slate-200 font-medium">Chave de API</Label>
              <div className="relative group">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={saving}
                  className="h-11 pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelName" className="text-slate-700 dark:text-slate-200 font-medium">Modelo (opcional)</Label>
              <Input
                id="modelName"
                placeholder="gemini-pro, gpt-4, claude-3-opus..."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                disabled={saving}
                className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50">
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Sua chave de API é criptografada e armazenada com segurança
              </AlertDescription>
            </Alert>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {configs.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Nenhum provedor de IA configurado</p>
          <p className="text-xs">Adicione uma chave de API para começar</p>
        </div>
      )}
    </div>
  )
}
