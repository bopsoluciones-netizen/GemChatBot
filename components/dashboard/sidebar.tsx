"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Bot, 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Settings, 
  Calendar, 
  Database,
  BarChart3,
  Link2,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface NavItem {
  title: string
  href: string
  icon: any
}

const creatorNavItems: NavItem[] = [
  { title: "Métricas Globales", href: "/creator", icon: LayoutDashboard },
  { title: "Cuentas", href: "/creator/accounts", icon: Users },
]

const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Branding", href: "/admin/settings", icon: Settings },
  { title: "Conocimiento", href: "/admin/knowledge", icon: Database },
  { title: "Calendario", href: "/admin/calendar", icon: Calendar },
  { title: "Leads", href: "/admin/leads", icon: Users },
  { title: "Conversaciones", href: "/admin/conversations", icon: MessageSquare },
  { title: "Link Público", href: "/admin/link", icon: Link2 },
]

export function Sidebar({ role }: { role: 'creator' | 'admin' }) {
  const pathname = usePathname()
  const items = role === 'creator' ? creatorNavItems : adminNavItems
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Bot className="h-6 w-6 text-primary" />
          <span>GemBot AI</span>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 px-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary text-primary-foreground" 
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="border-t p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-zinc-600 dark:text-zinc-400"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
