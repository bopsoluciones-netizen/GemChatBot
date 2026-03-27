"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Globe, 
  Youtube,
  FileCode,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function KnowledgeBasePage() {
  const [sources, setSources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [account, setAccount] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // URL form state
  const [url, setUrl] = useState("")
  const [urlTitle, setUrlTitle] = useState("")
  const [urlType, setUrlType] = useState<"url" | "youtube">("url")

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    // Fetch account
    const { data: accData, error: accError } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .or(`creator_id.eq.${user.id},admin_id.eq.${user.id}`)
      .single()

    if (accError) {
      console.error("Error fetching account:", accError)
    }

    if (accData) {
      setAccount(accData)
      // Fetch sources
      const { data: sourcesData } = await supabase
        .from("knowledge_sources")
        .select("*")
        .eq("account_id", accData.id)
        .order("created_at", { ascending: false })
      
      setSources(sourcesData || [])
    }
    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!account) {
      toast.error("No se encontró una cuenta de chatbot vinculada")
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const type = fileExt === 'pdf' ? 'pdf' : fileExt === 'docx' ? 'docx' : 'other'
    
    if (type === 'other') {
      toast.error("Solo se permiten archivos PDF y DOCX")
      setUploading(false)
      return
    }

    const fileName = `${account.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('knowledge')
      .upload(fileName, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      if (uploadError.message === 'Bucket not found') {
        toast.error("Error de configuración: El bucket 'knowledge' no existe en Supabase Storage.")
      } else {
        toast.error(`Error al subir archivo: ${uploadError.message}`)
      }
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('knowledge')
        .getPublicUrl(fileName)

      // In a real app, you would call a server function here to extract text.
      // For this base version, we'll now call the extraction API.
      const { data: { user } } = await supabase.auth.getUser()
      
      let content = "Texto procesándose..."
      try {
        const extractRes = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, fileUrl: publicUrl })
        })

        if (!extractRes.ok) {
           const errorData = await extractRes.json().catch(() => ({ error: "Error de servidor al extraer texto" }))
           throw new Error(errorData.error || `Error ${extractRes.status}`)
        }

        const extractData = await extractRes.json()
        if (extractData.text) {
          content = extractData.text
        }
      } catch (err) {
        console.error("Failed to extract text:", err)
      }

      const { error: dbError } = await supabase
        .from("knowledge_sources")
        .insert([{
          account_id: account.id,
          title: file.name,
          source_type: type,
          source_url: publicUrl,
          content: content
        }])

      if (dbError) {
        console.error("Error registering source details:", {
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint,
          code: dbError.code,
          supabaseError: dbError
        })
        toast.error(`Error al registrar fuente: ${dbError.message || "Error de permisos o esquema"}`)
      } else {
        toast.success("Archivo subido exitosamente")
        fetchData()
      }
    }
    setUploading(false)
  }

  const handleAddUrl = async () => {
    if (!urlTitle.trim()) {
      toast.error("Por favor ingresa un título para el link")
      return
    }

    if (!url.trim()) {
      toast.error("Por favor ingresa una URL válida")
      return
    }

    // Basic URL validation
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error();
      }
      new URL(url);
    } catch {
      toast.error("La URL debe ser válida y comenzar con http:// o https://")
      return
    }

    if (!account) {
      toast.error("No se encontró una cuenta de chatbot vinculada")
      return
    }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
       toast.error("Sesión de usuario no encontrada")
       setUploading(false)
       return
    }

    let content = `Contenido de ${url} se indexará próximamente.`
    try {
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "url", url })
      })

      if (!extractRes.ok) {
         const errorData = await extractRes.json().catch(() => ({ error: "Error de servidor al extraer URL" }))
         toast.error(errorData.error || "No se pudo extraer el contenido del link")
      } else {
        const extractData = await extractRes.json()
        if (extractData.text) {
          content = extractData.text
        }
      }
    } catch (err) {
       console.error("Failed to extract URL text:", err)
    }

    const { error } = await supabase
      .from("knowledge_sources")
      .insert([{
        account_id: account.id,
        title: urlTitle,
        source_type: urlType,
        source_url: url,
        content: content
      }])

    if (error) {
      console.error("Error saving link details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        supabaseError: error,
        account_id: account.id,
        title: urlTitle,
        source_type: urlType,
        source_url: url
      })
      toast.error(`Error al guardar link: ${error.message || "Error de permisos o esquema"}`)
    } else {
      toast.success("Link agregado exitosamente")
      setIsModalOpen(false)
      setUrl("")
      setUrlTitle("")
      fetchData()
    }
    setUploading(false)
  }

  const deleteSource = async (id: string) => {
    if (!confirm("¿Eliminar esta fuente de conocimiento?")) return

    const { error } = await supabase
      .from("knowledge_sources")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Error al eliminar")
    } else {
      toast.success("Fuente eliminada")
      fetchData()
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'pdf': return <FileText className="h-5 w-5 text-rose-500" />
      case 'docx': return <FileCode className="h-5 w-5 text-blue-500" />
      case 'url': return <Globe className="h-5 w-5 text-emerald-500" />
      case 'youtube': return <Youtube className="h-5 w-5 text-red-500" />
      default: return <LinkIcon className="h-5 w-5" />
    }
  }

  if (loading) return <div>Cargando base de conocimientos...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de Conocimiento</h1>
          <p className="text-zinc-500">Carga documentos y links para entrenar a tu chatbot.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Fuente
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Conocimiento</DialogTitle>
              <DialogDescription>
                Sube un archivo o pega un link para que el chatbot aprenda de él.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Archivo</TabsTrigger>
                <TabsTrigger value="link">Link Web</TabsTrigger>
              </TabsList>
              <TabsContent value="file" className="space-y-4 pt-4">
                <div className="grid gap-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">Subiendo archivo...</span>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-zinc-400" />
                        <span className="text-sm font-medium">Haz clic para buscar o arrastra un PDF/DOCX</span>
                        <span className="text-xs text-zinc-500">Máximo 10MB</span>
                        <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} />
                      </label>
                    )}
                  </div>
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>El procesamiento del texto puede tardar unos segundos después de la subida.</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="link" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="url-type">Tipo de Link</Label>
                    <Tabs value={urlType} onValueChange={(v: any) => setUrlType(v)}>
                       <TabsList className="grid w-fit grid-cols-2">
                        <TabsTrigger value="url">Web</TabsTrigger>
                        <TabsTrigger value="youtube">YouTube</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url-title">Nombre / Título</Label>
                    <Input id="url-title" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Ej. Lista de Precios 2024" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://tuweb.com/servicios" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddUrl} disabled={uploading}>Guardar Link</Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.length === 0 ? (
          <div className="col-span-full py-20 text-center border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-dashed">
            <Database className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">Aún no hay fuentes cargadas.</p>
            <Button variant="link" onClick={() => setIsModalOpen(true)}>Agrega tu primera fuente aquí</Button>
          </div>
        ) : sources.map((source) => (
          <Card key={source.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="rounded-md bg-zinc-100 dark:bg-zinc-800 p-2">
                {getIcon(source.source_type)}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => deleteSource(source.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-bold truncate mb-1">{source.title}</CardTitle>
              <CardDescription className="text-xs truncate">{source.source_url || "Archivo subido"}</CardDescription>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                  {new Date(source.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  Procesado
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function Database(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  )
}
