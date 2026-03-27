export async function getOpenRouterResponse(
  prompt: string, 
  context: string, 
  tone: string, 
  companyName: string
) {
  const systemPrompts: Record<string, string> = {
    amigable: "Eres un asistente virtual humano, amigable, cercano y muy conversacional.",
    formal: "Eres un asistente virtual corporativo humano, profesional, educado y preciso.",
    comercial: "Eres un asistente virtual humano de ventas, persuasivo, analítico y excelente comunicador.",
    informativo: "Eres un asistente virtual humano experto, directo y basado en datos actualizados.",
  }

  const basePrompt = `
    ${systemPrompts[tone] || systemPrompts.amigable}
    Trabajas para la empresa: ${companyName}.
    
    INSTRUCCIONES CRÍTICAS:
    1. PRIORIDAD ABSOLUTA: Utiliza ÚNICAMENTE la información del "CONTEXTO PROPORCIONADO" para responder preguntas sobre los servicios, productos, horarios o detalles de ${companyName}.
    2. Si la respuesta NO está en el CONTEXTO, no inventes información. Responde algo como: "Lo siento, no tengo esa información específica en este momento, ¿hay algo más en lo que pueda ayudarte?" o sugiere contactar directamente.
    3. ACTITUD: Actúa como una persona real (tu nombre es el de un asistente humano de ${companyName}), sé amable, empático y conversacional. No menciones que eres una IA.
    4. IDIOMA: Responde siempre en el mismo idioma en el que te escribe el usuario.
    
    Si el usuario quiere agendar una cita o muestra interés en una reunión, responde con: "[SOLICITUD_CITA]".
    
    CONTEXTO PROPORCIONADO (BASE DE CONOCIMIENTO):
    ${context}
  `

  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables")
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://gemchatbot.example.com", 
      "X-Title": "GemChatbot", 
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: prompt }
      ]
    })
  })

  if (!response.ok) {
    console.error("OpenRouter API Error:", await response.text());
    throw new Error("Failed to fetch from OpenRouter");
  }

  const data = await response.json()
  return data.choices[0].message.content
}
