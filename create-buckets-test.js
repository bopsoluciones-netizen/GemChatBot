const { createClient } = require('@supabase/supabase-js')
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

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL']
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function createBuckets() {
  console.log('Attempting to create buckets...')
  
  const { data: b1, error: e1 } = await supabase.storage.createBucket('knowledge', {
    public: true,
    fileSizeLimit: 1024 * 1024 * 50, // 50MB
    allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  })
  
  if (e1) {
    console.error('Error creating bucket "knowledge":', e1.message)
  } else {
    console.log('Bucket "knowledge" created successfully!')
  }

  const { data: b2, error: e2 } = await supabase.storage.createBucket('logos', {
    public: true
  })
  
  if (e2) {
    console.error('Error creating bucket "logos":', e2.message)
  } else {
    console.log('Bucket "logos" created successfully!')
  }
}

createBuckets()
