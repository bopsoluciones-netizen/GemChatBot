import { NextResponse } from "next/server"
import { getRelevantContext } from "@/lib/ai/rag"
import { getOpenRouterResponse } from "@/lib/ai/openrouter"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { message, accountId, conversationId } = await req.json()
    const supabase = await createClient()

    // 1. Get Account details for tone and name
    const { data: account } = await supabase
      .from("chatbot_accounts")
      .select("name, tone")
      .eq("id", accountId)
      .single()

    if (!account) throw new Error("Account not found")

    // 2. Get Context (RAG)
    const context = await getRelevantContext(accountId, message)

    // 3. Get OpenRouter Response
    const aiResponse = await getOpenRouterResponse(message, context, account.tone, account.name)

    // 4. Save messages to DB
    await supabase.from("messages").insert([
      { conversation_id: conversationId, role: "user", content: message },
      { conversation_id: conversationId, role: "assistant", content: aiResponse }
    ])

    return NextResponse.json({ response: aiResponse })
  } catch (error: any) {
    console.error("Chat API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
