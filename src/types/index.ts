export interface Product {
  id: string;
  name: string;
  brand: string;
  tagline: string;
  inspiredBy: string;
  size: string;
  concentration: string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  flaconDetails: {
    liquidGradient: string;
    capColor: string;
    labelBadge: string;
    accentGlow: string;
  };
  description: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  longevity: string;
  sillage: string;
  gender: 'Unisex' | 'Men' | 'Women';
  bestSeason: string;
  category?: string;
  status?: 'Active' | 'Inactive';
  isBestSeller: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  createdAt?: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  description: string;
  managerName: string;
  openingHours: string;
  status: 'Active' | 'Inactive';
  isDefault: boolean;
  createdAt: string;
}

export interface StoreProductAssignment {
  id: string;
  storeId: string;
  productId: string;
  storePrice: number;
  stock: number;
  isAvailable: boolean;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  storeId?: string;
  storeName?: string;
}

export interface OrderCustomer {
  fullName: string;
  mobileNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  orderNotes?: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Dispatched'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  createdAt: string;
  storeId?: string;
  storeName?: string;
  customer: OrderCustomer;
  items: {
    productId: string;
    productName: string;
    size: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  subtotal: number;
  deliveryCharges: number;
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  whatsappConfirmed: boolean;
}

export interface StoreSettings {
  officialWhatsapp: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  announcementBanner: string;
  adminPassword: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    whatsapp: string;
  };
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  purchasedProduct: string;
  date: string;
}
