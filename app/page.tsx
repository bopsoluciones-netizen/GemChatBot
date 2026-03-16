import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bot, ArrowRight, ShieldCheck, Sparkles, MessageSquare, Calendar } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <Bot className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">GemBot AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/login">
            Iniciar Sesión
          </Link>
          <Link className="text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors" href="/register">
            Empieza Gratis
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-blue-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 mb-4 animate-bounce">
                🚀 Multi-empresa y potenciado por Gemini
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none max-w-3xl">
                Chatbots Inteligentes para <span className="text-primary">Empresas Modernas</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-zinc-500 md:text-xl dark:text-zinc-400 mt-6 font-medium">
                Carga tus documentos, entrena tu bot y deja que la IA gestione tus leads y reservas automáticamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Button asChild size="lg" className="px-8 py-6 text-lg rounded-xl shadow-lg">
                  <Link href="/register">
                    Comenzar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg rounded-xl">
                  <Link href="/login">Ver Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-zinc-50 hover:shadow-xl transition-all">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">RAG Personalizado</h3>
                <p className="text-zinc-500">Sube tus PDFs, DOCX o links. El bot responde basándose exclusivamente en tu información.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-zinc-50 hover:shadow-xl transition-all">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Agendamiento Automático</h3>
                <p className="text-zinc-500">Convierte chats en citas. Sincronización real con tu calendario y bloqueos manuales.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl border bg-zinc-50 hover:shadow-xl transition-all">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Gestión de Leads</h3>
                <p className="text-zinc-500">Captura datos valiosos antes de cada chat y expórtalo todo a Excel en un clic.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="w-full py-12 border-t bg-zinc-50">
          <div className="container px-4 md:px-6 mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 text-zinc-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Seguridad Nivel Empresarial</span>
            </div>
            <p className="text-zinc-500 text-sm max-w-md text-center">
              Tus datos están protegidos con Row Level Security y encriptación de grado militar vía Supabase.
            </p>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">© 2024 GemBot AI. Todos los derechos reservados.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4" href="#">Términos</Link>
            <Link className="text-xs hover:underline underline-offset-4" href="#">Privacidad</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
