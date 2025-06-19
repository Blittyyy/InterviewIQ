import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixTrialFlags() {
  const { data, error } = await supabase
    .from('users')
    .update({ trial_active: false })
    .in('subscription_status', ['pro', 'enterprise'])
    .neq('trial_active', false)
    .select('id')

  if (error) {
    console.error('Error updating users:', error)
  } else {
    console.log(`Updated ${data?.length || 0} users to set trial_active to false.`)
  }
}

fixTrialFlags() 