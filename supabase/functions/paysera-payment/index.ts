import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { paymentConfig, paymentLink, cents } from '../_shared/paysera.ts';
const ADMIN_EMAIL = 'dreninallbani@gmail.com';

Deno.serve(async (req: Request) => {
  let config;
  try { config = paymentConfig(key => Deno.env.get(key)); }
  catch { return new Response(JSON.stringify({ error: 'Paysera nuk është konfiguruar ende.' }), { status: 503, headers: { 'Content-Type': 'application/json' } }); }
  const origin = req.headers.get('origin');
  const allowed = new Set([config.site, ...(Deno.env.get('PAYSERA_ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean)]);
  const headers = {
    'Access-Control-Allow-Origin': origin && allowed.has(origin) ? origin : config.site,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Content-Type': 'application/json', 'Vary': 'Origin',
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.has(origin)) return json({ error: 'Origin not allowed.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Unauthorized.' }, 401);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || userData.user?.email?.toLowerCase() !== ADMIN_EMAIL) return json({ error: 'Unauthorized.' }, 401);
    const body = await req.json().catch(() => null) as { order_id?: string; refresh?: boolean } | null;
    if (!body?.order_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.order_id)) return json({ error: 'Invalid order.' }, 400);
    const { data: order, error } = await admin.from('orders').select('*').eq('id', body.order_id).single();
    if (error || !order) return json({ error: 'Porosia nuk u gjet.' }, 404);
    if (order.payment_method !== 'paysera' || !['pending_supplier_check', 'confirmed', 'supplier_confirmed', 'awaiting_payment'].includes(order.supplier_status) || ['paid', 'paid_review'].includes(order.payment_status)) {
      return json({ error: 'Kjo porosi nuk mund të marrë një link të ri pagese.' }, 409);
    }
    const amount = cents(order.total);
    const parameters: Record<string, string> = {
      projectid: config.projectId, orderid: String(order.order_number), amount: String(amount), currency: 'EUR',
      accepturl: `${config.site}/#/payment-result?status=success&order=${encodeURIComponent(order.order_number)}`,
      cancelurl: `${config.site}/#/payment-result?status=cancelled&order=${encodeURIComponent(order.order_number)}`,
      callbackurl: `${config.site}/paysera-callback.php`,
      version: '1.8', p_email: String(order.email), test: config.test ? '1' : '0',
    };
    const url = paymentLink(parameters, config.password);
    const { data: updated, error: saveError } = await admin.rpc('prepare_paysera_payment', {
      p_order_id: order.id, p_amount: amount, p_url: url, p_test: config.test,
    });
    if (saveError || !updated) return json({ error: 'Porosia ndryshoi ose konfigurimi i databazës mungon. Rifreskoni dhe provoni përsëri.' }, 409);
    return json({ order: updated, payment_url: updated.paysera_payment_url });
  } catch {
    return json({ error: 'Nuk mund të përgatitet pagesa Paysera. Provoni përsëri.' }, 500);
  }
});
