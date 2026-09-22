import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Check, Clipboard, LogOut, Mail, RefreshCw, Search, ShoppingBag, X, Copy, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { allowedStatusChanges, STATUS_LABELS } from '@/lib/commerce';
import { formatPrice } from '@/lib/format';
import type { CartItem } from '@/types';

const ADMIN_EMAIL = 'dreninallbani@gmail.com';
type Order = {
  id: string; order_number: string; customer_name: string; email: string; phone: string;
  address: string; city: string; zip?: string; notes?: string; items: CartItem[];
  total: number; subtotal: number; shipping: number; payment_method: string;
  supplier_status?: string; supplier_notes?: string; created_at: string;
  payment_status?: string; paysera_test_mode?: boolean; payment_review_reason?: string; paysera_payment_url?: string; paysera_payment_created_at?: string; paid_at?: string;
};
type Notice = { orderId: string; kind: 'success' | 'error'; text: string };
const money = (value: number) => formatPrice(Number(value) || 0);
const statusOf = (order: Order) => order.supplier_status || 'pending_supplier_check';
const isAdmin = (session: Session | null) => session?.user.email?.toLowerCase() === ADMIN_EMAIL;
const messageOf = (error: unknown) => error instanceof Error ? error.message : 'Veprimi dështoi. Provoni përsëri.';

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const mutationLock = useRef(false);
  const loadVersion = useRef(0);
  const selectedOrder = orders.find(order => order.id === selectedId);

  useEffect(() => {
    const requests = loadVersion;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      sessionRef.current = next;
      setSession(next);
      setAuthReady(true);
      if (!isAdmin(next)) {
        loadVersion.current++;
        setOrders([]);
        setSelectedId(null);
        setNotice(null);
        setLoading(false);
      }
    });
    return () => { subscription.unsubscribe(); requests.current++; };
  }, []);

  const loadOrders = useCallback(async () => {
    if (!isAdmin(sessionRef.current) || mutationLock.current) return;
    const version = ++loadVersion.current;
    setLoading(true);
    try {
      const all: Order[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error: queryError } = await supabase.from('orders').select('*')
          .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
        if (version !== loadVersion.current || !isAdmin(sessionRef.current)) return;
        if (queryError) throw new Error(queryError.message);
        all.push(...(data || []) as Order[]);
        if (!data || data.length < 500) break;
      }
      setOrders(all);
      setError('');
    } catch (caught) {
      if (version === loadVersion.current) setError(messageOf(caught));
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin(session)) return;
    void loadOrders();
    const refresh = () => { if (document.visibilityState === 'visible') void loadOrders(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [session, loadOrders]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (signingIn) return;
    setError('');
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('Kjo llogari nuk ka qasje në panelin e administratorit.'); return;
    }
    setSigningIn(true);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (loginError) throw new Error(loginError.message);
      setPassword('');
    } catch (caught) { setError(messageOf(caught)); }
    finally { setSigningIn(false); }
  };

  const signOut = async () => {
    try {
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      if (logoutError) throw new Error(logoutError.message);
    } catch (caught) { setError(messageOf(caught)); }
  };

  const updateOrder = async (order: Order, changes: Record<string, unknown>, action: string) => {
    if (mutationLock.current || !isAdmin(sessionRef.current)) return;
    mutationLock.current = true;
    const owner = sessionRef.current?.user.id;
    loadVersion.current++;
    setLoading(false);
    setSaving(action);
    setNotice(null);
    try {
      let query = supabase.from('orders').update(changes).eq('id', order.id);
      // Do not overwrite another admin tab's decision or notes using stale data.
      const field = 'supplier_status' in changes ? 'supplier_status' : 'supplier_notes';
      const previous = order[field];
      query = previous == null ? query.is(field, null) : query.eq(field, previous);
      const { data, error: updateError } = await query.select('*').single();
      if (updateError || !data) {
        throw new Error(updateError?.code === 'PGRST116'
          ? 'Porosia ndryshoi në një dritare tjetër ose qasja skadoi. Rifreskoni dhe provoni përsëri.'
          : updateError?.message || 'Ndryshimi nuk u ruajt. Rifreskoni porosinë.');
      }
      if (sessionRef.current?.user.id !== owner) return;
      setOrders(current => current.map(item => item.id === order.id ? data as Order : item));
      setNotice({ orderId: order.id, kind: 'success', text: action === 'notes'
        ? 'Shënimet u ruajtën.' : `${STATUS_LABELS[String(changes.supplier_status)]}. Ndryshimi u ruajt me sukses.` });
    } catch (caught) {
      if (sessionRef.current?.user.id === owner) setNotice({ orderId: order.id, kind: 'error', text: messageOf(caught) });
    } finally { mutationLock.current = false; setSaving(null); }
  };

  const changeStatus = async (order: Order, target: string) => {
    if (!allowedStatusChanges(order.payment_method, statusOf(order)).includes(target)) return;
    if (target === 'confirmed' && order.payment_method === 'paysera') {
      if (mutationLock.current || !isAdmin(sessionRef.current)) return;
      mutationLock.current = true;
      const owner = sessionRef.current?.user.id;
      loadVersion.current++;
      setLoading(false);
      setSaving(target);
      setNotice(null);
      try {
        const { data, error: functionError } = await supabase.functions.invoke('paysera-payment', { body: { order_id: order.id } });
        if (functionError) {
          const response = (functionError as { context?: Response }).context;
          const detail = response instanceof Response ? await response.clone().json().catch(() => null) : null;
          throw new Error(detail?.error || 'Nuk u krijua linku Paysera. Kontrolloni konfigurimin ose provoni përsëri.');
        }
        if (!data?.order) throw new Error(data?.error || 'Nuk u krijua linku Paysera.');
        if (sessionRef.current?.user.id !== owner) return;
        setOrders(current => current.map(item => item.id === order.id ? data.order as Order : item));
        setNotice({ orderId: order.id, kind: 'success', text: data.order.paysera_test_mode ? 'Linku TEST Paysera u krijua. Nuk është pagesë reale.' : 'Stoku u konfirmua dhe linku Paysera u krijua. Kontrolloni dërgimin në Make.' });
      } catch (caught) {
        if (sessionRef.current?.user.id === owner) setNotice({ orderId: order.id, kind: 'error', text: messageOf(caught) });
      } finally {
        mutationLock.current = false;
        setSaving(null);
      }
      return;
    }
    await updateOrder(order, {
      supplier_status: target, status: target,
      ...(target === 'confirmed' ? { supplier_confirmed_at: new Date().toISOString() } : {}),
      ...(target === 'shipped' ? { fulfilled_at: new Date().toISOString() } : {}),
    }, target);
  };

  const counts = useMemo(() => orders.reduce<Record<string, number>>((result, order) => {
    const status = statusOf(order); result[status] = (result[status] || 0) + 1; return result;
  }, {}), [orders]);
  const filtered = orders.filter(order => (filter === 'all' || (filter === 'payment_review' ? order.payment_status === 'paid_review' : statusOf(order) === filter))
    && [order.order_number, order.customer_name, order.email, order.phone, order.city]
      .some(value => value?.toLowerCase().includes(search.trim().toLowerCase())));

  if (!authReady) return <main className="min-h-screen grid place-items-center" role="status">Duke kontrolluar hyrjen…</main>;
  if (!session) return <main className="min-h-screen bg-stone-100 px-4 py-16">
    <form onSubmit={signIn} className="max-w-md mx-auto bg-white rounded-xl border p-6 shadow-sm">
      <ShoppingBag className="w-9 h-9 mb-5" /><p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Luxury Watches Kosovë</p>
      <h1 className="text-2xl font-bold mb-2">Hyr në panelin e dyqanit</h1><p className="text-sm text-stone-500 mb-6">Menaxho porositë dhe konfirmo stokun.</p>
      <label htmlFor="admin-email" className="block text-sm font-semibold mb-1">Email</label>
      <input id="admin-email" required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="w-full mb-4 px-3 py-3 rounded-lg border" />
      <label htmlFor="admin-password" className="block text-sm font-semibold mb-1">Fjalëkalimi</label>
      <input id="admin-password" required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mb-4 px-3 py-3 rounded-lg border" />
      {orders.some(order => order.payment_status === 'paid_review') && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 text-sm"><strong>Ka pagesa të pranuara që kërkojnë kontroll.</strong> Kontrolloni porositë e anuluara për kthim të parave ose dërgesë. <button className="underline font-semibold" onClick={() => setFilter('payment_review')}>Shiko pagesat</button></div>}
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      <button disabled={signingIn} className="w-full py-3 rounded-lg bg-stone-900 text-white font-semibold disabled:opacity-50">{signingIn ? 'Duke hyrë…' : 'Hyr'}</button>
    </form>
  </main>;
  if (!isAdmin(session)) return <main className="p-8"><h1>Nuk keni qasje në panelin e administratorit.</h1><button onClick={signOut} className="underline mt-4">Dil nga llogaria</button></main>;

  return <main className="min-h-screen bg-[#f6f6f7] text-stone-900">
    <header className="bg-stone-900 text-white flex items-center justify-between gap-3 px-4 py-4 sm:px-7">
      <div className="flex items-center gap-2 font-semibold"><ShoppingBag className="w-5 h-5 shrink-0" /> Luxury Watches <span className="hidden sm:inline text-stone-400">· Admin</span></div>
      <button onClick={signOut} disabled={!!saving} className="flex items-center gap-2 text-sm p-2 disabled:opacity-50"><LogOut size={17} /> Dil</button>
    </header>
    <div className="max-w-7xl mx-auto p-4 sm:p-7">
      <div className="flex justify-between items-end gap-3 mb-6"><div><h1 className="text-2xl font-bold">Porositë</h1><p className="text-sm text-stone-500 mt-1">Konfirmo stokun dhe shiko detajet e klientit.</p></div>
        <button onClick={() => void loadOrders()} disabled={loading || !!saving} className="bg-white border rounded-lg p-3 flex gap-2 items-center text-sm disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /><span className="hidden sm:inline">Rifresko</span></button></div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">{[
        ['pending_supplier_check', 'Të reja', Clipboard], ['confirmed', 'Të konfirmuara', Check], ['unavailable', 'Pa stok', AlertCircle],
      ].map(([key, label, Icon]) => <button key={key as string} onClick={() => setFilter(key as string)} className={`text-left bg-white rounded-xl border p-3 sm:p-5 ${filter === key ? 'border-amber-700' : 'border-stone-200'}`}>
        <p className="text-2xl font-bold">{counts[key as string] || 0}</p><p className="mt-1 text-xs text-stone-600 flex items-center gap-1"><Icon size={14} className="shrink-0" />{label as string}</p>
      </button>)}</div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm">{error}</p>}
      <section className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search size={17} className="absolute left-3 top-3 text-stone-400" /><input aria-label="Kërko porositë" value={search} onChange={e => setSearch(e.target.value)} placeholder="Emri, numri i porosisë ose emaili" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm" /></div>
          <select aria-label="Filtro statusin" value={filter} onChange={e => setFilter(e.target.value)} className="max-w-full rounded-lg border pl-3 py-2.5 text-sm"><option value="all">Të gjitha ({orders.length})</option><option value="payment_review">Pagesa për kontroll ({orders.filter(order => order.payment_status === 'paid_review').length})</option>{Object.entries(STATUS_LABELS).filter(([key]) => key !== 'supplier_confirmed' || counts[key]).map(([key, label]) => <option key={key} value={key}>{label} ({counts[key] || 0})</option>)}</select>
        </div>
        <div className="divide-y divide-stone-100">{filtered.map(order => <button key={order.id} onClick={() => { setSelectedId(order.id); setNotice(null); }} className="w-full text-left p-4 hover:bg-stone-50 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
          <div className="min-w-0"><p className="font-semibold text-sm">{order.order_number}</p><p className="text-xs text-stone-500 mt-1">{new Date(order.created_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}</p><p className="text-sm mt-1 break-words">{order.customer_name} · {order.city}</p></div>
          <p className={`text-xs px-2.5 py-1.5 rounded-full justify-self-end sm:justify-self-start ${statusOf(order) === 'unavailable' ? 'bg-red-50 text-red-800' : statusOf(order) === 'pending_supplier_check' ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>{STATUS_LABELS[statusOf(order)] || statusOf(order)}</p>
          <p className="col-span-2 sm:col-span-1 text-sm font-semibold sm:text-right">{order.payment_status === 'paid_review' && <span className="block text-red-800 text-xs mb-1">Pagesë e pranuar · Kërkon kontroll</span>}{order.paysera_test_mode && <span className="block text-amber-800 text-xs mb-1">TEST · Jo pagesë reale</span>}{money(order.total)} <span className="text-xs font-normal text-stone-500">· {order.payment_method === 'cod' ? 'Cash në dorëzim' : order.payment_method}</span></p>
        </button>)}</div>
        {!loading && filtered.length === 0 && <p className="text-center py-12 text-sm text-stone-500">Nuk ka porosi për këtë filtër.</p>}
        {loading && <p role="status" className="text-center py-4 text-sm text-stone-500">Duke rifreskuar porositë…</p>}
      </section>
    </div>
    {selectedOrder && <OrderDetails key={selectedOrder.id} order={selectedOrder} saving={saving} notice={notice?.orderId === selectedOrder.id ? notice : null} close={() => setSelectedId(null)} changeStatus={changeStatus} saveNotes={(notes) => updateOrder(selectedOrder, { supplier_notes: notes }, 'notes')} />}
  </main>;
}

function OrderDetails({ order, saving, notice, close, changeStatus, saveNotes }: {
  order: Order; saving: string | null; notice: Notice | null; close: () => void;
  changeStatus: (order: Order, target: string) => Promise<void>; saveNotes: (notes: string) => Promise<void>;
}) {
  const dialog = useRef<HTMLElement>(null);
  const [notes, setNotes] = useState(order.supplier_notes || '');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkCopyError, setLinkCopyError] = useState(false);
  const status = statusOf(order);
  const next = order.payment_status === 'paid_review' ? [] : allowedStatusChanges(order.payment_method, status)
    .filter(target => !(target === 'confirmed' && order.paysera_payment_url && status !== 'pending_supplier_check'));
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => { document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);
  const closeIfReady = () => { if (!saving) close(); };
  const actionText: Record<string, string> = {
    confirmed: 'Ka stok · Konfirmo', unavailable: 'Nuk ka stok', awaiting_payment: 'Kërko pagesën',
    paid_awaiting_arrival: 'Shëno pagesën e verifikuar', ready_to_ship: 'Gati për dërgesë', shipped: 'Shëno si të dërguar', cancelled: 'Anulo porosinë',
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(order.order_number); setCopied(true); setCopyError(false); }
    catch { setCopyError(true); }
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={closeIfReady}>
    <aside ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="order-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
      if (event.key === 'Escape') closeIfReady();
      if (event.key === 'Tab') {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, textarea, select');
        const first = nodes?.[0]; const last = nodes?.[nodes.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }} className="w-full max-w-xl h-full overflow-y-auto bg-white shadow-2xl outline-none">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4"><div><p className="text-xs text-stone-500">Detajet e porosisë</p><h2 id="order-title" className="text-xl font-bold">{order.order_number}</h2></div><button disabled={!!saving} onClick={closeIfReady} aria-label="Mbyll detajet" className="p-2"><X size={20} /></button></div>
      <div className="p-4 sm:p-5 space-y-5">
        <section className="rounded-xl border p-4 space-y-3">
          <p className="font-semibold flex gap-2 items-center"><Check size={18} /> {STATUS_LABELS[status] || status}</p>
          {next.length > 0 && <div className="grid grid-cols-2 gap-2">{next.map(target => <button key={target} onClick={() => void changeStatus(order, target)} disabled={!!saving} className={`min-h-12 rounded-lg px-3 py-3 text-sm font-semibold flex gap-2 items-center justify-center disabled:opacity-50 ${target === 'unavailable' || target === 'cancelled' ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}>
            {saving === target && <Loader2 size={16} className="animate-spin shrink-0" />}{saving === target ? 'Duke ruajtur…' : actionText[target]}
          </button>)}</div>}
          {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg p-3 text-sm ${notice.kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-900'}`}>{notice.text}</div>}
          <div className="rounded-lg bg-stone-50 p-3 text-sm"><p className="flex items-center gap-2 font-semibold"><Mail size={16} /> Emaili i klientit</p><p className="break-all mt-1">{order.email}</p><p className="mt-2 text-xs text-stone-500">Statusi i dërgimit të emailit nuk është i disponueshëm në panel. Konfirmimi i porosisë më sipër tregon vetëm ndryshimin e ruajtur.</p></div>
          {order.payment_method === 'paysera' && <div className="text-sm rounded-lg p-3 bg-amber-50 text-amber-950 space-y-2">
            {order.payment_status === 'paid_review' ? <p role="alert" className="font-semibold text-red-800">Pagesa u pranua pas anulimit ose ndryshimit të porosisë. Kontrolloni Paysera për kthim të parave ose kontaktoni klientin. Mos e dërgoni automatikisht.</p>
              : order.payment_status === 'paid' ? <p className="font-semibold text-emerald-800">Pagesa Paysera u konfirmua: {money(order.total)}.</p>
              : order.payment_status === 'test_paid' ? <p className="font-semibold">TEST i suksesshëm — nuk janë pranuar para reale dhe porosia nuk dërgohet.</p>
              : <p className="font-semibold">{order.paysera_test_mode ? 'TEST · ' : ''}{order.paysera_payment_url ? 'Në pritje të pagesës Paysera.' : 'Linku Paysera krijohet sapo të konfirmoni stokun.'}</p>}
            {order.paysera_payment_url && order.payment_status === 'awaiting_payment' && !['unavailable', 'cancelled'].includes(status) && <button type="button" className="underline font-semibold" onClick={async () => { try { await navigator.clipboard.writeText(order.paysera_payment_url || ''); setLinkCopied(true); setLinkCopyError(false); } catch { setLinkCopyError(true); } }}>{linkCopied ? 'Linku u kopjua' : 'Kopjo linkun e pagesës'}</button>}
            {linkCopyError && <p role="alert">Kopjimi dështoi. Provoni përsëri në një shfletues me leje për kopjim.</p>}
            {['unavailable', 'cancelled'].includes(status) && order.payment_status !== 'paid_review' && <p>Porosia është anuluar. Nëse klienti paguan një link të vjetër, pagesa do të shënohet për kontroll në panel.</p>}
          </div>}
        </section>
        <section className="border rounded-xl p-4"><h3 className="font-semibold mb-3">Artikujt</h3>{(order.items || []).map((item, index) => <div key={item.id || index} className="flex justify-between gap-3 py-2 border-t border-stone-100"><p className="text-sm min-w-0 break-words">{item.quantity} × {item.name}</p><p className="text-sm font-medium shrink-0">{money(item.price * item.quantity)}</p></div>)}
          <dl className="border-t mt-3 pt-3 space-y-2 text-sm"><div className="flex justify-between"><dt>Nëntotali</dt><dd>{money(order.subtotal)}</dd></div><div className="flex justify-between"><dt>Posta</dt><dd>{Number(order.shipping) === 0 ? '€0.00' : money(order.shipping)}</dd></div><div className="flex justify-between font-bold text-base"><dt>Totali për pagesë</dt><dd>{money(order.total)}</dd></div></dl>
        </section>
        <section className="border rounded-xl p-4 space-y-2"><h3 className="font-semibold">Klienti</h3><p>{order.customer_name}</p><a className="block text-sm text-blue-700 break-all" href={`mailto:${order.email}`}>{order.email}</a><a className="block text-sm text-blue-700" href={`tel:${order.phone}`}>{order.phone}</a><p className="text-sm text-stone-600 break-words">{order.address}, {order.city} {order.zip}</p>{order.notes && <div className="bg-amber-50 rounded-lg p-3 text-sm"><strong>Shënimi i klientit:</strong><p className="mt-1 whitespace-pre-wrap break-words">{order.notes}</p></div>}<p className="text-sm font-semibold">{order.payment_method === 'cod' ? 'Pagesë në dorëzim · Cash' : 'Pagesë Paysera'}</p></section>
        <section className="border rounded-xl p-4"><label htmlFor="supplier-notes" className="font-semibold block mb-2">Shënime të brendshme</label><textarea id="supplier-notes" value={notes} maxLength={2000} disabled={!!saving} onChange={event => setNotes(event.target.value)} rows={3} className="w-full p-3 border rounded-lg text-sm" /><button disabled={!!saving || notes === (order.supplier_notes || '')} onClick={() => void saveNotes(notes)} className="mt-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm disabled:opacity-40">{saving === 'notes' ? 'Duke ruajtur…' : 'Ruaj shënimet'}</button></section>
        <button onClick={copy} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2"><Copy size={16} />{copied ? 'Numri u kopjua' : 'Kopjo numrin e porosisë'}</button>{copyError && <p role="alert" className="text-sm text-red-700">Nuk u kopjua. Numri i porosisë: {order.order_number}</p>}
      </div>
    </aside>
  </div>;
}
