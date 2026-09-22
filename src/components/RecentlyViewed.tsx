import { ProductCard } from './ProductCard';
import { useShoppingPreferences } from '@/context/ShoppingPreferences';
import { useSavedProducts } from '@/lib/useSavedProducts';
export function RecentlyViewed({excludeId}:{excludeId?:string}){
  const {recent}=useShoppingPreferences();
  const {products,loading,error}=useSavedProducts(recent.filter(id=>id!==excludeId).slice(0,6));
  if(loading||error||!products.length)return null;
  return <section aria-labelledby="recently-viewed-title" className="bg-stone-50 border-t border-stone-100 py-8 sm:py-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><h2 id="recently-viewed-title" className="text-xl sm:text-2xl font-bold text-stone-900">Orët që shikove së fundmi</h2><p className="text-sm text-stone-500 mt-2 mb-5">Vazhdo aty ku mbete.</p><div className="grid grid-flow-col auto-cols-[46%] sm:auto-cols-[30%] lg:auto-cols-[23%] gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-3">{products.map(product=><div className="snap-start" key={product.id}><ProductCard product={product}/></div>)}</div></div></section>;
}
