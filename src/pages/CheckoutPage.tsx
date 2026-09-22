import { useRef, useState } from 'react';
import { Check, Lock, ShoppingBag, CreditCard, Truck, ArrowRight, Loader2, Banknote } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { orderTotals, validCart } from '@/lib/commerce';
import { cartChanged, checkoutAttempt, cleanCustomer, customerError, findReceipt, rememberReceipt, finishCheckoutAttempt } from '@/lib/checkout';
import type { CustomerForm, PaymentMethod } from '@/lib/checkout';
import type { CartItem, Product } from '@/types';
import { navigate } from '@/lib/router';

const payseraEnabled = import.meta.env.VITE_PAYSERA_ENABLED === 'true';
const inputClass = 'w-full min-w-0 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-amber-500 focus:bg-white transition-colors text-base';
const fields: { key: keyof CustomerForm; label: string; placeholder: string; autoComplete: string; type?: string; required?: boolean; max: number; wide?: boolean }[] = [
  { key: 'customer_name', label: 'Emri dhe mbiemri', placeholder: 'Filan Fisteku', autoComplete: 'name', required: true, max: 120, wide: true },
  { key: 'email', label: 'Email', placeholder: 'filan@email.com', type: 'email', autoComplete: 'email', required: true, max: 254 },
  { key: 'phone', label: 'Telefon', placeholder: '+383 44 123 456', type: 'tel', autoComplete: 'tel', required: true, max: 30 },
  { key: 'address', label: 'Adresa', placeholder: 'Rruga, numri, hyrja', autoComplete: 'street-address', required: true, max: 250, wide: true },
  { key: 'city', label: 'Qyteti', placeholder: 'Prishtinë', autoComplete: 'address-level2', required: true, max: 100 },
  { key: 'zip', label: 'Kodi postar', placeholder: '10000', autoComplete: 'postal-code', max: 20 },
];

export function CheckoutPage() {
  const { items, completeOrder, replaceItems, closeCart } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const submitting = useRef(false);
  const fallbackAttempt = useRef<Awaited<ReturnType<typeof checkoutAttempt>> | null>(null);
  const [form, setForm] = useState<CustomerForm>({ customer_name: '', email: '', phone: '', address: '', city: '', zip: '', notes: '' });
  const totals = orderTotals(items);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    const customer = cleanCustomer(form);
    const validation = customerError(customer);
    if (validation) { setError(validation); return; }
    if (!items.length || items.length > 100 || validCart(items).length !== items.length) { setError('Kontrolloni produktet në shportë përpara porosisë. Lejohen deri në 100 produkte të ndryshme.'); return; }
    submitting.current = true;
    setProcessing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const { data, error: catalogueError } = await supabase.from('products').select('*').in('id', items.map(item => item.id)).abortSignal(controller.signal);
      if (catalogueError || !data) throw new Error('Nuk mund të kontrollojmë produktet tani. Ju lutemi provoni përsëri.');
      const catalogue = data as Product[];
      const checkedItems: CartItem[] = items.map(item => {
        const product = catalogue.find(row => row.id === item.id);
        if (!product || product.is_active === false || product.in_stock === false) throw new Error(`Produkti “${item.name}” nuk është më i disponueshëm. Hiqeni nga shporta për të vazhduar.`);
        if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) throw new Error('Çmimi i produktit nuk është i vlefshëm. Ju lutemi na kontaktoni.');
        return { id: product.id, name: product.name, brand: product.brand, image: product.image, price: Number(product.price), quantity: item.quantity };
      });
      if (cartChanged(items, checkedItems)) {
        replaceItems(checkedItems);
        throw new Error('Çmimet u përditësuan sipas katalogut. Kontrolloni totalin e ri dhe shtypni përsëri “Porosit tani”.');
      }
      const verifiedTotals = orderTotals(checkedItems);
      const payload = {
        ...customer, zip: customer.zip || null, notes: customer.notes || null,
        payment_method: paymentMethod, status: 'pending_supplier_check', supplier_status: 'pending_supplier_check',
        items: checkedItems, ...verifiedTotals,
      };
      const attempt = await checkoutAttempt(payload);
      fallbackAttempt.current = attempt;
      const { error: insertError } = await supabase.from('orders').insert({ ...payload, id: attempt.id, order_number: attempt.order_number }).abortSignal(controller.signal);
      const alreadySaved = insertError?.code === '23505' && insertError.message.includes('orders_pkey');
      if (insertError && !alreadySaved) {
        if (insertError.code === 'P0001') throw new Error(insertError.message);
        throw new Error(`Nuk morëm konfirmim për porosinë ${attempt.order_number}. Provoni përsëri me të njëjtat të dhëna; nuk do të krijohet porosi e dyfishtë.`);
      }
      rememberReceipt({ order_number: attempt.order_number, ...verifiedTotals, payment_method: paymentMethod });
      finishCheckoutAttempt();
      completeOrder(checkedItems);
      closeCart();
      navigate(`/order-success?order=${encodeURIComponent(attempt.order_number)}`);
    } catch (caught) {
      setError(controller.signal.aborted
        ? `Lidhja u vonua. Provoni përsëri me të njëjtat të dhëna.${fallbackAttempt.current ? ` Numri i kërkesës: ${fallbackAttempt.current.order_number}.` : ''}`
        : caught instanceof Error ? caught.message : 'Porosia nuk u konfirmua. Provoni përsëri.');
    } finally {
      window.clearTimeout(timeout);
      submitting.current = false;
      setProcessing(false);
    }
  };

  if (!items.length && !processing) return <div className="pt-20 min-h-screen bg-stone-50 flex items-center justify-center px-4"><div className="text-center"><ShoppingBag className="w-16 h-16 text-stone-300 mx-auto mb-4" /><h1 className="text-xl font-bold mb-4">Shporta është bosh</h1><button onClick={() => navigate('/shop')} className="px-6 py-3 bg-amber-700 text-white rounded-xl">Shiko produktet</button></div></div>;

  return <div className="pt-20 min-h-screen bg-stone-50">
    <div className="bg-stone-900 py-9 sm:py-12 text-center px-4"><h1 className="text-3xl sm:text-4xl font-bold text-white">Përfundo porosinë</h1><p className="flex items-center justify-center gap-2 mt-3 text-stone-300 text-sm"><Lock size={16} /> Pagesa bëhet vetëm pasi të konfirmojmë stokun</p></div>
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <fieldset disabled={processing} className="grid min-w-0 lg:grid-cols-3 gap-6" aria-busy={processing}>
        <legend className="sr-only">Të dhënat dhe përmbledhja e porosisë</legend>
        <div className="min-w-0 lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Truck size={20} className="text-amber-700" /> Adresa e dorëzimit · Kosovë</h2>
            <div className="grid sm:grid-cols-2 gap-4">{fields.map(field => <div key={field.key} className={field.wide ? 'sm:col-span-2 min-w-0' : 'min-w-0'}>
              <label htmlFor={`checkout-${field.key}`} className="block text-sm font-semibold text-stone-700 mb-1.5">{field.label}{field.required ? ' *' : ''}</label>
              <input id={`checkout-${field.key}`} name={field.key} type={field.type || 'text'} required={field.required} maxLength={field.max} autoComplete={field.autoComplete} value={form[field.key]} onChange={e => setForm(current => ({ ...current, [field.key]: e.target.value }))} className={inputClass} placeholder={field.placeholder} />
            </div>)}<div className="sm:col-span-2"><label htmlFor="checkout-notes" className="block text-sm font-semibold mb-1.5">Shënime për dorëzimin (opsionale)</label><textarea id="checkout-notes" value={form.notes} maxLength={1000} onChange={e => setForm(current => ({ ...current, notes: e.target.value }))} className={inputClass} rows={2} placeholder="Udhëzime për korrierin…" /></div></div>
          </section>
          <section className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard size={20} className="text-amber-700" /> Mënyra e pagesës</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod('cod')} aria-pressed={paymentMethod === 'cod'} className={`text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${paymentMethod === 'cod' ? 'border-amber-600 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                <span className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-300'}`}>{paymentMethod === 'cod' && <Check size={14} />}</span>
                <span><span className="font-semibold flex items-center gap-2"><Banknote size={18} /> Pagesë në dorëzim</span><span className="block text-sm text-stone-600 mt-1">Paguani te korrieri pasi të konfirmojmë stokun.</span></span>
              </button>
              <button
                type="button"
                disabled={!payseraEnabled}
                onClick={() => payseraEnabled && setPaymentMethod('paysera')}
                aria-pressed={payseraEnabled && paymentMethod === 'paysera'}
                aria-disabled={!payseraEnabled}
                className={`relative text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${payseraEnabled && paymentMethod === 'paysera' ? 'border-amber-600 bg-amber-50' : payseraEnabled ? 'border-stone-200 bg-white hover:border-stone-300' : 'border-stone-200 bg-stone-50 cursor-not-allowed'}`}
              >
                {!payseraEnabled && <span className="absolute top-3 right-3 rounded-full bg-stone-900 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">SË SHPEJTI</span>}
                <span className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${payseraEnabled && paymentMethod === 'paysera' ? 'border-amber-700 bg-amber-700 text-white' : 'border-stone-300 bg-white'}`}>{payseraEnabled && paymentMethod === 'paysera' && <Check size={14} />}</span>
                <span className="pr-16 min-w-0">
                  <span className="font-semibold flex items-center gap-2"><CreditCard size={18} /> Pagesë me kartelë <span className="text-stone-500 font-medium">(Paysera)</span></span>
                  <span className="block text-sm text-stone-600 mt-1">{payseraEnabled ? 'Nuk paguani tani. Pas konfirmimit të stokut, linku i sigurt i pagesës ju vjen me email.' : 'Paguani online me Visa, Mastercard ose Maestro përmes Paysera sapo ky opsion të aktivizohet.'}</span>
                  <span className="mt-3 flex flex-wrap items-center gap-2" aria-label="Kartelat e mbështetura: Visa, Mastercard dhe Maestro">
                    <img src="/payment-logos/visa.svg" alt="Visa" className="h-8 w-auto" />
                    <img src="/payment-logos/mastercard.svg" alt="Mastercard" className="h-8 w-auto" />
                    <img src="/payment-logos/maestro.svg" alt="Maestro" className="h-8 w-auto" />
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
        <section className="min-w-0 lg:col-span-1"><div className="bg-white rounded-2xl p-4 sm:p-6 border border-stone-100 lg:sticky lg:top-32">
          <h2 className="text-lg font-bold mb-5">Porosia juaj</h2><div className="space-y-3 mb-5 max-h-72 overflow-y-auto">{items.map(item => <div key={item.id} className="flex items-center gap-3"><img src={item.image} alt="" className="w-14 h-14 shrink-0 rounded-lg object-contain" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold break-words">{item.name}</p><p className="text-xs text-stone-500">{item.quantity} × {formatPrice(item.price)}</p></div><span className="text-sm font-semibold shrink-0">{formatPrice(item.price * item.quantity)}</span></div>)}</div>
          <Totals {...totals} />
          <p className="my-4 text-xs text-stone-500">Posta: 3 € për porosi nën 50 €; falas nga 50 €.</p>
          <p className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">Do ta kontrollojmë stokun dhe do t’ju konfirmojmë me email. {paymentMethod === 'paysera' ? 'Nëse produkti është në stok, emaili do të përmbajë linkun Paysera për pagesë.' : 'Pagesa bëhet te korrieri pas konfirmimit.'}</p>
          {error && <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 break-words">{error}</div>}
          <button type="submit" disabled={processing} className="w-full min-h-12 py-3.5 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 flex items-center justify-center gap-2 disabled:opacity-60">{processing ? <><Loader2 size={18} className="animate-spin" /> Duke regjistruar…</> : <>Porosit tani <ArrowRight size={18} /></>}</button>
          <p className="text-xs text-center text-stone-500 mt-4">Të dhënat tuaja përdoren për përpunimin dhe dorëzimin e porosisë.</p>
        </div></section>
      </fieldset>
    </form>
  </div>;
}

function Totals({ subtotal, shipping, total }: { subtotal: number; shipping: number; total: number }) {
  return <dl className="border-t pt-4 space-y-3 text-sm"><div className="flex justify-between"><dt>Nëntotali</dt><dd>{formatPrice(subtotal)}</dd></div><div className="flex justify-between"><dt>Posta</dt><dd>{shipping === 0 ? 'Falas · €0.00' : formatPrice(shipping)}</dd></div><div className="flex justify-between items-center border-t pt-4 font-bold"><dt>Totali për pagesë</dt><dd className="text-2xl text-amber-700">{formatPrice(total)}</dd></div></dl>;
}

export function OrderSuccessPage({ orderNumber }: { orderNumber?: string }) {
  const receipt = findReceipt(orderNumber);
  return <div className="pt-24 pb-12 min-h-screen bg-stone-50 flex items-center justify-center px-4"><div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-10 border border-stone-100 shadow-sm">
    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5"><Check size={32} className="text-emerald-600" /></div>
    <h1 className="text-3xl font-bold mb-3 text-center">{receipt ? 'E morëm porosinë tuaj!' : 'Detajet e porosisë'}</h1>
    <p className="text-stone-600 mb-4 text-center">{receipt ? 'Do ta kontrollojmë stokun dhe do t’ju konfirmojmë me email.' : 'Kontrolloni emailin tuaj për konfirmimin e kësaj porosie.'}</p>
    {orderNumber && <p className="text-sm text-center mb-6 break-all">Numri i porosisë: <strong>{orderNumber}</strong></p>}
    {receipt && <><Totals {...receipt} />{receipt.payment_method === 'paysera'
      ? <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 mt-5">Nuk ju është marrë asnjë pagesë. Nëse produkti është në stok, do të merrni me email një link të sigurt Paysera për të paguar {formatPrice(receipt.total)}.</p>
      : <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950 mt-5">Paguani {formatPrice(receipt.total)} te korrieri kur ta merrni porosinë. Posta është e përfshirë në total.</p>}</>}
    <button onClick={() => navigate('/shop')} className="w-full mt-6 px-6 py-3.5 bg-amber-700 text-white rounded-xl font-semibold">Vazhdo blerjen</button>
  </div></div>;
}

export function PaymentResultPage({ status, orderNumber }: { status?: string; orderNumber?: string }) {
  const cancelled = status === 'cancelled';
  return <div className="pt-24 pb-12 min-h-screen bg-stone-50 flex items-center justify-center px-4"><div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-10 border border-stone-100 shadow-sm text-center">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${cancelled ? 'bg-amber-100' : 'bg-emerald-100'}`}><Check size={32} className={cancelled ? 'text-amber-700' : 'text-emerald-600'} /></div>
    <h1 className="text-3xl font-bold mb-3">{cancelled ? 'Pagesa u ndërpre' : 'Faleminderit!'}</h1>
    <p className="text-stone-600 mb-4">{cancelled ? 'Pagesa Paysera nuk u përfundua. Mund ta hapni përsëri linkun e pagesës nga emaili juaj.' : 'Paysera po konfirmon pagesën me sistemin tonë. Porosia do të përgatitet sapo konfirmimi të regjistrohet.'}</p>
    {orderNumber && <p className="text-sm mb-6 break-all">Porosia: <strong>{orderNumber}</strong></p>}
    <button onClick={() => navigate('/shop')} className="w-full mt-2 px-6 py-3.5 bg-amber-700 text-white rounded-xl font-semibold">Kthehu në dyqan</button>
  </div></div>;
}
