const { GoogleGenerativeAI } = require("@google/generative-ai")
const fs = require('fs')
const path = require('path')

const envPath = path.join(process.cwd(), '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const lines = env.split('\n')
const envVars = {}
lines.forEach(line => {
  const parts = line.split('=')
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim()
  }
})

const apiKey = envVars['GOOGLE_GEMINI_API_KEY']
const genAI = new GoogleGenerativeAI(apiKey)

async function listModels() {
  try {
    // Note: listModels is not directly on genAI in some versions, 
    // it's usually accessed via an internal client or just by trying to use it.
    // Actually, in the SDK 0.x, there isn't a direct listModels.
    // However, I can try a "hello world" with a few different names.
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.5-flash-latest"]
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent("test")
        console.log(`Model "${modelName}" is WORKING`)
        break; // Stop at first working model
      } catch (err) {
        console.log(`Model "${modelName}" is NOT working: ${err.message}`)
      }
    }
  } catch (error) {
    console.error("Error testing models:", error.message)
  }
}

listModels()
