import { createClient } from "@/lib/supabase/server"

export async function trackEvent(accountId: string, eventType: string, metadata: any = {}) {
  const supabase = await createClient()
  
  await supabase.from("analytics_events").insert([{
    account_id: accountId,
    event_type: eventType,
    metadata
  }])
}
