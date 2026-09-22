import { Watch, Instagram, Facebook, Mail, Phone, MapPin, Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import { navigate } from '@/lib/router';

const BRANDS = [
  { label: 'BIGOTTI', path: '/shop?search=BIGOTTI' },
  { label: 'DANIEL KLEIN', path: '/shop?search=DANIEL KLEIN' },
  { label: 'SERGIO TACCHINI', path: '/shop?search=SERGIO TACCHINI' },
  { label: 'FREELOOK', path: '/shop?search=FREELOOK' },
  { label: 'CASIO', path: '/shop?search=CASIO' },
  { label: 'Q&Q', path: '/shop?search=Q%26Q' },
  { label: 'POLO EXCHANGE', path: '/shop?search=POLO EXCHANGE' },
];

export function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <section aria-label="Shërbimet tona" className="bg-white text-stone-900 border-y border-stone-100">
        <div className="max-w-7xl mx-auto overflow-x-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-nowrap items-center justify-between gap-8 py-5 min-w-max">
            {[
              { icon: Truck, title: 'Dërgesë falas', desc: 'Për porositë nga €50' },
              { icon: ShieldCheck, title: 'Garancia 2 vjet', desc: 'Në të gjitha produktet' },
              { icon: RefreshCw, title: 'Kthim 14 ditë', desc: 'Pa pyetje' },
              { icon: Headphones, title: 'Mbështetje 24/7', desc: 'Gjithmonë në dispozicion' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex shrink-0 items-center gap-3">
                <Icon aria-hidden="true" className="w-6 h-6 text-amber-700 shrink-0" />
                <div className="whitespace-nowrap">
                  <p className="font-bold text-xs sm:text-sm">{title}</p>
                  <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center">
                <Watch className="w-5 h-5 text-white" />
              </div>
              <div className="leading-none">
                <span className="block text-lg font-bold text-white tracking-tight">LUXURY WATCHES</span>
                <span className="block text-[10px] text-amber-500 font-semibold tracking-[0.2em]">KOSOVË</span>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Ora dhe aksesorë luksoz me çmime të përballueshme. Shpërndarje në të gjithë Kosovën me pagesë në dorëzim.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Ndihmë</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/shipping')} className="hover:text-amber-500 transition-colors">Dërgesa dhe transporti</button></li>
              <li><button onClick={() => navigate('/returns')} className="hover:text-amber-500 transition-colors">Kthimet dhe ndërrimet</button></li>
              <li><button onClick={() => navigate('/warranty')} className="hover:text-amber-500 transition-colors">Garancia</button></li>
              <li><button onClick={() => navigate('/contact')} className="hover:text-amber-500 transition-colors">Na kontaktoni</button></li>
              <li><button onClick={() => navigate('/privacy')} className="hover:text-amber-500 transition-colors">Privatësia</button></li>
              <li><button onClick={() => navigate('/terms')} className="hover:text-amber-500 transition-colors">Kushtet</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Dyqani</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => navigate('/shop')} className="hover:text-amber-500 transition-colors">Të gjitha orët</button></li>
              <li><button onClick={() => navigate('/shop?gender=men')} className="hover:text-amber-500 transition-colors">Orë meshkuj</button></li>
              <li><button onClick={() => navigate('/shop?gender=women')} className="hover:text-amber-500 transition-colors">Orë femra</button></li>
              <li><button onClick={() => navigate('/about')} className="hover:text-amber-500 transition-colors">Rreth nesh</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Markat</h3>
            <ul className="space-y-2 text-sm">
              {BRANDS.map((b) => (
                <li key={b.label}>
                  <button onClick={() => navigate(b.path)} className="hover:text-amber-500 transition-colors">{b.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-4 text-sm tracking-wider uppercase">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" /> +383 43 737 210
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" /> info@luxurywatches-ks.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" /> Prishtinë, Kosovë
              </li>
              <li className="flex items-center gap-3 pt-2">
                <span className="w-9 h-9 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors cursor-pointer">
                  <Instagram className="w-4 h-4" />
                </span>
                <span className="w-9 h-9 bg-stone-800 rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors cursor-pointer">
                  <Facebook className="w-4 h-4" />
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-center text-sm text-stone-500">
          © 2026 Luxury Watches Kosovë. Të gjitha të drejtat e rezervuara.
        </div>
      </div>
    </footer>
  );
}
