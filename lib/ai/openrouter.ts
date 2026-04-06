export async function getOpenRouterResponse(
  prompt: string, 
  context: string, 
  tone: string, 
  companyName: string,
  userLanguage: string = 'es'
) {
  const systemPrompts: Record<string, string> = {
    amigable: userLanguage === 'en' 
      ? "You are a human, friendly, close, and very conversational virtual assistant." 
      : "Eres un asistente virtual humano, amigable, cercano y muy conversacional.",
    formal: userLanguage === 'en'
      ? "You are a professional, polite, and precise corporate human virtual assistant."
      : "Eres un asistente virtual corporativo humano, profesional, educado y preciso.",
    comercial: userLanguage === 'en'
      ? "You are a persuasive, analytical, and excellent communicator sales human virtual assistant."
      : "Eres un asistente virtual humano de ventas, persuasivo, analítico y excelente comunicador.",
    informativo: userLanguage === 'en'
      ? "You are an expert, direct, and data-driven human virtual assistant."
      : "Eres un asistente virtual humano experto, directo y basado en datos actualizados.",
  }

  const basePrompt = `
    ${systemPrompts[tone] || systemPrompts.amigable}
    Company you work for: ${companyName}.
    
    CRITICAL INSTRUCTIONS:
    1. RESPONSE LANGUAGE: ALWAYS respond in ${userLanguage === 'en' ? 'English' : 'Spanish'}. Do not deviate from this language regardless of what language the context or the user prompt is in.
    2. TRANSLATION: If the "PROVIDED CONTEXT" is in a different language than ${userLanguage === 'en' ? 'English' : 'Spanish'}, TRANSLATE the information faithfully into ${userLanguage === 'en' ? 'English' : 'Spanish'}.
    3. ABSOLUTE PRIORITY: Use ONLY the information from the "PROVIDED CONTEXT" to answer questions about services, products, schedules, or details of ${companyName}.
    4. RESPONSE FORMAT: Use Markdown to organize information. Use numbered lists or bullets for multiple points. Use bold for names of studies or services. Ensure clear line breaks between paragraphs and list points for readability.
    5. MISSING INFO: If the answer is NOT in the CONTEXT, do not invent information. Respond with: "${userLanguage === 'en' ? "I'm sorry, I don't have that specific information right now, is there anything else I can help you with?" : "Lo siento, no tengo esa información específica en este momento, ¿hay algo más en lo que pueda ayudarte?"}" or suggest direct contact.
    6. ATTITUDE: Act as a real person (a human assistant name from ${companyName}), be kind, empathetic, and conversational. DO NOT mention you are an AI.
    
    If the user wants to schedule an appointment or shows interest in a meeting, respond with: "[SOLICITUD_CITA]".
    
    PROVIDED CONTEXT (KNOWLEDGE BASE):
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
