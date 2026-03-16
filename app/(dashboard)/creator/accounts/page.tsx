"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Trash2, 
  Edit,
  Power,
  PowerOff
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountSlug, setNewAccountSlug] = useState("")
  const supabase = createClient()

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Error al cargar cuentas")
    } else {
      setAccounts(data || [])
    }
    setLoading(false)
  }

  const handleCreateAccount = async () => {
    if (!newAccountName || !newAccountSlug) {
      toast.error("Completa todos los campos")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("chatbot_accounts")
      .insert([
        { 
          name: newAccountName, 
          slug: newAccountSlug.toLowerCase().replace(/\s+/g, '-'),
          creator_id: user?.id
        }
      ])
      .select()

    if (error) {
      toast.error("Error al crear cuenta", { description: error.message })
    } else {
      toast.success("Cuenta creada exitosamente")
      setIsCreateOpen(false)
      setNewAccountName("")
      setNewAccountSlug("")
      fetchAccounts()
    }
  }

  const toggleAccountStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("chatbot_accounts")
      .update({ is_active: !currentStatus })
      .eq("id", id)

    if (error) {
      toast.error("Error al actualizar estado")
    } else {
      toast.success(currentStatus ? "Cuenta desactivada" : "Cuenta activada")
      fetchAccounts()
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta? Esta acción no se puede deshacer.")) return

    const { error } = await supabase
      .from("chatbot_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Error al eliminar cuenta")
    } else {
      toast.success("Cuenta eliminada")
      fetchAccounts()
    }
  }

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(search.toLowerCase()) || 
    acc.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cuentas</h1>
          <p className="text-zinc-500">Administra las cuentas de chatbot para tus clientes.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Cuenta</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la empresa para crear su espacio independiente.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input 
                  id="name" 
                  value={newAccountName} 
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Ej. Acme Corp" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">chatbot.ai/</span>
                  <Input 
                    id="slug" 
                    value={newAccountSlug} 
                    onChange={(e) => setNewAccountSlug(e.target.value)}
                    placeholder="acme-corp" 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateAccount}>Crear Cuenta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar cuenta..." 
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
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Creada en</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Cargando...</TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">No se encontraron cuentas.</TableCell>
              </TableRow>
            ) : filteredAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell>
                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-500">/{account.slug}</TableCell>
                <TableCell className="text-zinc-500">
                  {new Date(account.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.open(`/chat/${account.slug}`, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Chat Público
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleAccountStatus(account.id, account.is_active)}>
                        {account.is_active ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4 text-amber-500" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4 text-green-500" />
                            Activar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteAccount(account.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
