const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Try to read .env.local manually from the current directory
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found in', process.cwd())
  process.exit(1)
}

const env = fs.readFileSync(envPath, 'utf8')
const lines = env.split('\n')
const envVars = {}
lines.forEach(line => {
  const parts = line.split('=')
  if (parts.length === 2) {
    envVars[parts[0].trim()] = parts[1].trim()
  }
})

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets()
  if (error) {
    console.error('Error listing buckets:', error.message)
  } else {
    console.log('Available buckets:', (data || []).map(b => b.name))
  }
}

listBuckets()
