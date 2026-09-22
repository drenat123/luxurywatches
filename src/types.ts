export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'watches';
  gender: 'men' | 'women' | 'unisex';
  price: number;
  old_price: number | null;
  image: string;
  badge: string | null;
  featured: boolean;
  created_at: string;
  supplier?: string | null;
  supplier_sku?: string | null;
  source_url?: string | null;
  description?: string | null;
  gallery?: string[];
  in_stock?: boolean;
  is_active?: boolean;
  updated_at?: string;
  strap_material?: string | null;
  color?: string | null;
  case_size?: string | null;
  movement?: string | null;
  water_resistance?: string | null;
}

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
}

export interface OrderRequest {
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip?: string;
  notes?: string;
  payment_method: 'cod' | 'paysera';
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}
