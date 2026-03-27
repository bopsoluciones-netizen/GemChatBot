import { NextResponse } from "next/server"
import mammoth from "mammoth"

// Move heavy/problematic imports inside the handler or use dynamic logic
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    const body = await req.json()
    const { type, url, fileUrl } = body

    let text = ""

    if (type === "url") {
      if (!url) return NextResponse.json({ error: "URL is required for type 'url'" }, { status: 400 })
      
      console.log("Extracting URL:", url)
      const response = await fetch(url)
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 500 })
      }
      
      const html = await response.text()
      // Very basic HTML to text: remove tags
      text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "") // Remove styles
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    } else if (type === "pdf" || type === "docx") {
      if (!fileUrl) return NextResponse.json({ error: "FileURL is required for files" }, { status: 400 })
      
      const response = await fetch(fileUrl)
      const buffer = await response.arrayBuffer()
      const nodeBuffer = Buffer.from(buffer)

      if (type === "pdf") {
        const pdf = require("pdf-parse")
        const data = await pdf(nodeBuffer)
        text = data.text
      } else {
        const data = await mammoth.extractRawText({ buffer: nodeBuffer })
        text = data.value
      }
    }

    // Basic cleanup
    text = text.substring(0, 50000) // Limit to 50k characters for RAG

    return NextResponse.json({ text: text || "No text could be extracted." })
  } catch (error: any) {
    console.error("Extraction API Crash:", error)
    return NextResponse.json({ 
      error: error.message || "Internal Server Error during extraction",
      details: error.toString()
    }, { status: 500 })
  }
}
