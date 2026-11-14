import React, { useState, useRef, useEffect } from 'react';
import {
  Product,
  Order,
  StoreSettings,
  OrderStatus,
  Store,
  StoreProductAssignment,
} from '../types';
import { StoreService } from '../services/storeService';
import { SupabaseService, SUPABASE_SCHEMA_SQL } from '../services/supabaseService';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { ProductCard } from './ProductCard';
import { StoreManagementTab } from './StoreManagementTab';
import { WhatsAppIcon } from './WhatsAppIcon';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import {
  Package,
  ShoppingBag,
  Sliders,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Edit2,
  Upload,
  LogOut,
  X,
  Save,
  RotateCcw,
  ExternalLink,
  Filter,
  Search,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Database,
  Image as ImageIcon,
  AlertTriangle,
  Store as StoreIcon,
  Copy,
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  onProductsUpdate: (products: Product[]) => void;
  settings: StoreSettings;
  onSettingsUpdate: (settings: StoreSettings) => void;
  onClose: () => void;
}

// Client-side image compression helper so photos render quickly & never crash local storage
function compressImageFile(file: File, maxWidth = 1000, maxHeight = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const mime = file.type === 'image/png' && file.size < 800000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const CATEGORY_OPTIONS = [
  'Floral & Gardenia',
  'Gourmand & Vanilla',
  'Fresh & Citrus Amber',
  'Imperial Agarwood & Oud',
  'Spicy & Woody Citrus',
  'Oriental & Warm Amber',
  'Musk & Cashmere',
  'Aromatic Fougere',
  'Royal Leather',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onProductsUpdate,
  settings,
  onSettingsUpdate,
  onClose,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ur_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState<'products' | 'stores' | 'orders' | 'overview' | 'settings'>('products');
  const [orders, setOrders] = useState<Order[]>(() => StoreService.getOrders());
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderStoreFilter, setOrderStoreFilter] = useState<string>('All');

  const [stores, setStores] = useState<Store[]>(() => StoreService.getStores());
  const [storeProducts, setStoreProducts] = useState<StoreProductAssignment[]>(() =>
    StoreService.getStoreProducts()
  );

  // Search & Filter in Products View
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStatusFilter, setProductStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string } | null>(null);

  const showNotification = (title: string, description: string) => {
    setToastMessage({ title, description });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync stores, storeProducts, orders & settings on mount and real-time broadcasts
  useEffect(() => {
    StoreService.loadStores().then((s) => s && setStores(s));
    StoreService.loadStoreProducts().then((sp) => sp && setStoreProducts(sp));
    StoreService.loadOrders().then((o) => o && setOrders(o));
    StoreService.loadSettings().then((s) => {
      if (s) setSettingsForm({ ...s });
    });

    const onStoresUpdate = (e: Event) => {
      const custom = e as CustomEvent<Store[]>;
      setStores(Array.isArray(custom.detail) ? custom.detail : StoreService.getStores());
    };
    const onStoreProductsUpdate = (e: Event) => {
      const custom = e as CustomEvent<StoreProductAssignment[]>;
      setStoreProducts(Array.isArray(custom.detail) ? custom.detail : StoreService.getStoreProducts());
    };
    const onOrdersUpdate = (e: Event) => {
      const custom = e as CustomEvent<Order[]>;
      setOrders(Array.isArray(custom.detail) ? custom.detail : StoreService.getOrders());
    };

    window.addEventListener('ur_stores_updated', onStoresUpdate);
    window.addEventListener('ur_store_products_updated', onStoreProductsUpdate);
    window.addEventListener('ur_orders_updated', onOrdersUpdate);

    return () => {
      window.removeEventListener('ur_stores_updated', onStoresUpdate);
      window.removeEventListener('ur_store_products_updated', onStoreProductsUpdate);
      window.removeEventListener('ur_orders_updated', onOrdersUpdate);
    };
  }, []);

  // Add / Edit Product Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formActiveSubtab, setFormActiveSubtab] = useState<'details' | 'preview'>('details');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [selectedRawImageFile, setSelectedRawImageFile] = useState<File | null>(null);
  const [selectedStoreIdsForProduct, setSelectedStoreIdsForProduct] = useState<string[]>([]);

  // Form Validation Errors State
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form Field State
  const defaultProductData: Partial<Product> = {
    id: '',
    name: '',
    brand: 'U.R PERFUMES',
    tagline: 'Extrait de Parfum, Inspired by Classics',
    inspiredBy: '',
    size: '30ml',
    concentration: 'Extrait de Parfum (14+ Hour Longevity)',
    price: 1800,
    originalPrice: 2400,
    stock: 50,
    image: '',
    description: '',
    category: 'Floral & Gardenia',
    status: 'Active',
    isFeatured: true,
    isBestSeller: false,
    gender: 'Unisex',
    longevity: '12–16 Hours',
    sillage: 'Moderate to Strong',
    bestSeason: 'All Seasons & Evening Wear',
    topNotes: ['Bergamot', 'Pink Pepper'],
    heartNotes: ['White Floral', 'Damask Rose'],
    baseNotes: ['Amber', 'Musk', 'Cedarwood'],
    rating: 5.0,
    reviewCount: 1,
    flaconDetails: {
      liquidGradient: 'from-amber-200/90 via-amber-400/85 to-amber-700/90',
      capColor: 'from-[#fceda2] via-[#d4af37] to-[#aa820a]',
      labelBadge: 'SIGNATURE COLLECTION',
      accentGlow: 'rgba(212,175,55,0.4)',
    },
  };

  const [formData, setFormData] = useState<Partial<Product>>(defaultProductData);
  const [topNotesInput, setTopNotesInput] = useState('');
  const [heartNotesInput, setHeartNotesInput] = useState('');
  const [baseNotesInput, setBaseNotesInput] = useState('');

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Admin Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    setSettingsForm({ ...settings });
  }, [settings]);

  // File input ref for image upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Open Add Product Modal (optionally pre-targeting a store from Store Management)
  const handleOpenAddModal = (targetStoreId?: string) => {
    setModalMode('add');
    const freshData = {
      ...defaultProductData,
      id: `ur-perfume-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFormData(freshData);
    setTopNotesInput(freshData.topNotes?.join(', ') || 'Citrus, Bergamot');
    setHeartNotesInput(freshData.heartNotes?.join(', ') || 'Jasmine, Cardamom');
    setBaseNotesInput(freshData.baseNotes?.join(', ') || 'Amber, Sandalwood');
    setSelectedRawImageFile(null);
    setFormErrors({});
    setFormActiveSubtab('details');
    if (targetStoreId) {
      setSelectedStoreIdsForProduct([targetStoreId]);
    } else {
      setSelectedStoreIdsForProduct(
        stores.filter((s) => s.status === 'Active').map((s) => s.id)
      );
    }
    setIsFormModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product: Product) => {
    setModalMode('edit');
    setFormData({ ...product });
    setTopNotesInput(product.topNotes?.join(', ') || '');
    setHeartNotesInput(product.heartNotes?.join(', ') || '');
    setBaseNotesInput(product.baseNotes?.join(', ') || '');
    setSelectedRawImageFile(null);
    setFormErrors({});
    setFormActiveSubtab('details');
    const assignedStoreIds = storeProducts
      .filter((sp) => sp.productId === product.id && sp.isAvailable)
      .map((sp) => sp.storeId);
    setSelectedStoreIdsForProduct(assignedStoreIds);
    setIsFormModalOpen(true);
  };

  // Image Upload Handler
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      setSelectedRawImageFile(file);

      // Local compressed base64 for instant preview & offline fallback
      const compressedDataUrl = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, image: compressedDataUrl }));

      // Clear image error if any
      setFormErrors((prev) => ({ ...prev, image: '' }));

      // If Supabase credentials are configured, upload to Supabase Storage 'perfumes' bucket
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        const uploadRes = await SupabaseService.uploadImage(file, file.name, settings, 'perfumes');
        if (uploadRes.success && uploadRes.data) {
          setFormData((prev) => ({ ...prev, image: uploadRes.data }));
          showNotification('Image Uploaded to Supabase Storage', 'Permanently stored in Supabase bucket.');
        } else if (uploadRes.error) {
          showNotification('Supabase Storage Warning', `${uploadRes.error} Local compressed image kept as fallback.`);
        }
      } else {
        showNotification('Photograph Attached', 'Bottle image successfully processed and ready to save.');
      }
    } catch (err) {
      console.error(err);
      showNotification('Image Error', 'Error processing image. Please try another JPG, PNG or WEBP file.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name?.trim()) {
      errors.name = 'Product Name is required.';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errors.price = 'Product Price (PKR) must be greater than 0.';
    }
    if (formData.stock === undefined || Number(formData.stock) < 0) {
      errors.stock = 'Stock Quantity cannot be negative.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Product (SAVE PRODUCT button)
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      setFormActiveSubtab('details');
      showNotification('Validation Error', 'Please complete the required fields highlighted in red.');
      return;
    }

    setIsSavingProduct(true);
    try {
      const parseNotes = (input: string) =>
        input
          .split(',')
          .map((n) => n.trim())
          .filter((n) => n.length > 0);

      const priceNum = Number(formData.price);
      const origPriceNum = formData.originalPrice ? Number(formData.originalPrice) : priceNum + 500;
      const stockNum = formData.stock !== undefined ? Number(formData.stock) : 50;

      let finalImageUrl = formData.image || '';

      // If a raw image file was selected and Supabase is configured, ensure Storage upload succeeded
      if (
        selectedRawImageFile &&
        settings.supabaseUrl &&
        settings.supabaseAnonKey &&
        finalImageUrl.startsWith('data:')
      ) {
        const storageRes = await SupabaseService.uploadImage(
          selectedRawImageFile,
          selectedRawImageFile.name,
          settings,
          'perfumes'
        );
        if (storageRes.success && storageRes.data) {
          finalImageUrl = storageRes.data;
        } else if (storageRes.error) {
          showNotification('Supabase Storage Notice', `${storageRes.error} Using compressed image.`);
        }
      }

      const finalProduct: Product = {
        id: formData.id || `ur-custom-${Date.now()}`,
        name: formData.name!.trim(),
        brand: 'U.R PERFUMES',
        tagline: formData.tagline || 'Extrait de Parfum Formulation',
        inspiredBy: formData.inspiredBy?.trim() || 'Fine Perfumery',
        size: formData.size || '30ml',
        concentration: formData.concentration || 'Extrait de Parfum',
        price: priceNum,
        originalPrice: origPriceNum,
        stock: stockNum,
        image: finalImageUrl,
        description:
          formData.description?.trim() ||
          'Formulated with high aromatic oil concentration for steady projection and lasting wear by U.R PERFUMES.',
        category: formData.category || 'Floral & Gardenia',
        status: formData.status || 'Active',
        isFeatured: formData.isFeatured !== undefined ? formData.isFeatured : true,
        isBestSeller: Boolean(formData.isBestSeller),
        gender: (formData.gender as any) || 'Unisex',
        longevity: formData.longevity || '12–16 Hours',
        sillage: formData.sillage || 'Moderate to Strong',
        bestSeason: formData.bestSeason || 'All Seasons',
        topNotes: parseNotes(topNotesInput).length > 0 ? parseNotes(topNotesInput) : ['Bergamot', 'Spices'],
        heartNotes: parseNotes(heartNotesInput).length > 0 ? parseNotes(heartNotesInput) : ['Floral Bouquet'],
        baseNotes: parseNotes(baseNotesInput).length > 0 ? parseNotes(baseNotesInput) : ['Amber', 'Musk'],
        rating: formData.rating || 5.0,
        reviewCount: formData.reviewCount || 1,
        createdAt: formData.createdAt || new Date().toISOString(),
        flaconDetails: formData.flaconDetails || {
          liquidGradient: 'from-amber-200/90 via-amber-400/85 to-amber-700/90',
          capColor: 'from-[#fceda2] via-[#d4af37] to-[#aa820a]',
          labelBadge: 'SIGNATURE COLLECTION',
          accentGlow: 'rgba(212,175,55,0.4)',
        },
      };

      // Save to Supabase Database (if configured) and verify response
      let supabaseError: string | undefined;
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        const dbRes = await SupabaseService.saveProduct(finalProduct, settings);
        if (!dbRes.success) {
          supabaseError = dbRes.error || 'Failed to save product to Supabase.';
        }
      }

      let updatedList: Product[];
      if (modalMode === 'add') {
        updatedList = StoreService.addProduct(
          finalProduct,
          selectedStoreIdsForProduct.length > 0 ? selectedStoreIdsForProduct : undefined
        );
        if (supabaseError) {
          showNotification(
            'Saved Locally · Supabase Sync Warning',
            `"${finalProduct.name}" is live locally, but Supabase reported: ${supabaseError}`
          );
        } else {
          showNotification(
            'Success! Product Published',
            `"${finalProduct.name}" has been saved and is now live on the U.R PERFUMES website!`
          );
        }
      } else {
        updatedList = StoreService.updateProduct(finalProduct);
        // Ensure selected stores have assignment updated
        stores.forEach((st) => {
          const isChecked = selectedStoreIdsForProduct.includes(st.id);
          const existing = storeProducts.find(
            (sp) => sp.storeId === st.id && sp.productId === finalProduct.id
          );
          if (isChecked && !existing) {
            StoreService.assignProductToStore(st.id, finalProduct, finalProduct.price, finalProduct.stock, true);
          } else if (!isChecked && existing && existing.isAvailable) {
            StoreService.updateStoreProduct({ ...existing, isAvailable: false });
          } else if (isChecked && existing && !existing.isAvailable) {
            StoreService.updateStoreProduct({ ...existing, isAvailable: true });
          }
        });
        if (supabaseError) {
          showNotification(
            'Updated Locally · Supabase Sync Warning',
            `Changes saved locally, but Supabase reported: ${supabaseError}`
          );
        } else {
          showNotification(
            'Success! Product Updated',
            `Changes to "${finalProduct.name}" have been saved permanently.`
          );
        }
      }

      setStoreProducts(StoreService.getStoreProducts());
      onProductsUpdate(updatedList);
      setIsFormModalOpen(false);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Quick 1-click status toggle
  const handleToggleStatus = (product: Product) => {
    const updated = StoreService.toggleProductStatus(product.id);
    onProductsUpdate(updated);
    const newStatus = product.status === 'Active' ? 'Inactive' : 'Active';
    showNotification(
      'Status Changed',
      `"${product.name}" is now ${newStatus} (${newStatus === 'Active' ? 'live on shop' : 'hidden from customers'}).`
    );
  };

  // Quick inline stock update
  const handleInlineStockChange = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    const updatedProduct = { ...product, stock: newStock };
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      SupabaseService.saveProduct(updatedProduct, settings);
    }
    const updated = StoreService.updateProduct(updatedProduct);
    onProductsUpdate(updated);
  };

  // Delete Handlers
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    if (settings.supabaseUrl && settings.supabaseAnonKey) {
      const delRes = await SupabaseService.deleteProduct(productToDelete.id, settings);
      if (!delRes.success && delRes.error) {
        showNotification('Supabase Delete Warning', delRes.error);
      }
    }
    const updated = StoreService.deleteProduct(productToDelete.id);
    setStoreProducts(StoreService.getStoreProducts());
    onProductsUpdate(updated);
    showNotification('Product Deleted', `"${productToDelete.name}" was permanently removed.`);
    setProductToDelete(null);
  };

  // Reset catalog
  const handleResetCatalog = () => {
    if (confirm('Reset catalog back to the original 5 U.R PERFUMES inspired fragrances?')) {
      const reset = StoreService.resetProducts();
      onProductsUpdate(reset);
      showNotification('Catalog Restored', 'Re-initialized to the original 5 signature fragrances.');
    }
  };

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const activePassword = settings.adminPassword || StoreService.getSettings().adminPassword;
    if (passwordInput.trim() === activePassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('ur_admin_auth', 'true');
      setPasswordInput('');
      setAuthError('');
    } else {
      setAuthError('Incorrect administrator password.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('ur_admin_auth');
  };

  // Order status
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const updated = StoreService.updateOrderStatus(orderId, newStatus);
    setOrders(updated);
    showNotification('Order Status Updated', `Order ${orderId} marked as ${newStatus}.`);
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: StoreSettings = {
      ...settingsForm,
      adminPassword: settings.adminPassword || settingsForm.adminPassword,
    };
    onSettingsUpdate(updatedSettings);
    await StoreService.saveSettings(updatedSettings);
    setSettingsSavedNotice(true);
    setTimeout(() => setSettingsSavedNotice(false), 3000);
    showNotification('Settings Saved', 'Store delivery settings, WhatsApp number, and Supabase config updated.');
  };

  // Change Admin Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const activePassword = settings.adminPassword || StoreService.getSettings().adminPassword;
    const currentTrimmed = currentPasswordInput.trim();
    const newTrimmed = newPasswordInput.trim();
    const confirmTrimmed = confirmPasswordInput.trim();

    if (!currentTrimmed) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (currentTrimmed !== activePassword) {
      setPasswordError('Current password is incorrect.');
      return;
    }
    if (newTrimmed.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newTrimmed !== confirmTrimmed) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newTrimmed === activePassword) {
      setPasswordError('New password must be different from your current password.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const updatedSettings: StoreSettings = {
        ...settings,
        ...settingsForm,
        adminPassword: newTrimmed,
      };
      setSettingsForm(updatedSettings);
      onSettingsUpdate(updatedSettings);
      await StoreService.saveSettings(updatedSettings);

      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setPasswordSuccess('Admin password updated successfully. Your new password is active immediately.');
      showNotification('Password Updated', 'Administrator password has been changed.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Test Supabase connection
  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseStatusMsg(null);
    const result = await SupabaseService.testConnection(settingsForm);
    setSupabaseTesting(false);
    setSupabaseStatusMsg(result.message);
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      productSearch.trim() === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.inspiredBy.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory =
      productCategoryFilter === 'All' || p.category === productCategoryFilter;

    const currentStatus = p.status || 'Active';
    const matchesStatus =
      productStatusFilter === 'All' || currentStatus === productStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeProductsCount = products.filter((p) => (p.status || 'Active') === 'Active').length;
  const inactiveProductsCount = products.length - activeProductsCount;

  // KPI
  const totalSales = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;

  // Preview product representation
  const previewProduct: Product = {
    id: formData.id || 'preview-id',
    name: formData.name || 'Your Fragrance Name',
    brand: 'U.R PERFUMES',
    tagline: formData.tagline || 'Exquisite Formulation',
    inspiredBy: formData.inspiredBy || 'Iconic Scent',
    size: formData.size || '30ml',
    concentration: formData.concentration || 'Extrait de Parfum',
    price: Number(formData.price) || 1800,
    originalPrice: Number(formData.originalPrice) || 2400,
    stock: Number(formData.stock) || 50,
    image: formData.image || '',
    description: formData.description || 'Fragrance description will appear here.',
    category: formData.category || 'Floral & Gardenia',
    status: formData.status || 'Active',
    isFeatured: formData.isFeatured !== undefined ? formData.isFeatured : true,
    isBestSeller: Boolean(formData.isBestSeller),
    gender: (formData.gender as any) || 'Unisex',
    longevity: formData.longevity || '12 – 16 Hours',
    sillage: formData.sillage || 'Heavy',
    bestSeason: formData.bestSeason || 'All-Year',
    topNotes: topNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
    heartNotes: heartNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
    baseNotes: baseNotesInput.split(',').map((s) => s.trim()).filter(Boolean),
    rating: 5.0,
    reviewCount: 1,
    flaconDetails: formData.flaconDetails || {
      liquidGradient: 'from-amber-200/90 via-amber-400/85 to-amber-700/90',
      capColor: 'from-[#fceda2] via-[#d4af37] to-[#aa820a]',
      labelBadge: 'ROYAL COLLECTION',
      accentGlow: 'rgba(212,175,55,0.4)',
    },
  };

  // Unauthenticated Login Screen
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 text-white shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            aria-label="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center space-y-3 mb-7">
            <RoyalCrownLogo size="md" iconOnly />
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#d4af37] font-medium">
                U.R Perfumes
              </p>
              <h2 className="font-cinzel text-xl font-semibold tracking-wide text-white mt-1">
                Admin Sign In
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Sign in to manage catalog products, branches, and customer orders.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-[0.14em] rounded-lg active:scale-[0.99] transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#09090b] flex flex-col text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 right-4 sm:right-6 z-[70] max-w-md p-4 rounded-xl bg-zinc-950 border border-zinc-700 text-white shadow-2xl flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white">
              {toastMessage.title}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              {toastMessage.description}
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-15 px-4 sm:px-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <RoyalCrownLogo size="sm" iconOnly />
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="font-cinzel font-semibold text-white tracking-wide whitespace-nowrap">
              U.R PERFUMES
            </span>
            <span className="text-zinc-600 hidden sm:inline">/</span>
            <span className="text-zinc-400 text-xs hidden sm:inline whitespace-nowrap">
              Admin Console
            </span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleOpenAddModal()}
            className="px-3.5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-zinc-950 border-b md:border-b-0 md:border-r border-zinc-800 p-3 sm:p-4 shrink-0 flex flex-col justify-between gap-4 overflow-y-auto">
          <div className="space-y-3 w-full">
            <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <div className="w-full">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'products'
                      ? 'bg-zinc-900 text-[#d4af37] border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>Products Management</span>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                    {products.length}
                  </span>
                </button>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="w-full py-2 px-3 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                    title="Add a new fragrance to the catalog"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ ADD NEW PRODUCT</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('stores')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'stores'
                    ? 'bg-zinc-900 text-[#d4af37] border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <StoreIcon className="w-4 h-4 shrink-0" />
                  <span>Store Management</span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                  {stores.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-zinc-900 text-[#d4af37] border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Orders</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className="text-[11px] font-mono tabular-nums text-amber-400 font-semibold">
                    {pendingOrdersCount} pending
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-zinc-900 text-[#d4af37] border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Store Analytics</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-zinc-900 text-[#d4af37] border border-zinc-700'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Settings & Security</span>
              </button>
            </nav>
          </div>

          {/* Catalog Summary footer in sidebar */}
          <div className="hidden md:block pt-4 border-t border-zinc-800/80 text-xs space-y-2">
            <div className="text-[11px] font-medium text-zinc-400">
              Catalog Summary
            </div>
            <div className="text-[11px] text-zinc-400 space-y-1.5">
              <div className="flex justify-between">
                <span>Active</span>
                <span className="text-emerald-400 font-mono tabular-nums font-semibold">{activeProductsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Hidden</span>
                <span className="text-zinc-400 font-mono tabular-nums">{inactiveProductsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Fragrances</span>
                <span className="text-white font-mono tabular-nums font-semibold">{products.length}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#09090b]">
          {/* TAB 1: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Header Box with Search, Filters and + ADD NEW PRODUCT button */}
              <div className="p-5 sm:p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-cinzel text-xl font-semibold text-white">
                      Products Management
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Add fragrances, upload bottle photography, adjust PKR pricing, and manage inventory.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={handleResetCatalog}
                      className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      title="Restore default catalog"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset Catalog</span>
                    </button>

                    <button
                      onClick={() => handleOpenAddModal()}
                      className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ ADD NEW PRODUCT</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-zinc-800/80">
                  <div className="sm:col-span-6 relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search perfumes by name or inspired scent..."
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-10 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={productCategoryFilter}
                      onChange={(e) => setProductCategoryFilter(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                    >
                      <option value="All">All Categories ({products.length})</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={productStatusFilter}
                      onChange={(e) => setProductStatusFilter(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
                    >
                      <option value="All">All Statuses ({products.length})</option>
                      <option value="Active">Active ({activeProductsCount})</option>
                      <option value="Inactive">Hidden ({inactiveProductsCount})</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                  <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel text-base font-semibold text-white">No products found</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      No perfumes match your current search or filter criteria.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal()}
                    className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider"
                  >
                    + ADD NEW PRODUCT
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map((p) => {
                    const isActive = (p.status || 'Active') === 'Active';

                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl bg-zinc-950 border transition-colors flex flex-col justify-between overflow-hidden ${
                          isActive
                            ? 'border-zinc-800 hover:border-zinc-600'
                            : 'border-zinc-800/50 opacity-75'
                        }`}
                      >
                        {/* Status & Specs Header */}
                        <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                              isActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                            }`}
                            title="Click to toggle Active / Hidden"
                          >
                            {isActive ? 'Active' : 'Hidden'}
                          </button>

                          <div className="text-[11px] text-zinc-400 font-mono tabular-nums flex items-center gap-2">
                            <span className="text-[#d4af37]">{p.size}</span>
                            <span>·</span>
                            <span>Stock {p.stock}</span>
                          </div>
                        </div>

                        {/* Flacon Visual */}
                        <div className="p-4 bg-black/50 flex items-center justify-center">
                          <PerfumeBottleVisual
                            product={p}
                            size="md"
                            className="w-full !h-52"
                            interactive={false}
                          />
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between border-t border-zinc-900">
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                              <span>{p.category || 'Fine Fragrance'}</span>
                              {p.isBestSeller && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#d4af37]">Best Seller</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{p.image ? 'Photo set' : 'Generated flacon'}</span>
                            </div>

                            <h3 className="font-cinzel text-base font-semibold text-white line-clamp-1">
                              {p.name}
                            </h3>

                            <div className="text-xs text-[#d4af37] font-serif-luxury italic">
                              Inspired by {p.inspiredBy}
                            </div>

                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
                              {p.description}
                            </p>
                          </div>

                          {/* Quick inline price & stock controls */}
                          <div className="pt-3 border-t border-zinc-900 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-400 text-[11px]">Price:</span>
                                <span className="font-mono font-semibold text-[#d4af37] text-sm tabular-nums">
                                  Rs. {p.price.toLocaleString()}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 text-[11px]">Stock:</span>
                                <div className="flex items-center border border-zinc-800 rounded-md bg-zinc-900">
                                  <button
                                    onClick={() => handleInlineStockChange(p, -5)}
                                    className="px-2 py-0.5 text-zinc-400 hover:text-white transition-colors"
                                    title="Decrease stock by 5"
                                  >
                                    -5
                                  </button>
                                  <span className="px-2 text-[11px] font-mono tabular-nums font-semibold text-white">
                                    {p.stock}
                                  </span>
                                  <button
                                    onClick={() => handleInlineStockChange(p, 5)}
                                    className="px-2 py-0.5 text-zinc-400 hover:text-white transition-colors"
                                    title="Increase stock by 5"
                                  >
                                    +5
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Edit & Delete */}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-xs text-zinc-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                                title="Delete perfume"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 1B: STORE MANAGEMENT */}
          {activeTab === 'stores' && (
            <StoreManagementTab
              stores={stores}
              onStoresUpdate={setStores}
              products={products}
              onProductsUpdate={onProductsUpdate}
              storeProducts={storeProducts}
              onStoreProductsUpdate={setStoreProducts}
              orders={orders}
              onOrderStatusUpdate={handleUpdateOrderStatus}
              settings={settings}
              onOpenAddNewProductModal={(targetStoreId) => handleOpenAddModal(targetStoreId)}
              showNotification={showNotification}
            />
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (() => {
            const filteredOrders = orders.filter((o) => {
              const matchStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
              const matchStore = orderStoreFilter === 'All' || o.storeId === orderStoreFilter;
              return matchStatus && matchStore;
            });
            const filteredSalesTotal = filteredOrders
              .filter((o) => o.status !== 'Cancelled')
              .reduce((sum, o) => sum + o.totalAmount, 0);

            return (
              <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <h2 className="font-cinzel text-xl font-semibold text-white">
                      Orders ({filteredOrders.length})
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Review shipping details, filter by branch, and update dispatch status.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono tabular-nums">
                      Total Sales: <strong className="text-[#d4af37]">Rs. {filteredSalesTotal.toLocaleString()}</strong>
                    </div>

                    <select
                      value={orderStoreFilter}
                      onChange={(e) => setOrderStoreFilter(e.target.value)}
                      className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="All">All Stores ({orders.length})</option>
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({orders.filter((o) => o.storeId === s.id).length})
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5">
                      <Filter className="w-4 h-4 text-zinc-400" />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Order Cards */}
                {filteredOrders.length === 0 ? (
                  <div className="p-12 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
                    <ShoppingBag className="w-7 h-7 text-zinc-600 mx-auto" />
                    <div className="font-cinzel text-sm font-semibold text-white">No Orders Found</div>
                    <p className="text-xs text-zinc-500">
                      No orders match your selected store or status filters yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span className="font-mono text-sm font-semibold text-[#d4af37] tabular-nums">
                              {order.id}
                            </span>
                            <span>·</span>
                            <span className="font-mono tabular-nums">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                            {order.storeName && (
                              <>
                                <span>·</span>
                                <span className="text-zinc-200">{order.storeName}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="text-zinc-300">{order.paymentMethod}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none ${
                                order.status === 'Pending'
                                  ? 'bg-amber-950/40 text-amber-400 border-amber-600/40'
                                  : order.status === 'Delivered'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-600/40'
                                  : order.status === 'Dispatched' || order.status === 'Shipped'
                                  ? 'bg-sky-950/40 text-sky-400 border-sky-600/40'
                                  : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2">
                            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                              Customer Details
                            </div>
                            <div>
                              <strong className="text-white text-sm">{order.customer.fullName}</strong>
                            </div>
                            <div className="font-mono text-zinc-300 tabular-nums">
                              Mobile: {order.customer.mobileNumber}
                            </div>
                            {order.customer.whatsappNumber && (
                              <div className="font-mono text-zinc-300 tabular-nums">
                                WhatsApp: {order.customer.whatsappNumber}
                              </div>
                            )}
                            <div className="pt-2">
                              <a
                                href={`https://wa.me/${order.customer.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                  `Assalam-o-Alaikum ${order.customer.fullName}! Thank you for shopping with U.R PERFUMES${order.storeName ? ` (${order.storeName})` : ''}.\n\nYour Order ID: ${order.id}\nTotal Amount: Rs. ${order.totalAmount.toLocaleString()} (Cash on Delivery).\nWe are preparing dispatch to ${order.customer.city}!`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>Message on WhatsApp</span>
                              </a>
                            </div>
                          </div>

                          <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2">
                            <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                              Shipping Address
                            </div>
                            <div>
                              <span className="text-zinc-400">City:</span>{' '}
                              <strong className="text-white">{order.customer.city}</strong>
                            </div>
                            <div>
                              <span className="text-zinc-400">Address:</span>{' '}
                              <span className="text-zinc-200">{order.customer.address}</span>
                            </div>
                            {order.customer.orderNotes && (
                              <div className="text-amber-300/90 italic pt-1">
                                Note: &ldquo;{order.customer.orderNotes}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div className="space-y-1">
                            {order.items.map((it, idx) => (
                              <div key={idx} className="text-zinc-300">
                                <strong className="text-white">{it.productName}</strong> ({it.size}) ×{' '}
                                <span className="font-mono tabular-nums">{it.quantity}</span> —{' '}
                                <span className="font-mono tabular-nums text-[#d4af37]">
                                  Rs. {(it.price * it.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <div className="text-zinc-400 text-[11px]">
                              Delivery: {order.deliveryCharges === 0 ? 'Free' : `Rs. ${order.deliveryCharges}`}
                            </div>
                            <div className="text-base font-semibold text-[#d4af37]">
                              Rs. {order.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 3: STORE ANALYTICS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div>
                <h2 className="font-cinzel text-xl font-semibold text-white">Store Analytics</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sales totals, order volume, and inventory across active branches.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Sales</span>
                    <DollarSign className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#d4af37] tabular-nums">
                    Rs. {totalSales.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Active &amp; completed orders
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Total Orders</span>
                    <ShoppingBag className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-mono font-semibold text-white tabular-nums">
                    {orders.length}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    All recorded orders
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Pending Dispatch</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-mono font-semibold text-amber-400 tabular-nums">
                    {pendingOrdersCount}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Awaiting confirmation
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Active Branches</span>
                    <StoreIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-mono font-semibold text-emerald-400 tabular-nums">
                    {stores.filter((s) => s.status === 'Active').length} / {stores.length}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {activeProductsCount} active fragrances
                  </div>
                </div>
              </div>

              {/* Per-Store Performance Breakdown */}
              <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-cinzel text-sm font-semibold text-white">
                    Performance by Branch
                  </h3>
                  <button
                    onClick={() => setActiveTab('stores')}
                    className="text-xs text-[#d4af37] hover:underline font-medium"
                  >
                    Manage Stores
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((st) => {
                    const stOrders = orders.filter((o) => o.storeId === st.id);
                    const stSales = stOrders
                      .filter((o) => o.status !== 'Cancelled')
                      .reduce((sum, o) => sum + o.totalAmount, 0);
                    const stProductsCount = storeProducts.filter((sp) => sp.storeId === st.id).length;

                    return (
                      <div
                        key={st.id}
                        className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-xs text-white truncate">
                            {st.name}
                          </span>
                          <span
                            className={`text-[11px] font-mono ${
                              st.status === 'Active'
                                ? 'text-emerald-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            {st.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/70 text-[11px] font-mono tabular-nums">
                          <div>
                            <div className="text-zinc-500">Products</div>
                            <div className="text-white font-semibold">{stProductsCount}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">Orders</div>
                            <div className="text-zinc-200 font-semibold">{stOrders.length}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">Sales</div>
                            <div className="text-[#d4af37] font-semibold">Rs. {stSales.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h2 className="font-cinzel text-xl font-semibold text-white">Settings &amp; Security</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage your administrator password, WhatsApp order number, shipping rates, and Supabase connection.
                </p>
              </div>

              {settingsSavedNotice && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Store settings saved and applied to the storefront.</span>
                </div>
              )}

              {/* SECURITY: CHANGE ADMIN PASSWORD */}
              <form onSubmit={handleChangePassword} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                  <KeyRound className="w-4 h-4 text-[#d4af37]" />
                  <div>
                    <h3 className="font-cinzel text-sm font-semibold text-white">
                      Change Admin Password
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Update the password required to access this admin console.
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPasswordInput}
                        onChange={(e) => {
                          setCurrentPasswordInput(e.target.value);
                          setPasswordError('');
                          setPasswordSuccess('');
                        }}
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
                        aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPasswordInput}
                          onChange={(e) => {
                            setNewPasswordInput(e.target.value);
                            setPasswordError('');
                            setPasswordSuccess('');
                          }}
                          placeholder="Minimum 6 characters"
                          autoComplete="new-password"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPasswordInput}
                          onChange={(e) => {
                            setConfirmPasswordInput(e.target.value);
                            setPasswordError('');
                            setPasswordSuccess('');
                          }}
                          placeholder="Re-enter new password"
                          autoComplete="new-password"
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
                          aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="py-2 px-5 bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>

              {/* STORE & SUPABASE CONFIGURATION */}
              <form onSubmit={handleSaveSettings} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="pb-3 border-b border-zinc-800/80">
                  <h3 className="font-cinzel text-sm font-semibold text-white">
                    Store Delivery &amp; WhatsApp Configuration
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure default WhatsApp ordering contact and delivery fees.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Official WhatsApp Number
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.officialWhatsapp}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, officialWhatsapp: e.target.value })
                    }
                    placeholder="+923390108748"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Used as the primary WhatsApp checkout contact across storefront order links.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Standard Delivery Charge (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsForm.deliveryCharge}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, deliveryCharge: Number(e.target.value) })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Free Shipping Threshold (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsForm.freeDeliveryThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          freeDeliveryThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Supabase Integration Section */}
                <div className="pt-5 border-t border-zinc-800/80 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Database className="w-4 h-4 text-[#d4af37]" />
                    <span>Supabase Database &amp; Storage</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Optional: Connect your Supabase project URL and anonymous key to mirror catalog products, branches, and uploaded photos in Supabase.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-300 mb-1">
                        Supabase Project URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://xyzproject.supabase.co"
                        value={settingsForm.supabaseUrl || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, supabaseUrl: e.target.value })
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-300 mb-1">
                        Supabase Anon Key
                      </label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={settingsForm.supabaseAnonKey || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, supabaseAnonKey: e.target.value })
                        }
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleTestSupabase}
                        disabled={supabaseTesting}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition-colors"
                      >
                        {supabaseTesting ? 'Testing...' : 'Test Connection'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSqlSchema((prev) => !prev)}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-[#d4af37] transition-colors"
                      >
                        {showSqlSchema ? 'Hide SQL Schema' : 'View SQL Schema'}
                      </button>

                      {supabaseStatusMsg && (
                        <span className="text-xs text-[#d4af37] font-medium">
                          {supabaseStatusMsg}
                        </span>
                      )}
                    </div>

                    {showSqlSchema && (
                      <div className="mt-3 p-4 rounded-lg bg-black border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#d4af37]">
                            Supabase Schema &amp; RLS Policies
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
                              setCopiedSql(true);
                              setTimeout(() => setCopiedSql(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                          >
                            {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                          </button>
                        </div>
                        <pre className="text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-56 p-2 bg-zinc-950 rounded border border-zinc-900 whitespace-pre">
                          {SUPABASE_SCHEMA_SQL}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Store Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-7 text-white shadow-2xl relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <RoyalCrownLogo size="sm" iconOnly />
                <div>
                  <h2 className="font-cinzel text-lg font-semibold text-white">
                    {modalMode === 'add' ? 'Add New Product' : `Edit Product: ${formData.name}`}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Configure fragrance details, bottle image, pricing, and branch visibility.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Banner if errors exist */}
            {Object.keys(formErrors).length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Please complete the required fields highlighted below.</span>
              </div>
            )}

            {/* Sub-tabs: Edit Details vs Live Shop Card Preview */}
            <div className="flex items-center gap-2 pt-3 pb-2 border-b border-zinc-800/80 shrink-0">
              <button
                type="button"
                onClick={() => setFormActiveSubtab('details')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  formActiveSubtab === 'details'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                Product Details
              </button>
              <button
                type="button"
                onClick={() => setFormActiveSubtab('preview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  formActiveSubtab === 'preview'
                    ? 'bg-[#d4af37] text-black font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Card Preview</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 pr-1">
              {formActiveSubtab === 'details' ? (
                <form id="productForm" onSubmit={handleSaveProduct} className="space-y-5">
                  {/* FIELD 1: PRODUCT NAME */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Product Name <span className="text-[#d4af37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Creed Aventus Inspired – 30ml"
                      value={formData.name || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (e.target.value.trim()) {
                          setFormErrors((prev) => ({ ...prev, name: '' }));
                        }
                      }}
                      className={`w-full bg-zinc-900 border rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-zinc-700 focus:border-[#d4af37]'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Product Photograph */}
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                    <label className="block text-xs font-medium text-zinc-300">
                      Product Image (JPG, PNG, WEBP)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg bg-black border border-zinc-800 relative">
                        {formData.image ? (
                          <div className="relative w-28 h-40 flex items-center justify-center">
                            <img
                              src={formData.image}
                              alt="Perfume bottle upload preview"
                              className="max-h-full max-w-full object-contain rounded"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, image: '' });
                                setSelectedRawImageFile(null);
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-rose-400 hover:text-white"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-28 h-40 flex flex-col items-center justify-center text-center p-2 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-xs">
                            <ImageIcon className="w-6 h-6 mb-1.5 text-zinc-600" />
                            <span>No image</span>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-8 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={handleImageFileSelect}
                          />

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs flex items-center gap-2 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5 text-black" />
                            <span>{isProcessingImage ? 'Processing...' : 'Upload Photo'}</span>
                          </button>

                          {formData.image && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, image: '' });
                                setSelectedRawImageFile(null);
                              }}
                              className="px-3 py-2 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Image URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://.../perfume.jpg"
                            value={formData.image || ''}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price, Compare Price, Size */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Price (PKR) <span className="text-[#d4af37]">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={100}
                        step={50}
                        placeholder="1800"
                        value={formData.price !== undefined ? formData.price : ''}
                        onChange={(e) => {
                          setFormData({ ...formData, price: Number(e.target.value) });
                          if (Number(e.target.value) > 0) {
                            setFormErrors((prev) => ({ ...prev, price: '' }));
                          }
                        }}
                        className={`w-full bg-zinc-900 border rounded-lg px-3.5 py-2 text-sm text-white font-mono tabular-nums focus:outline-none transition-colors ${
                          formErrors.price
                            ? 'border-rose-500 focus:border-rose-500'
                            : 'border-zinc-700 focus:border-[#d4af37]'
                        }`}
                      />
                      {formErrors.price && (
                        <p className="text-[11px] text-rose-400 mt-1">{formErrors.price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Compare-at Price (Optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={50}
                        placeholder="2400"
                        value={formData.originalPrice !== undefined ? formData.originalPrice : ''}
                        onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2 text-sm text-white font-mono tabular-nums focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Bottle Size
                      </label>
                      <select
                        value={formData.size || '30ml'}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="30ml">30ml</option>
                        <option value="50ml">50ml</option>
                        <option value="100ml">100ml</option>
                      </select>
                    </div>
                  </div>

                  {/* Category, Stock, Visibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Category
                      </label>
                      <select
                        value={formData.category || 'Floral & Gardenia'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="50"
                        value={formData.stock !== undefined ? formData.stock : 50}
                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2 text-sm text-white font-mono tabular-nums focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Visibility
                      </label>
                      <select
                        value={formData.status || 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Active">Active (Visible on Storefront)</option>
                        <option value="Inactive">Hidden</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the fragrance notes, character, and longevity..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Inspired By & Featured */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Inspired By
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Creed Aventus / Baccarat Rouge"
                        value={formData.inspiredBy || ''}
                        onChange={(e) => setFormData({ ...formData, inspiredBy: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Featured on Homepage
                      </label>
                      <select
                        value={formData.isFeatured ? 'Yes' : 'No'}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.value === 'Yes' })}
                        className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </div>

                  {/* Assign to Stores */}
                  {stores.length > 0 && (
                    <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        Available Branches
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {stores.map((st) => {
                          const checked = selectedStoreIdsForProduct.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-[#d4af37]/10 border-[#d4af37]/50 text-white'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStoreIdsForProduct((prev) => [...prev, st.id]);
                                  } else {
                                    setSelectedStoreIdsForProduct((prev) =>
                                      prev.filter((id) => id !== st.id)
                                    );
                                  }
                                }}
                                className="rounded bg-zinc-900 border-zinc-700 text-[#d4af37]"
                              />
                              <span>{st.name}</span>
                              {st.status === 'Inactive' && (
                                <span className="text-[10px] text-zinc-500">(Inactive)</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-300">
                    Storefront product card preview
                  </div>

                  <div className="max-w-sm mx-auto">
                    <ProductCard
                      product={previewProduct}
                      onSelect={() => {}}
                      onBuyNow={() => {}}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingProduct}
                onClick={() => handleSaveProduct()}
                className="px-5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5 text-black" />
                <span>{isSavingProduct ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-semibold text-white">Delete Product</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">&ldquo;{productToDelete.name}&rdquo;</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
