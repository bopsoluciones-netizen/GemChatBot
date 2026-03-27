import { isAdmin, getProfile } from "@/lib/supabase/auth-helpers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageSquare, Calendar, MousePointer2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const profile = await getProfile()
  
  if (!profile) {
    redirect("/login")
  }

  if (profile.role === 'creator') {
    redirect("/creator")
  }

  const supabase = await createClient()
  const { data: account } = await supabase
    .from("chatbot_accounts")
    .select("*")
    .or(`creator_id.eq.${profile.id},admin_id.eq.${profile.id}`)
    .single()

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="p-4 bg-amber-50 rounded-full dark:bg-amber-950/30">
          <AlertCircle className="h-12 w-12 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold">Bienvenido, {profile.full_name}</h2>
        <p className="text-zinc-500 text-center max-w-md">
          Aún no tienes un chatbot vinculado a tu cuenta. 
          Un Creador debe asignarte una cuenta de empresa usando tu email: 
          <span className="font-bold block mt-1 text-zinc-900 dark:text-zinc-100">{profile.email}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración: {account.name}</h1>
        <p className="text-zinc-500">Gestión de tu chatbot inteligente y atención al cliente.</p>
      </div>
      {/* ... rest of the dashboard ... */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
            <MousePointer2 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">452</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span>+5.2%</span>
              <span className="text-zinc-500 font-normal">vs ayer</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <span>+12.1%</span>
              <span className="text-zinc-500 font-normal">tasa de conv.</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-50 to-white dark:from-teal-950 dark:to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>2.4 min</span>
              <span className="text-zinc-500 font-normal">duración prom.</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-50 to-white dark:from-rose-950 dark:to-zinc-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas</CardTitle>
            <Calendar className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <span>3 pendientes</span>
              <span className="text-zinc-500 font-normal">hoy</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Últimos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-zinc-500 text-center py-8">
              Aún no has recibido leads. Comparte tu link para empezar.
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Estado del Chatbot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Servicio Activo</span>
                </div>
                <span className="text-sm text-zinc-500">Gemini 1.5 Flash</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">Fuentes Indexadas</span>
                <span className="text-sm font-bold text-primary">0 documentos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
