import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { action, ...payload } = await req.json()

    if (action === 'process_queue') {
      return await processQueue(supabase, RESEND_API_KEY)
    }

    if (action === 'test_send') {
      return await testSend(supabase, RESEND_API_KEY, payload)
    }

    if (action === 'preview_template') {
      return await previewTemplate(supabase, payload)
    }

    if (action === 'trigger_event') {
      return await triggerEvent(supabase, payload)
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function compileTemplate(supabase: any, template: any, variables: any) {
  // 1. Get Layout
  const { data: layout } = await supabase
    .from('email_blocks')
    .select('content_html')
    .eq('id', template.layout_id)
    .single()

  let masterHtml = layout?.content_html || '<html><body>{{content}}</body></html>'

  // 2. Get Blocks
  let compiledBlocksHtml = ''
  if (template.block_ids && template.block_ids.length > 0) {
    const { data: blocks } = await supabase
      .from('email_blocks')
      .select('id, content_html')
      .in('id', template.block_ids)

    // Sort blocks as they were in block_ids array
    const sortedBlocks = template.block_ids.map(id => blocks.find(b => b.id === id)).filter(Boolean)
    compiledBlocksHtml = sortedBlocks.map(b => b.content_html).join('')
  }

  // 3. Add custom body if any
  compiledBlocksHtml += (template.body_html || '')

  // 4. Inject content into layout
  let fullHtml = masterHtml.replace('{{content}}', compiledBlocksHtml)

  // 5. Replace variables
  const allVars = { 
    ...variables, 
    subject: template.subject,
    preheader: template.preheader || '',
    unsubscribe_url: `https://figusuy.com/profile/settings/emails`
  }

  Object.entries(allVars).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    fullHtml = fullHtml.replace(regex, String(value))
  })

  return fullHtml
}

async function triggerEvent(supabase: any, { event_key, user_id, variables }) {
  // Find trigger config
  const { data: config, error } = await supabase
    .from('email_trigger_configs')
    .select('*, email_templates(*)')
    .eq('event_key', event_key)
    .eq('is_active', true)
    .single()

  if (error || !config) throw new Error(`Trigger config not found for event: ${event_key}`)

  // Enqueue
  const { data: queueId, error: qError } = await supabase.rpc('enqueue_email', {
    p_user_id: user_id,
    p_template_slug: config.email_templates.slug,
    p_variables: variables,
    p_priority: config.priority
  })

  if (qError) throw qError

  return new Response(JSON.stringify({ success: true, queue_id: queueId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function previewTemplate(supabase: any, { template_id, variables }) {
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', template_id)
    .single()

  const html = await compileTemplate(supabase, template, variables || {})
  return new Response(JSON.stringify({ html }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function testSend(supabase: any, resendKey: any, { template_id, email, variables }) {
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', template_id)
    .single()

  const html = await compileTemplate(supabase, template, variables || {})

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendKey}`
    },
    body: JSON.stringify({
      from: 'FigusUY <onboarding@resend.dev>',
      to: [email],
      subject: `[TEST] ${template.subject}`,
      html: html
    })
  })

  const resData = await resendRes.json()
  return new Response(JSON.stringify(resData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function processQueue(supabase: any, resendKey: string | undefined) {
  if (!resendKey) throw new Error('RESEND_API_KEY not set')

  const { data: queueItems, error: queueError } = await supabase
    .from('email_queue')
    .select('*, profiles(email, name)')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .limit(10)

  if (queueError) throw queueError
  
  const results = []

  for (const item of queueItems) {
    try {
      await supabase.from('email_queue').update({ status: 'processing' }).eq('id', item.id)

      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', item.template_slug)
        .single()

      if (templateError || !template) throw new Error(`Template not found: ${item.template_slug}`)

      const html = await compileTemplate(supabase, template, item.variables || {})

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: 'FigusUY <onboarding@resend.dev>',
          to: [item.profiles.email],
          subject: template.subject,
          html: html
        })
      })

      const resendData = await resendRes.json()
      if (!resendRes.ok) throw new Error(resendData.message || 'Resend API error')

      await supabase.from('email_logs').insert({
        user_id: item.user_id,
        template_id: template.id,
        recipient_email: item.profiles.email,
        subject: template.subject,
        status: 'sent',
        provider_id: resendData.id,
        metadata: { queue_id: item.id }
      })

      await supabase.from('email_queue').update({ status: 'sent', processed_at: new Date().toISOString() }).eq('id', item.id)
      results.push({ id: item.id, success: true })

    } catch (err) {
      await supabase.from('email_queue').update({ 
        status: item.retry_count < item.max_retries ? 'pending' : 'failed',
        retry_count: item.retry_count + 1,
        last_error: err.message
      }).eq('id', item.id)
      results.push({ id: item.id, success: false, error: err.message })
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
