"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { CalendarDays, Clock, Ban, Trash2, Plus, Loader2, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, startOfDay, endOfDay, addHours } from "date-fns"
import { es } from "date-fns/locale"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export default function AdminCalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [account, setAccount] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isBlocking, setIsBlocking] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [blockStartHour, setBlockStartHour] = useState("09:00")
  const [blockEndHour, setBlockEndHour] = useState("18:00")
  const [isFullDay, setIsFullDay] = useState(true)
  
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
      .or(`creator_id.eq.${user?.id},admin_id.eq.${user?.id}`)
      .single()

    if (accData) {
      setAccount(accData)
      
      // Fetch blocks
      const { data: blockData } = await supabase
        .from("calendar_blocks")
        .select("*")
        .eq("account_id", accData.id)
      
      setBlocks(blockData || [])

      // Fetch appointments
      const { data: apptData } = await supabase
        .from("appointments")
        .select("*, leads(full_name)")
        .eq("account_id", accData.id)
      
      setAppointments(apptData || [])
    }
    setLoading(false)
  }

  const handleBlockTime = async () => {
    if (!date || !account) return
    
    setIsBlocking(true)
    const start = new Date(date)
    if (isFullDay) {
      start.setHours(0, 0, 0, 0)
    } else {
      const [h, m] = blockStartHour.split(":").map(Number)
      start.setHours(h, m, 0, 0)
    }

    const end = new Date(date)
    if (isFullDay) {
      end.setHours(23, 59, 59, 999)
    } else {
      const [h, m] = blockEndHour.split(":").map(Number)
      end.setHours(h, m, 0, 0)
    }

    const { error } = await supabase
      .from("calendar_blocks")
      .insert([{
        account_id: account.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        reason: isFullDay ? "Día completo bloqueado" : `Bloqueo: ${blockStartHour} - ${blockEndHour}`
      }])

    if (error) {
      toast.error("Error al bloquear tiempo")
    } else {
      toast.success(isFullDay ? "Fecha bloqueada" : "Horario bloqueado")
      fetchData()
    }
    setIsBlocking(false)
  }

  const saveAvailability = async () => {
    if (!account) return
    setSavingSettings(true)
    
    const { error } = await supabase
      .from("chatbot_accounts")
      .update({ working_hours: account.working_hours })
      .eq("id", account.id)

    if (error) {
      toast.error("Error al guardar disponibilidad")
    } else {
      toast.success("Disponibilidad guardada correctamente")
      fetchData()
    }
    setSavingSettings(false)
  }

  const updateWorkingDay = (day: string, field: string, value: any) => {
    const updated = { ...account.working_hours }
    updated[day] = { ...updated[day], [field]: value }
    setAccount({ ...account, working_hours: updated })
  }

  const deleteBlock = async (id: string) => {
    const { error } = await supabase
      .from("calendar_blocks")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Error al eliminar bloqueo")
    } else {
      toast.success("Bloqueo eliminado")
      fetchData()
    }
  }

  if (loading) return <div className="flex h-64 items-center justify-center">Cargando calendario...</div>

  if (!account && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-4 bg-rose-50 rounded-full">
           <CalendarDays className="h-12 w-12 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold">Sin cuenta asignada</h2>
        <p className="text-zinc-500 text-center max-w-sm">
          No tienes acceso a un calendario todavía. Contacta con el administrador.
        </p>
      </div>
    )
  }

  const selectedDateAppointments = appointments.filter(a => 
    date && format(new Date(a.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  )

  const isDateBlocked = blocks.some(b => 
    date && format(new Date(b.start_time), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendario de Citas</h1>
          <p className="text-zinc-500">Gestiona tu disponibilidad y revisa las citas agendadas.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-5 lg:col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Selecciona una Fecha</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center p-0 pb-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border-0"
              locale={es}
            />
          </CardContent>
        </Card>

        <div className="md:col-span-7 lg:col-span-8 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {date ? format(date, "PPPP", { locale: es }) : "Selecciona una fecha"}
                </CardTitle>
                <CardDescription>Eventos y disponibilidad para este día.</CardDescription>
              </div>
              {date && (
                <Dialog>
                  <DialogTrigger 
                    render={
                      <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" disabled={isBlocking}>
                        <Ban className="mr-2 h-4 w-4" />
                        Bloquear Tiempo
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bloquear disponibilidad</DialogTitle>
                      <DialogDescription>
                        Selecciona el rango de tiempo que deseas bloquear para el {format(date, "PPP", { locale: es })}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-2">
                        <Switch id="full-day" checked={isFullDay} onCheckedChange={(checked: boolean) => setIsFullDay(checked)} />
                        <Label htmlFor="full-day">Bloquear día completo</Label>
                      </div>
                      
                      {!isFullDay && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Hora Inicio</Label>
                            <Input type="time" value={blockStartHour} onChange={(e) => setBlockStartHour(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Hora Fin</Label>
                            <Input type="time" value={blockEndHour} onChange={(e) => setBlockEndHour(e.target.value)} />
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsBlocking(false)}>Cancelar</Button>
                      <Button onClick={handleBlockTime} disabled={isBlocking}>
                        {isBlocking ? "Bloqueando..." : "Confirmar Bloqueo"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Citas Agendadas</h3>
                {selectedDateAppointments.length === 0 ? (
                  <div className="text-sm text-zinc-500 py-8 text-center border rounded-lg border-dashed">
                    No hay citas para este día.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDateAppointments.map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900 border-l-4 border-l-primary">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-zinc-400" />
                          <div>
                            <p className="text-sm font-bold">{format(new Date(appt.start_time), 'HH:mm')} - {appt.leads?.full_name}</p>
                            <p className="text-[10px] text-zinc-500">Cita Confirmada</p>
                          </div>
                        </div>
                        <Badge variant="outline">Próxima</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Resumen de Bloqueos</CardTitle>
              <CardDescription>Días u horarios que has marcado como no disponibles.</CardDescription>
            </CardHeader>
            <CardContent>
               {blocks.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">No tienes bloqueos activos.</p>
              ) : (
                <div className="space-y-2">
                  {blocks.map(block => (
                    <div key={block.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">{format(new Date(block.start_time), 'PPP', { locale: es })}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 ml-6">
                          {format(new Date(block.start_time), 'HH:mm')} - {format(new Date(block.end_time), 'HH:mm')} ({block.reason})
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => deleteBlock(block.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Configuración de Disponibilidad</CardTitle>
                <CardDescription>Define tus horarios estándar de trabajo por día.</CardDescription>
              </div>
              <Button size="sm" onClick={saveAvailability} disabled={savingSettings}>
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Horarios
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {account.working_hours && Object.entries(account.working_hours).map(([day, config]: [string, any]) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <div className="flex items-center gap-3 w-24">
                      <Switch 
                        checked={config.active} 
                        onCheckedChange={(checked) => updateWorkingDay(day, 'active', checked)} 
                      />
                      <span className="text-xs font-bold uppercase">{
                        day === 'mon' ? 'Lun' : 
                        day === 'tue' ? 'Mar' : 
                        day === 'wed' ? 'Mié' : 
                        day === 'thu' ? 'Jue' : 
                        day === 'fri' ? 'Vie' : 
                        day === 'sat' ? 'Sáb' : 'Dom'
                      }</span>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <Input 
                        type="time" 
                        value={config.start} 
                        onChange={(e) => updateWorkingDay(day, 'start', e.target.value)}
                        disabled={!config.active}
                        className="w-24 h-8 text-xs"
                      />
                      <span className="text-zinc-400">-</span>
                      <Input 
                        type="time" 
                        value={config.end} 
                        onChange={(e) => updateWorkingDay(day, 'end', e.target.value)}
                        disabled={!config.active}
                        className="w-24 h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
