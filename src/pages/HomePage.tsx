import { useEffect, useState, useRef, useCallback } from 'react';
import { ArrowRight, Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/types';
import { canonicalizeProducts } from '@/lib/productIdentity';
import { RecentlyViewed } from '@/components/RecentlyViewed';

const BRANDS = ['BIGOTTI', 'DANIEL KLEIN', 'SERGIO TACCHINI', 'FREELOOK', 'CASIO', 'Q&Q', 'POLO EXCHANGE'];

const HERO_SLIDES = [
  {
    image: '/heroes/hero-sale.png',
    mobileImage: '/heroes/hero-sale-mobile.png',
    position: 'object-[50%_center] lg:object-center',
    badge: 'Oferta të limituara',
    title: 'ZBRITJE DERI NË',
    highlight: '30%',
    text: 'Modele të zgjedhura me çmime speciale.',
    cta: 'SHFLETO ZBRITJET',
    link: '/sale',
  },
  {
    image: '/heroes/hero-collection.png',
    mobileImage: '/heroes/hero-collection-mobile.png',
    position: 'object-[50%_center] lg:object-center',
    badge: 'Koleksioni i ri 2026',
    title: 'QINDRA MODELE.',
    highlight: 'NJË ËSHTË E JOTJA.',
    text: 'Zbulo koleksionin tonë të orëve për meshkuj dhe femra.',
    cta: 'SHIKO KOLEKSIONIN',
    link: '/shop',
  },
  {
    image: '/heroes/hero-brands.png',
    mobileImage: '/heroes/hero-brands-mobile.png',
    position: 'object-[50%_center] lg:object-center',
    badge: 'Marka të njohura',
    title: 'BRENDET QË DO.',
    highlight: 'NË NJË VEND.',
    text: 'Bigotti • Daniel Klein • Polo Exchange • Sergio Tacchini dhe më shumë.',
    cta: 'SHFLETO BRENDET',
    link: '/shop',
  },
];

const TESTIMONIALS = [
  { name: 'Arben K.', city: 'Prishtinë', text: 'Orë e bukur dhe cilësi e shkëlqyer. Dërgesa shumë e shpejtë dhe pagesa në dorëzim. Ja rekomandoj!', rating: 5 },
  { name: 'Valentina M.', city: 'Prizren', text: 'E kam porositur një orë për bashkëshortin dhe ai ishte shumë i kënaqur. Cilësi superiore.', rating: 5 },
  { name: 'Bekim H.', city: 'Pejë', text: 'Çmimi më i mirë në Kosovë për këtë markë. Shërbim profesional dhe produkt origjinal.', rating: 5 },
];

function ProductCarousel({ products, title }: { products: Product[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.8;
    container.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-stone-900">{title}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
              aria-label="Majtas"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border-2 border-stone-200 flex items-center justify-center hover:bg-stone-900 hover:text-white hover:border-stone-900 transition-colors"
              aria-label="Djathtas"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((p) => (
            <div key={p.id} className="flex-shrink-0 w-64 sm:w-72">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const [menProducts, setMenProducts] = useState<Product[]>([]);
  const [womenProducts, setWomenProducts] = useState<Product[]>([]);
  const [dealProduct, setDealProduct] = useState<Product | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: men } = await supabase
        .from('products')
        .select('*')
        .eq('gender', 'men')
        .order('created_at', { ascending: false })
        .limit(12);
      setMenProducts(canonicalizeProducts((men || []) as Product[]).products);

      const { data: women } = await supabase
        .from('products')
        .select('*')
        .eq('gender', 'women')
        .order('created_at', { ascending: false })
        .limit(12);
      setWomenProducts(canonicalizeProducts((women || []) as Product[]).products);

      const { data: dealCandidates } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .not('old_price', 'is', null)
        .order('id', { ascending: true })
        .range(0, 1999);
      const discounted = canonicalizeProducts((dealCandidates || []) as Product[]).products
        .filter(product => product.old_price != null && product.old_price > product.price);
      const previousOfferId = window.localStorage.getItem('luxury-watches-last-offer');
      const freshCandidates = discounted.length > 1
        ? discounted.filter(product => product.id !== previousOfferId)
        : discounted;
      const offer = freshCandidates.length > 0
        ? freshCandidates[Math.floor(Math.random() * freshCandidates.length)]
        : null;
      if (offer) window.localStorage.setItem('luxury-watches-last-offer', offer.id);
      setDealProduct(offer);
    })();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, HERO_SLIDES[heroSlide].link === '/sale' ? 10000 : 5000);
    return () => clearTimeout(timer);
  }, [heroSlide]);

  useEffect(() => {
    const end = new Date();
    end.setHours(end.getHours() + 23, end.getMinutes() + 59, end.getSeconds() + 59);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      setCountdown({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[heroSlide];

  return (
    <div>
      {/* Hero Slideshow */}
      <section aria-label="Koleksionet dhe ofertat" className="relative mt-20 min-h-[320px] overflow-hidden bg-stone-50 lg:aspect-[8/3] lg:min-h-[460px] lg:bg-[#100e0c] lg:flex lg:items-center">
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            aria-hidden={i !== heroSlide}
            className={`absolute top-0 left-0 w-full h-[300px] lg:inset-0 lg:h-full transition-opacity duration-1000 ${i === heroSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={s.image}
              alt=""
              className={`hidden lg:block w-full h-full object-contain ${s.position} lg:object-contain lg:object-center`}
            />
            <img
              src={s.mobileImage}
              alt=""
              className="lg:hidden w-full h-full object-contain object-center"
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[72%] hidden lg:block lg:w-[32%] bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

        <div className="relative z-[1] flex min-h-[300px] items-end px-4 pb-8 sm:px-8 lg:min-h-0 lg:items-center lg:px-[3%] lg:py-12 w-full">
          <div className="w-auto max-w-xl p-0 sm:p-6 lg:max-w-none lg:w-[27%] lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0 lg:backdrop-blur-0">
            <h1 key={`title-${heroSlide}`} className="hidden lg:block text-xl sm:text-4xl lg:text-[clamp(1.5rem,2.4vw,3rem)] font-bold text-white leading-[1.1] mb-2 sm:mb-5 animate-fade-in-up animation-delay-100">
              {slide.title} <span className="text-amber-700 lg:text-amber-500">{slide.highlight}</span>
            </h1>
            <p key={`text-${heroSlide}`} className="hidden lg:block text-xs sm:text-base xl:text-lg text-stone-200 lg:text-stone-300 mb-3 sm:mb-6 leading-relaxed animate-fade-in-up animation-delay-200">
              {slide.text}
            </p>
            <div key={`cta-${heroSlide}`} className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-300">
              <button
                onClick={() => navigate(slide.link)}
                className="px-3.5 sm:px-5 xl:px-6 py-2.5 sm:py-4 bg-amber-700 text-white rounded-xl text-[11px] sm:text-sm xl:text-base font-semibold hover:bg-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 transition-all hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {slide.cta} <ArrowRight aria-hidden="true" className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`h-2 rounded-full transition-all ${i === heroSlide ? 'w-8 bg-amber-500' : 'w-2 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setHeroSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-stone-950/75 hover:bg-stone-950/90 border border-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10 shadow-lg"
          aria-label="Majtas"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setHeroSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-stone-950/75 hover:bg-stone-950/90 border border-white/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10 shadow-lg"
          aria-label="Djathtas"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* Brands */}
      <section aria-labelledby="home-brands-title" className="bg-stone-50 border-b border-stone-100 py-7 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 id="home-brands-title" className="text-xl sm:text-2xl font-bold text-stone-900">Markat tona</h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1.5">Zgjidh markën. Zbulo orën tënde.</p>
            </div>
            <a href="#/shop" className="shrink-0 inline-flex items-center gap-1.5 min-h-11 text-xs sm:text-sm font-semibold text-amber-800 hover:text-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-700 rounded">
              Të gjitha <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </a>
          </div>
          <div className="grid grid-flow-col auto-cols-[156px] sm:auto-cols-[180px] lg:grid-flow-row lg:grid-cols-7 lg:auto-cols-auto gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-3 pt-1 sm:mx-0 sm:px-1" aria-label="Zgjidh një markë">
            {BRANDS.map((brand) => (
              <a
                key={brand}
                href={`#/shop?search=${encodeURIComponent(brand)}`}
                aria-label={`Shiko orët ${brand}`}
                className="group snap-start flex flex-col items-center overflow-hidden rounded-lg border border-stone-700 bg-gradient-to-br from-stone-800 to-stone-950 hover:border-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 transition-colors"
              >
                <span aria-hidden="true" className="w-6 h-px bg-amber-600/80 mt-4 group-hover:w-10 transition-[width] motion-reduce:transition-none" />
                <span className="flex items-center justify-center text-center min-h-[48px] px-3 text-[12px] sm:text-[13px] font-semibold tracking-[0.1em] leading-snug text-stone-100">{brand}</span>
                <span className="w-full flex items-center justify-center gap-2 border-t border-white/10 py-2.5 text-[10px] font-medium text-amber-200/90 group-hover:text-amber-100 group-hover:bg-white/5 transition-colors">
                  Shiko orët
                  <ArrowRight aria-hidden="true" className="w-3 h-3" />
                </span>
              </a>
            ))}
          </div>
          <p className="lg:hidden text-[11px] text-stone-500 mt-1 flex items-center gap-2">Rrëshqit për më shumë marka <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" /></p>
        </div>
      </section>

      {/* Gender carousels - stacked like orlette.com */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-amber-700 text-sm font-bold uppercase tracking-wider">Koleksionet</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mt-2">Orë për të gjithë</h2>
          </div>
        </div>
        <ProductCarousel products={menProducts} title="Orë për Meshkuj" />
        <ProductCarousel products={womenProducts} title="Orë për Femra" />
      </section>

      {/* Deal of the day */}
      {dealProduct && (
        <section className="py-20 bg-stone-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-700/20 blur-3xl rounded-full" />
                <img
                  src={dealProduct.image}
                  alt={dealProduct.name}
                  className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl"
                />
              </div>
              <div className="text-center lg:text-left">
                <span className="inline-block px-4 py-1.5 bg-red-600/20 border border-red-600/30 text-red-400 text-sm font-bold rounded-full mb-4">
                  Oferta e ditës
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">{dealProduct.name}</h2>
                <p className="text-stone-400 mb-6">{dealProduct.brand} · Cilësi premium me zbritje të kufizuar</p>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                  <span className="text-4xl font-bold text-amber-500">{`€${dealProduct.price.toFixed(2)}`}</span>
                  {dealProduct.old_price && (
                    <span className="text-2xl text-stone-500 line-through">{`€${dealProduct.old_price.toFixed(2)}`}</span>
                  )}
                </div>
                <div className="flex justify-center lg:justify-start gap-4 mb-8">
                  {[
                    { label: 'Orë', value: countdown.hours },
                    { label: 'Min', value: countdown.minutes },
                    { label: 'Sek', value: countdown.seconds },
                  ].map((t) => (
                    <div key={t.label} className="bg-stone-800 rounded-xl px-5 py-3 min-w-[72px]">
                      <div className="text-2xl font-bold text-white tabular-nums">
                        {String(t.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-stone-400">{t.label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate(`/product/${dealProduct.id}`)}
                  className="px-8 py-4 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                >
                  Shiko ofertën
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <RecentlyViewed />
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-700 text-sm font-bold uppercase tracking-wider">Testimet</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 mt-2">Çfarë thonë klientët</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                <Quote className="w-8 h-8 text-amber-200 mb-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">{t.name}</p>
                    <p className="text-xs text-stone-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
