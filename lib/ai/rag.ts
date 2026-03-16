import { createClient } from "@/lib/supabase/server"

export async function getRelevantContext(accountId: string, query: string) {
  const supabase = await createClient()

  // Simplified context retrieval for MVP: 
  // Fetch all knowledge sources for the account and concatenate them.
  // In a production RAG system, we would use vector embeddings and similarity search.
  const { data: sources } = await supabase
    .from("knowledge_sources")
    .select("content")
    .eq("account_id", accountId)

  if (!sources || sources.length === 0) {
    return "No hay información específica disponible para esta empresa."
  }

  // Combine top content chunks
  return sources.map(s => s.content).join("\n\n---\n\n")
}
