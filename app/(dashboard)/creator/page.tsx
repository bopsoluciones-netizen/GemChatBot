import { getProfile } from "@/lib/supabase/auth-helpers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Bot, BarChart3, TrendingUp } from "lucide-react"

export default async function CreatorDashboard() {
  const profile = await getProfile()
  
  if (!profile) {
    redirect("/login")
  }

  if (profile.role === 'admin') {
    redirect("/admin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel del Creador</h1>
        <p className="text-zinc-500">Resumen global de todos los chatbots en la plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas Totales</CardTitle>
            <Bot className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-zinc-500">+15% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,542</div>
            <p className="text-xs text-zinc-500">+12.4% de tasa de éxito</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-zinc-500">+8 desde ayer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Cuentas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {/* List of accounts will go here */}
            <div className="text-sm text-zinc-500">No hay cuentas activas todavía.</div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Rendimiento por Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-500">Datos insuficientes para mostrar gráficas.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
