import { createClient } from "@/lib/supabase/server"

export async function getRelevantContext(accountId: string, query: string) {
  const supabase = await createClient()

  // Simplified context retrieval for MVP: 
  // Fetch all knowledge sources for the account and concatenate them.
  // In a production RAG system, we would use vector embeddings and similarity search.
  const { data: sources } = await supabase
    .from("knowledge_sources")
    .select("title, content, source_type")
    .eq("account_id", accountId)

  if (!sources || sources.length === 0) {
    return "No hay información específica disponible para esta empresa en la base de conocimientos."
  }

  // Combine content with titles for better AI understanding
  return sources
    .map(s => `FUENTE: ${s.title} (${s.source_type})\nCONTENIDO: ${s.content}`)
    .join("\n\n---\n\n")
}
