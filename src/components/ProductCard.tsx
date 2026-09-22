import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, Watch } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useShoppingPreferences } from '@/context/ShoppingPreferences';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { favourites, toggleFavourite } = useShoppingPreferences();
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [product.image]);
  const saved = favourites.includes(product.id);
  const discounted = product.old_price != null && product.old_price > product.price;
  const badge = discounted ? `−${Math.round((1-product.price/product.old_price!)*100)}%` : product.badge && !/[-−%]/.test(product.badge) ? product.badge : null;
  return <article className="group flex flex-col h-full min-w-0 bg-white rounded-2xl overflow-hidden border border-stone-200/70 hover:border-amber-700/30 hover:shadow-lg transition-shadow">
    <div className="relative aspect-square bg-stone-50">
      <a href={`#/product/${product.id}`} aria-label={`Shiko ${product.name}`} className="block w-full h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700 focus-visible:outline-offset-[-3px]">
        {imageFailed ? <div className="h-full flex items-center justify-center"><Watch className="w-12 h-12 text-stone-300" aria-label="Fotografia nuk është e disponueshme"/></div> : <img src={product.image} alt={product.name} loading="lazy" decoding="async" onError={()=>setImageFailed(true)} className="w-full h-full object-contain p-3 sm:p-5 mix-blend-multiply"/>}
      </a>
      {badge && <span className={`absolute pointer-events-none top-3 left-2.5 max-w-[calc(100%-60px)] text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md ${discounted ? 'bg-red-600 text-white' : 'bg-stone-900 text-white'}`}>{badge}</span>}
      <button onClick={()=>toggleFavourite(product.id)} aria-pressed={saved} aria-label={`${saved ? 'Hiq nga të preferuarat' : 'Ruaj në të preferuarat'}: ${product.name}`} className="absolute right-1 top-1 w-11 h-11 flex items-center justify-center rounded-full text-amber-800 hover:bg-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700"><Heart className="w-5 h-5" fill={saved ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="flex flex-col flex-1 p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-amber-800 font-semibold uppercase tracking-wider mb-1.5">{product.brand}</p>
      <a href={`#/product/${product.id}`} className="text-[13px] sm:text-sm leading-5 font-semibold text-stone-900 hover:text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700 min-h-10 line-clamp-2" title={product.name}>{product.name}</a>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-3 mb-3">
        <span className="text-lg sm:text-xl font-bold text-amber-700">{formatPrice(product.price)}</span>
        {discounted && <del className="text-xs sm:text-sm text-stone-500">{formatPrice(product.old_price!)}</del>}
      </div>
      <button onClick={()=>addToCart(product)} disabled={product.in_stock===false} aria-label={`Shto në shportë: ${product.name}`} className="mt-auto w-full min-h-11 px-2 py-2.5 bg-stone-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ShoppingBag aria-hidden="true" className="w-4 h-4 shrink-0"/>{product.in_stock===false ? 'Pa stok' : 'Shto në shportë'}</button>
    </div>
  </article>;
}
