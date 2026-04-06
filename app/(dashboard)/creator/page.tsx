import { getProfile } from "@/lib/supabase/auth-helpers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Bot, BarChart3, TrendingUp, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function CreatorDashboard() {
  const profile = await getProfile()
  
  if (!profile) {
    redirect("/login")
  }

  if (profile.role === 'admin') {
    redirect("/admin")
  }

  const supabase = await createClient()

  // 1. Fetch own accounts
  const { data: accounts } = await supabase
    .from("chatbot_accounts")
    .select("*")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })

  const accountIds = accounts?.map(a => a.id) || []

  // 2. Fetch aggregate metrics
  let totalLeads = 0
  let totalConversations = 0
  let totalAppointments = 0

  if (accountIds.length > 0) {
    // Leads
    const { count: lCount } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .in("account_id", accountIds)
    totalLeads = lCount || 0

    // Conversations (from analytics_events)
    const { count: cCount } = await supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "conversation")
      .in("account_id", accountIds)
    totalConversations = cCount || 0

    // Appointments (from appointments table)
    const { count: aCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .in("account_id", accountIds)
    totalAppointments = aCount || 0
  }

  // 3. Simple trend stubs (count items from last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  const { count: recentAccounts } = await supabase
    .from("chatbot_accounts")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", profile.id)
    .gte("created_at", thirtyDaysAgoISO)

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
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
            <p className="text-xs text-zinc-500">+{recentAccounts || 0} en los últimos 30 días</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">Total histórico across all accounts</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">Total de interacciones registradas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments.toLocaleString()}</div>
            <p className="text-xs text-zinc-500">Total de citas gestionadas por IA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Cuentas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accounts && accounts.length > 0 ? (
                accounts.slice(0, 5).map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{acc.name}</p>
                        <p className="text-xs text-zinc-500">{acc.admin_email}</p>
                      </div>
                    </div>
                    <Link href={`/creator/accounts?id=${acc.id}`}>
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-500 text-center py-4">No hay cuentas activas todavía.</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-500">Leads por Cuenta (Prom)</span>
                <span className="font-bold">{(accounts?.length ? totalLeads / accounts.length : 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-zinc-500">Conv. por Cuenta (Prom)</span>
                <span className="font-bold">{(accounts?.length ? totalConversations / accounts.length : 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Tasa de Agendamiento</span>
                <span className="font-bold">{(totalConversations ? (totalAppointments / totalConversations) * 100 : 0).toFixed(1)}%</span>
              </div>
              <div className="mt-4 pt-4 bg-zinc-50 p-3 rounded-lg dark:bg-zinc-900">
                <p className="text-xs text-zinc-500 mb-1 italic">Tip de rendimiento:</p>
                <p className="text-xs">Los chatbots con mayor tasa de agendamiento suelen tener bases de conocimiento más completas.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
