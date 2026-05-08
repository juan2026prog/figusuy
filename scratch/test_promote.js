
import { createClient } from '@supabase/supabase-client';

const supabase = createClient('https://yntpctzgxaderribxsbe.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testApproval() {
  const userId = '633f1113-49fa-4601-a025-df13ef4b0f16'; // Mogumbo
  const role = 'influencer';
  
  console.log(`Promoting user ${userId} to ${role}...`);
  
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    
  if (error) {
    console.error('Error promoting user:', error);
  } else {
    console.log('Success!', data);
  }
}

testApproval();
