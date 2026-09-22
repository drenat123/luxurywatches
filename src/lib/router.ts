import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'sale' }
  | { name: 'favourites' }
  | { name: 'shop'; category?: string; gender?: string; search?: string }
  | { name: 'product'; productId?: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'about' }
  | { name: 'shipping' | 'returns' | 'warranty' | 'privacy' | 'terms' | 'contact' }
  | { name: 'order-success'; orderNumber?: string }
  | { name: 'payment-result'; status?: string; orderNumber?: string }
  | { name: 'admin' };

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [path, queryString] = hash.split('?');
  const segments = path.split('/').filter(Boolean);
  const params = new URLSearchParams(queryString || '');

  if (segments.length === 0) return { name: 'home' };
  if (segments[0] === 'sale') return { name: 'sale' };
  if (segments[0] === 'favourites') return { name: 'favourites' };
  if (segments[0] === 'shop') {
    return {
      name: 'shop',
      category: params.get('category') || undefined,
      gender: params.get('gender') || undefined,
      search: params.get('search') || params.get('q') || undefined,
    };
  }
  if (segments[0] === 'product') {
    return { name: 'product', productId: segments[1] || undefined };
  }
  if (segments[0] === 'cart') return { name: 'cart' };
  if (segments[0] === 'checkout') return { name: 'checkout' };
  if (segments[0] === 'about') return { name: 'about' };
  if (['shipping', 'returns', 'warranty', 'privacy', 'terms', 'contact'].includes(segments[0])) {
    return { name: segments[0] as 'shipping' | 'returns' | 'warranty' | 'privacy' | 'terms' | 'contact' };
  }
  if (segments[0] === 'order-success') {
    return { name: 'order-success', orderNumber: params.get('order') || undefined };
  }
  if (segments[0] === 'payment-result') {
    return { name: 'payment-result', status: params.get('status') || undefined, orderNumber: params.get('order') || undefined };
  }
  if (segments[0] === 'admin') return { name: 'admin' };
  return { name: 'home' };
}

const SHOP_STATE_KEY = 'lw-shop-state';
const SHOP_RESTORE_KEY = 'lw-restore-shop';

export function getSavedShopPath() {
  try {
    const raw = sessionStorage.getItem(SHOP_STATE_KEY);
    if (!raw) return '/shop';
    const state = JSON.parse(raw) as { hash?: string };
    return state.hash?.replace(/^#/, '') || '/shop';
  } catch {
    return '/shop';
  }
}

export function returnToShop() {
  sessionStorage.setItem(SHOP_RESTORE_KEY, '1');
  navigate(getSavedShopPath());
}

export function navigate(path: string) {
  window.location.hash = path;

}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    const onChange = (event: HashChangeEvent) => {
      const oldHash = new URL(event.oldURL).hash.replace(/^#\/?/, '');
      const newHash = new URL(event.newURL).hash.replace(/^#\/?/, '');
      if (oldHash.startsWith('product/') && newHash.startsWith('shop')) {
        sessionStorage.setItem(SHOP_RESTORE_KEY, '1');
      }
      setRoute(parseHash());
      if (!newHash.startsWith('shop')) window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}


