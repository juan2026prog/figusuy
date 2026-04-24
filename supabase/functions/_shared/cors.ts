// Allowed origins for CORS. Add your production domain here.
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  // Agrega aquí tu dominio de producción cuando lo tengas
];

export function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function getCorsHeaders(req: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
