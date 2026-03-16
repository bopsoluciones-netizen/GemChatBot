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
import { Input } from "@/components/ui/input"
import { Download, Search, User, Mail, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
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
        .from("leads")
        .select("*")
        .eq("account_id", accData.id)
        .order("created_at", { ascending: false })
      
      setLeads(data || [])
    }
    setLoading(false)
  }

  const handleExport = async () => {
    if (!account) return
    window.open(`/api/export?accountId=${account.id}&type=leads`, '_blank')
  }

  const filteredLeads = leads.filter(l => 
    l.full_name.toLowerCase().includes(search.toLowerCase()) || 
    l.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div>Cargando leads...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Capturados</h1>
          <p className="text-zinc-500">Listado de prospectos interesados que han interactuado con tu chatbot.</p>
        </div>
        <Button onClick={handleExport} className="gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Exportar a Excel
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar por nombre o email..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Origen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No se encontraron leads.</TableCell>
              </TableRow>
            ) : filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {lead.full_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1 text-zinc-600">
                      <Mail className="h-3 w-3" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-600">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs flex items-center gap-1 text-zinc-600">
                    <MapPin className="h-3 w-3" />
                    {lead.city}, {lead.country}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-zinc-500">
                  {new Date(lead.created_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{lead.utm_source || "Chat Directo"}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
