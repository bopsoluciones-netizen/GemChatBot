import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { startOfDay, endOfDay, addHours, isAfter, isBefore, parseISO, format } from "date-fns"
import { enUS } from "date-fns/locale"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")
  const dateStr = searchParams.get("date") // yyyy-MM-dd

  if (!accountId || !dateStr) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const supabase = await createClient()
  const date = parseISO(dateStr)
  const start = startOfDay(date)
  const end = endOfDay(date)
  const dayName = format(date, 'eee', { locale: enUS }).toLowerCase() // mon, tue, etc.

  // 1. Fetch account and its working hours
  const { data: account } = await supabase
    .from("chatbot_accounts")
    .select("working_hours")
    .eq("id", accountId)
    .single()

  const workingHours = account?.working_hours || {
    mon: { start: "09:00", end: "18:00", active: true },
    tue: { start: "09:00", end: "18:00", active: true },
    wed: { start: "09:00", end: "18:00", active: true },
    thu: { start: "09:00", end: "18:00", active: true },
    fri: { start: "09:00", end: "18:00", active: true },
    sat: { start: "09:00", end: "13:00", active: false },
    sun: { start: "09:00", end: "13:00", active: false }
  }

  const dayConfig = workingHours[dayName]
  if (!dayConfig || !dayConfig.active) {
    return NextResponse.json({ slots: [] })
  }

  // 2. Fetch existing appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time")
    .eq("account_id", accountId)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())

  // 3. Fetch calendar blocks (granular blocks)
  const { data: blocks } = await supabase
    .from("calendar_blocks")
    .select("start_time, end_time")
    .eq("account_id", accountId)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())

  // 4. Generate slots based on working hours
  const slots = []
  const [startH, startM] = dayConfig.start.split(":").map(Number)
  const [endH, endM] = dayConfig.end.split(":").map(Number)
  
  const baseDateStr = format(date, 'yyyy-MM-dd')
  
  for (let h = startH; h < endH; h++) {
    const slotStr = `${baseDateStr}T${h.toString().padStart(2, '0')}:00:00.000Z`
    
    // Check if occupied by appointment (exact string match)
    const isOccupied = appointments?.some(a => {
      const aTime = new Date(a.start_time).toISOString()
      return aTime === slotStr
    })
    
    // Check if overlapping with manual blocks
    const isBlocked = blocks?.some(b => {
      const bStart = new Date(b.start_time).toISOString()
      const bEnd = new Date(b.end_time).toISOString()
      return (slotStr >= bStart && slotStr < bEnd)
    })
    
    if (!isOccupied && !isBlocked) {
      slots.push(slotStr)
    }
  }

  return NextResponse.json({ slots })
}

export async function POST(req: Request) {
  try {
    const { accountId, leadId, startTime } = await req.json()
    const supabase = await createClient()

    const start = new Date(startTime)
    const end = addHours(start, 1)

    // Transactional check would be ideal, but here we do a simple double-booking check
    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("account_id", accountId)
      .eq("start_time", startTime)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Horario ya ocupado" }, { status: 409 })
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert([{
        account_id: accountId,
        lead_id: leadId,
        start_time: startTime,
        end_time: end.toISOString(),
        status: "scheduled"
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ appointment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
