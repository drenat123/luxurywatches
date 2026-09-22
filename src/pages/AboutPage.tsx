import { Watch, Award, Users, Truck, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { navigate } from '@/lib/router';

export function AboutPage() {
  return (
    <div className="pt-20">
      <section className="relative h-80 flex items-center overflow-hidden">
        <img
          src="https://images.pexels.com/photos/28135838/pexels-photo-28135838.jpeg?auto=compress&cs=tinysrgb&h=800&w=1920"
          alt="Luxury watch"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-stone-900/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Rreth nesh</h1>
          <p className="text-stone-300 text-lg">Historia jonë, misioni ynë</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Watch className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-stone-900 mb-6">Luxury Watches Kosovë</h2>
          <p className="text-lg text-stone-600 leading-relaxed mb-4">
            Luxury Watches Kosovë u themelua me një mision të thjeshtë: të sjellë ora luksoze dhe aksesorë me cilësi të lartë për klientët në Kosovë, me çmime të përballueshme.
          </p>
          <p className="text-lg text-stone-600 leading-relaxed">
            Nga orë klasike tek modele moderne — ne kujdesemi për çdo detaj të produktit dhe shërbimit tonë, për t'ju ofruar një përvojë blerjeje që do të vlerësoni.
          </p>
        </div>
      </section>

      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, value: '500+', label: 'Produkte' },
              { icon: Users, value: '10,000+', label: 'Klientë të kënaqur' },
              { icon: Truck, value: '24h', label: 'Dërgesë' },
              { icon: ShieldCheck, value: '2 vjet', label: 'Garanci' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-stone-100">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-7 h-7 text-amber-700" />
                </div>
                <p className="text-3xl font-bold text-stone-900 mb-1">{s.value}</p>
                <p className="text-sm text-stone-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-stone-900 mb-6">Vlerat tona</h2>
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: 'Cilësi e garantuar', desc: 'Çdo produkt kalon kontroll rigoroz për cilësi përpara se të dërgohet.' },
                  { icon: Heart, title: 'Klienti në qendër', desc: 'Kënaqësia e klientit është prioriteti ynë numër një.' },
                  { icon: Truck, title: 'Shërbim i shpejtë', desc: 'Dërgesë brenda 24 orëve në të gjithë Kosovën me pagesë në dorëzim.' },
                ].map((v, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <v.icon className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 mb-1">{v.title}</h3>
                      <p className="text-stone-600 text-sm leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/9561299/pexels-photo-9561299.jpeg?auto=compress&cs=tinysrgb&h=800&w=700"
                alt="Premium watch"
                className="rounded-3xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-stone-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Gati për të blerë?</h2>
          <p className="text-stone-400 mb-8">Zbuloni koleksionin tonë të orëve luksoze</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-4 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors inline-flex items-center gap-2"
          >
            Shiko dyqanin <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
