import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function getGeminiResponse(
  prompt: string, 
  context: string, 
  tone: string, 
  companyName: string
) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-3-flash-preview",
    tools: [
      {
        googleSearch: {}
      }
    ] as any
  })

  const systemPrompts: Record<string, string> = {
    amigable: "Eres un asistente virtual amigable, cercano y servicial.",
    formal: "Eres un asistente virtual corporativo, profesional y preciso.",
    comercial: "Eres un asistente virtual enfocado en negocios, persuasivo y analítico.",
    informativo: "Eres un asistente virtual experto, directo y basado en datos actualizados.",
  }

  const basePrompt = `
    ${systemPrompts[tone] || systemPrompts.amigable}
    Trabajas para la empresa: ${companyName}.
    
    INSTRUCCIONES DE RESPUESTA:
    1. Utiliza prioritariamente la información en el CONTEXTO para responder sobre temas internos.
    2. Si la información no está en el CONTEXTO, busca en la web información pública y relevante sobre "${companyName}" o el tema consultado para dar una respuesta completa.
    3. Si después de buscar no encuentras información fiable, indícalo amablemente y sugiere contactar a soporte.
    4. Siempre mantén un tono extremadamente profesional y evita inventar datos.
    
    Si el usuario quiere agendar una cita o muestra interés en una reunión, responde con: "[SOLICITUD_CITA]".
    
    CONTEXTO:
    ${context}
    
    PREGUNTA DEL USUARIO:
    ${prompt}
  `

  const result = await model.generateContent(basePrompt)
  const response = await result.response
  return response.text()
}
