import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem, Order, StoreSettings, PromoCode, ProductSize, CatalogCategory, CatalogCollection, CustomerReview, ReviewStatus, CustomerUser, UserStatus, DeliveryAddress } from '../types/ecommerce';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_PROMO_CODES } from '../data/products';
import { logRbacAction } from '../lib/server/rbacEngine';

export const INITIAL_CATEGORIES: CatalogCategory[] = [
  {
    id: 'cat-homme',
    name: 'HOMME',
    slug: 'homme',
    description: 'Vestiaire masculin contemporain PROS peigné 480GSM',
    fullDescription: 'Découvrez les créations masculines d’exception signées PROS.',
    imageUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80',
    status: 'ACTIVE',
    displayOrder: 1,
    metaTitle: 'Collection Homme PROS — PRESIDENT OUSMANE SONKO',
    metaDescription: 'Vestiaire masculin haute couture africaine contemporaine.',
    seoSlug: 'homme',
    showOnStore: true,
    showInMenu: true,
    showOnHomepage: true,
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'cat-femme',
    name: 'FEMME',
    slug: 'femme',
    description: 'Haute couture féminine PROS et ensembles structurés',
    fullDescription: 'L’élégance engagée au féminin par la maison PROS.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    status: 'ACTIVE',
    displayOrder: 2,
    metaTitle: 'Collection Femme PROS — E-Shop Officiel',
    metaDescription: 'Hoodies crop, ensembles et vestes féminines PROS.',
    seoSlug: 'femme',
    showOnStore: true,
    showInMenu: true,
    showOnHomepage: true,
    createdAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 'cat-accessoires',
    name: 'ACCESSOIRES',
    slug: 'accessoires',
    description: 'Casquettes, bonnets, écharpes et maroquinerie d’artisanat',
    fullDescription: 'Complétez votre silhouette avec les accessoires officiels PROS.',
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1000&q=80',
    status: 'ACTIVE',
    displayOrder: 3,
    metaTitle: 'Accessoires Officiels PROS — Casquettes & Maroquinerie',
    metaDescription: 'Les accessoires iconiques de la marque PROS.',
    seoSlug: 'accessoires',
    showOnStore: true,
    showInMenu: true,
    showOnHomepage: true,
    createdAt: '2026-08-18T10:00:00.000Z',
  },
];

export const INITIAL_COLLECTIONS: CatalogCollection[] = [];
export const INITIAL_REVIEWS: CustomerReview[] = [];
export const INITIAL_CUSTOMERS: CustomerUser[] = [];
export const INITIAL_ADDRESSES: DeliveryAddress[] = [];
export const INITIAL_ORDERS: Order[] = [];

interface StoreContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: CatalogCategory[];
  collections: CatalogCollection[];
  reviews: CustomerReview[];
  customers: CustomerUser[];
  addresses: DeliveryAddress[];
  cart: CartItem[];
  wishlist: string[]; // product IDs
  orders: Order[];
  settings: StoreSettings;
  promoCodes: PromoCode[];
  cartCount: number;
  wishlistCount: number;
  isMiniCartOpen: boolean;
  setIsMiniCartOpen: (open: boolean) => void;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  lang: 'FR' | 'EN';
  setLang: (lang: 'FR' | 'EN') => void;
  
  // Cart Actions
  addToCart: (product: Product, color: string, size: ProductSize, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  
  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Order Actions
  addOrder: (order: Order) => Order;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;

  // Category Actions
  addCategory: (category: CatalogCategory) => void;
  updateCategory: (category: CatalogCategory) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategories: (newOrderCategories: CatalogCategory[]) => void;
  duplicateCategory: (category: CatalogCategory) => CatalogCategory;

  // Collection Actions
  addCollection: (collection: CatalogCollection) => void;
  updateCollection: (collection: CatalogCollection) => void;
  deleteCollection: (collectionId: string) => void;
  reorderCollections: (newOrderCollections: CatalogCollection[]) => void;
  duplicateCollection: (collection: CatalogCollection) => CatalogCollection;

  // Admin Product Actions
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateSettings: (settings: StoreSettings) => void;
  // Promo Code Actions
  addPromoCode: (promo: PromoCode) => void;
  updatePromoCode: (promo: PromoCode) => void;
  deletePromoCode: (promoId: string) => void;
  togglePromoCodeStatus: (promoId: string) => void;
  validateAndApplyPromoCode: (codeStr: string, cartSubtotal: number, customerEmail?: string) => { valid: boolean; discountAmount: number; isFreeShipping: boolean; promo?: PromoCode; message?: string };
  updateStockPerSize: (productId: string, size: ProductSize, newStock: number) => void;
  resetAllData: () => void;

  // Review Actions
  addReview: (review: CustomerReview) => void;
  updateReviewStatus: (reviewId: string, status: ReviewStatus, adminNote?: string, adminName?: string) => void;
  deleteReview: (reviewId: string) => void;

  // Customer Actions
  addCustomer: (customer: CustomerUser) => void;
  updateCustomer: (customer: CustomerUser) => void;
  deleteCustomer: (customerId: string) => void;
  toggleCustomerBlockStatus: (customerId: string) => void;

  // Delivery Address Actions
  addDeliveryAddress: (address: Omit<DeliveryAddress, 'id' | 'createdAt'>) => DeliveryAddress;
  updateDeliveryAddress: (address: DeliveryAddress) => void;
  deleteDeliveryAddress: (addressId: string) => { success: boolean; message?: string };
  setDefaultDeliveryAddress: (addressId: string) => void;
  toggleAddressActiveStatus: (addressId: string) => void;
  importDeliveryAddresses: (newAddresses: Omit<DeliveryAddress, 'id' | 'createdAt'>[]) => { success: boolean; count: number };

  // Utility
  formatPrice: (amount: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'pros_store_v2_';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<CatalogCategory[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [collections, setCollections] = useState<CatalogCollection[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'reviews', JSON.stringify(reviews));
  }, [reviews]);

  const [customers, setCustomers] = useState<CustomerUser[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);

  const [addresses, setAddresses] = useState<DeliveryAddress[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'addresses');
    return saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'addresses', JSON.stringify(addresses));
  }, [addresses]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'promos');
    return saved ? JSON.parse(saved) : INITIAL_PROMO_CODES;
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  // Persistence side effects
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'products', JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage quota warning (products):', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage quota warning (categories):', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'collections', JSON.stringify(collections));
    } catch (e) {
      console.warn('LocalStorage quota warning (collections):', e);
    }
  }, [collections]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('LocalStorage quota warning (cart):', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('LocalStorage quota warning (wishlist):', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'orders', JSON.stringify(orders));
    } catch (e) {
      console.warn('LocalStorage quota warning (orders):', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('LocalStorage quota warning (settings):', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'promos', JSON.stringify(promoCodes));
    } catch (e) {
      console.warn('LocalStorage quota warning (promos):', e);
    }
  }, [promoCodes]);

  // Reset all data
  const resetAllData = () => {
    setProducts([]);
    setCategories([]);
    setCollections([]);
    setOrders([]);
    setCart([]);
    setWishlist([]);
    setPromoCodes([]);
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'products');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'categories');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'collections');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'orders');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'cart');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'wishlist');
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + 'promos');
  };

  // Cart actions
  const addToCart = (product: Product, color: string, size: ProductSize, quantity = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.color === color && item.size === size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const newItem: CartItem = {
        id: `${product.id}-${color}-${size}-${Date.now()}`,
        productId: product.id,
        product,
        color,
        size,
        quantity,
        price: product.price,
      };
      return [...prev, newItem];
    });

    setIsMiniCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  // Wishlist actions
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Category Actions
  const addCategory = (newCat: CatalogCategory) => {
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (updatedCat: CatalogCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
  };

  const deleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  const reorderCategories = (newOrderCategories: CatalogCategory[]) => {
    setCategories(newOrderCategories.map((c, index) => ({ ...c, displayOrder: index + 1 })));
  };

  const duplicateCategory = (sourceCat: CatalogCategory): CatalogCategory => {
    const timestamp = Date.now();
    const duplicated: CatalogCategory = {
      ...sourceCat,
      id: `cat-${timestamp}`,
      name: `${sourceCat.name} (COPIE)`,
      slug: `${sourceCat.slug}-copie-${timestamp.toString().slice(-4)}`,
      seoSlug: `${sourceCat.slug}-copie-${timestamp.toString().slice(-4)}`,
      status: 'INACTIVE',
      displayOrder: categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, duplicated]);
    return duplicated;
  };

  // Collection Actions
  const addCollection = (newCol: CatalogCollection) => {
    setCollections((prev) => [...prev, newCol]);
  };

  const updateCollection = (updatedCol: CatalogCollection) => {
    setCollections((prev) =>
      prev.map((c) => (c.id === updatedCol.id ? updatedCol : c))
    );
  };

  const deleteCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((c) => c.id !== collectionId));
  };

  const reorderCollections = (newOrderCollections: CatalogCollection[]) => {
    setCollections(newOrderCollections.map((c, index) => ({ ...c, displayOrder: index + 1 })));
  };

  const duplicateCollection = (sourceCol: CatalogCollection): CatalogCollection => {
    const timestamp = Date.now();
    const duplicated: CatalogCollection = {
      ...sourceCol,
      id: `col-${timestamp}`,
      name: `${sourceCol.name} (COPIE)`,
      slug: `${sourceCol.slug}-copie-${timestamp.toString().slice(-4)}`,
      seoSlug: `${sourceCol.slug}-copie-${timestamp.toString().slice(-4)}`,
      status: 'DRAFT',
      displayOrder: collections.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollections((prev) => [...prev, duplicated]);
    return duplicated;
  };

  // Orders
  const addOrder = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const orderedItem = newOrder.items.find((i) => i.productId === p.id);
        if (orderedItem) {
          const currentStock = p.stockPerSize[orderedItem.size] || 0;
          const updatedStock = Math.max(0, currentStock - orderedItem.quantity);
          return {
            ...p,
            stockPerSize: {
              ...p.stockPerSize,
              [orderedItem.size]: updatedStock,
            },
          };
        }
        return p;
      })
    );
    clearCart();
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  // Admin actions
  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  const addProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const updateSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
  };

  const addPromoCode = (promo: PromoCode) => {
    setPromoCodes((prev) => [promo, ...prev]);
  };

  const updatePromoCode = (updatedPromo: PromoCode) => {
    setPromoCodes((prev) => prev.map((p) => (p.id === updatedPromo.id ? updatedPromo : p)));
  };

  const deletePromoCode = (promoId: string) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== promoId && p.code !== promoId));
  };

  const togglePromoCodeStatus = (promoId: string) => {
    setPromoCodes((prev) =>
      prev.map((p) => {
        if (p.id === promoId || p.code === promoId) {
          const nextActive = !p.active;
          return {
            ...p,
            active: nextActive,
            status: nextActive ? 'ACTIVE' : 'DISABLED',
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const validateAndApplyPromoCode = (
    codeStr: string,
    cartSubtotal: number
  ): { valid: boolean; discountAmount: number; isFreeShipping: boolean; promo?: PromoCode; message?: string } => {
    const cleanCode = codeStr.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Veuillez saisir un code promo.' };
    }

    const found = promoCodes.find((p) => p.code.toUpperCase() === cleanCode);
    if (!found) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Code promo inexistant.' };
    }

    if (!found.active || found.status === 'DISABLED') {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Ce code promo a été désactivé.' };
    }

    if (found.status === 'EXPIRED') {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Ce code promo est expiré.' };
    }

    if (found.startsAt && new Date(found.startsAt).getTime() > Date.now()) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Ce code promo n\'est pas encore actif.' };
    }

    if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Ce code promo est expiré.' };
    }

    if (found.usageLimit && found.usageCount >= found.usageLimit) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Ce code promo a atteint sa limite d\'utilisation.' };
    }

    if (found.minimumOrderAmount && cartSubtotal < found.minimumOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        isFreeShipping: false,
        message: `Ce code nécessite un panier minimum de ${formatPrice(found.minimumOrderAmount)}.`,
      };
    }

    let discountAmount = 0;
    let isFreeShipping = false;

    if (found.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((cartSubtotal * found.discountValue) / 100);
      if (found.maximumDiscountAmount && discountAmount > found.maximumDiscountAmount) {
        discountAmount = found.maximumDiscountAmount;
      }
    } else if (found.discountType === 'FIXED_AMOUNT') {
      discountAmount = Math.min(cartSubtotal, found.discountValue);
    } else if (found.discountType === 'FREE_SHIPPING' || found.freeShipping) {
      isFreeShipping = true;
    }

    return {
      valid: true,
      discountAmount,
      isFreeShipping,
      promo: found,
      message: `Code promo ${found.code} appliqué avec succès.`,
    };
  };

  const updateStockPerSize = (productId: string, size: ProductSize, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stockPerSize: {
                ...p.stockPerSize,
                [size]: Math.max(0, newStock),
              },
            }
          : p
      )
    );
  };

  // Review Actions & Automatic Product Rating Sync
  const addReview = (review: CustomerReview) => {
    setReviews((prev) => [review, ...prev]);
  };

  const updateReviewStatus = (reviewId: string, status: ReviewStatus, adminNote?: string, adminName = 'Admin PROS') => {
    let targetProductId = '';

    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          targetProductId = r.productId;
          return {
            ...r,
            status,
            adminNote: adminNote || r.adminNote,
            moderatedBy: adminName,
            moderatedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    // Recalculate target product rating & count based ONLY on APPROVED reviews
    if (targetProductId) {
      setTimeout(() => {
        setReviews((latestReviews) => {
          const approvedProductReviews = latestReviews.filter((r) => r.productId === targetProductId && r.status === 'APPROVED');
          const count = approvedProductReviews.length;
          const avgRating = count > 0 ? Number((approvedProductReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)) : 5.0;

          setProducts((prevProds) =>
            prevProds.map((p) => (p.id === targetProductId ? { ...p, rating: avgRating, reviewsCount: count } : p))
          );
          return latestReviews;
        });
      }, 50);
    }
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  // Customer Actions
  const addCustomer = (customer: CustomerUser) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const updateCustomer = (updatedCustomer: CustomerUser) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const toggleCustomerBlockStatus = (customerId: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const nextStatus: UserStatus = c.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
          return { ...c, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );
  };

  // Delivery Address Actions
  const addDeliveryAddress = (addressData: Omit<DeliveryAddress, 'id' | 'createdAt'>): DeliveryAddress => {
    const newAddress: DeliveryAddress = {
      ...addressData,
      id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
    };

    setAddresses((prev) => {
      let updated = [...prev];
      if (newAddress.isDefault) {
        updated = updated.map((a) => (a.customerId === newAddress.customerId ? { ...a, isDefault: false } : a));
      }
      return [newAddress, ...updated];
    });

    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', 'ADDRESS_CREATED', 'DELIVERY_ADDRESS', newAddress.id, '', newAddress.recipientName);
    return newAddress;
  };

  const updateDeliveryAddress = (updatedAddress: DeliveryAddress) => {
    setAddresses((prev) => {
      let updated = prev.map((a) => (a.id === updatedAddress.id ? updatedAddress : a));
      if (updatedAddress.isDefault) {
        updated = updated.map((a) => (a.customerId === updatedAddress.customerId && a.id !== updatedAddress.id ? { ...a, isDefault: false } : a));
      }
      return updated;
    });

    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', 'ADDRESS_UPDATED', 'DELIVERY_ADDRESS', updatedAddress.id, '', updatedAddress.recipientName);
  };

  const setDefaultDeliveryAddress = (addressId: string) => {
    const target = addresses.find((a) => a.id === addressId);
    if (!target) return;

    setAddresses((prev) =>
      prev.map((a) => {
        if (a.customerId === target.customerId) {
          return { ...a, isDefault: a.id === addressId, updatedAt: new Date().toISOString() };
        }
        return a;
      })
    );

    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', 'ADDRESS_SET_DEFAULT', 'DELIVERY_ADDRESS', addressId, 'isDefault: false', 'isDefault: true');
  };

  const toggleAddressActiveStatus = (addressId: string) => {
    const target = addresses.find((a) => a.id === addressId);
    if (!target) return;

    const nextActive = !target.isActive;
    setAddresses((prev) =>
      prev.map((a) => (a.id === addressId ? { ...a, isActive: nextActive, updatedAt: new Date().toISOString() } : a))
    );

    const action = nextActive ? 'ADDRESS_ACTIVATED' : 'ADDRESS_DEACTIVATED';
    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', action, 'DELIVERY_ADDRESS', addressId);
  };

  const deleteDeliveryAddress = (addressId: string): { success: boolean; message?: string } => {
    const target = addresses.find((a) => a.id === addressId);
    if (!target) return { success: false, message: 'Adresse introuvable.' };

    const linkedOrders = orders.filter(
      (o) => o.deliveryAddressId === addressId || (o.customer && o.customer.email.toLowerCase() === target.recipientName.toLowerCase())
    );

    if (linkedOrders.length > 0) {
      return {
        success: false,
        message: `Cette adresse est utilisée par ${linkedOrders.length} commande(s). Vous pouvez la désactiver mais pas la supprimer.`,
      };
    }

    setAddresses((prev) => prev.filter((a) => a.id !== addressId));
    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', 'ADDRESS_DELETED', 'DELIVERY_ADDRESS', addressId, target.recipientName, '');
    return { success: true, message: 'Adresse supprimée définitivement.' };
  };

  const importDeliveryAddresses = (newAddressesData: Omit<DeliveryAddress, 'id' | 'createdAt'>[]): { success: boolean; count: number } => {
    let count = 0;
    setAddresses((prev) => {
      let updated = [...prev];
      newAddressesData.forEach((addrData) => {
        const newAddress: DeliveryAddress = {
          ...addrData,
          id: `addr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date().toISOString(),
        };
        if (newAddress.isDefault) {
          updated = updated.map((a) => (a.customerId === newAddress.customerId ? { ...a, isDefault: false } : a));
        }
        updated.unshift(newAddress);
        count++;
      });
      return updated;
    });

    logRbacAction('usr-primary-admin', 'servicepro.sn@gmail.com', 'ADDRESS_IMPORT', 'DELIVERY_ADDRESS', undefined, '', `${count} adresses importées`);
    return { success: true, count };
  };

  // Utility: Price formatter in FCFA (e.g. 45 000 FCFA)
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        setProducts,
        categories,
        collections,
        reviews,
        customers,
        addresses,
        cart,
        wishlist,
        orders,
        settings,
        promoCodes,
        cartCount: cart.reduce((sum, i) => sum + i.quantity, 0),
        wishlistCount: wishlist.length,
        isMiniCartOpen,
        setIsMiniCartOpen,
        setIsCartOpen: setIsMiniCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        lang,
        setLang,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addOrder,
        updateOrderStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        duplicateCategory,
        addCollection,
        updateCollection,
        deleteCollection,
        reorderCollections,
        duplicateCollection,
        updateProduct,
        addProduct,
        deleteProduct,
        updateSettings,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        togglePromoCodeStatus,
        validateAndApplyPromoCode,
        updateStockPerSize,
        addReview,
        updateReviewStatus,
        deleteReview,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        toggleCustomerBlockStatus,
        addDeliveryAddress,
        updateDeliveryAddress,
        deleteDeliveryAddress,
        setDefaultDeliveryAddress,
        toggleAddressActiveStatus,
        importDeliveryAddresses,
        resetAllData,
        formatPrice,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
