import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { navigate } from '@/lib/router';
import { MAX_QUANTITY, orderTotals } from '@/lib/commerce';

export function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-stone-300" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Shporta është bosh</h1>
          <p className="text-stone-500 mb-8">Shtoni produkte për të filluar blerjen</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3.5 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors"
          >
            Shiko produktet
          </button>
        </div>
      </div>
    );
  }

  const { shipping, total } = orderTotals(items);

  return (
    <div className="pt-20 min-h-screen bg-stone-50">
      <div className="bg-stone-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Shporta e blerjeve</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="min-w-0 lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 border border-stone-100">
                <img src={item.image} alt={item.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">{item.brand}</p>
                    <h3 className="font-semibold text-stone-900 truncate">{item.name}</h3>
                    <p className="text-amber-700 font-bold mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 border border-stone-200 rounded-lg">
                      <button
                        aria-label={`Zvogëlo sasinë: ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-stone-100 rounded-l-lg transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center font-semibold">{item.quantity}</span>
                      <button
                        aria-label={`Rrit sasinë: ${item.name}`}
                        disabled={item.quantity >= MAX_QUANTITY}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-stone-100 rounded-r-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-stone-900">{formatPrice(item.price * item.quantity)}</span>
                      <button
                        aria-label={`Hiq nga shporta: ${item.name}`}
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => navigate('/shop')}
              className="text-stone-600 font-semibold hover:text-amber-700 transition-colors flex items-center gap-2"
            >
              ← Vazhdo blerjen
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-stone-100 lg:sticky lg:top-32">
              <h2 className="text-lg font-bold text-stone-900 mb-6">Përmbledhja</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-stone-600">
                  <span>Nëntotali</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Dërgesa</span>
                  <span className="font-semibold">{shipping === 0 ? 'Falas' : formatPrice(shipping)}</span>
                </div>
                {subtotal < 50 && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">
                    Posta kushton 3 €. Falas për porosi prej 50 € e më shumë.
                  </p>
                )}
              </div>
              <div className="border-t border-stone-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900">Totali</span>
                  <span className="text-2xl font-bold text-amber-700">{formatPrice(total)}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors flex items-center justify-center gap-2"
              >
                Vazhdo në checkout <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
