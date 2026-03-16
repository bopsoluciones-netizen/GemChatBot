"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MessageSquare, Calendar, ExternalLink, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: accData } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .eq("creator_id", user?.id)
      .single()

    if (accData) {
      setAccount(accData)
      const { data } = await supabase
        .from("conversations")
        .select("*, leads(full_name)")
        .eq("account_id", accData.id)
        .order("created_at", { ascending: false })
      
      setConversations(data || [])
    }
    setLoading(false)
  }

  if (loading) return <div>Cargando conversaciones...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversaciones</h1>
          <p className="text-zinc-500">Historial de interacciones entre tus clientes y el chatbot.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.info("Exportación de conversaciones disponible próximamente")}>
           <Download className="h-4 w-4" />
           Exportar Historial
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead / Usuario</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Iniciada el</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">No hay conversaciones registradas.</TableCell>
              </TableRow>
            ) : conversations.map((conv) => (
              <TableRow key={conv.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-zinc-400" />
                    {conv.leads?.full_name || "Usuario Anónimo"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={conv.status === 'active' ? "default" : "secondary"}>
                    {conv.status === 'active' ? "Activa" : "Completada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">
                  {new Date(conv.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function toast(arg0: { info: string }) {
  throw new Error("Function not implemented.")
}
