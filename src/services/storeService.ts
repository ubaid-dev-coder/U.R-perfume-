import {
  Product,
  Order,
  StoreSettings,
  OrderStatus,
  Store,
  StoreProductAssignment,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STORES,
  INITIAL_STORE_PRODUCTS,
} from '../data/initialData';
import { SupabaseService } from './supabaseService';

const PRODUCTS_KEY = 'ur_perfumes_products_v7';
const ORDERS_KEY = 'ur_perfumes_orders_v1';
const SETTINGS_KEY = 'ur_perfumes_settings_v1';
const STORES_KEY = 'ur_perfumes_stores_v1';
const STORE_PRODUCTS_KEY = 'ur_perfumes_store_products_v1';

const INVICTUS_SEED_FLAG = 'ur_invictus_seeded_v1';
const JANAN_SPOT_SEED_FLAG = 'ur_janan_spot_seeded_v1';
const JANAN_SPOT_SP_SEED_FLAG = 'ur_janan_spot_sp_seeded_v1';
const JANAN_SPORTS_1600_FLAG = 'ur_janan_sports_1600_v1';
const JANAN_SPORTS_SP_1600_FLAG = 'ur_janan_sports_sp_1600_v1';

export class StoreService {
  // =========================================================
  // EVENT BROADCASTERS
  // =========================================================
  private static broadcast(eventName: string, detail: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  private static mergeWithInitial(products: Product[]): Product[] {
    const LEGACY_REPLACED_IMAGES = new Set([
      '/assets/aistudio/image_bb39909f.png',
      '/assets/aistudio/image_82981bf4.png',
      '/assets/aistudio/image_d9d5f189.png',
      '/assets/aistudio/image_f7eac110.png',
      '/assets/aistudio/janan_gold_bottle.jpg',
      '/assets/aistudio/image_9222a07a.png',
      '/assets/aistudio/image_e4aa6d4a.png',
    ]);

    let changed = false;
    let list = products.map((item) => {
      const initialMatch = INITIAL_PRODUCTS.find((p) => p.id === item.id);
      if (
        initialMatch &&
        (!item.image || item.image.trim() === '' || LEGACY_REPLACED_IMAGES.has(item.image))
      ) {
        if (item.image !== initialMatch.image) {
          changed = true;
        }
        return { ...item, image: initialMatch.image };
      }
      return item;
    });

    if (typeof window !== 'undefined') {
      // One-time seed for newly added Invictus signature bottle
      if (!localStorage.getItem(INVICTUS_SEED_FLAG)) {
        const invictusInit = INITIAL_PRODUCTS.find((p) => p.id === 'invictus-inspired');
        if (invictusInit && !list.some((p) => p.id === 'invictus-inspired')) {
          list = [...list, invictusInit];
          changed = true;
        }
        localStorage.setItem(INVICTUS_SEED_FLAG, 'true');
      }

      // One-time seed for newly added Janan Spot signature bottle
      if (!localStorage.getItem(JANAN_SPOT_SEED_FLAG)) {
        const jananSpotInit = INITIAL_PRODUCTS.find((p) => p.id === 'janan-spot-inspired');
        if (jananSpotInit && !list.some((p) => p.id === 'janan-spot-inspired')) {
          list = [...list, jananSpotInit];
          changed = true;
        }
        localStorage.setItem(JANAN_SPOT_SEED_FLAG, 'true');
      }

      // One-time sync for Janan Sports name & Rs. 1,600 price update
      if (!localStorage.getItem(JANAN_SPORTS_1600_FLAG)) {
        list = list.map((p) =>
          p.id === 'janan-spot-inspired'
            ? { ...p, name: 'Janan Sports Inspired – 30ml', price: 1600, originalPrice: 2000 }
            : p
        );
        changed = true;
        localStorage.setItem(JANAN_SPORTS_1600_FLAG, 'true');
      }

      if (changed) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
      }
    }

    return list;
  }

  // =========================================================
  // PRODUCTS MANAGEMENT
  // =========================================================
  static getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      if (stored) {
        const parsed: Product[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.mergeWithInitial(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse products from local storage:', e);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }

  static async loadProducts(): Promise<Product[]> {
    const settings = this.getSettings();

    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      try {
        const result = await SupabaseService.fetchProducts(settings);
        if (result.success && result.data && result.data.length > 0) {
          const merged = this.mergeWithInitial(result.data);
          const missingInitials = INITIAL_PRODUCTS.filter(
            (init) => !merged.some((m) => m.id === init.id)
          );
          const fullCatalog = [...merged, ...missingInitials];
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fullCatalog));
          this.broadcast('ur_products_updated', fullCatalog);
          return fullCatalog;
        }
      } catch (err) {
        console.warn('Supabase product load notice:', err);
      }
    }

    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const merged = this.mergeWithInitial(data);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
          this.broadcast('ur_products_updated', merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Backend API product fetch notice:', err);
    }

    return this.getProducts();
  }

  static saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products),
      }).catch(() => {});
      this.broadcast('ur_products_updated', products);
    } catch (e) {
      console.error('Failed to save products:', e);
    }
  }

  static addProduct(newProduct: Product, assignToStoreIds?: string[]): Product[] {
    const products = this.getProducts();
    const stampedProduct: Product = {
      ...newProduct,
      createdAt: newProduct.createdAt || new Date().toISOString(),
    };
    const updated = [stampedProduct, ...products.filter((p) => p.id !== stampedProduct.id)];
    this.saveProducts(updated);

    // Automatically assign new product to specified stores (or all active stores by default)
    const stores = this.getStores();
    const targetIds =
      assignToStoreIds && assignToStoreIds.length > 0
        ? assignToStoreIds
        : stores.filter((s) => s.status === 'Active').map((s) => s.id);

    if (targetIds.length > 0) {
      targetIds.forEach((sid) => {
        this.assignProductToStore(sid, stampedProduct, stampedProduct.price, stampedProduct.stock, true);
      });
    }

    return updated;
  }

  static updateProduct(updated: Product): Product[] {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      products[index] = updated;
    } else {
      products.unshift(updated);
    }
    this.saveProducts(products);
    return products;
  }

  static toggleProductStatus(id: string): Product[] {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      const current = products[index].status || 'Active';
      products[index].status = current === 'Active' ? 'Inactive' : 'Active';

      const settings = this.getSettings();
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        SupabaseService.saveProduct(products[index], settings);
      }
      this.saveProducts(products);
    }
    return products;
  }

  static deleteProduct(id: string): Product[] {
    const products = this.getProducts().filter((p) => p.id !== id);
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.deleteProduct(id, settings);
    }
    // Also clean up store assignments for this product
    const sp = this.getStoreProducts().filter((item) => item.productId !== id);
    this.saveStoreProducts(sp);

    this.saveProducts(products);
    return products;
  }

  static resetProducts(): Product[] {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    this.saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }

  // =========================================================
  // STORES MANAGEMENT
  // =========================================================
  static getStores(): Store[] {
    try {
      const stored = localStorage.getItem(STORES_KEY);
      if (stored) {
        let parsed: Store[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof window !== 'undefined' && !localStorage.getItem('ur_logo_seeded_v1')) {
            const defaultLogo = INITIAL_STORES[0]?.logo || '';
            if (defaultLogo) {
              let changed = false;
              parsed = parsed.map((s) => {
                if (s.id === 'ur-flagship-karachi' && !s.logo) {
                  changed = true;
                  return { ...s, logo: defaultLogo };
                }
                return s;
              });
              if (changed) {
                localStorage.setItem(STORES_KEY, JSON.stringify(parsed));
              }
            }
            localStorage.setItem('ur_logo_seeded_v1', 'true');
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stores from local storage:', e);
    }
    localStorage.setItem(STORES_KEY, JSON.stringify(INITIAL_STORES));
    return INITIAL_STORES;
  }

  static async loadStores(): Promise<Store[]> {
    const settings = this.getSettings();

    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      try {
        const result = await SupabaseService.fetchStores(settings);
        if (result.success && result.data && result.data.length > 0) {
          localStorage.setItem(STORES_KEY, JSON.stringify(result.data));
          this.broadcast('ur_stores_updated', result.data);
          return result.data;
        }
      } catch (err) {
        console.warn('Supabase stores load notice:', err);
      }
    }

    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(STORES_KEY, JSON.stringify(data));
          this.broadcast('ur_stores_updated', data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend API stores fetch notice:', err);
    }

    return this.getStores();
  }

  static saveStores(stores: Store[]): void {
    try {
      localStorage.setItem(STORES_KEY, JSON.stringify(stores));
      fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stores),
      }).catch(() => {});
      this.broadcast('ur_stores_updated', stores);
    } catch (e) {
      console.error('Failed to save stores:', e);
    }
  }

  static addStore(newStore: Store): Store[] {
    let stores = this.getStores();
    if (newStore.isDefault) {
      stores = stores.map((s) => ({ ...s, isDefault: false }));
    }
    const updated = [newStore, ...stores.filter((s) => s.id !== newStore.id)];
    this.saveStores(updated);
    return updated;
  }

  static updateStore(updatedStore: Store): Store[] {
    let stores = this.getStores();
    if (updatedStore.isDefault) {
      stores = stores.map((s) => ({ ...s, isDefault: s.id === updatedStore.id }));
    }
    const index = stores.findIndex((s) => s.id === updatedStore.id);
    if (index !== -1) {
      stores[index] = updatedStore;
    } else {
      stores.unshift(updatedStore);
    }
    this.saveStores(stores);
    return stores;
  }

  static toggleStoreStatus(storeId: string): Store[] {
    const stores = this.getStores();
    const index = stores.findIndex((s) => s.id === storeId);
    if (index !== -1) {
      stores[index].status = stores[index].status === 'Active' ? 'Inactive' : 'Active';
      const settings = this.getSettings();
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        SupabaseService.saveStore(stores[index], settings);
      }
      this.saveStores(stores);
    }
    return stores;
  }

  static setDefaultStore(storeId: string): Store[] {
    const stores = this.getStores().map((s) => ({
      ...s,
      isDefault: s.id === storeId,
      // Ensure default store is Active
      status: s.id === storeId ? ('Active' as const) : s.status,
    }));
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      stores.forEach((s) => SupabaseService.saveStore(s, settings));
    }
    this.saveStores(stores);
    return stores;
  }

  static deleteStore(storeId: string): Store[] {
    let stores = this.getStores().filter((s) => s.id !== storeId);
    if (stores.length > 0 && !stores.some((s) => s.isDefault)) {
      stores[0].isDefault = true;
    }
    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.deleteStore(storeId, settings);
    }
    // Remove store product assignments for deleted store
    const sp = this.getStoreProducts().filter((item) => item.storeId !== storeId);
    this.saveStoreProducts(sp);

    this.saveStores(stores);
    return stores;
  }

  // =========================================================
  // STORE PRODUCT & INVENTORY MANAGEMENT
  // =========================================================
  private static mergeStoreProducts(list: StoreProductAssignment[]): StoreProductAssignment[] {
    let updated = [...list];
    let changed = false;

    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('ur_invictus_sp_seeded_v1')) {
        const invictusSp = INITIAL_STORE_PRODUCTS.find(
          (sp) => sp.productId === 'invictus-inspired'
        );
        if (
          invictusSp &&
          !updated.some(
            (sp) => sp.storeId === invictusSp.storeId && sp.productId === invictusSp.productId
          )
        ) {
          updated = [...updated, invictusSp];
          changed = true;
        }
        localStorage.setItem('ur_invictus_sp_seeded_v1', 'true');
      }

      if (!localStorage.getItem(JANAN_SPOT_SP_SEED_FLAG)) {
        const jananSpotSp = INITIAL_STORE_PRODUCTS.find(
          (sp) => sp.productId === 'janan-spot-inspired'
        );
        if (
          jananSpotSp &&
          !updated.some(
            (sp) => sp.storeId === jananSpotSp.storeId && sp.productId === jananSpotSp.productId
          )
        ) {
          updated = [...updated, jananSpotSp];
          changed = true;
        }
        localStorage.setItem(JANAN_SPOT_SP_SEED_FLAG, 'true');
      }

      if (!localStorage.getItem(JANAN_SPORTS_SP_1600_FLAG)) {
        updated = updated.map((sp) =>
          sp.productId === 'janan-spot-inspired' ? { ...sp, storePrice: 1600 } : sp
        );
        changed = true;
        localStorage.setItem(JANAN_SPORTS_SP_1600_FLAG, 'true');
      }

      if (changed) {
        localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(updated));
      }
    }

    return updated;
  }

  static getStoreProducts(): StoreProductAssignment[] {
    try {
      const stored = localStorage.getItem(STORE_PRODUCTS_KEY);
      if (stored) {
        const parsed: StoreProductAssignment[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return this.mergeStoreProducts(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse storeProducts:', e);
    }
    localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(INITIAL_STORE_PRODUCTS));
    return INITIAL_STORE_PRODUCTS;
  }

  static async loadStoreProducts(): Promise<StoreProductAssignment[]> {
    const settings = this.getSettings();

    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      try {
        const result = await SupabaseService.fetchStoreProducts(settings);
        if (result.success && result.data) {
          const merged = this.mergeStoreProducts(result.data);
          localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(merged));
          this.broadcast('ur_store_products_updated', merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase storeProducts load notice:', err);
      }
    }

    try {
      const res = await fetch('/api/store-products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const merged = this.mergeStoreProducts(data);
          localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(merged));
          this.broadcast('ur_store_products_updated', merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Backend API storeProducts fetch notice:', err);
    }

    return this.getStoreProducts();
  }

  static saveStoreProducts(list: StoreProductAssignment[]): void {
    try {
      localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(list));
      fetch('/api/store-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list),
      }).catch(() => {});
      this.broadcast('ur_store_products_updated', list);
    } catch (e) {
      console.error('Failed to save storeProducts:', e);
    }
  }

  static assignProductToStore(
    storeId: string,
    product: Product,
    storePrice?: number,
    stock?: number,
    isAvailable: boolean = true
  ): StoreProductAssignment[] {
    const list = this.getStoreProducts();
    const id = `sp-${storeId}-${product.id}`;
    const existingIdx = list.findIndex((item) => item.storeId === storeId && item.productId === product.id);
    const entry: StoreProductAssignment = {
      id,
      storeId,
      productId: product.id,
      storePrice: storePrice !== undefined ? storePrice : product.price,
      stock: stock !== undefined ? stock : product.stock,
      isAvailable,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      list[existingIdx] = entry;
    } else {
      list.unshift(entry);
    }

    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.saveStoreProduct(entry, settings);
    }

    this.saveStoreProducts(list);
    return list;
  }

  static updateStoreProduct(assignment: StoreProductAssignment): StoreProductAssignment[] {
    const list = this.getStoreProducts();
    const idx = list.findIndex((i) => i.id === assignment.id || (i.storeId === assignment.storeId && i.productId === assignment.productId));
    const updatedItem = { ...assignment, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      list[idx] = updatedItem;
    } else {
      list.unshift(updatedItem);
    }

    const settings = this.getSettings();
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.saveStoreProduct(updatedItem, settings);
    }

    this.saveStoreProducts(list);
    return list;
  }

  static removeProductFromStore(storeId: string, productId: string): StoreProductAssignment[] {
    const list = this.getStoreProducts();
    const target = list.find((i) => i.storeId === storeId && i.productId === productId);
    const filtered = list.filter((i) => !(i.storeId === storeId && i.productId === productId));

    const settings = this.getSettings();
    if (target && settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.deleteStoreProduct(target.id, storeId, productId, settings);
    }

    this.saveStoreProducts(filtered);
    return filtered;
  }

  /**
   * Resolves effective products for a given store on the public storefront:
   * - Filters active products (`status !== 'Inactive'`)
   * - If store has explicit assignments, shows those available products with store-specific price & stock.
   * - If a store is newly created and has 0 assignments yet, fallback shows nothing or wait:
   *   Actually, let's strictly honor assignments for non-default stores if they have assignments,
   *   and for any store with assignments, show only `isAvailable: true` assigned products with overridden price & stock!
   */
  static getStorefrontProducts(
    allProducts: Product[],
    stores: Store[],
    storeProducts: StoreProductAssignment[],
    selectedStoreId?: string | null
  ): Product[] {
    const activeStores = stores.filter((s) => s.status === 'Active');
    const activeProducts = allProducts.filter((p) => (p.status || 'Active') === 'Active');

    if (activeStores.length === 0) {
      return activeProducts;
    }

    // If a specific store is selected
    if (selectedStoreId) {
      const targetStore = activeStores.find((s) => s.id === selectedStoreId);
      if (!targetStore) return activeProducts;

      const storeAssignments = storeProducts.filter((sp) => sp.storeId === selectedStoreId);
      if (storeAssignments.length === 0) {
        // Store has no specific inventory configured yet -> show active products as available or empty?
        // Wait: requirement says "Products assigned to active stores must appear correctly on the public website"
        // and "Show products available at the selected store".
        // Let's check: if a store has assignments, map those available items; if it has zero assignments yet, return [] so admin sees exact assigned inventory!
        // Wait: what if admin adds a store and hasn't assigned any products yet vs expects default store to have products?
        // Our INITIAL_STORE_PRODUCTS assigns all 5 products to the default store, and addProduct auto-assigns to active stores.
        // So any store with assigned products shows exact assigned products!
        return [];
      }

      return activeProducts
        .map((prod) => {
          const assignment = storeAssignments.find((sp) => sp.productId === prod.id);
          if (!assignment || !assignment.isAvailable) return null;
          return {
            ...prod,
            price: assignment.storePrice > 0 ? assignment.storePrice : prod.price,
            stock: assignment.stock,
          };
        })
        .filter((p): p is Product => p !== null);
    }

    // If viewing across all active stores, show active products assigned & available in at least one active store
    // (or unassigned products that were just added to global catalog)
    const activeStoreIds = new Set(activeStores.map((s) => s.id));
    return activeProducts.filter((prod) => {
      const assignmentsForProd = storeProducts.filter(
        (sp) => sp.productId === prod.id && activeStoreIds.has(sp.storeId)
      );
      if (assignmentsForProd.length === 0) return true; // newly added global product
      return assignmentsForProd.some((sp) => sp.isAvailable);
    });
  }

  // =========================================================
  // ORDERS MANAGEMENT
  // =========================================================
  static getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse orders:', e);
    }
    return [];
  }

  static async loadOrders(): Promise<Order[]> {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
          this.broadcast('ur_orders_updated', data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Backend API orders fetch notice:', err);
    }
    return this.getOrders();
  }

  static createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status' | 'whatsappConfirmed'>): Order {
    const orders = this.getOrders();
    const uniqueNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      ...order,
      id: `UR-${uniqueNum}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      whatsappConfirmed: false,
    };
    orders.unshift(newOrder);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(() => {});

      const settings = this.getSettings();
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        SupabaseService.saveOrder(newOrder, settings);
      }

      // Deduct store-specific stock if order has a storeId
      if (newOrder.storeId) {
        const storeProducts = this.getStoreProducts();
        let changed = false;
        const updatedSP = storeProducts.map((sp) => {
          if (sp.storeId === newOrder.storeId) {
            const orderedItem = newOrder.items.find((it) => it.productId === sp.productId);
            if (orderedItem) {
              changed = true;
              return {
                ...sp,
                stock: Math.max(0, sp.stock - orderedItem.quantity),
                updatedAt: new Date().toISOString(),
              };
            }
          }
          return sp;
        });
        if (changed) {
          this.saveStoreProducts(updatedSP);
        }
      }

      this.broadcast('ur_orders_updated', orders);
    } catch (e) {
      console.error('Failed to save new order:', e);
    }
    return newOrder;
  }

  static updateOrderStatus(orderId: string, status: OrderStatus): Order[] {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
      orders[index].status = status;
      try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        fetch(`/api/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }).catch(() => {});

        const settings = this.getSettings();
        if (settings.supabaseUrl && settings.supabaseAnonKey) {
          SupabaseService.updateOrderStatus(orderId, status, settings);
        }
        this.broadcast('ur_orders_updated', orders);
      } catch (e) {
        console.error('Failed to update order status:', e);
      }
    }
    return orders;
  }

  // =========================================================
  // SETTINGS MANAGEMENT
  // =========================================================
  static getSettings(): StoreSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const merged = { ...INITIAL_SETTINGS, ...JSON.parse(stored) };
        if (
          typeof merged.announcementBanner === 'string' &&
          merged.announcementBanner.includes('👑')
        ) {
          merged.announcementBanner = INITIAL_SETTINGS.announcementBanner;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }

  static async loadSettings(): Promise<StoreSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const merged: StoreSettings = { ...INITIAL_SETTINGS, ...data };
          if (
            typeof merged.announcementBanner === 'string' &&
            merged.announcementBanner.includes('👑')
          ) {
            merged.announcementBanner = INITIAL_SETTINGS.announcementBanner;
          }
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
          this.broadcast('ur_settings_updated', merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Backend API settings fetch notice:', err);
    }
    return this.getSettings();
  }

  static async saveSettings(settings: StoreSettings): Promise<boolean> {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      this.broadcast('ur_settings_updated', settings);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  // =========================================================
  // WHATSAPP URL GENERATORS (STORE-AWARE)
  // =========================================================
  static generateProductWhatsAppUrl(
    product: Product,
    quantity: number = 1,
    customerName: string = '',
    address: string = '',
    phone: string = '',
    storeOverride?: Store | null
  ): string {
    const settings = this.getSettings();
    const rawWa = storeOverride?.whatsapp || settings.officialWhatsapp;
    const cleanNum = rawWa.replace(/[^0-9]/g, '');
    const total = product.price * quantity;
    const storeLabel = storeOverride?.name ? ` (${storeOverride.name})` : '';

    let message = `Assalam-o-Alaikum U.R PERFUMES${storeLabel},\n\n`;
    message += `I would like to order:\n`;
    message += `- Product: ${product.name}\n`;
    message += `- Size: ${product.size}\n`;
    message += `- Quantity: ${quantity}\n`;
    message += `- Unit Price: Rs. ${product.price.toLocaleString()}\n`;
    message += `- Subtotal: Rs. ${total.toLocaleString()}\n`;
    message += `- Payment: Cash on Delivery (COD)\n`;

    if (customerName) message += `\nCustomer Name: ${customerName}`;
    if (phone) message += `\nPhone / Contact: ${phone}`;
    if (address) message += `\nDelivery Address: ${address}`;

    message += `\nPlease confirm my order and dispatch details. Thank you!`;

    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`;
  }

  static generateOrderWhatsAppUrl(order: Order, storeOverride?: Store | null): string {
    const settings = this.getSettings();
    const rawWa = storeOverride?.whatsapp || settings.officialWhatsapp;
    const cleanNum = rawWa.replace(/[^0-9]/g, '');

    let msg = `Assalam-o-Alaikum U.R PERFUMES,\n\n`;
    msg += `I have placed an order on your website:\n\n`;
    msg += `Order ID: ${order.id}\n`;
    if (order.storeName) {
      msg += `Branch: ${order.storeName}\n`;
    }
    msg += `Customer: ${order.customer.fullName}\n`;
    msg += `Mobile: ${order.customer.mobileNumber}\n`;
    if (order.customer.whatsappNumber && order.customer.whatsappNumber !== order.customer.mobileNumber) {
      msg += `WhatsApp: ${order.customer.whatsappNumber}\n`;
    }
    msg += `Delivery Address: ${order.customer.address}, ${order.customer.city}\n\n`;
    msg += `Order Items:\n`;
    order.items.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.productName} (${item.size}) x ${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}\n`;
    });
    msg += `\nSubtotal: Rs. ${order.subtotal.toLocaleString()}`;
    msg += `\nDelivery: ${order.deliveryCharges === 0 ? 'Free' : `Rs. ${order.deliveryCharges.toLocaleString()}`}`;
    msg += `\nTotal Payable: Rs. ${order.totalAmount.toLocaleString()} (Cash on Delivery)`;
    if (order.customer.orderNotes) {
      msg += `\nNotes: ${order.customer.orderNotes}`;
    }
    msg += `\n\nPlease confirm dispatch. Thank you!`;

    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
  }
}
