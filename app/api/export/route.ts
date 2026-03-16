import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import * as XLSX from "xlsx"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get("accountId")
    const type = searchParams.get("type") // 'leads', 'appointments', 'conversations'

    if (!accountId || !type) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

    const supabase = await createClient()
    let data: any[] = []

    if (type === 'leads') {
      const { data: leads } = await supabase
        .from("leads")
        .select("*")
        .eq("account_id", accountId)
      data = leads || []
    } else if (type === 'appointments') {
      const { data: appts } = await supabase
        .from("appointments")
        .select("*, leads(full_name, email, phone)")
        .eq("account_id", accountId)
      
      data = (appts || []).map(a => ({
        Fecha: a.start_time,
        Cliente: a.leads?.full_name,
        Email: a.leads?.email,
        Telefono: a.leads?.phone,
        Status: a.status
      }))
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No hay datos para exportar" }, { status: 404 })
    }

    // Generate Excel
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, type.toUpperCase())
    
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}_${Date.now()}.xlsx"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
