import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TestTube, Zap } from "lucide-react"
import { Header } from "@/components/layout/header"

export default function TestHotReloadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-16 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <TestTube className="h-16 w-16 text-green-500" />
              <Zap className="h-12 w-12 text-yellow-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-4">🔥 Hot Reload CONFIRMADO!</h1>
            <p className="text-muted-foreground mb-6">
              Modificado em {new Date().toLocaleTimeString()} - Atualização instantânea via volumes!
            </p>
            <div className="flex flex-col gap-2 text-sm text-left bg-muted p-4 rounded-lg">
              <p>✅ Novo arquivo detectado automaticamente</p>
              <p>✅ Modificações em tempo real (HOT RELOAD)</p>
              <p>✅ Multi-stage Dockerfile funcionando</p>
              <p>✅ Volume mounts (.:/app) substituíram Docker Watch</p>
              <p>✅ Next.js native file watching ativo</p>
            </div>
            <Button className="mt-6 bg-green-600 hover:bg-green-700">🚀 Docker Otimizado!</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
