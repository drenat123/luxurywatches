import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { navigate } from '@/lib/router';
import { MAX_QUANTITY, orderTotals } from '@/lib/commerce';

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeFromCart, subtotal, totalCount } = useCart();

  if (!isOpen) return null;
  const { shipping, total } = orderTotals(items);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end animate-fade-in" onClick={closeCart}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
            <h2 className="text-lg font-bold text-stone-900">Shporta ({totalCount})</h2>
          </div>
          <button onClick={closeCart} aria-label="Mbyll shportën" className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="w-16 h-16 text-stone-300 mb-4" />
            <p className="text-lg font-semibold text-stone-700 mb-1">Shporta është bosh</p>
            <p className="text-sm text-stone-400 mb-6">Shtoni produkte për të vazhduar</p>
            <button
              onClick={() => {
                closeCart();
                navigate('/shop');
              }}
              className="px-6 py-3 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors"
            >
              Shiko produktet
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-stone-500 mb-2">{item.brand}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 border border-stone-200 rounded-lg">
                        <button
                          aria-label={`Zvogëlo sasinë: ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-stone-100 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          aria-label={`Rrit sasinë: ${item.name}`}
                          disabled={item.quantity >= MAX_QUANTITY}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-stone-100 rounded-r-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-700 text-sm">{formatPrice(item.price * item.quantity)}</span>
                        <button
                          aria-label={`Hiq nga shporta: ${item.name}`}
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-stone-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Nëntotali</span>
                <span className="text-xl font-bold text-stone-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm"><span>Posta</span><span>{shipping === 0 ? 'Falas' : formatPrice(shipping)}</span></div>
              <div className="flex justify-between font-semibold"><span>Totali për pagesë</span><span>{formatPrice(total)}</span></div>
              <button
                onClick={() => {
                  closeCart();
                  navigate('/cart');
                }}
                className="w-full py-3 border-2 border-stone-900 text-stone-900 rounded-xl font-semibold hover:bg-stone-900 hover:text-white transition-colors"
              >
                Shiko shportën
              </button>
              <button
                onClick={() => {
                  closeCart();
                  navigate('/checkout');
                }}
                className="w-full py-3 bg-amber-700 text-white rounded-xl font-semibold hover:bg-amber-800 transition-colors"
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
