import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function getGeminiResponse(
  prompt: string, 
  context: string, 
  tone: string, 
  companyName: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const systemPrompts: Record<string, string> = {
    amigable: "Eres un asistente virtual amigable, cercano y servicial.",
    formal: "Eres un asistente virtual profesional, formal y serio.",
    comercial: "Eres un asistente virtual enfocado en ventas, persuasivo y dinámico.",
    informativo: "Eres un asistente virtual informativo, directo y basado puramente en hechos.",
  }

  const basePrompt = `
    ${systemPrompts[tone] || systemPrompts.amigable}
    Trabajas para la empresa: ${companyName}.
    
    REGLA CRÍTICA: Solo puedes responder usando la información proporcionada en el CONTEXTO a continuación.
    Si la respuesta no está en el contexto, di amablemente que no tienes esa información y ofrece que un humano se contacte con ellos.
    NUNCA inventes información.
    
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
