import { useEffect, useState } from 'react';
import { Menu, Search, ShoppingBag, X, ChevronDown, Heart } from 'lucide-react';
import { useShoppingPreferences } from '@/context/ShoppingPreferences';
import { useCart } from '@/context/CartContext';
import { navigate, useRoute } from '@/lib/router';
import { SearchOverlay } from './SearchOverlay';

const BRAND_LINKS = [
  { label: 'Të gjitha', path: '/shop' },
  { label: 'BIGOTTI', path: '/shop?search=BIGOTTI' },
  { label: 'DANIEL KLEIN', path: '/shop?search=DANIEL KLEIN' },
  { label: 'SERGIO TACCHINI', path: '/shop?search=SERGIO TACCHINI' },
  { label: 'FREELOOK', path: '/shop?search=FREELOOK' },
  { label: 'CASIO', path: '/shop?search=CASIO' },
  { label: 'Q&Q', path: '/shop?search=Q%26Q' },
  { label: 'POLO EXCHANGE', path: '/shop?search=POLO EXCHANGE' },
];

export function Header() {
  const { favourites } = useShoppingPreferences();
  const { totalCount, openCart } = useCart();
  const route = useRoute();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setCatalogOpen(false);
    setMobileCatalogOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/') return route.name === 'home';
    if (path === '/about') return route.name === 'about';
    if (path === '/shop') return route.name === 'shop' && !route.category && !route.gender;
    if (path.includes('gender=men')) return route.name === 'shop' && route.gender === 'men';
    if (path.includes('gender=women')) return route.name === 'shop' && route.gender === 'women';
    if (path.includes('gender=unisex')) return route.name === 'shop' && route.gender === 'unisex';
    return false;
  };

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white'}`}>
        <div className="h-9 overflow-hidden bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 text-white flex items-center border-b border-amber-500/30" aria-label="Njoftim për dërgesën">
          <div className="announcement-track flex w-max items-center whitespace-nowrap" aria-hidden="true">
            {[0, 1, 2, 3].map((copy) => (
              <span key={copy} className="flex items-center px-6 sm:px-12 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-stone-100">
                <span className="text-amber-400 mr-2.5 text-xs" aria-hidden="true">✦</span>
                Pagesë në dorëzim
                <span className="mx-4 text-amber-400/90" aria-hidden="true">◆</span>
                Pagesë me kartelë përmes Paysera
                <span className="mx-4 text-amber-400/90" aria-hidden="true">◆</span>
                Dërgesë 24–48 orë
              </span>
            ))}
          </div>
          <span className="sr-only">Pagesë në dorëzim. Pagesë me kartelë përmes Paysera. Dërgesë brenda 24–48 orëve.</span>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-20'}`}>
            <button onClick={() => go('/')} className="group flex items-center" aria-label="Luxury Watches Kosovë - Ballina">
              <img
                src="/luxury-watches-header-logo.png"
                alt="Luxury Watches Kosovë"
                className={`block w-[138px] sm:w-[176px] object-contain transition-all duration-300 group-hover:opacity-75 ${scrolled ? 'max-h-10' : 'max-h-12'}`}
              />
            </button>

            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => go('/')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive('/') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-700 hover:bg-stone-50'
                }`}
              >
                Ballina
              </button>

              {/* Katalogu dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCatalogOpen(true)}
                onMouseLeave={() => setCatalogOpen(false)}
              >
                <button
                  onClick={() => go('/shop')}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    route.name === 'shop' ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-700 hover:bg-stone-50'
                  }`}
                >
                  Katalogu <ChevronDown className={`w-4 h-4 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} />
                </button>
                {catalogOpen && (
                  <div className="absolute top-full left-0 pt-2 w-56 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden">
                      {BRAND_LINKS.map((brand) => (
                        <button
                          key={brand.label}
                          onClick={() => go(brand.path)}
                          className="block w-full text-left px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-amber-50 hover:text-amber-700 transition-colors border-b border-stone-50 last:border-0"
                        >
                          {brand.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => go('/shop?gender=men')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive('/shop?gender=men') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-700 hover:bg-stone-50'
                }`}
              >
                Meshkuj
              </button>
              <button
                onClick={() => go('/shop?gender=women')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive('/shop?gender=women') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-700 hover:bg-stone-50'
                }`}
              >
                Femra
              </button>
              <button
                onClick={() => go('/about')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive('/about') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:text-amber-700 hover:bg-stone-50'
                }`}
              >
                Rreth Nesh
              </button>
            </nav>

            <div className="flex items-center gap-0 sm:gap-2">
              <button onClick={() => go('/favourites')} aria-label={`Të preferuarat (${favourites.length})`} className="relative p-2.5 rounded-xl hover:bg-stone-100 transition-colors">
                <Heart className="w-5 h-5 text-stone-700" />
                {favourites.length > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-amber-700 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{favourites.length}</span>}
              </button>
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                aria-label="Kërko"
              >
                <Search className="w-5 h-5 text-stone-700" />
              </button>
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                aria-label="Shporta"
              >
                <ShoppingBag className="w-5 h-5 text-stone-700" />
                {totalCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-amber-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-in">
                    {totalCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-stone-100 transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-stone-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
          <div
            className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-stone-200">
              <span className="font-bold text-stone-900">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-stone-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col p-3">
              <button
                onClick={() => go('/')}
                className={`px-4 py-3 text-left text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                Ballina
              </button>

              <button
                onClick={() => setMobileCatalogOpen(!mobileCatalogOpen)}
                className="flex items-center justify-between px-4 py-3 text-left text-sm font-semibold rounded-xl transition-colors text-stone-700 hover:bg-stone-50"
              >
                Katalogu <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatalogOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileCatalogOpen && (
                <div className="ml-3 border-l-2 border-amber-100 pl-3 mb-1">
                  {BRAND_LINKS.map((brand) => (
                    <button
                      key={brand.label}
                      onClick={() => go(brand.path)}
                      className="block w-full text-left px-4 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition-colors"
                    >
                      {brand.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => go('/shop?gender=men')}
                className={`px-4 py-3 text-left text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/shop?gender=men') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                Meshkuj
              </button>
              <button
                onClick={() => go('/shop?gender=women')}
                className={`px-4 py-3 text-left text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/shop?gender=women') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                Femra
              </button>
              <button
                onClick={() => go('/about')}
                className={`px-4 py-3 text-left text-sm font-semibold rounded-xl transition-colors ${
                  isActive('/about') ? 'text-amber-700 bg-amber-50' : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                Rreth Nesh
              </button>
            </nav>
          </div>
        </div>
      )}

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}
