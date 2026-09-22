import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { paymentConfig, verifiedCallback } from '../_shared/paysera.ts';

Deno.serve(async (req: Request) => {
  if (!['GET', 'POST'].includes(req.method)) return new Response('Method not allowed', { status: 405 });
  let config;
  try { config = paymentConfig(key => Deno.env.get(key)); }
  catch { return new Response('Configuration error', { status: 503 }); }
  let payment;
  try {
    let incoming: URLSearchParams;
    if (req.method === 'GET') incoming = new URL(req.url).searchParams;
    else {
      if (!req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) return new Response('Unsupported content type', { status: 415 });
      const body = await req.text();
      if (body.length > 40000) return new Response('Request too large', { status: 413 });
      incoming = new URLSearchParams(body);
    }
    payment = verifiedCallback(incoming, config);
  } catch { return new Response('Invalid payment notification', { status: 400 }); }
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    // The database locks the order and checks amount/mode/state atomically.
    const { error } = await admin.rpc('record_paysera_callback', {
      p_order_number: payment.orderNumber, p_amount: payment.amount,
      p_currency: payment.currency, p_status: payment.status, p_test: payment.test,
    });
    if (error) {
      console.error('Paysera callback database failure', error.code);
      return new Response('Callback not recorded', { status: 500 });
    }
    return new Response('OK', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch { return new Response('Callback not recorded', { status: 500 }); }
});
