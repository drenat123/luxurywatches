import { CartProvider, useCart } from '@/context/CartContext';
import { useRoute } from '@/lib/router';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { SalePage } from '@/pages/SalePage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage, OrderSuccessPage, PaymentResultPage } from '@/pages/CheckoutPage';
import { AboutPage } from '@/pages/AboutPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { InfoPage } from '@/pages/InfoPage';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ShoppingPreferencesProvider } from '@/context/ShoppingPreferences';
import { FavouritesPage } from '@/pages/FavouritesPage';
import { AdminPage } from '@/pages/AdminPage';

function Pages() {
  const route = useRoute();
  const { isOpen } = useCart();

  if (route.name === 'admin') return <AdminPage />;

  let page;
  switch (route.name) {
    case 'favourites':
      page = <FavouritesPage />;
      break;
    case 'home':
      page = <HomePage />;
      break;
    case 'shop':
      page = <ShopPage key={JSON.stringify(route)} />;
      break;
    case 'sale':
      page = <SalePage />;
      break;
    case 'product':
      page = <ProductDetailPage productId={route.productId} />;
      break;
    case 'cart':
      page = <CartPage />;
      break;
    case 'checkout':
      page = <CheckoutPage />;
      break;
    case 'about':
      page = <AboutPage />;
      break;
    case 'shipping':
    case 'returns':
    case 'warranty':
    case 'privacy':
    case 'terms':
    case 'contact':
      page = <InfoPage page={route.name} />;
      break;
    case 'order-success':
      page = <OrderSuccessPage orderNumber={route.orderNumber} />;
      break;
    case 'payment-result':
      page = <PaymentResultPage status={route.status} orderNumber={route.orderNumber} />;
      break;
    default:
      page = <HomePage />;
  }

  const hideFooter = route.name === 'cart' || route.name === 'checkout' || route.name === 'order-success' || route.name === 'payment-result';

  return (
    <div className={`min-h-screen flex flex-col bg-white ${route.name === 'product' ? 'pb-24 md:pb-0' : ''}`}>
      <Header />
      <main className="flex-1 pt-9">{page}</main>
      {!hideFooter && <Footer />}
      {!isOpen && <WhatsAppButton />}
      {isOpen && <CartDrawer />}
    </div>
  );
}

export default function App() {
  return (
    <ShoppingPreferencesProvider><CartProvider>
      <Pages />
    </CartProvider></ShoppingPreferencesProvider>
  );
}

