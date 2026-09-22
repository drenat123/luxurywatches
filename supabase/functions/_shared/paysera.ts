import { createHash, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export function paymentConfig(env: (key: string) => string | undefined) {
  const projectId = env('PAYSERA_PROJECT_ID') || '';
  const password = env('PAYSERA_SIGN_PASSWORD') || '';
  const mode = env('PAYSERA_TEST_MODE');
  if (!/^\d{1,11}$/.test(projectId) || !password || !['0', '1'].includes(mode || '')) {
    throw new Error('Set PAYSERA_PROJECT_ID, PAYSERA_SIGN_PASSWORD and PAYSERA_TEST_MODE (0 or 1).');
  }
  const site = new URL(env('SITE_URL') || 'https://luxurywatchesks.com');
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash || site.username || site.password) throw new Error('SITE_URL must be an HTTPS site origin.');
  return { projectId, password, test: mode === '1', site: site.origin };
}

export function cents(value: unknown) {
  const number = Number(value);
  const result = Math.round(number * 100);
  if (!Number.isFinite(number) || !Number.isSafeInteger(result) || result <= 0 || result > 99999999999) throw new Error('Invalid payment amount.');
  return result;
}

export function paymentLink(parameters: Record<string, string>, password: string) {
  const data = Buffer.from(new URLSearchParams(parameters).toString(), 'utf8').toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
  const sign = createHash('md5').update(data + password).digest('hex');
  return `https://www.paysera.com/pay/?${new URLSearchParams({ data, sign })}`;
}

export function verifiedCallback(incoming: URLSearchParams, config: ReturnType<typeof paymentConfig>) {
  const data = incoming.get('data') || '';
  const ss1 = incoming.get('ss1') || '';
  if (incoming.getAll('data').length !== 1 || incoming.getAll('ss1').length !== 1 || !/^[A-Za-z0-9_\-+/]+={0,2}$/.test(data) || data.length > 32768 || !/^[a-f\d]{32}$/i.test(ss1)) throw new Error('Invalid callback.');
  const expected = createHash('md5').update(data + config.password).digest();
  if (!timingSafeEqual(expected, Buffer.from(ss1, 'hex'))) throw new Error('Invalid signature.');
  const decoded = new URLSearchParams(Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  for (const key of new Set(decoded.keys())) if (decoded.getAll(key).length !== 1) throw new Error('Duplicate callback field.');
  if (decoded.get('projectid') !== config.projectId) throw new Error('Invalid project.');
  const test = decoded.get('test') || '0';
  if (!['0', '1'].includes(test) || (test === '1') !== config.test) throw new Error('Payment mode mismatch.');
  const orderNumber = decoded.get('orderid') || '';
  const status = decoded.get('status') || '';
  if (!/^LW-[A-Z0-9]{6,32}$/.test(orderNumber) || !/^[0-4]$/.test(status)) throw new Error('Invalid order or status.');
  const amount = decoded.has('payamount') ? decoded.get('payamount') : decoded.get('amount');
  const currency = decoded.has('payamount') ? decoded.get('paycurrency') : decoded.get('currency');
  if (!amount || !/^\d{1,11}$/.test(amount) || Number(amount) <= 0 || currency !== 'EUR') throw new Error('Invalid payment amount or currency.');
  return { orderNumber, status, amount: Number(amount), currency, test: test === '1' };
}
