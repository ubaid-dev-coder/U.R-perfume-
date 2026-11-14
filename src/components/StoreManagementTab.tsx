import React, { useState, useRef } from 'react';
import {
  Store,
  Product,
  Order,
  StoreProductAssignment,
  StoreSettings,
  OrderStatus,
} from '../types';
import { StoreService } from '../services/storeService';
import { SupabaseService } from '../services/supabaseService';
import { PerfumeBottleVisual } from './PerfumeBottleVisual';
import { WhatsAppIcon } from './WhatsAppIcon';
import { RoyalCrownLogo } from './RoyalCrownLogo';
import {
  Store as StoreIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  X,
  Upload,
  Save,
  Star,
  Package,
  ShoppingBag,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';

interface StoreManagementTabProps {
  stores: Store[];
  onStoresUpdate: (stores: Store[]) => void;
  products: Product[];
  onProductsUpdate: (products: Product[]) => void;
  storeProducts: StoreProductAssignment[];
  onStoreProductsUpdate: (list: StoreProductAssignment[]) => void;
  orders: Order[];
  onOrderStatusUpdate: (orderId: string, status: OrderStatus) => void;
  settings: StoreSettings;
  onOpenAddNewProductModal: (targetStoreId?: string) => void;
  showNotification: (title: string, description: string) => void;
}

function compressLogoFile(file: File, maxSize = 600, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
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
        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mime, quality));
      };
      img.onerror = () => reject(new Error('Failed to load logo'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const StoreManagementTab: React.FC<StoreManagementTabProps> = ({
  stores,
  onStoresUpdate,
  products,
  storeProducts,
  onStoreProductsUpdate,
  orders,
  onOrderStatusUpdate,
  settings,
  onOpenAddNewProductModal,
  showNotification,
}) => {
  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Active detail store workspace
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [workspaceSubtab, setWorkspaceSubtab] = useState<'products' | 'orders' | 'details'>('products');
  const [storeOrderFilter, setStoreOrderFilter] = useState<string>('All');

  // Store Add/Edit Modal
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [storeModalMode, setStoreModalMode] = useState<'add' | 'edit'>('add');
  const [storeForm, setStoreForm] = useState<Partial<Store>>({});
  const [storeFormErrors, setStoreFormErrors] = useState<{ [key: string]: string }>({});
  const [rawLogoFile, setRawLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Assign Existing Product Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignProductId, setAssignProductId] = useState('');
  const [assignPrice, setAssignPrice] = useState<number>(1700);
  const [assignStock, setAssignStock] = useState<number>(40);

  // Confirm Delete Store Modal
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  // View full store details modal
  const [viewingStore, setViewingStore] = useState<Store | null>(null);

  // =========================================================
  // ANALYTICS COMPUTATIONS (REAL DATA ONLY)
  // =========================================================
  const totalStoresCount = stores.length;
  const activeStoresCount = stores.filter((s) => s.status === 'Active').length;
  const inactiveStoresCount = totalStoresCount - activeStoresCount;
  const totalProductsAcrossStores = storeProducts.length;
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalOrdersAcrossStores = orders.length;
  const totalStoreSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Per-store metrics helper
  const getStoreMetrics = (storeId: string) => {
    const storeAssigned = storeProducts.filter((sp) => sp.storeId === storeId);
    const storeOrdersList = orders.filter(
      (o) => o.storeId === storeId || (!o.storeId && stores.find((s) => s.id === storeId)?.isDefault)
    );
    const storeSales = storeOrdersList
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      productCount: storeAssigned.length,
      availableCount: storeAssigned.filter((sp) => sp.isAvailable).length,
      totalStock: storeAssigned.reduce((sum, sp) => sum + sp.stock, 0),
      orderCount: storeOrdersList.length,
      sales: storeSales,
      ordersList: storeOrdersList,
    };
  };

  // =========================================================
  // STORE CRUD HANDLERS
  // =========================================================
  const handleOpenAddStore = () => {
    setStoreModalMode('add');
    setStoreForm({
      id: `ur-store-${Date.now()}`,
      name: '',
      logo: '',
      address: '',
      phone: '',
      whatsapp: '+92',
      email: '',
      description: '',
      managerName: '',
      openingHours: 'Mon – Sun: 11:00 AM – 11:00 PM',
      status: 'Active',
      isDefault: stores.length === 0,
    });
    setRawLogoFile(null);
    setStoreFormErrors({});
    setIsStoreModalOpen(true);
  };

  const handleOpenEditStore = (store: Store) => {
    setStoreModalMode('edit');
    setStoreForm({ ...store });
    setRawLogoFile(null);
    setStoreFormErrors({});
    setIsStoreModalOpen(true);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      setRawLogoFile(file);
      const dataUrl = await compressLogoFile(file);
      setStoreForm((prev) => ({ ...prev, logo: dataUrl }));
      showNotification('Logo Ready', 'Store logo preview updated and ready to save.');
    } catch (err) {
      console.error(err);
      showNotification('Logo Error', 'Could not process the selected logo image.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const validateStoreForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!storeForm.name?.trim()) errors.name = 'Store Name is required.';
    if (!storeForm.address?.trim()) errors.address = 'Store Address is required.';
    if (!storeForm.phone?.trim()) errors.phone = 'Store Phone Number is required.';
    if (!storeForm.whatsapp?.trim()) errors.whatsapp = 'WhatsApp Number is required.';
    setStoreFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveStore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStoreForm()) {
      showNotification('Missing Fields', 'Please complete all required store details.');
      return;
    }

    setIsSavingStore(true);
    try {
      let finalLogo = storeForm.logo || '';

      // Upload logo to Supabase Storage if configured
      if (rawLogoFile && settings.supabaseUrl && settings.supabaseAnonKey) {
        const uploadRes = await SupabaseService.uploadImage(
          rawLogoFile,
          rawLogoFile.name,
          settings,
          'store-logos'
        );
        if (uploadRes.success && uploadRes.data) {
          finalLogo = uploadRes.data;
        } else if (uploadRes.error) {
          console.warn('Supabase store logo upload warning:', uploadRes.error);
        }
      }

      const finalStore: Store = {
        id: storeForm.id || `ur-store-${Date.now()}`,
        name: storeForm.name!.trim(),
        logo: finalLogo,
        address: storeForm.address!.trim(),
        phone: storeForm.phone!.trim(),
        whatsapp: storeForm.whatsapp!.trim(),
        email: storeForm.email?.trim() || 'contact@urperfumes.pk',
        description:
          storeForm.description?.trim() ||
          'Authorized U.R PERFUMES boutique & dispatch center offering signature Extrait de Parfum editions.',
        managerName: storeForm.managerName?.trim() || 'Store Manager',
        openingHours: storeForm.openingHours?.trim() || 'Mon – Sun: 11:00 AM – 11:00 PM',
        status: (storeForm.status as 'Active' | 'Inactive') || 'Active',
        isDefault: Boolean(storeForm.isDefault),
        createdAt: storeForm.createdAt || new Date().toISOString(),
      };

      // Sync to Supabase if configured
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        const dbRes = await SupabaseService.saveStore(finalStore, settings);
        if (!dbRes.success) {
          showNotification(
            'Saved Locally (Supabase Notice)',
            `Saved to local database. Supabase note: ${dbRes.error}`
          );
        }
      }

      let updatedStores: Store[];
      if (storeModalMode === 'add') {
        updatedStores = StoreService.addStore(finalStore);
        // Auto-assign active products if desired? Let's leave empty or let admin assign, or auto-assign all active?
        // Actually, let's check: when a new store is created, assigning existing active products makes it immediately shoppable, OR admin can assign them.
        // Wait: requirement says "Admin can: Assign existing perfumes to a store. Add new products."
        // Let's keep new stores clean and let admin assign, OR show a clear prompt inside Store Workspace to assign products in 1 click! Even better: let's add a "Assign All Catalog Perfumes" quick button in Store Product Management!
        showNotification('Store Created!', `"${finalStore.name}" has been added to Store Management.`);
      } else {
        updatedStores = StoreService.updateStore(finalStore);
        showNotification('Store Updated!', `Details for "${finalStore.name}" have been saved.`);
      }

      onStoresUpdate(updatedStores);
      setIsStoreModalOpen(false);
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleToggleStoreStatus = (store: Store) => {
    const updated = StoreService.toggleStoreStatus(store.id);
    onStoresUpdate(updated);
    const nextStatus = store.status === 'Active' ? 'Inactive' : 'Active';
    showNotification(
      'Store Status Updated',
      `"${store.name}" is now ${nextStatus}.`
    );
  };

  const handleSetDefaultStore = (store: Store) => {
    const updated = StoreService.setDefaultStore(store.id);
    onStoresUpdate(updated);
    showNotification('Default Store Updated', `"${store.name}" is now the primary flagship store.`);
  };

  const handleConfirmDeleteStore = () => {
    if (!storeToDelete) return;
    if (stores.length <= 1) {
      showNotification('Action Blocked', 'You must maintain at least one store in U.R PERFUMES.');
      setStoreToDelete(null);
      return;
    }
    const updated = StoreService.deleteStore(storeToDelete.id);
    onStoresUpdate(updated);
    onStoreProductsUpdate(StoreService.getStoreProducts());
    if (selectedStoreId === storeToDelete.id) {
      setSelectedStoreId(null);
    }
    showNotification('Store Removed', `"${storeToDelete.name}" has been deleted.`);
    setStoreToDelete(null);
  };

  // =========================================================
  // STORE PRODUCT ASSIGNMENT HANDLERS
  // =========================================================
  const activeStore = stores.find((s) => s.id === selectedStoreId) || null;

  const handleOpenAssignProductModal = (storeId: string) => {
    const assignedIds = new Set(
      storeProducts.filter((sp) => sp.storeId === storeId).map((sp) => sp.productId)
    );
    const unassigned = products.filter((p) => !assignedIds.has(p.id));
    const first = unassigned[0] || products[0];
    if (first) {
      setAssignProductId(first.id);
      setAssignPrice(first.price);
      setAssignStock(first.stock);
    }
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !assignProductId) return;
    const product = products.find((p) => p.id === assignProductId);
    if (!product) return;

    const updatedList = StoreService.assignProductToStore(
      activeStore.id,
      product,
      Number(assignPrice) || product.price,
      Number(assignStock) >= 0 ? Number(assignStock) : product.stock,
      true
    );
    onStoreProductsUpdate(updatedList);
    setIsAssignModalOpen(false);
    showNotification(
      'Product Assigned to Store',
      `"${product.name}" added to ${activeStore.name} at Rs. ${Number(assignPrice).toLocaleString()}.`
    );
  };

  const handleAssignAllCatalog = (store: Store) => {
    let latest = storeProducts;
    products.forEach((p) => {
      const already = latest.some((sp) => sp.storeId === store.id && sp.productId === p.id);
      if (!already) {
        latest = StoreService.assignProductToStore(store.id, p, p.price, p.stock, true);
      }
    });
    onStoreProductsUpdate(latest);
    showNotification('Full Catalog Assigned', `All ${products.length} perfumes are now assigned to ${store.name}.`);
  };

  const handleUpdateStoreProductField = (
    assignment: StoreProductAssignment,
    changes: Partial<StoreProductAssignment>
  ) => {
    const updatedItem = { ...assignment, ...changes };
    const updatedList = StoreService.updateStoreProduct(updatedItem);
    onStoreProductsUpdate(updatedList);
  };

  const handleRemoveFromStore = (storeId: string, productId: string, productName: string) => {
    if (!confirm(`Remove "${productName}" from this store?`)) return;
    const updatedList = StoreService.removeProductFromStore(storeId, productId);
    onStoreProductsUpdate(updatedList);
    showNotification('Removed from Store', `"${productName}" has been unassigned from this branch.`);
  };

  // Filtered stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // RENDER STORE WORKSPACE (IF A STORE IS SELECTED)
  // =========================================================
  if (activeStore) {
    const metrics = getStoreMetrics(activeStore.id);
    const assignedItems = storeProducts
      .filter((sp) => sp.storeId === activeStore.id)
      .map((sp) => ({
        assignment: sp,
        product: products.find((p) => p.id === sp.productId),
      }))
      .filter((item): item is { assignment: StoreProductAssignment; product: Product } => Boolean(item.product));

    const assignedIds = new Set(assignedItems.map((i) => i.product.id));
    const unassignedProducts = products.filter((p) => !assignedIds.has(p.id));

    const filteredStoreOrders = metrics.ordersList.filter((o) =>
      storeOrderFilter === 'All' ? true : o.status === storeOrderFilter
    );

    const pendingCount = metrics.ordersList.filter((o) => o.status === 'Pending').length;
    const confirmedCount = metrics.ordersList.filter((o) => o.status === 'Confirmed').length;
    const dispatchedCount = metrics.ordersList.filter((o) => o.status === 'Dispatched' || o.status === 'Shipped').length;
    const deliveredCount = metrics.ordersList.filter((o) => o.status === 'Delivered').length;

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Back Breadcrumb & Store Header */}
        <div className="p-5 sm:p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedStoreId(null)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-zinc-300 hover:text-white transition-colors"
                title="Back to All Stores"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-black border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                {activeStore.logo ? (
                  <img src={activeStore.logo} alt={activeStore.name} className="w-full h-full object-cover" />
                ) : (
                  <StoreIcon className="w-5 h-5 text-[#d4af37]" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-cinzel text-lg sm:text-xl font-semibold text-white">
                    {activeStore.name}
                  </h2>
                  {activeStore.isDefault && (
                    <span className="text-[11px] text-[#d4af37] font-medium">
                      · Primary Branch
                    </span>
                  )}
                  <span
                    className={`text-[11px] font-mono ${
                      activeStore.status === 'Active'
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    · {activeStore.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2.5">
                  <span>{activeStore.address}</span>
                  <span>·</span>
                  <span>Manager: <strong className="text-zinc-200">{activeStore.managerName}</strong></span>
                  <span>·</span>
                  <span className="font-mono text-emerald-400 tabular-nums">{activeStore.whatsapp}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenEditStore(activeStore)}
                className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-xs text-white flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Edit Store</span>
              </button>
            </div>
          </div>

          {/* Store-Level Analytics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-zinc-800/80">
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Assigned Products</div>
              <div className="text-xl font-mono font-semibold text-white mt-0.5 tabular-nums">
                {metrics.productCount} <span className="text-xs text-emerald-400 font-normal">({metrics.availableCount} active)</span>
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Inventory Stock</div>
              <div className="text-xl font-mono font-semibold text-[#d4af37] mt-0.5 tabular-nums">
                {metrics.totalStock} bottles
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Store Orders</div>
              <div className="text-xl font-mono font-semibold text-white mt-0.5 tabular-nums">
                {metrics.orderCount}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
              <div className="text-[11px] text-zinc-400">Store Revenue</div>
              <div className="text-xl font-mono font-semibold text-[#d4af37] mt-0.5 tabular-nums">
                Rs. {metrics.sales.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setWorkspaceSubtab('products')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                workspaceSubtab === 'products'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Products &amp; Inventory ({assignedItems.length})</span>
            </button>
            <button
              onClick={() => setWorkspaceSubtab('orders')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                workspaceSubtab === 'orders'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Store Orders ({metrics.orderCount})</span>
            </button>
            <button
              onClick={() => setWorkspaceSubtab('details')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                workspaceSubtab === 'details'
                  ? 'bg-[#d4af37] text-black font-semibold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <StoreIcon className="w-3.5 h-3.5" />
              <span>Store Profile</span>
            </button>
          </div>
        </div>

        {/* SUBTAB 1: STORE PRODUCT MANAGEMENT */}
        {workspaceSubtab === 'products' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <h3 className="font-cinzel text-base font-semibold text-white">
                  Branch Pricing &amp; Stock
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Assign perfumes to this branch, adjust PKR pricing, and update inventory.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {unassignedProducts.length > 0 && (
                  <button
                    onClick={() => handleAssignAllCatalog(activeStore)}
                    className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-xs text-zinc-200 transition-colors whitespace-nowrap"
                  >
                    Assign All ({unassignedProducts.length})
                  </button>
                )}

                <button
                  onClick={() => handleOpenAssignProductModal(activeStore.id)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 border border-[#d4af37]/50 text-[#d4af37] hover:bg-[#d4af37] hover:text-black font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Existing Perfume</span>
                </button>

                <button
                  onClick={() => onOpenAddNewProductModal(activeStore.id)}
                  className="px-3.5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {assignedItems.length === 0 ? (
              <div className="p-12 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                <Package className="w-9 h-9 text-zinc-600 mx-auto" />
                <div>
                  <h4 className="font-cinzel text-base font-semibold text-white">No Products Assigned Yet</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Assign existing perfumes from your catalog or create a new fragrance for this branch.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => handleAssignAllCatalog(activeStore)}
                    className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider"
                  >
                    Assign All Catalog Perfumes
                  </button>
                  <button
                    onClick={() => handleOpenAssignProductModal(activeStore.id)}
                    className="px-4 py-2 rounded-lg bg-zinc-900 border border-[#d4af37] text-[#d4af37] font-semibold text-xs uppercase tracking-wider"
                  >
                    Select Perfume
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {assignedItems.map(({ assignment, product }) => (
                  <div
                    key={assignment.id}
                    className={`rounded-xl bg-zinc-950 border p-4 space-y-4 transition-colors ${
                      assignment.isAvailable
                        ? 'border-zinc-800 hover:border-zinc-600'
                        : 'border-zinc-800/50 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-20 rounded-lg bg-black border border-zinc-800 overflow-hidden shrink-0">
                        <PerfumeBottleVisual
                          product={product}
                          size="sm"
                          className="!h-full !p-1"
                          interactive={false}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-cinzel text-sm font-semibold text-white truncate">
                          {product.name}
                        </h4>
                        <p className="text-[11px] text-[#d4af37] italic truncate">
                          {product.size} · {product.category}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateStoreProductField(assignment, {
                                isAvailable: !assignment.isAvailable,
                              })
                            }
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                              assignment.isAvailable
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {assignment.isAvailable ? 'Available' : 'Unavailable'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Store-Specific Price & Stock Controls */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-900">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Store Price (PKR)
                        </label>
                        <input
                          type="number"
                          min={100}
                          step={50}
                          value={assignment.storePrice}
                          onChange={(e) =>
                            handleUpdateStoreProductField(assignment, {
                              storePrice: Number(e.target.value),
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-2.5 py-1.5 text-xs text-[#d4af37] font-mono tabular-nums font-semibold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Branch Stock
                        </label>
                        <div className="flex items-center border border-zinc-700 rounded-lg bg-zinc-900 overflow-hidden">
                          <button
                            onClick={() =>
                              handleUpdateStoreProductField(assignment, {
                                stock: Math.max(0, assignment.stock - 5),
                              })
                            }
                            className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            -5
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={assignment.stock}
                            onChange={(e) =>
                              handleUpdateStoreProductField(assignment, {
                                stock: Math.max(0, Number(e.target.value)),
                              })
                            }
                            className="w-full bg-transparent text-center text-xs text-white font-mono tabular-nums font-semibold focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleUpdateStoreProductField(assignment, {
                                stock: assignment.stock + 5,
                              })
                            }
                            className="px-2 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-xs">
                      <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        Base: Rs. {product.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() =>
                          handleRemoveFromStore(activeStore.id, product.id, product.name)
                        }
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: STORE ORDERS */}
        {workspaceSubtab === 'orders' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
                <span className="text-amber-400">Pending: {pendingCount}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-sky-400">Confirmed: {confirmedCount}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-300">Dispatched: {dispatchedCount}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-emerald-400">Delivered: {deliveredCount}</span>
              </div>

              <select
                value={storeOrderFilter}
                onChange={(e) => setStoreOrderFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="All">All Store Orders ({metrics.orderCount})</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {filteredStoreOrders.length === 0 ? (
              <div className="p-12 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
                No orders found for this store under &ldquo;{storeOrderFilter}&rdquo;.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStoreOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-900">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#d4af37]">{ord.id}</span>
                        <span className="text-xs text-zinc-500">
                          {new Date(ord.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <select
                        value={ord.status}
                        onChange={(e) => onOrderStatusUpdate(ord.id, e.target.value as OrderStatus)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Processing">Processing</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-zinc-400">Customer: <strong className="text-white">{ord.customer.fullName}</strong></div>
                        <div className="text-zinc-400 font-mono">Phone: {ord.customer.mobileNumber}</div>
                        <div className="text-zinc-400">City: {ord.customer.city} — {ord.customer.address}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-zinc-300">
                          {ord.items.map((i) => `${i.productName} ×${i.quantity}`).join(', ')}
                        </div>
                        <div className="text-base font-serif-luxury font-bold text-[#d4af37] mt-1">
                          Total: Rs. {ord.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: STORE CONTACT & PROFILE */}
        {workspaceSubtab === 'details' && (
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 text-xs">
            <h3 className="font-cinzel text-base font-bold text-white">Complete Store Profile</h3>
            <p className="text-zinc-300 leading-relaxed">{activeStore.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="text-zinc-500 uppercase text-[10px] font-cinzel">Location & Manager</div>
                <div className="text-white"><strong>Address:</strong> {activeStore.address}</div>
                <div className="text-white"><strong>Manager:</strong> {activeStore.managerName}</div>
                <div className="text-white"><strong>Opening Hours:</strong> {activeStore.openingHours}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-2">
                <div className="text-zinc-500 uppercase text-[10px] font-cinzel">Direct Contacts</div>
                <div className="text-white font-mono"><strong>Phone:</strong> {activeStore.phone}</div>
                <div className="text-emerald-400 font-mono"><strong>WhatsApp:</strong> {activeStore.whatsapp}</div>
                <div className="text-white"><strong>Email:</strong> {activeStore.email}</div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGN EXISTING PRODUCT MODAL */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-950 border border-[#d4af37]/60 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="font-cinzel text-base font-bold text-white">
                  Assign Perfume to Store
                </h3>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Select Perfume from Master Catalog
                  </label>
                  <select
                    value={assignProductId}
                    onChange={(e) => {
                      const pid = e.target.value;
                      setAssignProductId(pid);
                      const prod = products.find((p) => p.id === pid);
                      if (prod) {
                        setAssignPrice(prod.price);
                        setAssignStock(prod.stock);
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Base: Rs. {p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Store Price (PKR)
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={assignPrice}
                      onChange={(e) => setAssignPrice(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Branch Stock
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={assignStock}
                      onChange={(e) => setAssignStock(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-md bg-[#d4af37] hover:bg-[#e5c158] text-black font-cinzel font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    ASSIGN PRODUCT
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================
  // RENDER MAIN STORE MANAGEMENT PAGE
  // =========================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with + ADD NEW STORE Button */}
      <div className="p-5 sm:p-6 rounded-xl bg-zinc-950 border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-cinzel text-xl font-semibold text-white">
              Store Management
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Manage branch locations, logos, branch-specific inventory, and order metrics.
            </p>
          </div>

          <button
            onClick={handleOpenAddStore}
            className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add New Store</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-zinc-800/80">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores by name, city, address, or manager..."
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-lg px-3 py-2 text-xs text-white focus:outline-none transition-colors"
            >
              <option value="All">All Stores ({totalStoresCount})</option>
              <option value="Active">Active Stores ({activeStoresCount})</option>
              <option value="Inactive">Inactive Stores ({inactiveStoresCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Store Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Total Stores</span>
            <StoreIcon className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-mono font-semibold text-white tabular-nums">
            {totalStoresCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Active</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-mono font-semibold text-emerald-400 tabular-nums">
            {activeStoresCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Inactive</span>
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-2xl font-mono font-semibold text-zinc-400 tabular-nums">
            {inactiveStoresCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Assigned SKUs</span>
            <Package className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-2xl font-mono font-semibold text-white tabular-nums">
            {totalProductsAcrossStores}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Total Orders</span>
            <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-mono font-semibold text-white tabular-nums">
            {totalOrdersAcrossStores}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Total Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
          </div>
          <div className="text-lg sm:text-xl font-mono font-semibold text-[#d4af37] tabular-nums">
            Rs. {totalStoreSales.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Store Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredStores.map((store) => {
          const metrics = getStoreMetrics(store.id);
          const isActive = store.status === 'Active';

          return (
            <div
              key={store.id}
              className={`rounded-xl bg-zinc-950 border p-5 sm:p-6 space-y-4 transition-colors ${
                isActive
                  ? 'border-zinc-800 hover:border-zinc-600'
                  : 'border-zinc-800/40 opacity-75'
              }`}
            >
              {/* Top Row: Logo, Title, Status Switch */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-black border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <RoyalCrownLogo size="sm" iconOnly />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-cinzel text-base font-semibold text-white truncate">
                        {store.name}
                      </h3>
                      {store.isDefault && (
                        <span className="text-[11px] text-[#d4af37] font-medium whitespace-nowrap">
                          · Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{store.address}</p>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={() => handleToggleStoreStatus(store)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 border transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {store.status}
                </button>
              </div>

              {/* Contact & Manager Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300 bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800/70">
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="truncate">Manager: {store.managerName}</span>
                </div>
                <div className="flex items-center gap-2 truncate font-mono tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="truncate">{store.phone}</span>
                </div>
                <div className="flex items-center gap-2 truncate font-mono tabular-nums text-emerald-400">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                  <span className="truncate">{store.whatsapp}</span>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="truncate">{store.openingHours}</span>
                </div>
              </div>

              {/* Store Stats Strip */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-zinc-900 tabular-nums">
                <div>
                  <div className="text-[11px] text-zinc-500">Products</div>
                  <div className="font-mono font-semibold text-white">{metrics.productCount}</div>
                </div>
                <div className="border-x border-zinc-900">
                  <div className="text-[11px] text-zinc-500">Orders</div>
                  <div className="font-mono font-semibold text-white">{metrics.orderCount}</div>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500">Sales</div>
                  <div className="font-mono font-semibold text-[#d4af37]">Rs. {metrics.sales.toLocaleString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedStoreId(store.id);
                      setWorkspaceSubtab('products');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Manage Inventory &amp; Orders</span>
                  </button>

                  <button
                    onClick={() => setViewingStore(store)}
                    className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-zinc-300 hover:text-white transition-colors"
                    title="View Store Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {!store.isDefault && (
                    <button
                      onClick={() => handleSetDefaultStore(store)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-[11px] text-[#d4af37] flex items-center gap-1 whitespace-nowrap"
                      title="Set as Default Store"
                    >
                      <Star className="w-3 h-3" />
                      <span>Set Default</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEditStore(store)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-[#d4af37] text-xs text-zinc-200 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Edit</span>
                  </button>

                  {stores.length > 1 && (
                    <button
                      onClick={() => setStoreToDelete(store)}
                      className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-400 hover:border-rose-500/50"
                      title="Delete Store"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT STORE MODAL */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-7 text-white shadow-2xl relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-cinzel text-lg font-semibold text-white">
                    {storeModalMode === 'add' ? 'Add New Store' : `Edit Store: ${storeForm.name}`}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Configure branch details, logo, manager, and WhatsApp dispatch contact.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStoreModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Errors Banner */}
            {Object.keys(storeFormErrors).length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Please complete all required store fields highlighted in red.</span>
              </div>
            )}

            {/* Form Body */}
            <form
              id="storeManagementForm"
              onSubmit={handleSaveStore}
              className="flex-1 overflow-y-auto py-4 pr-1 space-y-5"
            >
              {/* 1. Store Name & 2. Logo Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-black border border-zinc-800">
                  {storeForm.logo ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden">
                      <img src={storeForm.logo} alt="Store logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setStoreForm({ ...storeForm, logo: '' });
                          setRawLogoFile(null);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border border-dashed border-zinc-700 flex flex-col items-center justify-center text-zinc-500 text-[10px] text-center p-2">
                      <ImageIcon className="w-6 h-6 mb-1 text-zinc-600" />
                      <span>Store Logo</span>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="mt-2.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-[#d4af37]/40 text-[#d4af37] text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingLogo ? 'Processing...' : 'Upload Store Logo'}</span>
                  </button>
                </div>

                <div className="sm:col-span-8 space-y-3">
                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                      Store Name <span className="text-[#d4af37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. U.R PERFUMES – Lahore Gulberg Boutique"
                      value={storeForm.name || ''}
                      onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                      className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                        storeFormErrors.name ? 'border-rose-500' : 'border-zinc-700 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                      Store Address <span className="text-[#d4af37]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MM Alam Road, Gulberg III, Lahore"
                      value={storeForm.address || ''}
                      onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                      className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none ${
                        storeFormErrors.address ? 'border-rose-500' : 'border-zinc-700 focus:border-[#d4af37]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Phone, WhatsApp, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    Store Phone Number <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+92 300 1234567"
                    value={storeForm.phone || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none ${
                      storeFormErrors.phone ? 'border-rose-500' : 'border-zinc-700 focus:border-[#d4af37]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    WhatsApp Number <span className="text-[#d4af37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+923390108748"
                    value={storeForm.whatsapp || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, whatsapp: e.target.value })}
                    className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none ${
                      storeFormErrors.whatsapp ? 'border-rose-500' : 'border-zinc-700 focus:border-[#d4af37]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    Store Email
                  </label>
                  <input
                    type="email"
                    placeholder="lahore@urperfumes.pk"
                    value={storeForm.email || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Manager, Opening Hours, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    Store Manager Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hamza Tariq"
                    value={storeForm.managerName || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, managerName: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    placeholder="Mon – Sun: 11:00 AM – 11:00 PM"
                    value={storeForm.openingHours || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, openingHours: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                    Store Status
                  </label>
                  <select
                    value={storeForm.status || 'Active'}
                    onChange={(e) => setStoreForm({ ...storeForm, status: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="Active">Active (Visible to Customers)</option>
                    <option value="Inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Store Description */}
              <div>
                <label className="block text-xs font-cinzel font-semibold text-zinc-300 mb-1 uppercase">
                  Store Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe this boutique branch, specialty collections, and same-day city dispatch..."
                  value={storeForm.description || ''}
                  onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#d4af37] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Default Store Toggle */}
              <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(storeForm.isDefault)}
                  onChange={(e) => setStoreForm({ ...storeForm, isDefault: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-900 text-[#d4af37] focus:ring-0"
                />
                <span>Set as Primary Default Store on Website Load</span>
              </label>
            </form>

            {/* Footer: SAVE STORE & CANCEL */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsStoreModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingStore}
                onClick={() => handleSaveStore()}
                className="px-5 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5 text-black" />
                <span>{isSavingStore ? 'Saving...' : 'Save Store'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETE STORE DETAILS MODAL */}
      {viewingStore && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-black border border-zinc-700 overflow-hidden flex items-center justify-center">
                  {viewingStore.logo ? (
                    <img src={viewingStore.logo} alt={viewingStore.name} className="w-full h-full object-cover" />
                  ) : (
                    <RoyalCrownLogo size="sm" iconOnly />
                  )}
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-semibold text-white">{viewingStore.name}</h3>
                  <span className="text-[11px] text-[#d4af37]">{viewingStore.status} Branch</span>
                </div>
              </div>
              <button
                onClick={() => setViewingStore(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">{viewingStore.description}</p>

            <div className="space-y-2 text-xs bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#d4af37]" /> <span>{viewingStore.address}</span></div>
              <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-[#d4af37]" /> <span>Manager: {viewingStore.managerName}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-[#d4af37]" /> <span>Hours: {viewingStore.openingHours}</span></div>
              <div className="flex items-center gap-2 font-mono tabular-nums"><Phone className="w-3.5 h-3.5 text-[#d4af37]" /> <span>Phone: {viewingStore.phone}</span></div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-emerald-400"><WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" /> <span>WhatsApp: {viewingStore.whatsapp}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-[#d4af37]" /> <span>Email: {viewingStore.email}</span></div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedStoreId(viewingStore.id);
                  setViewingStore(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#d4af37] hover:bg-[#e0bd4c] text-black font-semibold text-xs"
              >
                Manage Products &amp; Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE STORE MODAL */}
      {storeToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-rose-500/50 rounded-3xl p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel text-base font-bold text-white">Delete Store</h3>
                <p className="text-xs text-zinc-400">This will remove the store and its branch inventory.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300">
              Are you sure you want to permanently delete <strong>"{storeToDelete.name}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStoreToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmDeleteStore}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs"
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
