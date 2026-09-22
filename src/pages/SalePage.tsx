import { useEffect, useState } from 'react';
import { ChevronDown, Tag, Watch } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { isDiscountedProduct } from '@/lib/saleProducts';
import type { Product } from '@/types';
import { canonicalizeProducts } from '@/lib/productIdentity';

const PAGE_SIZE = 24;
const FETCH_SIZE = 200;
const GENDERS = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'men', label: 'Meshkuj' },
  { value: 'women', label: 'Femra' },
];

export function SalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [gender, setGender] = useState('all');

  const brands = [...new Set(products.map(product => product.brand))].sort((a, b) => a.localeCompare(b));
  const genderProducts = products.filter(product => gender === 'all' || product.gender === gender);
  const filteredProducts = genderProducts.filter(product => !selectedBrand || product.brand === selectedBrand);

  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      setLoading(true);
      setError(false);
      setVisibleCount(PAGE_SIZE);
      try {
        const discounted: Product[] = [];
        let offset = 0;
        // Fetch every candidate page before filtering: REST filters compare a
        // column to a value, so old_price > price is checked per product here.
        // Filtering only the first response would miss later discounted items.
        while (!controller.signal.aborted) {
          const { data, count, error: queryError } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('is_active', true)
            .not('old_price', 'is', null)
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .range(offset, offset + FETCH_SIZE - 1)
            .abortSignal(controller.signal);
          if (queryError) throw queryError;
          if (!data?.length) break;
          discounted.push(...data.filter(isDiscountedProduct));
          offset += data.length;
          if (count !== null && offset >= count) break;
        }
        if (!controller.signal.aborted) setProducts(canonicalizeProducts(discounted).products);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadProducts();
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <section className="bg-stone-900 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide mb-2">ZBRITJE</h1>
          <p className="text-sm sm:text-base text-stone-300">Oferta speciale në modelet e përzgjedhura.</p>
        </div>
      </section>

      <section aria-label="Orët me zbritje" aria-busy={loading} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {loading ? (
          <>
            <p role="status" className="text-sm text-stone-500 mb-4">Duke ngarkuar ofertat...</p>
            <div aria-hidden="true" className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          </>
        ) : error ? (
          <div role="alert" className="bg-white border border-stone-100 rounded-2xl px-6 py-10 text-center">
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Ofertat nuk mund të ngarkohen</h2>
            <p className="text-sm text-stone-500 mb-6">Ju lutemi, provoni përsëri pas pak.</p>
            <button onClick={() => setAttempt(value => value + 1)} className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors">Provo përsëri</button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl px-6 py-10 text-center">
            <Tag aria-hidden="true" className="w-9 h-9 text-amber-700 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-stone-900 mb-2">Aktualisht nuk ka orë me zbritje</h2>
            <p className="text-sm text-stone-500 mb-6">Ofertat e reja do të shfaqen këtu. Ndërkohë, zbuloni koleksionin tonë.</p>
            <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors">Shiko koleksionin</button>
          </div>
        ) : (
          <>
            <fieldset className="mb-4 sm:max-w-sm">
              <legend className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600 mb-2.5">Gjinia</legend>
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-stone-200 bg-white p-1">
                {GENDERS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={gender === option.value}
                    onClick={() => {
                      setGender(option.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className={`min-h-11 px-1 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 ${gender === option.value ? 'bg-stone-900 text-[#ead3a8] shadow-sm' : 'text-stone-600 hover:bg-amber-50 hover:text-amber-800'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mb-4 sm:max-w-sm">
              <label htmlFor="sale-brand" className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-600 mb-2.5">
                Brendi
                <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-amber-700/30 to-transparent" />
              </label>
              <div className="relative group rounded-xl bg-gradient-to-br from-stone-800 to-stone-950 shadow-[0_4px_12px_rgba(28,25,23,0.12)]">
                <Watch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#c6a66d]" />
              <select
                id="sale-brand"
                value={selectedBrand}
                onChange={event => {
                  setSelectedBrand(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="relative w-full min-h-14 appearance-none pl-12 pr-14 py-3.5 bg-transparent border border-[#b7955b]/50 rounded-xl text-base font-medium text-stone-100 tracking-wide hover:border-[#d6b77d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b7955b] focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 transition-colors cursor-pointer [&>option]:bg-white [&>option]:text-stone-900"
              >
                <option value="">Të gjitha brendet ({genderProducts.length})</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand} ({genderProducts.filter(product => product.brand === brand).length})</option>
                ))}
              </select>
                <span aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-11 h-6 border-l border-[#b7955b]/30 flex items-center justify-center">
                  <ChevronDown className="w-4 h-4 text-[#c6a66d] group-hover:text-[#ead3a8] transition-colors" />
                </span>
              </div>
            </div>
            <p role="status" className="text-sm text-stone-500 mb-4">{Math.min(visibleCount, filteredProducts.length)} nga {filteredProducts.length} orë me zbritje{selectedBrand && ` · ${selectedBrand}`}</p>
            {filteredProducts.length === 0 && (
              <div className="bg-white border border-stone-100 rounded-2xl px-5 py-8 text-center">
                <h2 className="font-semibold text-stone-900 mb-2">Nuk ka oferta për këto filtra</h2>
                <p className="text-sm text-stone-500 mb-4">Provoni një brend ose gjini tjetër për të zbuluar ofertat.</p>
                <button onClick={() => { setSelectedBrand(''); setGender('all'); setVisibleCount(PAGE_SIZE); }} className="min-h-11 px-5 py-2.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors">Pastro filtrat</button>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 [&>div>div.p-4>div]:flex-wrap [&>div>div.p-4>div]:gap-2 [&>div>div.p-4>div>div]:flex-wrap">
              {filteredProducts.slice(0, visibleCount).map(product => <ProductCard key={product.id} product={product} />)}
            </div>
            {visibleCount < filteredProducts.length && (
              <div className="mt-6 flex justify-center">
                <button onClick={() => setVisibleCount(value => value + PAGE_SIZE)} className="px-6 py-3 bg-stone-900 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors">Shfaq më shumë orë</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
