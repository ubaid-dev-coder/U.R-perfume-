import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, StoreSettings, Store } from '../types';
import { StoreService } from '../services/storeService';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryCharges: number;
  totalAmount: number;
  totalItemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  settings: StoreSettings;
  updateSettings: (newSettings: StoreSettings) => void;
  directBuyNow: (product: Product, quantity?: number) => void;
  directCheckoutItem: CartItem | null;
  setDirectCheckoutItem: (item: CartItem | null) => void;
  // Multi-store selection state
  stores: Store[];
  activeStores: Store[];
  selectedStore: Store | null;
  selectStore: (storeId: string) => void;
  refreshStores: (updatedStores?: Store[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ur_perfumes_cart_v1';
const SELECTED_STORE_KEY = 'ur_perfumes_selected_store_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse cart storage:', e);
    }
    return [];
  });

  const [settings, setSettings] = useState<StoreSettings>(() => StoreService.getSettings());
  const [stores, setStores] = useState<Store[]>(() => StoreService.getStores());
  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => {
    const saved = localStorage.getItem(SELECTED_STORE_KEY);
    if (saved) return saved;
    const allStores = StoreService.getStores();
    const def = allStores.find((s) => s.isDefault && s.status === 'Active') || allStores.find((s) => s.status === 'Active');
    return def?.id || '';
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);

  const activeStores = stores.filter((s) => s.status === 'Active');

  const selectedStore =
    activeStores.find((s) => s.id === selectedStoreId) ||
    activeStores.find((s) => s.isDefault) ||
    activeStores[0] ||
    null;

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to store cart items:', e);
    }
  }, [items]);

  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem(SELECTED_STORE_KEY, selectedStore.id);
    }
  }, [selectedStore]);

  // Listen for real-time store and settings updates across the app
  useEffect(() => {
    StoreService.loadStores().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setStores(loaded);
      }
    });

    StoreService.loadSettings().then((loadedSettings) => {
      if (loadedSettings) {
        setSettings(loadedSettings);
      }
    });

    const handleStoresUpdated = (e: Event) => {
      const custom = e as CustomEvent<Store[]>;
      if (custom.detail && Array.isArray(custom.detail)) {
        setStores(custom.detail);
      } else {
        setStores(StoreService.getStores());
      }
    };

    const handleSettingsUpdated = (e: Event) => {
      const custom = e as CustomEvent<StoreSettings>;
      if (custom.detail) {
        setSettings(custom.detail);
      } else {
        setSettings(StoreService.getSettings());
      }
    };

    window.addEventListener('ur_stores_updated', handleStoresUpdated);
    window.addEventListener('ur_settings_updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('ur_stores_updated', handleStoresUpdated);
      window.removeEventListener('ur_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const selectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    localStorage.setItem(SELECTED_STORE_KEY, storeId);
  };

  const refreshStores = (updatedStores?: Store[]) => {
    if (updatedStores) {
      setStores(updatedStores);
    } else {
      setStores(StoreService.getStores());
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: item.quantity + quantity,
                storeId: selectedStore?.id,
                storeName: selectedStore?.name,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity,
          storeId: selectedStore?.id,
          storeName: selectedStore?.name,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const directBuyNow = (product: Product, quantity = 1) => {
    setDirectCheckoutItem({
      product,
      quantity,
      storeId: selectedStore?.id,
      storeName: selectedStore?.name,
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setDirectCheckoutItem(null);
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    StoreService.saveSettings(newSettings);
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const deliveryCharges =
    subtotal === 0 || subtotal >= settings.freeDeliveryThreshold
      ? 0
      : settings.deliveryCharge;

  const totalAmount = subtotal + deliveryCharges;

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryCharges,
        totalAmount,
        totalItemCount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        settings,
        updateSettings,
        directBuyNow,
        directCheckoutItem,
        setDirectCheckoutItem,
        stores,
        activeStores,
        selectedStore,
        selectStore,
        refreshStores,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
