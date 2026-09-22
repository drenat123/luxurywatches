import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { MAX_QUANTITY, orderTotals, validCart } from '@/lib/commerce';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  replaceItems: (items: CartItem[]) => void;
  completeOrder: (purchased: CartItem[]) => void;
  totalCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'lw_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return validCart(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
    catch { return []; }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { /* Checkout remains usable when browser storage is unavailable. */ }
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(product.price) || product.price <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          image: product.image,
          quantity: Math.min(MAX_QUANTITY, quantity),
        },
      ];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i)));
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const { subtotal } = orderTotals(items);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        replaceItems: (nextItems) => setItems(validCart(nextItems)),
        completeOrder: (purchased) => setItems(current => current.map(item => ({
          ...item, quantity: item.quantity - (purchased.find(bought => bought.id === item.id)?.quantity || 0),
        })).filter(item => item.quantity > 0)),
        totalCount,
        subtotal,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
