import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { startOfDay, endOfDay, addHours, isAfter, isBefore, parseISO } from "date-fns"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")
  const dateStr = searchParams.get("date") // yyyy-MM-dd

  if (!accountId || !dateStr) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const supabase = await createClient()
  const date = parseISO(dateStr)
  const start = startOfDay(date)
  const end = endOfDay(date)

  // 1. Check if day is blocked
  const { data: blocks } = await supabase
    .from("calendar_blocks")
    .select("*")
    .eq("account_id", accountId)
    .gte("start_time", start.toISOString())
    .lte("end_time", end.toISOString())

  if (blocks && blocks.length > 0) {
    return NextResponse.json({ slots: [] }) // Day fully blocked
  }

  // 2. Fetch existing appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time")
    .eq("account_id", accountId)
    .gte("start_time", start.toISOString())
    .lte("end_time", end.toISOString())

  // 3. Generate slots (e.g., 9:00 to 18:00, every hour)
  const slots = []
  let currentSlot = addHours(start, 9) // Start at 9 AM
  const workEnd = addHours(start, 18) // End at 6 PM

  while (isBefore(currentSlot, workEnd)) {
    const slotStr = currentSlot.toISOString()
    const isOccupied = appointments?.some(a => a.start_time === slotStr)
    
    if (!isOccupied) {
      slots.push(slotStr)
    }
    currentSlot = addHours(currentSlot, 1)
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
