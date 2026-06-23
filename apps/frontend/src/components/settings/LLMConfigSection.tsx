'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Sparkles, Eye, EyeOff, Trash2, Plus, Lock, Pencil } from "lucide-react"
import { LLMConfig, llmConfigApi } from "@/services/api"
import { toast } from "sonner"

interface LLMConfigItemProps {
  config: LLMConfig
  onDelete: () => void
  onEdit: () => void
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

function LLMConfigItem({ config, onDelete, onEdit, onTest, onActivate, onDeactivate, testing }: LLMConfigItemProps) {
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
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-1"
          title="Editar"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Excluir"
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
  const [additionalConfig, setAdditionalConfig] = useState<any>({})
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [openRouterModels, setOpenRouterModels] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null)

  // Fetch OpenRouter models when provider is selected or refresh requested
  const fetchOpenRouterModels = async (key?: string) => {
    // Only fetch if key is provided or we are checking without key (public endpoint attempt)
    // But our backend requires auth usually. The backend method uses stored key if not provided.
    try {
      setLoadingModels(true);
      const models = await llmConfigApi.getOpenRouterModels(key);
      setOpenRouterModels(models);
      // If current modelName is not in list and we have models, maybe partial match or keep custom
    } catch (err) {
      console.error('Failed to fetch OpenRouter models', err);
      toast.error('Erro ao buscar modelos do OpenRouter');
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    if (provider === 'openrouter' && showAddForm) {
      fetchOpenRouterModels(apiKey);
    }
  }, [provider, showAddForm]);

  // When API key changes significantly (on blur maybe? or just manual refresh button)
  // for now let's add a refresh button next to model select

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
    // If editing, API key is optional (keep existing). If creating, it's required.
    if (!editingConfigId && !apiKey) {
      toast.error('Informe a chave de API')
      return
    }

    try {
      setSaving(true)

      if (editingConfigId) {
        // Update existing
        await llmConfigApi.updateConfig(editingConfigId, {
          apiKey: apiKey || undefined, // Only send if user typed something
          modelName: modelName || undefined,
          isActive: true,
          additionalConfig: Object.keys(additionalConfig).length > 0 ? additionalConfig : undefined
        })

        // Reload configs to get latest state (simple way)
        await loadConfigs()
        toast.success('Configuração atualizada com sucesso!')
      } else {
        // Create new
        const newConfig = await llmConfigApi.saveConfig({
          provider,
          apiKey,
          modelName: modelName || undefined,
          isActive: true,
          additionalConfig: Object.keys(additionalConfig).length > 0 ? additionalConfig : undefined
        })
        setConfigs([newConfig, ...configs.filter(c => c.id !== newConfig.id)]) // Ensure unique? Actually backend deactivates others.
        // It's safer to reload or just append. 
        // If we created a new active one, others became inactive. Local state might be stale regarding isActive of others.
        // Let's iterate to fix local state or just reload.
        // For simplicity/correctness, let's reload.
        await loadConfigs()
        toast.success('Configuração salva com sucesso!')
      }

      // Reset form
      setApiKey('')
      setModelName('')
      setAdditionalConfig({})
      setShowAddForm(false)
      setEditingConfigId(null)
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

  const handleEdit = (config: LLMConfig) => {
    setEditingConfigId(config.id)
    setProvider(config.provider as any)
    setApiKey('') // Empty means verify/keep existing
    setModelName(config.modelName || '')
    setAdditionalConfig(config.additionalConfig || {})
    setShowAddForm(true)
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
              onEdit={() => handleEdit(config)}
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
              <h4 className="font-bold text-slate-900 dark:text-foreground">
                {editingConfigId ? 'Editar Configuração' : 'Nova Configuração'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                {editingConfigId ? 'Atualize os detalhes do provedor' : 'Adicione um modelo de linguagem'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddForm(false)
                setApiKey('')
                setModelName('')
                setAdditionalConfig({})
                setEditingConfigId(null)
              }}
              className="hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              Cancelar
            </Button>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-slate-700 dark:text-slate-200 font-medium">Provedor</Label>
              <Select value={provider} onValueChange={(v: any) => {
                setProvider(v);
                // Set default recommended model based on provider
                if (v === 'gemini') setModelName('gemini-2.0-flash');
                else if (v === 'openai') setModelName('gpt-4o');
                else if (v === 'claude') setModelName('claude-3-sonnet-20240229');
                else if (v === 'openrouter') setModelName('google/gemini-2.0-flash-lite-preview-02-05:free');
                else setModelName('');
              }}
                disabled={!!editingConfigId}
              >
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
                  placeholder={editingConfigId ? "Deixe em branco para manter a atual" : "sk-..."}
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
              <div className="flex justify-between items-center">
                <Label htmlFor="modelName" className="text-slate-700 dark:text-slate-200 font-medium">Modelo</Label>
                {provider === 'openrouter' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchOpenRouterModels(apiKey)}
                    disabled={loadingModels}
                    className="h-6 text-xs"
                    type="button"
                    title="Atualizar lista de modelos"
                  >
                    <Sparkles className={`h-3 w-3 mr-1 ${loadingModels ? 'animate-spin' : ''}`} />
                    Atualizar Lista
                  </Button>
                )}
              </div>
              <div className="relative">
                <Select
                  value={modelName}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setModelName('')
                    } else {
                      setModelName(value)
                    }
                  }}
                >
                  <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <SelectValue placeholder="Selecione ou digite o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingModels && (
                      <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Carregando modelos...
                      </div>
                    )}
                    {provider === 'gemini' && (
                      <>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recomendado)</SelectItem>
                        <SelectItem value="gemini-2.0-pro-exp">Gemini 2.0 Pro Experimental</SelectItem>
                        <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                      </>
                    )}
                    {provider === 'openai' && (
                      <>
                        <SelectItem value="gpt-4o">GPT-4o (Recomendado)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </>
                    )}
                    {provider === 'claude' && (
                      <>
                        <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                      </>
                    )}
                    {provider === 'openrouter' && (
                      <>
                        {openRouterModels.length > 0 ? (
                          openRouterModels.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="google/gemini-2.0-flash-lite-preview-02-05:free">Gemini 2.0 Flash Lite (Free)</SelectItem>
                            <SelectItem value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</SelectItem>
                            <SelectItem value="deepseek/deepseek-chat:free">DeepSeek Chat (Free)</SelectItem>
                            <SelectItem value="mistralai/mistral-7b-instruct:free">Mistral 7B (Free)</SelectItem>
                          </>
                        )}
                      </>
                    )}
                    {provider === 'grok' && (
                      <>
                        <SelectItem value="grok-1">Grok-1</SelectItem>
                      </>
                    )}
                    <SelectItem value="custom">Outro (Digitar manualmente)</SelectItem>
                  </SelectContent>
                </Select>
                {/* Fallback Input if custom or empty/unmatched */}
                {(() => {
                  const presets: Record<string, string[]> = {
                    gemini: ['gemini-2.0-flash', 'gemini-2.0-pro-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
                    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                    claude: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
                    openrouter: ['google/gemini-2.0-flash-lite-preview-02-05:free', 'deepseek/deepseek-r1:free', 'deepseek/deepseek-chat:free', 'mistralai/mistral-7b-instruct:free'],
                    grok: ['grok-1']
                  };
                  const currentPresets = presets[provider] || [];
                  const isPreset = currentPresets.includes(modelName);

                  if (!modelName || !isPreset) {
                    return (
                      <Input
                        id="modelNameCustom"
                        placeholder="Nome do modelo customizado..."
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        disabled={saving}
                        className="mt-2 h-11 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {provider === 'gemini' && (
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-border/50">
                <h5 className="font-semibold text-sm text-slate-900 dark:text-foreground">Parâmetros Avançados</h5>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-slate-700 dark:text-slate-200 text-xs font-medium flex justify-between">
                      Temperatura
                      <span className="text-slate-500">{additionalConfig.temperature ?? 0.7}</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                      value={additionalConfig.temperature ?? 0.7}
                      onChange={(e) => setAdditionalConfig({ ...additionalConfig, temperature: parseFloat(e.target.value) })}
                    />
                    <p className="text-[10px] text-slate-500">Mais criativo (1.0) vs Mais preciso (0.0)</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topP" className="text-slate-700 dark:text-slate-200 text-xs font-medium flex justify-between">
                      Top P
                      <span className="text-slate-500">{additionalConfig.topP ?? 0.95}</span>
                    </Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                      value={additionalConfig.topP ?? 0.95}
                      onChange={(e) => setAdditionalConfig({ ...additionalConfig, topP: parseFloat(e.target.value) })}
                    />
                    <p className="text-[10px] text-slate-500">Diversidade de tokens</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topK" className="text-slate-700 dark:text-slate-200 text-xs font-medium">Top K (Opcional)</Label>
                    <Input
                      id="topK"
                      type="number"
                      placeholder="Ex: 40"
                      value={additionalConfig.topK || ''}
                      onChange={(e) => setAdditionalConfig({ ...additionalConfig, topK: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="h-9 bg-slate-50 dark:bg-slate-900/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens" className="text-slate-700 dark:text-slate-200 text-xs font-medium">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      placeholder="Ex: 8192"
                      value={additionalConfig.maxTokens || ''}
                      onChange={(e) => setAdditionalConfig({ ...additionalConfig, maxTokens: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="h-9 bg-slate-50 dark:bg-slate-900/50"
                    />
                  </div>
                </div>
              </div>
            )}


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
                  {editingConfigId ? 'Atualizar Configuração' : 'Salvar Configuração'}
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
