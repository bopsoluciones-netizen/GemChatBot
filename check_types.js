
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkColumnTypes() {
  console.log('Checking column types...')
  
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'appointments' })
  // If rpc doesn't exist, we'll try to infer from a raw query or just use the REST API
  
  if (error) {
    // Try to get one row and check if the date looks like it has an offset
    const { data: row } = await supabase.from('appointments').select('start_time').limit(1)
    if (row && row.length > 0) {
      console.log('Sample start_time:', row[0].start_time)
      // Check if it ends with +00 or Z
    } else {
      console.log('No rows found to infer type.')
    }
  } else {
    console.log('Table Info:', data)
  }
}

checkColumnTypes()
