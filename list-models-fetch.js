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

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.error) {
      console.error('API Error:', JSON.stringify(data.error, null, 2))
    } else {
      console.log('Available models:', data.models ? data.models.map(m => m.name) : 'No models found')
    }
  } catch (err) {
    console.error('Fetch error:', err.message)
  }
}

listModels()
