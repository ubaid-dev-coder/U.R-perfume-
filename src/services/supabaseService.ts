import { Product, StoreSettings, Store, StoreProductAssignment, Order, OrderStatus } from '../types';

export interface SupabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export const SUPABASE_SCHEMA_SQL = `-- U.R PERFUMES Multi-Store & Product Management Schema + RLS
-- Run this in your Supabase SQL Editor

-- 1. Stores Table
create table if not exists public.stores (
  id text primary key,
  name text not null,
  logo text default '',
  address text default '',
  phone text default '',
  whatsapp text default '',
  email text default '',
  description text default '',
  manager_name text default '',
  opening_hours text default '',
  status text default 'Active' check (status in ('Active', 'Inactive')),
  is_default boolean default false,
  created_at timestamptz default now()
);

-- 2. Products Table
create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text default 'U.R PERFUMES',
  tagline text default '',
  inspired_by text default '',
  size text default '30ml',
  concentration text default 'Extrait de Parfum',
  price numeric not null,
  original_price numeric default 0,
  stock integer default 50,
  image text default '',
  description text default '',
  category text default 'Floral & Gardenia',
  status text default 'Active' check (status in ('Active', 'Inactive')),
  is_featured boolean default true,
  is_bestseller boolean default false,
  gender text default 'Unisex',
  longevity text default '12 - 16 Hours',
  sillage text default 'Strong',
  created_at timestamptz default now()
);

-- 3. Store Products Table (Connects Stores <-> Products with store-specific price & availability)
create table if not exists public.store_products (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  store_price numeric not null,
  is_available boolean default true,
  updated_at timestamptz default now(),
  unique(store_id, product_id)
);

-- 4. Store Inventory Table (Tracks stock levels per store)
create table if not exists public.store_inventory (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  stock integer not null default 0,
  updated_at timestamptz default now(),
  unique(store_id, product_id)
);

-- 5. Orders Table (Connected to stores)
create table if not exists public.orders (
  id text primary key,
  store_id text references public.stores(id) on delete set null,
  store_name text default '',
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric not null,
  delivery_charges numeric default 0,
  total_amount numeric not null,
  payment_method text default 'Cash on Delivery (COD)',
  status text default 'Pending',
  whatsapp_confirmed boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.store_products enable row level security;
alter table public.store_inventory enable row level security;
alter table public.orders enable row level security;

-- Public Read Access Policies (Active stores & active products)
create policy "Public read active stores" on public.stores for select using (true);
create policy "Public read active products" on public.products for select using (true);
create policy "Public read store products" on public.store_products for select using (true);
create policy "Public read store inventory" on public.store_inventory for select using (true);

-- Admin Write Policies (Allow authenticated/admin portal operations)
create policy "Admin manage stores" on public.stores for all using (true) with check (true);
create policy "Admin manage products" on public.products for all using (true) with check (true);
create policy "Admin manage store_products" on public.store_products for all using (true) with check (true);
create policy "Admin manage store_inventory" on public.store_inventory for all using (true) with check (true);
create policy "Public create and read orders" on public.orders for all using (true) with check (true);

-- Storage Buckets
insert into storage.buckets (id, name, public) values ('perfumes', 'perfumes', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('store-logos', 'store-logos', true) on conflict (id) do nothing;
`;

export class SupabaseService {
  public static getCredentials(settings?: StoreSettings) {
    const url =
      settings?.supabaseUrl ||
      (import.meta.env?.VITE_SUPABASE_URL as string) ||
      '';
    const anonKey =
      settings?.supabaseAnonKey ||
      (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
      '';
    return {
      url: url.trim().replace(/\/+$/, ''),
      anonKey: anonKey.trim(),
      isConfigured: Boolean(url && anonKey),
    };
  }

  // =========================================================
  // ROW MAPPERS
  // =========================================================
  public static mapRowToProduct(row: any): Product {
    const imageUrl = row.image || row.image_url || row.imageUrl || '';
    const inspiredBy = row.inspired_by || row.inspiredBy || 'Luxury Formulation';
    const price = Number(row.price || 0);
    const origPrice = Number(row.original_price || row.originalPrice || 0);

    return {
      id: String(row.id),
      name: String(row.name || 'U.R Perfume'),
      brand: String(row.brand || 'U.R PERFUMES'),
      tagline: String(row.tagline || 'Exquisite Formulation, Inspired by Elegance'),
      inspiredBy,
      size: String(row.size || '30ml'),
      concentration: String(row.concentration || 'Extrait de Parfum (Intense 14+ Hour Projection)'),
      price,
      originalPrice: origPrice > price ? origPrice : price + 500,
      stock: Number(row.stock !== undefined ? row.stock : 50),
      image: imageUrl,
      description: String(row.description || ''),
      category: String(row.category || 'Floral & Gardenia'),
      status: (row.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
      isFeatured: row.is_featured !== undefined ? Boolean(row.is_featured) : Boolean(row.isFeatured !== false),
      isBestSeller: Boolean(row.is_bestseller || row.isBestSeller),
      gender: (row.gender || 'Unisex') as 'Unisex' | 'Men' | 'Women',
      longevity: String(row.longevity || '12 – 16 Hours (Extrait Grade)'),
      sillage: String(row.sillage || 'Heavy, Royal Scent Bubble'),
      bestSeason: String(row.best_season || row.bestSeason || 'All-Year, Evening Royalty'),
      topNotes: Array.isArray(row.top_notes)
        ? row.top_notes
        : Array.isArray(row.topNotes)
        ? row.topNotes
        : ['Bergamot', 'Pear Blossom'],
      heartNotes: Array.isArray(row.heart_notes)
        ? row.heart_notes
        : Array.isArray(row.heartNotes)
        ? row.heartNotes
        : ['White Floral', 'Spices'],
      baseNotes: Array.isArray(row.base_notes)
        ? row.base_notes
        : Array.isArray(row.baseNotes)
        ? row.baseNotes
        : ['Amber', 'Musk'],
      rating: Number(row.rating || 5.0),
      reviewCount: Number(row.review_count || row.reviewCount || 1),
      createdAt: row.created_at || row.createdAt,
      flaconDetails: row.flacon_details || row.flaconDetails || {
        liquidGradient: 'from-amber-200/90 via-amber-400/85 to-amber-700/90',
        capColor: 'from-[#fceda2] via-[#d4af37] to-[#aa820a]',
        labelBadge: 'ROYAL COLLECTION',
        accentGlow: 'rgba(212,175,55,0.4)',
      },
    };
  }

  public static mapRowToStore(row: any): Store {
    return {
      id: String(row.id),
      name: String(row.name || 'U.R PERFUMES Boutique'),
      logo: String(row.logo || row.logo_url || ''),
      address: String(row.address || ''),
      phone: String(row.phone || ''),
      whatsapp: String(row.whatsapp || ''),
      email: String(row.email || ''),
      description: String(row.description || ''),
      managerName: String(row.manager_name || row.managerName || ''),
      openingHours: String(row.opening_hours || row.openingHours || 'Mon – Sun: 11:00 AM – 11:00 PM'),
      status: (row.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
      isDefault: Boolean(row.is_default ?? row.isDefault ?? false),
      createdAt: String(row.created_at || row.createdAt || new Date().toISOString()),
    };
  }

  // =========================================================
  // PRODUCTS TABLE
  // =========================================================
  static async fetchProducts(settings?: StoreSettings): Promise<SupabaseResponse<Product[]>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      const endpoint = `${url}/rest/v1/products?select=*&order=created_at.desc.nullslast,id.desc`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return { success: false, error: `Supabase query failed (${res.status}): ${await res.text()}`, statusCode: res.status };
      }

      const rows = await res.json();
      return { success: true, data: Array.isArray(rows) ? rows.map((r: any) => this.mapRowToProduct(r)) : [] };
    } catch (err: any) {
      return { success: false, error: `Supabase network error: ${err?.message || 'Connection failed'}` };
    }
  }

  static async saveProduct(product: Product, settings?: StoreSettings): Promise<SupabaseResponse<Product>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) {
      return { success: false, error: 'Supabase credentials are not configured in Store & Supabase Settings.' };
    }

    const payload: Record<string, any> = {
      id: product.id,
      name: product.name,
      brand: product.brand || 'U.R PERFUMES',
      price: product.price,
      original_price: product.originalPrice,
      size: product.size || '30ml',
      category: product.category || 'Floral & Gardenia',
      description: product.description || '',
      image: product.image || '',
      stock: product.stock !== undefined ? product.stock : 50,
      status: product.status || 'Active',
      inspired_by: product.inspiredBy || '',
      is_featured: product.isFeatured !== undefined ? product.isFeatured : true,
      is_bestseller: Boolean(product.isBestSeller),
      gender: product.gender || 'Unisex',
      longevity: product.longevity || '12 – 16 Hours (Extrait Grade)',
      sillage: product.sillage || 'Heavy, Royal Scent Bubble',
      top_notes: product.topNotes || [],
      heart_notes: product.heartNotes || [],
      base_notes: product.baseNotes || [],
    };

    const endpoint = `${url}/rest/v1/products?on_conflict=id`;
    let attempts = 0;
    while (attempts < 5) {
      attempts++;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const json = await res.json();
          return { success: true, data: Array.isArray(json) && json[0] ? this.mapRowToProduct(json[0]) : product };
        }

        const errorText = await res.text();
        const colMatch =
          errorText.match(/Could not find the '([^']+)' column/i) ||
          errorText.match(/column "([^"]+)" of relation "products" does not exist/i);
        if (colMatch && colMatch[1] && payload[colMatch[1]] !== undefined) {
          delete payload[colMatch[1]];
          continue;
        }
        return { success: false, error: `Database insertion error (${res.status}): ${errorText}`, statusCode: res.status };
      } catch (err: any) {
        return { success: false, error: `Supabase network error: ${err?.message || 'Failed to connect'}` };
      }
    }
    return { success: false, error: 'Database insertion failed after schema adaptation.' };
  }

  static async deleteProduct(productId: string, settings?: StoreSettings): Promise<SupabaseResponse<void>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/products?id=eq.${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      return res.ok ? { success: true } : { success: false, error: await res.text(), statusCode: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // =========================================================
  // STORES TABLE
  // =========================================================
  static async fetchStores(settings?: StoreSettings): Promise<SupabaseResponse<Store[]>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/stores?select=*&order=created_at.desc.nullslast`, {
        method: 'GET',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      if (!res.ok) {
        return { success: false, error: await res.text(), statusCode: res.status };
      }
      const rows = await res.json();
      return { success: true, data: Array.isArray(rows) ? rows.map((r: any) => this.mapRowToStore(r)) : [] };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  static async saveStore(store: Store, settings?: StoreSettings): Promise<SupabaseResponse<Store>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    const payload: Record<string, any> = {
      id: store.id,
      name: store.name,
      logo: store.logo || '',
      address: store.address,
      phone: store.phone,
      whatsapp: store.whatsapp,
      email: store.email,
      description: store.description || '',
      manager_name: store.managerName || '',
      opening_hours: store.openingHours || '',
      status: store.status || 'Active',
      is_default: Boolean(store.isDefault),
      created_at: store.createdAt || new Date().toISOString(),
    };

    try {
      const res = await fetch(`${url}/rest/v1/stores?on_conflict=id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        return { success: true, data: Array.isArray(json) && json[0] ? this.mapRowToStore(json[0]) : store };
      }
      return { success: false, error: await res.text(), statusCode: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  static async deleteStore(storeId: string, settings?: StoreSettings): Promise<SupabaseResponse<void>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}`, {
        method: 'DELETE',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      return res.ok ? { success: true } : { success: false, error: await res.text(), statusCode: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // =========================================================
  // STORE_PRODUCTS & STORE_INVENTORY TABLES
  // =========================================================
  static async fetchStoreProducts(settings?: StoreSettings): Promise<SupabaseResponse<StoreProductAssignment[]>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      const [spRes, invRes] = await Promise.all([
        fetch(`${url}/rest/v1/store_products?select=*`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
        fetch(`${url}/rest/v1/store_inventory?select=*`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
      ]);

      if (!spRes.ok) {
        return { success: false, error: await spRes.text(), statusCode: spRes.status };
      }

      const spRows = await spRes.json();
      const invRows = invRes.ok ? await invRes.json() : [];

      const mapped: StoreProductAssignment[] = (Array.isArray(spRows) ? spRows : []).map((row: any) => {
        const invMatch = Array.isArray(invRows)
          ? invRows.find((i: any) => i.store_id === row.store_id && i.product_id === row.product_id)
          : null;
        return {
          id: String(row.id),
          storeId: String(row.store_id),
          productId: String(row.product_id),
          storePrice: Number(row.store_price ?? row.storePrice ?? 0),
          stock: Number(invMatch?.stock ?? row.stock ?? 0),
          isAvailable: Boolean(row.is_available ?? row.isAvailable ?? true),
          updatedAt: String(row.updated_at || new Date().toISOString()),
        };
      });

      return { success: true, data: mapped };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  static async saveStoreProduct(
    assignment: StoreProductAssignment,
    settings?: StoreSettings
  ): Promise<SupabaseResponse<StoreProductAssignment>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      // 1. Upsert store_products
      const spRes = await fetch(`${url}/rest/v1/store_products?on_conflict=id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: assignment.id,
          store_id: assignment.storeId,
          product_id: assignment.productId,
          store_price: assignment.storePrice,
          is_available: assignment.isAvailable,
          updated_at: assignment.updatedAt || new Date().toISOString(),
        }),
      });

      // 2. Upsert store_inventory
      await fetch(`${url}/rest/v1/store_inventory?on_conflict=id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: `inv-${assignment.storeId}-${assignment.productId}`,
          store_id: assignment.storeId,
          product_id: assignment.productId,
          stock: assignment.stock,
          updated_at: assignment.updatedAt || new Date().toISOString(),
        }),
      });

      if (spRes.ok) {
        return { success: true, data: assignment };
      }
      return { success: false, error: await spRes.text(), statusCode: spRes.status };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  static async deleteStoreProduct(
    assignmentId: string,
    storeId: string,
    productId: string,
    settings?: StoreSettings
  ): Promise<SupabaseResponse<void>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase credentials not configured' };

    try {
      await fetch(`${url}/rest/v1/store_inventory?store_id=eq.${encodeURIComponent(storeId)}&product_id=eq.${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });

      const res = await fetch(`${url}/rest/v1/store_products?id=eq.${encodeURIComponent(assignmentId)}`, {
        method: 'DELETE',
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      return res.ok ? { success: true } : { success: false, error: await res.text(), statusCode: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // =========================================================
  // ORDERS TABLE
  // =========================================================
  static async saveOrder(order: Order, settings?: StoreSettings): Promise<SupabaseResponse<Order>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/orders?on_conflict=id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: order.id,
          store_id: order.storeId || null,
          store_name: order.storeName || '',
          customer: order.customer,
          items: order.items,
          subtotal: order.subtotal,
          delivery_charges: order.deliveryCharges,
          total_amount: order.totalAmount,
          payment_method: order.paymentMethod,
          status: order.status,
          whatsapp_confirmed: order.whatsappConfirmed,
          created_at: order.createdAt,
        }),
      });
      return res.ok ? { success: true, data: order } : { success: false, error: await res.text() };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus, settings?: StoreSettings): Promise<SupabaseResponse<void>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) return { success: false, error: 'Supabase not configured' };

    try {
      const res = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ status }),
      });
      return res.ok ? { success: true } : { success: false, error: await res.text() };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // =========================================================
  // SUPABASE STORAGE BUCKET UPLOAD (Perfumes & Store Logos)
  // =========================================================
  private static async ensureBucket(url: string, anonKey: string, bucketName: string): Promise<void> {
    try {
      await fetch(`${url}/storage/v1/bucket`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bucketName,
          name: bucketName,
          public: true,
        }),
      });
    } catch {
      // safe ignore if bucket already exists or restricted
    }
  }

  static async uploadImage(
    file: File | Blob,
    fileName: string,
    settings?: StoreSettings,
    bucket: 'perfumes' | 'store-logos' = 'perfumes'
  ): Promise<SupabaseResponse<string>> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) {
      return { success: false, error: 'Supabase credentials are not configured.' };
    }

    try {
      await this.ensureBucket(url, anonKey, bucket);

      const cleanFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadUrl = `${url}/storage/v1/object/${bucket}/${cleanFileName}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: file,
      });

      if (res.ok) {
        const publicUrl = `${url}/storage/v1/object/public/${bucket}/${cleanFileName}`;
        return { success: true, data: publicUrl };
      } else {
        const errText = await res.text();
        return {
          success: false,
          error: `Storage upload failed (${res.status}): ${errText}`,
          statusCode: res.status,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Storage connection error: ${err?.message || 'Network failure'}`,
      };
    }
  }

  // =========================================================
  // CONNECTION DIAGNOSTICS
  // =========================================================
  static async testConnection(settings?: StoreSettings): Promise<{ success: boolean; message: string }> {
    const { url, anonKey, isConfigured } = this.getCredentials(settings);
    if (!isConfigured) {
      return {
        success: false,
        message: 'Please provide both Supabase Project URL and Anon Public Key.',
      };
    }

    try {
      const [prodRes, storesRes] = await Promise.all([
        fetch(`${url}/rest/v1/products?select=id&limit=1`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
        fetch(`${url}/rest/v1/stores?select=id&limit=1`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        }),
      ]);

      if (!prodRes.ok) {
        return {
          success: false,
          message: `Products table check failed (${prodRes.status}). Run the SQL Schema below in Supabase SQL Editor.`,
        };
      }
      if (!storesRes.ok) {
        return {
          success: false,
          message: `Connected to products table, but "stores" table is missing (${storesRes.status}). Run the SQL Schema below.`,
        };
      }

      await Promise.all([
        this.ensureBucket(url, anonKey, 'perfumes'),
        this.ensureBucket(url, anonKey, 'store-logos'),
      ]);

      return {
        success: true,
        message: 'Connected! Tables (products, stores, store_products, store_inventory, orders) & Storage ready.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection test failed: ${err?.message || 'Network error'}`,
      };
    }
  }
}
