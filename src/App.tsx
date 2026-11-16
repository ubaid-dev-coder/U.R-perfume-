import { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { StoreService } from './services/storeService';
import { Product, StoreSettings, StoreProductAssignment } from './types';
import { Navbar } from './components/Navbar';
import { StoreSelectorSection } from './components/StoreSelectorSection';
import { FeaturedProducts } from './components/FeaturedProducts';
import { CollectionsSection } from './components/CollectionsSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { TestimonialsSection } from './components/TestimonialsSection';
import { NewsletterSection } from './components/NewsletterSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';

const isAdminRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '').toLowerCase();
  return pathname === '/admin' || pathname.endsWith('/admin') || hash === 'admin';
};

function MainStoreContent() {
  const { settings, updateSettings, directBuyNow, stores, activeStores, selectedStore } = useCart();
  const [products, setProducts] = useState<Product[]>(() => StoreService.getProducts());
  const [storeProducts, setStoreProducts] = useState<StoreProductAssignment[]>(() =>
    StoreService.getStoreProducts()
  );
  const [activeSection, setActiveSection] = useState('home');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => isAdminRoute());

  const closeAdmin = () => {
    setIsAdminOpen(false);
    if (isAdminRoute()) {
      window.history.pushState({}, '', '/');
    }
  };

  useEffect(() => {
    const syncAdminFromUrl = () => {
      setIsAdminOpen(isAdminRoute());
    };
    window.addEventListener('popstate', syncAdminFromUrl);
    window.addEventListener('hashchange', syncAdminFromUrl);
    return () => {
      window.removeEventListener('popstate', syncAdminFromUrl);
      window.removeEventListener('hashchange', syncAdminFromUrl);
    };
  }, []);

  // Resolve products available at the selected active boutique (or all active products if no stores active)
  const storefrontProducts = StoreService.getStorefrontProducts(
    products,
    stores,
    storeProducts,
    activeStores.length > 0 ? selectedStore?.id : null
  );

  // Sync scroll positions for navigation links
  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBuyNow = (product: Product) => {
    directBuyNow(product, 1);
    setIsCheckoutOpen(true);
  };

  const handleDirectCheckoutFromModal = (product: Product, quantity: number) => {
    directBuyNow(product, quantity);
    setIsCheckoutOpen(true);
  };

  const handleProductsUpdate = (updated: Product[]) => {
    setProducts(updated);
  };

  const handleSettingsUpdate = (updated: StoreSettings) => {
    updateSettings(updated);
  };

  // Real-time product & store-product synchronization: load on mount & subscribe to updates
  useEffect(() => {
    // 1. Immediately load fresh catalog & store assignments from Supabase / Backend API
    StoreService.loadProducts().then((loaded) => {
      if (loaded && loaded.length > 0) {
        setProducts(loaded);
      }
    });
    StoreService.loadStoreProducts().then((loadedSp) => {
      if (loadedSp) {
        setStoreProducts(loadedSp);
      }
    });

    // 2. Listen to custom events whenever a product or store inventory is updated
    const handleProductsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProducts(customEvent.detail);
      } else {
        StoreService.loadProducts().then((p) => setProducts(p));
      }
    };

    const handleStoreProductsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<StoreProductAssignment[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setStoreProducts(customEvent.detail);
      } else {
        setStoreProducts(StoreService.getStoreProducts());
      }
    };

    window.addEventListener('ur_products_updated', handleProductsUpdated);
    window.addEventListener('ur_store_products_updated', handleStoreProductsUpdated);

    // 3. Re-verify when tab/window gains focus
    const handleFocus = () => {
      StoreService.loadProducts().then((p) => {
        if (p && p.length > 0) setProducts(p);
      });
      StoreService.loadStoreProducts().then((sp) => {
        if (sp) setStoreProducts(sp);
      });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('ur_products_updated', handleProductsUpdated);
      window.removeEventListener('ur_store_products_updated', handleStoreProductsUpdated);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Keep track of scroll to update active nav state
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      const sections = ['contact', 'about', 'collections', 'shop'];
      for (const s of sections) {
        const el = document.getElementById(s);
        if (el && scrollPos >= el.offsetTop) {
          setActiveSection(s);
          return;
        }
      }
      setActiveSection('home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* Top Announcement Bar */}
      {settings.announcementBanner && (
        <div className="bg-[#0a0a0c] border-b border-zinc-800/90 py-2 px-4 text-center text-[11px] sm:text-xs text-zinc-300 font-medium tracking-wide">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span>{settings.announcementBanner}</span>
          </div>
        </div>
      )}

      {/* Sticky Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Multi-Store Boutique Selector (when active stores exist) */}
        <StoreSelectorSection
          products={products}
          storeProducts={storeProducts}
        />

        {/* 2. Featured Inspired Perfumes */}
        <FeaturedProducts
          products={storefrontProducts}
          selectedStore={selectedStore}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onBuyNow={handleBuyNow}
        />

        {/* 3. Curated Collections Anthology */}
        <CollectionsSection
          products={storefrontProducts}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        {/* 4. Why Choose U.R PERFUMES */}
        <WhyChooseUs />

        {/* 5. Customer Testimonials */}
        <TestimonialsSection />

        {/* 6. About U.R PERFUMES */}
        <AboutSection />

        {/* 7. VIP Club Newsletter */}
        <NewsletterSection />

        {/* 8. Contact Concierge */}
        <ContactSection settings={settings} selectedStore={selectedStore} />
      </main>

      {/* Luxury Footer */}
      <Footer
        settings={settings}
        selectedStore={selectedStore}
        onNavigate={handleNavigate}
      />

      {/* Floating WhatsApp Hotline Button */}
      <FloatingWhatsApp settings={settings} selectedStore={selectedStore} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        allProducts={storefrontProducts}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onDirectCheckout={handleDirectCheckoutFromModal}
      />

      {/* Admin Control Panel */}
      {isAdminOpen && (
        <AdminDashboard
          products={products}
          onProductsUpdate={handleProductsUpdate}
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          onClose={closeAdmin}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <MainStoreContent />
    </CartProvider>
  );
}
