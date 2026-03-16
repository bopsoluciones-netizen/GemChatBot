"use client"

import { useState, useRef, useEffect } from "react"
import { LeadForm } from "@/components/chat/lead-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Send, Bot, User, Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { format, addDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function PublicChatPage() {
  const params = useParams()
  const slug = params.accountId as string
  const [account, setAccount] = useState<any>(null)
  const [lead, setLead] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingAccount, setFetchingAccount] = useState(true)
  
  // Booking state
  const [showBooking, setShowBooking] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [bookingDate, setBookingDate] = useState(new Date())
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchAccount()
  }, [slug])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const fetchAccount = async () => {
    const { data } = await supabase
      .from("chatbot_accounts")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single()
    
    setAccount(data)
    setFetchingAccount(false)
  }

  const handleLeadSubmit = async (formData: any) => {
    setLoading(true)
    // 1. Create Lead
    const { data: leadData } = await supabase
      .from("leads")
      .insert([{ 
        account_id: account.id,
        ...formData
      }])
      .select()
      .single()

    // 2. Create Conversation
    const { data: convData } = await supabase
      .from("conversations")
      .insert([{
        account_id: account.id,
        lead_id: leadData.id
      }])
      .select()
      .single()

    setLead(leadData)
    setConversation(convData)
    setMessages([{ 
      role: 'assistant', 
      content: `¡Hola ${formData.full_name}! Bienvenido a ${account.name}. ¿En qué puedo ayudarte hoy?` 
    }])
    setLoading(false)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          accountId: account.id,
          conversationId: conversation.id
        })
      })

      const data = await res.json()
      
      if (data.response) {
        if (data.response.includes("[SOLICITUD_CITA]")) {
          const cleanMsg = data.response.replace("[SOLICITUD_CITA]", "").trim()
          if (cleanMsg) {
            setMessages(prev => [...prev, { role: 'assistant', content: cleanMsg }])
          }
          setShowBooking(true)
          fetchSlots(new Date())
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        }
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSlots = async (date: Date) => {
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/appointments?accountId=${account.id}&date=${format(date, 'yyyy-MM-dd')}`)
      const data = await res.json()
      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error("Error fetching slots:", error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBooking = async (slot: string) => {
    setLoading(true)
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          leadId: lead.id,
          startTime: slot
        })
      })
      const data = await res.json()
      if (data.appointment) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Confirmado. Tu cita ha sido agendada para el ${format(new Date(slot), "PPPP 'a las' HH:mm", { locale: es })}.` 
        }])
        setShowBooking(false)
      } else {
        alert("Lo siento, ese horario ya no está disponible.")
      }
    } catch (err) {
      console.error("Booking error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingAccount) return <div className="flex h-screen items-center justify-center">Cargando...</div>
  if (!account) return <div className="flex h-screen items-center justify-center">Chatbot no encontrado o inactivo.</div>

  if (!lead) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <LeadForm onSubmit={handleLeadSubmit} loading={loading} companyName={account.name} logoUrl={account.logo_url} />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4 shadow-sm bg-white dark:bg-zinc-900 z-10">
        <div className="flex items-center gap-3">
          {account.logo_url ? (
            <img src={account.logo_url} alt={account.name} className="h-10 w-10 object-contain rounded" />
          ) : (
            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-lg leading-tight">{account.name}</h1>
            <p className="text-xs text-green-500 font-medium">Asistente Virtual Activo</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="hidden sm:flex" disabled>
          <Calendar className="mr-2 h-4 w-4" />
          Reservar Cita
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <ScrollArea className="flex-1 p-4 md:p-8" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
                  msg.role === 'user' ? "bg-white text-zinc-900" : "bg-primary text-primary-foreground"
                )}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm shadow-sm max-w-[85%]",
                  msg.role === 'user' 
                    ? "bg-zinc-900 text-zinc-50 rounded-tr-none" 
                    : "bg-white border text-zinc-900 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow-sm animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Booking Overlay/Panel */}
        {showBooking && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 z-20">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Escoge un horario disponible:</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowBooking(false)}>Cerrar</Button>
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-2">
                <Button variant="outline" size="icon" onClick={() => {
                  const d = addDays(bookingDate, -1);
                  setBookingDate(d);
                  fetchSlots(d);
                }} disabled={isSameDay(bookingDate, new Date())}>
                   <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{format(bookingDate, 'PPPP', { locale: es })}</span>
                <Button variant="outline" size="icon" onClick={() => {
                  const d = addDays(bookingDate, 1);
                  setBookingDate(d);
                  fetchSlots(d);
                }}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {loadingSlots ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-center text-zinc-500 text-sm py-4">No hay horarios disponibles para este día.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map(slot => (
                    <Button 
                      key={slot} 
                      variant="outline" 
                      className="text-xs py-1 h-auto"
                      onClick={() => handleBooking(slot)}
                    >
                      {format(new Date(slot), 'HH:mm')}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <footer className="border-t p-4 pb-6 md:px-8 bg-zinc-50 dark:bg-zinc-900">
        <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2">
          <Input 
            placeholder="Escribe tu mensaje aquí..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="bg-white border-zinc-200 focus-visible:ring-primary shadow-sm h-12 rounded-xl"
          />
          <Button type="submit" disabled={loading} className="h-12 w-12 rounded-xl shadow-md shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <p className="text-[10px] text-center text-zinc-400 mt-3 font-medium uppercase tracking-widest">
          Powered by Gemini AI 
        </p>
      </footer>
    </div>
  )
}
