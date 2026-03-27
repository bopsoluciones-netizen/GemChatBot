"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, Save, Upload, User, Loader2 } from "lucide-react"

export default function BrandingSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [account, setAccount] = useState<any>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchAccount()
  }, [])

  const fetchAccount = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .or(`creator_id.eq.${user?.id},admin_id.eq.${user?.id}`)
      .single()

    if (data) {
      setAccount(data)
      setLogoPreview(data.logo_url)
    }
    setLoading(false)
  }

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    let logoUrl = account.logo_url

    if (logo) {
      const fileExt = logo.name.split('.').pop()
      const fileName = `${account.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logo)

      if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
          toast.error("Error de configuración: El bucket 'logos' no existe en Supabase Storage.")
        } else {
          toast.error("Error al subir logo: " + uploadError.message)
        }
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName)
        logoUrl = publicUrl
      }
    }

    const { error } = await supabase
      .from("chatbot_accounts")
      .update({
        name: account.name,
        tone: account.tone,
        notification_email: account.notification_email,
        logo_url: logoUrl
      })
      .eq("id", account.id)

    if (error) {
      toast.error("Error al guardar cambios")
    } else {
      toast.success("Configuración guardada")
      fetchAccount()
    }
    setSaving(false)
  }

  if (loading) return <div className="flex h-64 items-center justify-center">Cargando configuración...</div>
  
  if (!account && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-4 bg-zinc-100 rounded-full">
           <Building2 className="h-12 w-12 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold">Sin cuenta asignada</h2>
        <p className="text-zinc-500 text-center max-w-sm">
          No tienes una cuenta vinculada para configurar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Identidad y Marca</h1>
        <p className="text-zinc-500">Configura cómo se verá y comportará tu chatbot ante los clientes.</p>
      </div>

      <form onSubmit={handleUpdateAccount}>
        <div className="grid gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>
                Estos datos se mostrarán en la interfaz del chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Nombre de la Empresa</Label>
                <Input 
                  id="company-name" 
                  value={account.name}
                  onChange={(e) => setAccount({...account, name: e.target.value})}
                  placeholder="Ej. Acme Corp" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notification-email">Email de Notificaciones (Citas)</Label>
                <Input 
                  id="notification-email" 
                  type="email"
                  value={account.notification_email || ""}
                  onChange={(e) => setAccount({...account, notification_email: e.target.value})}
                  placeholder="ventas@tuempresa.com" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Logo de la Empresa
              </CardTitle>
              <CardDescription>
                Se recomienda un archivo cuadrado PNG o JPG de al menos 400x400px.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-zinc-50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="h-8 w-8 text-zinc-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLogo(file)
                        setLogoPreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                  <p className="text-xs text-zinc-500">Máximo 2MB. Fondos transparentes recomendados.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personalidad del Chatbot
              </CardTitle>
              <CardDescription>
                Esto ajusta el tono de las respuestas generadas por la IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="tone">Tono de Voz</Label>
                <Select 
                  value={account.tone} 
                  onValueChange={(val) => setAccount({...account, tone: val})}
                >
                  <SelectTrigger id="tone w-full">
                    <SelectValue placeholder="Selecciona un tono" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amigable">Amigable (Cercano y amable)</SelectItem>
                    <SelectItem value="formal">Formal (Profesional y serio)</SelectItem>
                    <SelectItem value="comercial">Comercial / Persuasivo (Enfocado en ventas)</SelectItem>
                    <SelectItem value="informativo">Informativo (Directo y basado en datos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" className="gap-2" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
