"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Link2, Copy, Check, ExternalLink } from "lucide-react"

export default function LinkGeneratorPage() {
  const [account, setAccount] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: accData } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .or(`creator_id.eq.${user?.id},admin_id.eq.${user?.id}`)
      .single()
    setAccount(accData)
  }

  const copyToClipboard = () => {
    if (!account) return
    const url = `${window.location.origin}/chat/${account.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success("Link copiado al portapapeles")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!account && typeof window !== 'undefined') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Link2 className="h-12 w-12 text-zinc-300" />
        <h2 className="text-xl font-bold">Sin cuenta asignada</h2>
        <p className="text-zinc-500 text-center max-w-sm">
          No se encontró un chatbot vinculado a tu usuario. Contacta con soporte técnico.
        </p>
      </div>
    )
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${account.slug}`

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tu Link Público</h1>
        <p className="text-zinc-500">Comparte este link con tus clientes para que puedan chatear con tu bot.</p>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Acceso Directo
          </CardTitle>
          <CardDescription className="text-blue-100">
            Cualquier usuario con este link podrá interactuar con tu empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              readOnly 
              value={publicUrl}
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus-visible:ring-offset-blue-600"
            />
            <Button 
              variant="secondary" 
              onClick={copyToClipboard}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button asChild variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10">
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Probar Chat Ahora
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Botones Web</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500 mb-4">Usa este link en tus botones de "Contacto" o "Soporte".</p>
            <code className="text-[10px] bg-zinc-100 dark:bg-zinc-800 p-2 rounded block whitespace-pre">
              {`<a href="${publicUrl}" target="_blank">Chatea con nosotros</a>`}
            </code>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Códigos QR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">Puedes generar un código QR con este link para tus tarjetas o menús físicos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
