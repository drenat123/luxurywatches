import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingBag, Minus, Plus, Truck, ShieldCheck, RefreshCw, Check, Star, Heart, MessageCircle } from 'lucide-react';
import { useShoppingPreferences } from '@/context/ShoppingPreferences';
import { RecentlyViewed } from '@/components/RecentlyViewed';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { navigate, returnToShop } from '@/lib/router';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types';
import { canonicalizeProducts } from '@/lib/productIdentity';

const GENDER_LABELS: Record<string, string> = {
  men: 'Meshkuj',
  women: 'Femra',
  unisex: 'Unisex',
};

function generatedWatchSpecs(product: Product) {
  const isWomen = product.gender === 'women';
  const name = product.name.toLowerCase();
  const strap = product.strap_material?.trim() || (name.includes('silikon') || name.includes('sport') ? 'Silikon' : 'Çelik inox');
  const color = product.color?.trim() || (name.includes('gold') || name.includes('ari') ? 'E artë' : 'Sipas fotografisë');
  const caseSize = product.case_size?.trim() || (isWomen ? '32–36 mm' : '40–44 mm');
  return {
    strap,
    color,
    caseSize,
    movement: product.movement?.trim() || 'Quartz',
    waterResistance: product.water_resistance?.trim() || '3 ATM',
  };
}

export function ProductDetailPage({ productId }: { productId?: string }) {
  const { addToCart, isOpen, closeCart } = useCart();
  const { favourites, toggleFavourite, remember } = useShoppingPreferences();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setQuantity(1);
    setAdded(false);
    setProduct(null);
    (async () => {
      setLoading(true);
      if (!productId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('products').select('*').eq('id', productId).eq('is_active', true).maybeSingle();
      if (cancelled) return;
      setProduct(data as Product | null);
      setSelectedImage(null);
      if (data) {
        const { data: relData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('gender', (data as Product).gender)
          .neq('id', productId)
          .limit(4);
        if (!cancelled) setRelated(canonicalizeProducts((relData as Product[]) || []).products);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => { if (product) remember(product.id); }, [product, remember]);

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-stone-100 rounded-3xl aspect-square animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-stone-100 rounded animate-pulse" />
              <div className="h-8 w-64 bg-stone-100 rounded animate-pulse" />
              <div className="h-6 w-32 bg-stone-100 rounded animate-pulse" />
              <div className="h-32 w-full bg-stone-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Produkti nuk u gjet</h2>
          <p className="text-stone-500 mb-6">Ky produkt mund të jetë hequr ose nuk ekziston.</p>
          <button
            onClick={returnToShop}
            className="px-6 py-3 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors"
          >
            Kthehu në dyqan
          </button>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product.in_stock === false) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;
  const gallery = Array.from(new Set([product.image, ...(product.gallery || [])].filter(Boolean)));
  const activeImage = selectedImage || gallery[0] || product.image;
  const model = product.supplier_sku || product.name.match(/\b[A-Z]{1,5}[.-][A-Z0-9.-]+\b/i)?.[0] || 'Nuk specifikohet';
  const productLink = new URL(window.location.href);
  productLink.hash = `/product/${product.id}`;
  const whatsappHref = `https://wa.me/38343737210?text=${encodeURIComponent(`Përshëndetje! Jam i interesuar për ${product.brand} ${model}. A mund të më jepni më shumë informacion?\n${productLink.href}`)}`;
  const generatedSpecs = generatedWatchSpecs(product);
  const specs = [
    { label: 'Marka', value: product.brand },
    { label: 'Modeli', value: model },
    { label: 'Gjinia', value: GENDER_LABELS[product.gender] || product.gender },
    { label: 'Materiali i rripit', value: generatedSpecs.strap },
    { label: 'Ngjyra', value: generatedSpecs.color },
    { label: 'Madhësia e kasës', value: generatedSpecs.caseSize },
    { label: 'Mekanizmi', value: generatedSpecs.movement },
    { label: 'Rezistenca ndaj ujit', value: generatedSpecs.waterResistance },
    { label: 'Garancia', value: '2 vjet' },
  ];

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-amber-700">Ballina</button>
          <span>/</span>
          <button onClick={returnToShop} className="hover:text-amber-700">Dyqan</button>
          <span>/</span>
          <span className="text-stone-900 font-medium truncate">{product.name}</span>
        </div>

        <button
          onClick={returnToShop}
          className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-amber-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kthehu në dyqan
        </button>

        {/* Product main */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div>
            {/* Image */}
            <div className="relative bg-white rounded-3xl overflow-hidden border border-stone-100 group">
              {product.badge && (
                <span className={`absolute top-4 left-4 z-10 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md ${
                  product.badge.startsWith('-') ? 'bg-red-600' : product.badge === 'HOT' ? 'bg-orange-600' : 'bg-emerald-600'
                }`}>
                  {product.badge}
                </span>
              )}
              <img
                src={activeImage}
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.src = product.image;
                }}
                className="w-full aspect-square object-contain p-5 sm:p-8"
              />
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 mt-3">
                {gallery.map((image) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImage(image)}
                    className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                      activeImage === image ? 'border-amber-600' : 'border-transparent'
                    }`}
                    aria-label={`Shiko imazhin e ${product.name}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mb-2">{product.brand}</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight mb-3">{product.name}</h1>

            {/* Rating stars (decorative) */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="text-sm text-stone-400">(12 vlerësime)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-amber-700">{formatPrice(product.price)}</span>
              {product.old_price != null && product.old_price > product.price && (
                <>
                  <span className="text-xl text-stone-400 line-through">{formatPrice(product.old_price)}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-sm font-bold rounded-full">-{discount}%</span>
                </>
              )}
            </div>

            {/* Specs */}
            <div className="mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-stone-100">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">Specifikimet e orës</h2>
                <span className="text-[10px] uppercase tracking-wider text-stone-400">Detaje</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                {specs.map(spec => (
                  <div key={spec.label} className="min-w-0">
                    <dt className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider mb-1">{spec.label}</dt>
                    <dd className="font-semibold text-sm truncate text-stone-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-2">Përshkrimi</h2>
                <p className="text-sm leading-6 text-stone-600">{product.description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6 text-sm">
              <span className={`px-3 py-1.5 rounded-lg ${product.in_stock === false ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {product.in_stock === false ? 'Nuk ka stok' : 'Në stok'}
              </span>
            </div>

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border-2 border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-3 text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.in_stock === false}
                className={`flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  product.in_stock === false ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : added ? 'bg-emerald-600 text-white' : 'bg-amber-700 text-white hover:bg-amber-800'
                }`}
              >
                {added ? (
                  <><Check className="w-5 h-5" /> U shtua në shportë!</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> Shto në shportë</>
                )}
              </button>
            </div>

            {/* Buy now */}
            <button
              disabled={product.in_stock === false}
              onClick={() => {
                addToCart(product, quantity);
                closeCart();
                navigate('/checkout');
              }}
              className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-semibold hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-4"
            >
              Bli tani
            </button>

            <div className="flex flex-wrap gap-3 mb-6">
              <button aria-pressed={favourites.includes(product.id)} onClick={() => toggleFavourite(product.id)} className="min-h-11 inline-flex items-center justify-center gap-2 px-4 py-3 border border-stone-200 bg-white rounded-xl text-sm font-semibold text-amber-800 hover:bg-amber-50"><Heart size={18} fill={favourites.includes(product.id) ? 'currentColor' : 'none'} />{favourites.includes(product.id) ? 'E ruajtur' : 'Ruaje'}</button>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="min-h-11 flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100"><MessageCircle size={18}/> Pyet për këtë orë<span className="sr-only"> në WhatsApp (hapet në dritare të re)</span></a>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-200">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck className="w-5 h-5 text-amber-700" />
                <span className="text-xs text-stone-600 font-medium">Dërgesë falas<br />nga €50</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <span className="text-xs text-stone-600 font-medium">Garanci<br />2 vjet</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RefreshCw className="w-5 h-5 text-amber-700" />
                <span className="text-xs text-stone-600 font-medium">Kthim<br />14 ditë</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="py-12 border-t border-stone-200">
            <h2 className="text-2xl font-bold text-stone-900 mb-8">Produkte të ngjashme</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
      <RecentlyViewed excludeId={product.id} />
      {!isOpen && <div aria-label="Blerje e shpejtë" className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-4 pt-3" style={{paddingBottom:'calc(12px + env(safe-area-inset-bottom, 0px))'}}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] text-stone-500 uppercase tracking-wide truncate">{product.brand}</p><span className="text-lg font-bold text-amber-700">{formatPrice(product.price)}</span></div><button onClick={handleAddToCart} disabled={product.in_stock===false} className="min-h-11 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 disabled:opacity-40"><ShoppingBag size={18}/>{product.in_stock===false?'Pa stok':'Shto në shportë'}</button></div></div>}
    </div>
  );
}
