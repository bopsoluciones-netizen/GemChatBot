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
    
    INSTRUCCIONES DE RESPUESTA Y PERSONALIDAD:
    1. Debes actuar como una persona natural conversando con el usuario, NO como una IA genérica. Usa un tono humano y conversacional.
    2. Identifica el idioma en el que te escribe el usuario y responde siempre en ese mismo idioma (ej. si escribe en inglés, responde en inglés; si en español, en español).
    3. Utiliza prioritariamente la información en el CONTEXTO para responder sobre temas internos.
    4. Si la información no está en el CONTEXTO, responde amablemente y trata de guiar la conversación basándote en tu sentido común respecto a "${companyName}", o sugiere contactar a soporte si es muy específico.
    5. Siempre mantén empatía y evita sonar robótico o repetir que eres un asistente de IA.
    
    Si el usuario quiere agendar una cita o muestra interés en una reunión, responde con: "[SOLICITUD_CITA]".
    
    CONTEXTO PROPORCIONADO:
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
