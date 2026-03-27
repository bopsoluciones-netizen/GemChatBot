"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Bot, ShieldCheck, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      toast.error("Error al iniciar sesión", { description: authError.message })
      setLoading(false)
      return
    }

    if (!data.user) {
       setLoading(false)
       return
    }

    // 2. Refresh profile or create if missing
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (profileError || !profile) {
      // Fallback: Create profile if missing
      console.log("Profile missing, creating for user:", data.user.id)
      const { error: insertError } = await supabase
        .from("profiles")
        .insert([{
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || "Usuario",
          role: "admin" // Default role
        }])

      if (insertError) {
        // If it's a conflict, the profile actually exists now, we can proceed
        if (insertError.code === '23505') {
           console.log("Profile already exists, skipping creation")
           // Re-fetch profile if it was a conflict and we didn't get it initially
           const { data: existingProfile, error: refetchError } = await supabase
             .from("profiles")
             .select("*")
             .eq("id", data.user.id)
             .single()
           if (refetchError) {
             console.error("Failed to refetch profile after conflict:", refetchError.message)
             toast.error("Error al configurar tu perfil", {
               description: refetchError.message
             })
             setLoading(false)
             return
           }
           profile = existingProfile // Update profile variable
        } else {
          console.error("Failed to create profile fallback:", insertError.message, insertError.details)
          toast.error("Error al configurar tu perfil", {
            description: insertError.message
          })
          setLoading(false)
          return
        }
      }
    }

    const userEmail = data.user.email
    const userId = data.user.id

    // Auto-linking: If this is an admin, check if there's an account waiting for this email
    // We check this for both new and existing profiles to ensure linking happens
    if (userEmail) {
      console.log("Checking for pending accounts for:", userEmail)
      const { data: pendingAccount, error: fetchError } = await supabase
        .from("chatbot_accounts")
        .select("id, name")
        .eq("admin_email", userEmail)
        .is("admin_id", null)
        .maybeSingle()

      if (fetchError) {
        console.error("Error fetching pending accounts:", fetchError.message)
      } else if (pendingAccount) {
        console.log("Account found to link:", pendingAccount.name)
        const { error: linkError } = await supabase
          .from("chatbot_accounts")
          .update({ admin_id: userId })
          .eq("id", pendingAccount.id)
        
        if (linkError) {
          console.error("Failed to link account:", linkError.message)
          toast.error("Error al vincular tu cuenta empresarial", { description: linkError.message })
        } else {
          console.log("Account linked successfully!")
          toast.success(`Cuenta "${pendingAccount.name}" vinculada correctamente`)
        }
      } else {
        console.log("No pending account found for this email (or already linked)")
      }
    }

    const finalRole = profile?.role || "admin"
    router.push(finalRole === "creator" ? "/creator" : "/admin")
    
    setLoading(false)
    toast.success("Bienvenido de nuevo")
  }

  // Temporary function to become creator (only for development/setup)
  const makeMeCreator = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("Debes estar logueado")
      return
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role: 'creator' })
      .eq('id', user.id)

    if (error) {
      toast.error("Error al cambiar rol")
    } else {
      toast.success("¡Ahora eres Creador! Recarga la página.")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-200 shadow-xl dark:border-zinc-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Bot className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder a tu panel
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Entrar al Panel"
              )}
            </Button>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-3 w-3" />
              <span>Acceso seguro administrado por Supabase</span>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Acceso rápido para desarrollo - Solo visible si se desea configurar el primer creador */}
      <div className="mt-8 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={makeMeCreator}
          className="text-zinc-400 hover:text-primary transition-colors"
        >
          Configurar esta cuenta como Creador
        </Button>
      </div>
    </div>
  )
}
