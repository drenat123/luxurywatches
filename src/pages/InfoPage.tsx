import { Mail, MapPin, Phone, ShieldCheck, Truck, Undo2, FileText, LockKeyhole } from 'lucide-react';
import type { Route } from '@/lib/router';

type InfoRoute = Extract<Route, { name: 'shipping' | 'returns' | 'warranty' | 'privacy' | 'terms' | 'contact' }>['name'];

const CONTENT: Record<InfoRoute, { title: string; intro: string; icon: typeof Truck; sections: { heading: string; text: string }[] }> = {
  shipping: {
    title: 'Dërgesa dhe transporti',
    intro: 'Ne dërgojmë porositë në të gjithë Kosovën, shpejt dhe në mënyrë të sigurt.',
    icon: Truck,
    sections: [
      { heading: 'Koha e dorëzimit', text: 'Pasi të konfirmojmë stokun me email, dorëzimi pritet brenda 24–48 orëve, në varësi të korrierit dhe qytetit.' },
      { heading: 'Pagesa', text: 'Pagesa në dorëzim është e disponueshme për porositë në Kosovë. Për çdo porosi, ekipi ynë mund t’ju kontaktojë për konfirmim.' },
      { heading: 'Kostoja e postës', text: 'Posta kushton 3 € për porosi nën 50 € dhe është falas për porosi prej 50 € e më shumë. Kostoja përfshihet në totalin e checkout-it.' },
    ],
  },
  returns: {
    title: 'Kthimet dhe ndërrimet',
    intro: 'Dëshirojmë që të jeni plotësisht të kënaqur me orën tuaj.',
    icon: Undo2,
    sections: [
      { heading: 'Kërkesa për kthim', text: 'Na kontaktoni brenda 14 ditësh nga pranimi i porosisë për të kërkuar kthim ose ndërrim.' },
      { heading: 'Kushtet', text: 'Produkti duhet të jetë i papërdorur, në gjendje të re dhe me paketimin e tij. Produktet e përdorura ose të dëmtuara pas dorëzimit mund të mos pranohen.' },
      { heading: 'Si të na kontaktoni', text: 'Për të nisur një kërkesë, na telefononi ose na shkruani në email me numrin e porosisë dhe arsyen e kthimit.' },
    ],
  },
  warranty: {
    title: 'Garancia',
    intro: 'Çdo orë e blerë nga Luxury Watches Kosovë mbulohet me garanci 2 vjet.',
    icon: ShieldCheck,
    sections: [
      { heading: 'Çfarë mbulon', text: 'Garancia mbulon defektet e prodhimit dhe funksionimin normal të mekanizmit gjatë periudhës së garancisë.' },
      { heading: 'Çfarë nuk mbulon', text: 'Dëmtimet nga goditjet, përdorimi i gabuar, gërvishtjet, konsumimi normal dhe dëmtimet nga ndërhyrjet e paautorizuara nuk mbulohen.' },
      { heading: 'Shërbimi', text: 'Ruajeni dëshminë e blerjes dhe na kontaktoni nëse keni nevojë për asistencë gjatë periudhës së garancisë.' },
    ],
  },
  privacy: {
    title: 'Politika e privatësisë',
    intro: 'Ne e përdorim informacionin tuaj vetëm për të përpunuar dhe dorëzuar porositë tuaja.',
    icon: LockKeyhole,
    sections: [
      { heading: 'Të dhënat që mbledhim', text: 'Gjatë porosisë mund të kërkojmë emrin, telefonin, emailin dhe adresën e dorëzimit.' },
      { heading: 'Përdorimi i të dhënave', text: 'Të dhënat përdoren për konfirmimin e porosisë, komunikimin me ju, dorëzimin dhe shërbimin pas shitjes.' },
      { heading: 'Siguria', text: 'Ne nuk i shesim të dhënat tuaja personale. Për pyetje rreth privatësisë, kontaktoni ekipin tonë.' },
    ],
  },
  terms: {
    title: 'Kushtet e përdorimit',
    intro: 'Duke përdorur këtë faqe, ju pranoni kushtet e mëposhtme të blerjes.',
    icon: FileText,
    sections: [
      { heading: 'Porositë', text: 'Një porosi konsiderohet e konfirmuar pasi të jetë pranuar dhe konfirmuar nga ekipi ynë. Çmimet dhe disponueshmëria mund të ndryshojnë para konfirmimit.' },
      { heading: 'Produktet dhe çmimet', text: 'Ne përpiqemi të paraqesim fotografi, përshkrime dhe çmime të sakta. Mund të ketë ndryshime të vogla në ngjyrë për shkak të ekranit.' },
      { heading: 'Kontaktimi', text: 'Për paqartësi rreth një porosie, produkti ose pagese, na kontaktoni para se të bëni porosinë.' },
    ],
  },
  contact: {
    title: 'Na kontaktoni',
    intro: 'Jemi këtu për t’ju ndihmuar të zgjidhni orën e duhur.',
    icon: Phone,
    sections: [
      { heading: 'Telefoni', text: '+383 43 737 210' },
      { heading: 'Email', text: 'info@luxurywatches-ks.com' },
      { heading: 'Lokacioni', text: 'Prishtinë, Kosovë' },
    ],
  },
};

export function InfoPage({ page }: { page: InfoRoute }) {
  const content = CONTENT[page];
  const Icon = content.icon;
  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <section className="bg-stone-900 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Icon aria-hidden="true" className="w-8 h-8 text-amber-400 mb-5" />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{content.title}</h1>
          <p className="text-stone-300 max-w-2xl leading-relaxed">{content.intro}</p>
        </div>
      </section>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-100">
          {content.sections.map(section => (
            <section key={section.heading} className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-stone-900 mb-2">{section.heading}</h2>
              <p className="text-stone-600 leading-7">{section.text}</p>
            </section>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-stone-600">
          <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-700" /> +383 43 737 210</span>
          <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-700" /> info@luxurywatches-ks.com</span>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-700" /> Prishtinë, Kosovë</span>
        </div>
      </main>
    </div>
  );
}
