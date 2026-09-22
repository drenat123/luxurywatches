import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';
import { useRoute } from '@/lib/router';
import type { Product } from '@/types';
import { canonicalizeProducts } from '@/lib/productIdentity';

const GENDERS = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'men', label: 'Meshkuj' },
  { value: 'women', label: 'Femra' },
];

const AVAILABILITY = [
  { value: 'all', label: 'Të gjitha' },
  { value: 'in-stock', label: 'Në stok' },
  { value: 'out-of-stock', label: 'Jashtë stokut' },
];

const SORTS = [
  { value: 'newest', label: 'Më të rejat' },
  { value: 'price-asc', label: 'Çmimi: I ulët → I lartë' },
  { value: 'price-desc', label: 'Çmimi: I lartë → I ulët' },
  { value: 'name', label: 'Emri A-Z' },
];

const PAGE_SIZE = 24;
const SHOP_STATE_KEY = 'lw-shop-state';
const SHOP_RESTORE_KEY = 'lw-restore-shop';

// Keep the last rendered result in memory while a watch detail page is open.
// Fresh visits and changed filters still fetch current data.
let catalogueCache: { key: string; products: Product[] } | null = null;
let cachedBrands: string[] = [];
const catalogueKey = (gender: string, availability: string, brands: string[], sort: string, search: string, min: string, max: string) =>
  JSON.stringify([gender, availability, [...brands].sort(), sort, search.trim(), min, max]);

export function ShopPage() {
  const route = useRoute();
  // Read the return snapshot once. Saving subsequent renders must never change it.
  const [savedState] = useState(() => {
    try {
      if (sessionStorage.getItem(SHOP_RESTORE_KEY) !== '1') return null;
      const state = JSON.parse(sessionStorage.getItem(SHOP_STATE_KEY) || 'null') as {
        hash: string; scrollY: number; visibleCount: number; gender: string; anchor?: { href: string; top: number; textLink?: boolean };
        selectedBrands: string[]; availability: string; sort: string;
        search: string; minPrice: string; maxPrice: string;
      } | null;
      return state?.hash === (window.location.hash || '#/shop') ? state : null;
    } catch { return null; }
  });
  const [currentHash] = useState(() => window.location.hash || '#/shop');
  const canRestore = savedState !== null;
  const initialGender = canRestore ? savedState.gender || 'all' : route.name === 'shop' ? route.gender || 'all' : 'all';
  const initialSearch = canRestore ? savedState.search || '' : route.name === 'shop' ? route.search || '' : '';

  const [initialCache] = useState(() => {
    if (!savedState) return null;
    const key = catalogueKey(initialGender, savedState.availability || 'all', savedState.selectedBrands || [], savedState.sort || 'newest', initialSearch, savedState.minPrice || '', savedState.maxPrice || '');
    return catalogueCache?.key === key ? catalogueCache : null;
  });
  const [products, setProducts] = useState<Product[]>(() => initialCache?.products.slice(0, Math.max(PAGE_SIZE, Number(savedState?.visibleCount) || PAGE_SIZE)) || []);
  const [allProducts, setAllProducts] = useState<Product[]>(initialCache?.products || []);
  const [brands, setBrands] = useState<string[]>(cachedBrands);
  const [loading, setLoading] = useState(!initialCache);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(initialCache?.products.length || 0);
  const [gender, setGender] = useState(initialGender);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(canRestore ? savedState.selectedBrands || [] : []);
  const [availability, setAvailability] = useState(canRestore ? savedState.availability || 'all' : 'all');
  const [sort, setSort] = useState(canRestore ? savedState.sort || 'newest' : 'newest');
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [minPrice, setMinPrice] = useState(canRestore ? savedState.minPrice || '' : '');
  const [maxPrice, setMaxPrice] = useState(canRestore ? savedState.maxPrice || '' : '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const filterDialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number>(canRestore ? Math.max(PAGE_SIZE, Number(savedState.visibleCount) || PAGE_SIZE) : PAGE_SIZE);
  const restoreScrollRef = useRef<number | null>(canRestore ? Number(savedState.scrollY) || 0 : null);
  const activeFilters = [
    ...(gender !== 'all' ? [{key:'gender',label:GENDERS.find(g=>g.value===gender)?.label || gender,clear:()=>setGender('all')}] : []),
    ...selectedBrands.map(brand=>({key:brand,label:brand,clear:()=>toggleBrand(brand)})),
    ...(minPrice !== '' ? [{key:'min',label:`Nga €${minPrice}`,clear:()=>setMinPrice('')}] : []),
    ...(maxPrice !== '' ? [{key:'max',label:`Deri €${maxPrice}`,clear:()=>setMaxPrice('')}] : []),
    ...(search ? [{key:'search',label:search,clear:()=>setSearch('')}] : []),
    ...(availability !== 'all' ? [{key:'availability',label:availability==='in-stock'?'Në stok':'Jashtë stokut',clear:()=>setAvailability('all')}] : []),
  ];
  const clearFilters=()=>{setGender('all');setSelectedBrands([]);setMinPrice('');setMaxPrice('');setSearch('');setAvailability('all');};
  useEffect(()=>{
    if(!showMobileFilters)return;
    const dialog=filterDialog.current;
    dialog?.showModal();
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{dialog?.close();document.body.style.overflow=previous;};
  },[showMobileFilters]);

  useLayoutEffect(() => {
    if (!savedState) window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  useEffect(() => {
    const saveState = (event?: Event) => {
      // Do not overwrite the snapshot while leaving or restoring the catalogue.
      if (window.location.hash !== currentHash || restoreScrollRef.current !== null) return;
      sessionStorage.setItem(SHOP_STATE_KEY, JSON.stringify({
        hash: currentHash,
        scrollY: window.scrollY,
        anchor: (() => {
          const clicked = event?.target instanceof Element ? event.target.closest('article a') : null;
          if (clicked) return { href: clicked.getAttribute('href')!, top: clicked.getBoundingClientRect().top, textLink: !clicked.hasAttribute('aria-label') };
          const cards = Array.from(document.querySelectorAll('main article'));
          const card = cards.find(element => element.getBoundingClientRect().bottom > 100);
          const href = card?.querySelector('a')?.getAttribute('href');
          return card && href ? { href, top: card.getBoundingClientRect().top } : undefined;
        })(),
        visibleCount, gender, selectedBrands, availability, sort, search, minPrice, maxPrice,
      }));
    };
    saveState();
    window.addEventListener('scroll', saveState, { passive: true });
    document.addEventListener('click', saveState, true);
    return () => {
      window.removeEventListener('scroll', saveState);
      document.removeEventListener('click', saveState, true);
    };
  }, [currentHash, visibleCount, gender, selectedBrands, availability, sort, search, minPrice, maxPrice]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    (async () => {
      const { data: brandData } = await supabase
        .from('products')
        .select('brand')
        .eq('is_active', true)
        .order('brand', { ascending: true });
      if (brandData) {
        cachedBrands = [...new Set(brandData.map((d) => d.brand))];
        setBrands(cachedBrands);
      }
    })();
  }, []);

  useEffect(() => {
    const key = catalogueKey(gender, availability, selectedBrands, sort, debouncedSearch, minPrice, maxPrice);
    if (initialCache?.key === key && attempt === 0) {
      setAllProducts(initialCache.products);
      setProducts(initialCache.products.slice(0, visibleCount));
      setTotalProducts(initialCache.products.length);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(false);
      let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true);
      if (gender !== 'all') query = query.eq('gender', gender);
      if (availability === 'in-stock') query = query.eq('in_stock', true);
      if (availability === 'out-of-stock') query = query.eq('in_stock', false);
      if (selectedBrands.length > 0) query = query.in('brand', selectedBrands);
      if (minPrice !== '' && Number.isFinite(Number(minPrice))) query = query.gte('price', Number(minPrice));
      if (maxPrice !== '' && Number.isFinite(Number(maxPrice))) query = query.lte('price', Number(maxPrice));
      if (debouncedSearch) {
        const escapedSearch = debouncedSearch.replace(/[%_,]/g, ' ');
        query = query.or(`name.ilike.%${escapedSearch}%,brand.ilike.%${escapedSearch}%,supplier_sku.ilike.%${escapedSearch}%`);
      }
      if (sort === 'price-asc') query = query.order('price', { ascending: true });
      else if (sort === 'price-desc') query = query.order('price', { ascending: false });
      else if (sort === 'name') query = query.order('name', { ascending: true });
      else query = query.order('created_at', { ascending: false });

      const { data, error: queryError } = await query.range(0, 1999).abortSignal(controller.signal);
      if (controller.signal.aborted) return;
      if (queryError) { setError(true); setLoading(false); return; }
      let canonical = canonicalizeProducts((data || []) as Product[]).products;
      const lowerBound = minPrice === '' ? null : Number(minPrice);
      const upperBound = maxPrice === '' ? null : Number(maxPrice);
      canonical = canonical.filter(product =>
        (lowerBound === null || product.price >= lowerBound) &&
        (upperBound === null || product.price <= upperBound)
      );
      if (sort === 'price-asc') canonical.sort((a, b) => a.price - b.price);
      else if (sort === 'price-desc') canonical.sort((a, b) => b.price - a.price);
      else if (sort === 'name') canonical.sort((a, b) => a.name.localeCompare(b.name));
      catalogueCache = { key, products: canonical };
      setAllProducts(canonical);
      setProducts(canonical.slice(0, visibleCount));
      setTotalProducts(canonical.length);
      setLoading(false);
    })();
    return () => controller.abort();
  }, [gender, availability, selectedBrands, sort, debouncedSearch, minPrice, maxPrice, attempt]);

  useLayoutEffect(() => {
    if (loading || error || restoreScrollRef.current === null) return;
    // Image dimensions are reserved; restore only after the complete grid mounts.
    const anchor = savedState?.anchor;
    const card = anchor && Array.from(document.querySelectorAll('main article'))
      .find(element => element.querySelector('a')?.getAttribute('href') === anchor.href);
    const target = card && anchor?.textLink !== undefined ? card.querySelector(anchor.textLink ? 'a:not([aria-label])' : 'a[aria-label]') : card;
    const top = target && anchor
      ? window.scrollY + target.getBoundingClientRect().top - anchor.top
      : restoreScrollRef.current;
    window.scrollTo({ top, behavior: 'instant' });
    restoreScrollRef.current = null;
    sessionStorage.removeItem(SHOP_RESTORE_KEY);
  }, [loading, error, products.length]);
  const loadMore = async () => {
    if (loadingMore || products.length >= totalProducts) return;
    setLoadingMore(true);
    const nextCount = products.length + PAGE_SIZE;
    setVisibleCount(nextCount);
    setProducts(allProducts.slice(0, nextCount));
    setLoadingMore(false);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const filterPanel = (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wider">Çmimi</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-stone-500">
            Nga
            <input type="number" min="0" step="1" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="€0" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500" />
          </label>
          <label className="text-xs text-stone-500">
            Deri
            <input type="number" min="0" step="1" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="€500" className="mt-1 w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm outline-none focus:border-amber-500" />
          </label>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wider">Gjinia</h3>
        <div className="space-y-1.5">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                gender === g.value ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wider">Disponueshmëria</h3>
        <div className="space-y-1.5">
          {AVAILABILITY.map((option) => (
            <button
              key={option.value}
              onClick={() => setAvailability(option.value)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                availability === option.value ? 'bg-amber-50 text-amber-700' : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-stone-900 mb-3 text-sm uppercase tracking-wider">Marka</h3>
        <div className="space-y-1.5">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors text-stone-600 hover:bg-stone-50"
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                selectedBrands.includes(brand) ? 'bg-amber-700 border-amber-700' : 'border-stone-300'
              }`}>
                {selectedBrands.includes(brand) && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                )}
              </span>
              {brand}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <div className="bg-stone-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dyqani</h1>
          <p className="text-stone-400">Zbuloni koleksionin tonë të orëve</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Gender tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                gender === g.value
                  ? 'bg-stone-900 text-white shadow-md'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 sticky top-32">
              {filterPanel}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="sticky top-[100px] z-30 lg:static grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 mb-4 bg-stone-50/95 backdrop-blur-md lg:backdrop-blur-none py-2">
              <div className="relative flex-1 col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Kërko orë ose markë..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <select
                aria-label="Rendit orët" value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full sm:w-auto min-w-0 px-3 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:border-amber-500 transition-colors text-sm font-medium text-stone-700 cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-xl font-medium text-stone-700"
              >
                <SlidersHorizontal className="w-5 h-5" /> Filtra {activeFilters.length > 0 && <span className="rounded-full bg-amber-700 text-white px-1.5 text-xs">{activeFilters.length}</span>}
              </button>
            </div>

            {activeFilters.length > 0 && <div aria-label="Filtrat aktivë" className="flex flex-wrap items-center gap-2 mb-4">
              {activeFilters.map(filter=><button key={filter.key} onClick={filter.clear} aria-label={`Hiq filtrin ${filter.label}`} className="min-h-9 inline-flex items-center gap-2 px-3 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-semibold">{filter.label}<X size={13}/></button>)}
              <button onClick={clearFilters} className="min-h-9 px-2 text-xs font-semibold text-stone-600 underline">Pastro të gjitha</button>
            </div>}
            <p className="text-sm text-stone-500 mb-4">
              {loading ? 'Duke ngarkuar...' : `${products.length}${totalProducts > products.length ? ` nga ${totalProducts}` : ''} orë`}
            </p>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div role="alert" className="text-center py-12 bg-white rounded-2xl"><p className="text-stone-600">Katalogu nuk mund të ngarkohet. Provoni përsëri.</p><button onClick={()=>setAttempt(value=>value+1)} className="mt-4 px-5 py-3 bg-amber-700 text-white rounded-xl">Provo përsëri</button></div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <Search className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-stone-700 mb-1">Asnjë orë nuk u gjet</p>
                <p className="text-stone-400 text-sm">Provo të ndryshosh filtrat</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {!loading && products.length > 0 && products.length < totalProducts && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-stone-900 text-white rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? 'Duke ngarkuar...' : 'Shfaq më shumë orë'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <dialog ref={filterDialog} aria-label="Filtrat e katalogut" onCancel={()=>setShowMobileFilters(false)} className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none max-h-[85dvh] bg-white rounded-t-3xl p-5 backdrop:bg-black/50 backdrop:backdrop-blur-sm" onClick={event=>{if(event.target===event.currentTarget){const rect=event.currentTarget.getBoundingClientRect();if(event.clientY<rect.top)setShowMobileFilters(false);}}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">Filtra</h2>
              <button autoFocus aria-label="Mbyll filtrat" onClick={() => setShowMobileFilters(false)} className="p-2 rounded-lg hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterPanel}
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-6 py-3 bg-amber-700 text-white rounded-xl font-semibold"
            >
              Apliko filtrat
            </button>
        </dialog>
      )}
    </div>
  );
}







