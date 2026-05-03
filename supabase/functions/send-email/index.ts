import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, template, data } = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let html = ''

    if (template === 'business_approved') {
      html = `
<div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e5e7eb;">
    
    <div style="background:#ea580c; padding:28px 24px; color:#ffffff;">
      <h1 style="margin:0; font-size:26px;">Tu local fue aprobado 🎉</h1>
      <p style="margin:8px 0 0; font-size:15px;">Ya formás parte de FigusUY Negocios.</p>
    </div>

    <div style="padding:28px 24px; color:#111827;">
      <p style="font-size:16px; margin-top:0;">Hola <strong>${data.name}</strong>,</p>

      <p style="font-size:15px; line-height:1.6;">
        ¡Buenas noticias! Tu solicitud fue aprobada y tu local ya fue habilitado en FigusUY.
      </p>

      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:16px; padding:18px; margin:22px 0;">
        <strong style="display:block; margin-bottom:10px;">Tu plan actual</strong>
        <div style="display:inline-block; background:#ea580c; color:#ffffff; padding:8px 14px; border-radius:999px; font-size:13px; font-weight:bold;">
          ${data.plan}
        </div>
        <p style="margin:12px 0 0; font-size:14px; color:#7c2d12; line-height:1.5;">
          Tu local fue activado con este plan y ya puede comenzar a aparecer dentro de FigusUY según su configuración y visibilidad.
        </p>
      </div>

      <div style="background:#fff7ed; border:1px solid #fed7aa; border-radius:16px; padding:18px; margin:22px 0;">
        <strong style="display:block; margin-bottom:10px;">Desde ahora podés:</strong>
        <ul style="padding-left:20px; margin:0; line-height:1.8;">
          <li>Aparecer como punto o tienda dentro de la app</li>
          <li>Recibir consultas por WhatsApp</li>
          <li>Editar tu perfil</li>
          <li>Cargar fotos</li>
          <li>Configurar promos</li>
          <li>Ver métricas de rendimiento</li>
        </ul>
      </div>

      <p style="font-size:15px; line-height:1.6;">
        Te recomendamos completar tu perfil cuanto antes para mejorar tu visibilidad y aprovechar mejor tu plan.
      </p>

      <div style="text-align:center; margin:30px 0;">
        <a href="${data.link}"
           style="background:#ea580c; color:#ffffff; text-decoration:none; padding:14px 24px; border-radius:999px; font-weight:bold; display:inline-block;">
          Ingresar a mi local
        </a>
      </div>

      <p style="font-size:14px; color:#64748b; line-height:1.6;">
        Tip rápido: agregá fotos, horarios y WhatsApp para que los usuarios puedan encontrarte y contactarte más fácil.
      </p>

      <p style="font-size:15px; margin-bottom:0;">
        Bienvenido a <strong>FigusUY Negocios</strong> 🚀
      </p>
    </div>

    <div style="background:#f1f5f9; padding:18px 24px; font-size:12px; color:#64748b; text-align:center;">
      FigusUY · Plataforma de intercambio y puntos para coleccionistas
    </div>

  </div>
</div>`
    } else if (template === 'business_requested') {
      html = `
<div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e5e7eb;">
    
    <div style="background:#1e293b; padding:28px 24px; color:#ffffff;">
      <h1 style="margin:0; font-size:26px;">Recibimos tu solicitud 📩</h1>
      <p style="margin:8px 0 0; font-size:15px;">Estamos revisando los datos de <strong>${data.business_name}</strong>.</p>
    </div>

    <div style="padding:28px 24px; color:#111827;">
      <p style="font-size:16px; margin-top:0;">Hola <strong>${data.name}</strong>,</p>

      <p style="font-size:15px; line-height:1.6;">
        Muchas gracias por postular tu local para formar parte de FigusUY. 
      </p>

      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:16px; padding:18px; margin:22px 0;">
        <strong style="display:block; margin-bottom:10px; font-size:14px; color:#64748b; text-transform:uppercase;">Resumen de solicitud:</strong>
        <p style="margin:4px 0; font-size:15px;"><strong>Local:</strong> ${data.business_name}</p>
        <p style="margin:4px 0; font-size:15px;"><strong>Dirección:</strong> ${data.address}</p>
        <p style="margin:4px 0; font-size:15px;"><strong>Plan:</strong> ${data.plan}</p>
      </div>

      <p style="font-size:15px; line-height:1.6;">
        Nuestro equipo de moderación revisará la información en un plazo máximo de 48hs hábiles. Te avisaremos por este mismo medio una vez que el local sea aprobado y activado en la plataforma.
      </p>

      <p style="font-size:15px; line-height:1.6;">
        Si tienes alguna duda o necesitas corregir algún dato, podés responder directamente a este mail.
      </p>

      <p style="font-size:15px; margin-bottom:0;">
        Atentamente,<br/>
        El equipo de <strong>FigusUY</strong> 🚀
      </p>
    </div>

    <div style="background:#f1f5f9; padding:18px 24px; font-size:12px; color:#64748b; text-align:center;">
      FigusUY · Montevideo, Uruguay
    </div>

  </div>
</div>`
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'FigusUY <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html
      })
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: res.status
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
