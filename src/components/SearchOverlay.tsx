import { useEffect, useRef, useState } from 'react';
import { Search, X, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/types';
import { canonicalizeProducts } from '@/lib/productIdentity';

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(8);
      setResults(canonicalizeProducts((data || []) as Product[]).products);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-down" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-200">
          <Search className="w-5 h-5 text-stone-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kërko orë, markë..."
            className="flex-1 text-lg outline-none placeholder:text-stone-400"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {query.trim() === '' && (
            <div className="px-5 py-12 text-center text-stone-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Shkruaj për të kërkuar produkte</p>
            </div>
          )}
          {query.trim() !== '' && loading && (
            <div className="px-5 py-8 text-center text-stone-400">Duke kërkuar...</div>
          )}
          {query.trim() !== '' && !loading && results.length === 0 && (
            <div className="px-5 py-12 text-center text-stone-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>Asnjë rezultat për "{query}"</p>
            </div>
          )}
          {results.length > 0 && (
            <div className="py-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    navigate(`/product/${p.id}`);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3 hover:bg-stone-50 transition-colors text-left"
                >
                  <img src={p.image} alt={p.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 truncate">{p.name}</p>
                    <p className="text-sm text-stone-500">{p.brand} · {p.category}</p>
                  </div>
                  <span className="font-bold text-amber-700">{formatPrice(p.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
