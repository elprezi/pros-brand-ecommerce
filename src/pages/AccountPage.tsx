import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Award,
  Heart,
  RotateCcw,
  Lock,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  FileText,
  Printer,
  Search,
  Copy,
  Sparkles,
} from 'lucide-react';
import { PasswordInput } from '../components/ui/PasswordInput';
import { useStore } from '../store/storeContext';
import { useAuth } from '../store/authContext';
import { useLoyalty } from '../store/loyaltyContext';
import type { AddressLabel, ProductSize, Order, DeliveryAddress } from '../types/ecommerce';
import {
  apiGetOrderById,
  apiCreateReturnRequest,
  getUserWishlist,
  saveUserWishlist,
  getUserReturnRequests,
  type ReturnRequest,
} from '../lib/server/accountApi';
import { generateInvoiceData } from '../lib/server/invoiceApi';
import { downloadInvoicePdf, printOrderReceiptWindow } from '../lib/utils/pdfGenerator';

const SENEGAL_REGIONS = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Ziguinchor',
  'Diourbel',
  'Kaolack',
  'Fatick',
  'Kolda',
  'Louga',
  'Matam',
  'Sédhiou',
  'Tambacounda',
  'Kédougou',
  'Kaffrine',
];

const CLUB_PHYSICAL_REWARDS = [
  {
    id: 'rew-socks',
    title: 'Chaussettes Exclusives PROS',
    cost: 50,
    productName: 'Chaussettes PROS Streetwear',
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&q=80&w=400',
    description: 'Chaussettes en coton peigné haut de gamme avec broderie officielle PROS.',
    codePrefix: 'CADEAU-PROS-CHAUSSETTES-',
  },
  {
    id: 'rew-mug',
    title: 'Mug / Tasse Collector PROS',
    cost: 100,
    productName: 'Tasse Officielle PROS',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400',
    description: 'Tasse céramique finition noir mat avec logo doré « ÉLÉGANTE. FORTE. ENGAGÉE. »',
    codePrefix: 'CADEAU-PROS-TASSE-',
  },
  {
    id: 'rew-cap',
    title: 'Casquette Streetwear Officielle PROS',
    cost: 150,
    productName: 'Casquette PROS Président Ousmane Sonko',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
    description: 'Casquette brodée haute couture 100% coton sergé.',
    codePrefix: 'CADEAU-PROS-CASQUETTE-',
  },
  {
    id: 'rew-tshirt',
    title: 'T-Shirt Signature PROS',
    cost: 250,
    productName: 'T-Shirt Coton Bio PROS',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
    description: 'T-Shirt coupe sur-mesure 240g/m² avec marquage sérigraphié d\'exception.',
    codePrefix: 'CADEAU-PROS-TSHIRT-',
  },
  {
    id: 'rew-polo',
    title: 'Polo Haute Couture PROS',
    cost: 500,
    productName: 'Polo Piqué Luxe PROS',
    image: 'https://images.unsplash.com/photo-1625910513413-5fc256ecf91a?auto=format&fit=crop&q=80&w=400',
    description: 'Polo prestige en piqué de coton égyptien avec boutons en nacre gravés.',
    codePrefix: 'CADEAU-PROS-POLO-',
  },
];

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    orders,
    products,
    toggleWishlist,
    addToCart,
    formatPrice,
    addresses,
    addDeliveryAddress,
    deleteDeliveryAddress,
    setDefaultDeliveryAddress,
    settings,
    addPromoCode,
  } = useStore();

  const { currentUser, logout, updateProfile, changePassword } = useAuth();
  const { members, rewards } = useLoyalty();

  // Dynamic Physical Rewards List created by Admin in /admin/loyalty
  const activeRewardsList = useMemo(() => {
    if (rewards && rewards.length > 0) {
      return rewards.map((r) => ({
        id: r.id,
        title: r.name,
        cost: r.pointsCost,
        productName: r.name,
        image: r.imageUrl || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400',
        description: r.description,
        codePrefix: `CADEAU-PROS-${r.id.slice(-4)}-`,
      }));
    }
    return CLUB_PHYSICAL_REWARDS;
  }, [rewards]);

  // Active Tab Navigation State (Defaulting to 'orders')
  const [activeTab, setActiveTab] = useState<
    'orders' | 'club' | 'wishlist' | 'profile' | 'addresses' | 'returns' | 'security'
  >(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['orders', 'club', 'wishlist', 'profile', 'addresses', 'returns', 'security'].includes(tabParam)) {
      return tabParam as any;
    }
    return 'orders';
  });

  // Unique Client Referral Code & Link Helpers
  const userRefCode = useMemo(() => {
    if (!currentUser) return 'PROS-MEMBRE';
    const cleanName = (currentUser.lastName || currentUser.firstName || 'MEMBRE').toUpperCase().replace(/[^A-Z]/g, '');
    const idSuffix = (currentUser.id || '9821').slice(-4);
    return `PROS-${cleanName}-${idSuffix}`;
  }, [currentUser]);

  const userRefUrl = useMemo(() => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pros2029.vercel.app';
    return `${baseUrl}/auth/register?ref=${userRefCode}`;
  }, [userRefCode]);

  // ASYNC LOADING STATES
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);

  // SEARCH & FILTER STATES FOR ORDERS
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // NOTIFICATION & TOAST STATE
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // MODAL STATES
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [addressToDeleteId, setAddressToDeleteId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // PROS CLUB VOUCHER REDEMPTION STATE
  const [generatedVoucher, setGeneratedVoucher] = useState<{ code: string; title: string; pointsSpent: number } | null>(null);

  // PROFILE FORM STATE
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '1974-07-15',
    avatar: '',
  });

  // PASSWORD SECURITY FORM STATE
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // RETURN REQUEST FORM STATE
  const [returnForm, setReturnForm] = useState({
    orderId: '',
    item: '',
    reason: '',
    refundAmount: 0,
  });

  // NEW / EDIT ADDRESS FORM STATE
  const [newAddressForm, setNewAddressForm] = useState<{
    id?: string;
    label: AddressLabel;
    recipientName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    region: string;
    country: string;
  }>({
    label: 'DOMICILE',
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Dakar',
    region: 'Dakar',
    country: 'Sénégal',
  });

  // PERSISTED RETURN REQUESTS STATE & USER POINTS
  const [userReturnRequests, setUserReturnRequests] = useState<ReturnRequest[]>([]);
  const [userPointsOverride, setUserPointsOverride] = useState<number | null>(null);

  // AUTHENTICATION GUARD & INITIAL DATA FETCH
  useEffect(() => {
    if (!currentUser) {
      navigate('/auth/login?redirect=/account');
      return;
    }

    setIsLoadingPage(true);

    // Sync profile form directly from currentUser
    setProfileForm({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      birthDate: currentUser.birthDate || '1974-07-15',
      avatar: currentUser.avatar || '',
    });

    setNewAddressForm((prev) => ({
      ...prev,
      recipientName: `${currentUser.firstName} ${currentUser.lastName}`,
      phone: currentUser.phone || '',
    }));

    // Load persisted returns
    setUserReturnRequests(getUserReturnRequests(currentUser.id));
    setIsLoadingPage(false);
  }, [currentUser, navigate]);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const t = tabParam.toLowerCase();
      if (t === 'orders' || t === 'commandes' || t === 'overview' || t === 'tableau-de-bord') setActiveTab('orders');
      else if (t === 'club' || t === 'fidelite' || t === 'parrainage') setActiveTab('club');
      else if (t === 'wishlist' || t === 'souhaits') setActiveTab('wishlist');
      else if (t === 'profile' || t === 'informations') setActiveTab('profile');
      else if (t === 'addresses' || t === 'adresses') setActiveTab('addresses');
      else if (t === 'returns' || t === 'retours') setActiveTab('returns');
      else if (t === 'security' || t === 'securite') setActiveTab('security');
    }
  }, [searchParams]);

  const handleTabChange = (
    tab: 'orders' | 'club' | 'wishlist' | 'profile' | 'addresses' | 'returns' | 'security'
  ) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // REAL LOGOUT HANDLER
  const handleLogout = () => {
    logout();
    showToast('Vous avez été déconnecté avec succès.', 'info');
    navigate('/auth/login');
  };

  // USER'S REAL ORDERS
  const userOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) => (o as any).userId === currentUser.id || o.customer.email.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [orders, currentUser]);

  // FILTERED ORDERS FOR ORDERS TAB
  const filteredUserOrders = useMemo(() => {
    return userOrders.filter((o) => {
      const matchesSearch =
        !orderSearchQuery ||
        o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.trackingNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        (o.items || []).some((i) => i.product?.name.toLowerCase().includes(orderSearchQuery.toLowerCase()));

      const matchesStatus =
        orderStatusFilter === 'all' ||
        (orderStatusFilter === 'pending' && (o.status === 'recue' || o.status === 'preparation')) ||
        (orderStatusFilter === 'delivered' && (o.status === 'expedie' || o.status === 'transit' || o.status === 'livree')) ||
        (orderStatusFilter === 'cancelled' && (o.status as string) === 'cancelled');

      return matchesSearch && matchesStatus;
    });
  }, [userOrders, orderSearchQuery, orderStatusFilter]);

  // USER'S REAL ADDRESSES
  const userAddresses = useMemo(() => {
    if (!currentUser) return [];
    return addresses.filter(
      (a) => a.customerId === currentUser.id || (a as any).userId === currentUser.id
    );
  }, [addresses, currentUser]);

  // USER'S REAL WISHLIST PRODUCTS
  const userWishlistIds = useMemo(() => {
    if (!currentUser) return [];
    return getUserWishlist(currentUser.id, []);
  }, [currentUser]);

  const savedWishlistProducts = useMemo(() => {
    return products.filter((p) => userWishlistIds.includes(p.id));
  }, [products, userWishlistIds]);

  // PROS CLUB LOYALTY MEMBER DATA & TRANSACTIONS
  const loyaltyMember = useMemo(() => {
    if (!currentUser) return null;
    const found = members.find(
      (m) => m.email.toLowerCase() === currentUser.email.toLowerCase() || (m as any).customerId === currentUser.id
    );
    const pts = userPointsOverride !== null ? userPointsOverride : (found?.availablePoints || 0);

    let levelName = 'BRONZE';
    if (pts >= 2500) levelName = 'PLATINUM';
    else if (pts >= 1000) levelName = 'GOLD';
    else if (pts >= 500) levelName = 'SILVER';

    return {
      id: found?.id || `LOYALTY-${currentUser.id}`,
      customerId: currentUser.id,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      email: currentUser.email,
      phone: currentUser.phone || '',
      levelName,
      availablePoints: pts,
      totalEarnedPoints: found?.totalEarnedPoints || pts,
      totalSpentPoints: found?.totalSpentPoints || 0,
      rewardsRedeemedCount: found?.rewardsRedeemedCount || 0,
      joinedAt: currentUser.createdAt,
      lastActivityDate: new Date().toISOString(),
      status: 'ACTIVE' as const,
    };
  }, [members, currentUser, userPointsOverride]);

  // REAL PROFILE UPDATE HANDLER
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const res = updateProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
      birthDate: profileForm.birthDate,
      avatar: profileForm.avatar,
    });

    setIsSavingProfile(false);

    if (res.success) {
      showToast('Modifications enregistrées avec succès.');
    } else {
      showToast(res.message || 'Impossible d\'enregistrer les modifications.', 'error');
    }
  };

  // REAL PASSWORD CHANGE HANDLER
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.googleId && !securityForm.currentPassword) {
      showToast('Veuillez saisir votre mot de passe actuel.', 'error');
      return;
    }
    if (!securityForm.newPassword || securityForm.newPassword.length < 6) {
      showToast('Le nouveau mot de passe doit contenir au moins 6 caractères.', 'error');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      showToast('Les nouveaux mots de passe ne correspondent pas.', 'error');
      return;
    }

    setIsSavingPassword(true);

    const res = changePassword(securityForm.currentPassword, securityForm.newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast(res.message);
    } else {
      showToast(res.message, 'error');
    }
  };

  // REAL ADD / EDIT ADDRESS HANDLER
  const handleAddOrEditAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressForm.addressLine1 || !newAddressForm.city) {
      showToast('Veuillez renseigner l\'adresse et la ville.', 'error');
      return;
    }

    addDeliveryAddress({
      customerId: currentUser?.id || '',
      label: newAddressForm.label || 'DOMICILE',
      recipientName: newAddressForm.recipientName || `${profileForm.firstName} ${profileForm.lastName}`,
      phone: newAddressForm.phone || profileForm.phone,
      addressLine1: newAddressForm.addressLine1,
      addressLine2: newAddressForm.addressLine2,
      city: newAddressForm.city,
      region: newAddressForm.region || 'Dakar',
      country: 'Sénégal',
      isDefault: userAddresses.length === 0,
      isActive: true,
    });

    setIsAddAddressModalOpen(false);
    setEditingAddress(null);
    setNewAddressForm({
      label: 'DOMICILE',
      recipientName: `${profileForm.firstName} ${profileForm.lastName}`,
      phone: profileForm.phone,
      addressLine1: '',
      addressLine2: '',
      city: 'Dakar',
      region: 'Dakar',
      country: 'Sénégal',
    });
    showToast('Adresse enregistrée avec succès.');
  };

  // REAL DELETE ADDRESS HANDLER WITH CONFIRMATION
  const confirmDeleteAddress = () => {
    if (!addressToDeleteId) return;
    deleteDeliveryAddress(addressToDeleteId);
    setAddressToDeleteId(null);
    showToast('Adresse supprimée.');
  };

  // SET DEFAULT ADDRESS HANDLER
  const handleSetDefaultAddress = (id: string) => {
    setDefaultDeliveryAddress(id);
    showToast('Adresse principale modifiée.');
  };

  // REAL CREATE RETURN REQUEST HANDLER
  const handleCreateReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnForm.orderId || !returnForm.reason) {
      showToast('Veuillez sélectionner une commande et indiquer un motif.', 'error');
      return;
    }

    setIsCreatingReturn(true);
    const res = await apiCreateReturnRequest(currentUser, returnForm);
    setIsCreatingReturn(false);

    if (res.success && res.data) {
      setUserReturnRequests([res.data, ...userReturnRequests]);
      setIsReturnModalOpen(false);
      setReturnForm({ orderId: '', item: '', reason: '', refundAmount: 0 });
      showToast('Votre demande de retour a été transmise.');
    } else {
      showToast(res.error || 'Impossible d\'envoyer la demande.', 'error');
    }
  };

  // VIEW ORDER DETAILS WITH STRICT OWNERSHIP GUARD
  const handleViewOrderDetails = async (orderId: string) => {
    const res = await apiGetOrderById(currentUser, orderId, orders);
    if (res.success && res.data) {
      setSelectedOrderDetails(res.data);
    } else {
      showToast(res.error || 'Accès refusé à cette commande.', 'error');
    }
  };

  // DOWNLOAD INVOICE PDF HANDLER
  const handleDownloadInvoice = (order: Order) => {
    try {
      const invoiceData = generateInvoiceData(order, settings);
      downloadInvoicePdf(invoiceData);
      showToast(`Facture PDF de la commande ${order.id} téléchargée.`);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors du téléchargement de la facture.', 'error');
    }
  };

  // PRINT RECEIPT WINDOW HANDLER (USER REQUEST #1 & #3)
  const handlePrintReceipt = (order: Order) => {
    try {
      const invoiceData = generateInvoiceData(order, settings);
      printOrderReceiptWindow(invoiceData);
      showToast(`Impression du reçu ${order.id} initialisée.`);
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de l\'impression du reçu.', 'error');
    }
  };

  // REAL PROS CLUB PRODUCT REWARD REDEMPTION HANDLER
  const handleRedeemReward = (reward: any) => {
    const currentPts = loyaltyMember?.availablePoints || 0;
    if (currentPts < reward.cost) {
      showToast(`Points insuffisants. Il vous manque ${reward.cost - currentPts} points.`, 'error');
      return;
    }

    const uniqueCode = `${reward.codePrefix}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create promo code in store context for free gift product
    addPromoCode({
      id: `promo-gift-${Date.now()}`,
      code: uniqueCode,
      name: `Cadeau Offert PROS - ${reward.productName}`,
      discountType: 'FREE_SHIPPING',
      discountValue: 0,
      freeShipping: true,
      minimumOrderAmount: 0,
      active: true,
      usageLimit: 1,
      usageCount: 0,
      startsAt: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    setUserPointsOverride(currentPts - reward.cost);
    setGeneratedVoucher({
      code: uniqueCode,
      title: reward.title,
      pointsSpent: reward.cost,
    });

    showToast(`Félicitations ! Vous avez réclamé votre ${reward.title} !`, 'success');
  };

  // STRICT SINGLE SOURCE OF TRUTH ADMIN BUTTON CHECK
  const canAccessAdmin = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'CLIENT') return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.isPrimaryAdmin) {
      return true;
    }
    if (currentUser.role === 'STAFF') {
      return Array.isArray(currentUser.permissions) && currentUser.permissions.length > 0;
    }
    return false;
  }, [currentUser]);

  if (isLoadingPage || !currentUser) {
    return (
      <div className="min-h-screen bg-white text-pros-black flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 size={32} className="animate-spin text-pros-gold" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
          CHARGEMENT DE VOTRE ESPACE MEMBRE...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-pros-black py-6 sm:py-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        
        {/* UNIFIED LUXURY TOP HEADER BANNER WITH ALL 6 NAVIGATION CARDS */}
        <div className="bg-pros-black text-white p-6 sm:p-8 border border-neutral-800 space-y-6 shadow-xl font-sans">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-pros-gold shrink-0" />
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-pros-gold text-black rounded-full flex items-center justify-center font-display font-extrabold text-xl shrink-0">
                  {currentUser.firstName.charAt(0)}{currentUser.lastName.charAt(0)}
                </div>
              )}
              <div>
                <span className="text-[10px] font-mono font-bold tracking-superwide uppercase text-pros-gold block">
                  ESPACE PERSONNEL MEMBRE PROS
                </span>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-white mt-0.5">
                  BONJOUR, {currentUser.firstName.toUpperCase()} {currentUser.lastName.toUpperCase()} 👋
                </h1>
                <p className="text-xs text-white/70 font-sans mt-1">
                  Membre PROS depuis {new Date(currentUser.createdAt).toLocaleDateString('fr-FR')} • Compte VÉRIFIÉ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
              <button
                onClick={() => handleTabChange('club')}
                className="px-3.5 py-2 bg-pros-gold hover:bg-yellow-400 text-black text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer font-sans shadow-md"
              >
                <Sparkles size={14} />
                <span>OBTENIR MON LIEN PARRAINAGE</span>
              </button>

              <button
                onClick={() => handleTabChange('profile')}
                className={`px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer font-sans ${
                  activeTab === 'profile'
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <User size={14} />
                <span>MES INFORMATIONS</span>
              </button>

              {canAccessAdmin && (
                <Link
                  to="/admin"
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold uppercase border border-white/20 flex items-center space-x-1.5 transition-all shadow-sm font-sans"
                  title="Accéder au panneau d'administration PROS"
                >
                  <ShieldCheck size={14} className="text-pros-gold" />
                  <span>ACCÈS ADMIN</span>
                </Link>
              )}
            </div>
          </div>

          {/* ALL 6 DIRECT NAVIGATION CARDS IN HEADER */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-sans">
            <button
              onClick={() => handleTabChange('orders')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'orders' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">COMMANDES</span>
                <Package size={16} className={activeTab === 'orders' ? 'text-pros-gold' : 'text-white'} />
              </div>
              <strong className="text-sm font-bold font-mono text-white">{userOrders.length} Achats</strong>
            </button>

            <button
              onClick={() => handleTabChange('club')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'club' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">PARRAINAGE</span>
                <Award size={16} className="text-pros-gold" />
              </div>
              <strong className="text-sm font-bold font-mono text-pros-gold">{loyaltyMember?.availablePoints ?? 0} PTS</strong>
            </button>

            <button
              onClick={() => handleTabChange('wishlist')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'wishlist' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">FAVORIS</span>
                <Heart size={16} className="text-red-500" />
              </div>
              <strong className="text-sm font-bold font-mono text-white">{userWishlistIds.length} Souhaits</strong>
            </button>

            <button
              onClick={() => handleTabChange('addresses')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'addresses' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">ADRESSES</span>
                <MapPin size={16} className={activeTab === 'addresses' ? 'text-pros-gold' : 'text-white'} />
              </div>
              <strong className="text-sm font-bold font-mono text-white">{userAddresses.length} Adresses</strong>
            </button>

            <button
              onClick={() => handleTabChange('returns')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'returns' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">RETOURS</span>
                <RotateCcw size={16} className={activeTab === 'returns' ? 'text-pros-gold' : 'text-white'} />
              </div>
              <strong className="text-sm font-bold font-mono text-white">{userReturnRequests.length} Retours</strong>
            </button>

            <button
              onClick={() => handleTabChange('security')}
              className={`p-3 bg-white/5 hover:bg-white/15 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                activeTab === 'security' ? 'border-pros-gold bg-white/20 ring-1 ring-pros-gold' : 'border-white/10'
              }`}
            >
              <div className="flex justify-between items-center text-white/60 mb-2">
                <span className="text-[9px] font-mono uppercase font-bold">SÉCURITÉ</span>
                <Lock size={16} className={activeTab === 'security' ? 'text-pros-gold' : 'text-white'} />
              </div>
              <strong className="text-sm font-bold font-mono text-white">Mot de passe</strong>
            </button>
          </div>
        </div>

        {/* TOAST ALERT NOTIFICATION */}
        {toastMsg && (
          <div
            className={`p-4 text-xs font-bold flex items-center justify-between font-sans shadow-sm border ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toastMsg.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-neutral-600 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* MAIN BODY: DIRECT ACTIVE TAB CONTENT AREA */}
        <main className="w-full space-y-6">

            {/* TAB 1: MES COMMANDES */}
            {activeTab === 'orders' && (
              <div className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                      HISTORIQUE DES COMMANDES ({userOrders.length})
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                      Consultez l'historique complet de vos achats, téléchargez vos factures et imprimez vos reçus.
                    </p>
                  </div>

                  {userOrders.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="N° commande, article..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-pros-bone border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                        />
                      </div>
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="px-2 py-1.5 bg-pros-bone border border-neutral-300 text-xs font-mono focus:outline-none focus:border-black"
                      >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En cours</option>
                        <option value="delivered">Livrées</option>
                        <option value="cancelled">Annulées</option>
                      </select>
                    </div>
                  )}
                </div>

                {filteredUserOrders.length === 0 ? (
                  <div className="p-12 bg-pros-bone border border-neutral-200 text-center space-y-4 font-sans max-w-lg mx-auto my-8">
                    <Package size={42} className="mx-auto text-neutral-300" />
                    <h3 className="font-display font-bold text-sm uppercase text-black">
                      {userOrders.length === 0 ? 'AUCUNE COMMANDE' : 'AUCUN RÉSULTAT'}
                    </h3>
                    <p className="text-xs text-neutral-600">
                      {userOrders.length === 0
                        ? 'Vous n\'avez pas encore passé de commande. Découvrez nos collections et trouvez vos prochains essentiels PROS.'
                        : 'Aucune commande ne correspond à vos critères de recherche.'}
                    </p>
                    <Link
                      to="/shop"
                      className="px-6 py-3 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide inline-block shadow-sm"
                    >
                      DÉCOUVRIR LA COLLECTION
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans">
                    {filteredUserOrders.map((o) => (
                      <div key={o.id} className="p-5 bg-pros-bone border border-neutral-200 space-y-3 font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-3 gap-2">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-black text-sm uppercase block">{o.id}</span>
                            <span className="text-[11px] text-neutral-500 font-mono">
                              Date: {new Date(o.createdAt).toLocaleDateString('fr-FR')} • N° Suivi: {o.trackingNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[9px] uppercase">
                              {o.status.toUpperCase()}
                            </span>
                            <strong className="font-mono text-emerald-800 text-sm font-bold ml-2">{formatPrice(o.total)}</strong>
                          </div>
                        </div>

                        {/* ORDER ITEMS LIST PREVIEW */}
                        <div className="space-y-2">
                          {(o.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-mono">
                              <span className="font-sans font-bold text-black">{item.product?.name || 'Produit PROS'} ({item.size || 'M'} x{item.quantity})</span>
                              <span>{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                            </div>
                          ))}
                        </div>

                        {/* FULL ACTION BUTTONS (IMPRIMER REÇU / FACTURE PDF / VOIR DÉTAILS) */}
                        <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewOrderDetails(o.id)}
                              className="px-3 py-1.5 bg-pros-black text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} /> VOIR LE DÉTAIL / FACTURE
                            </button>

                            <button
                              onClick={() => handleDownloadInvoice(o)}
                              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <FileText size={12} className="text-emerald-700" /> FACTURE PDF
                            </button>

                            <button
                              onClick={() => handlePrintReceipt(o)}
                              className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                              title="Imprimer le reçu de cette commande"
                            >
                              <Printer size={12} className="text-black" /> IMPRIMER REÇU
                            </button>
                          </div>

                          <Link
                            to={`/order-tracking?tracking=${o.trackingNumber}`}
                            className="text-[10px] font-bold uppercase text-pros-gold hover:underline flex items-center gap-1 font-mono"
                          >
                            <span>SUIVRE L'EXPÉDITION</span>
                            <ArrowRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PROS CLUB & PARRAINAGE PAR LIEN */}
            {activeTab === 'club' && (
              <div className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pros-gold font-mono block">PROGRAMME DE PARRAINAGE EXCLUSIF</span>
                    <h2 className="font-display font-bold text-xl uppercase text-pros-black mt-0.5">
                      PROS CLUB & PARRAINAGE
                    </h2>
                  </div>
                  <span className="px-3 py-1 bg-pros-gold text-black font-mono font-bold text-xs uppercase">
                    ● {loyaltyMember?.availablePoints ?? 0} PTS CUMULÉS
                  </span>
                </div>

                {/* REFERRAL LINK ENGINE BANNER */}
                <div className="p-6 bg-pros-black text-white border border-neutral-800 space-y-4 shadow-xl font-sans">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-pros-gold shrink-0" size={24} />
                    <div>
                      <h3 className="font-display font-bold text-base uppercase text-white">VOTRE LIEN DE PARRAINAGE UNIQUE</h3>
                      <p className="text-xs text-white/70 font-sans">
                        Partagez votre lien. Gagnez <strong className="text-pros-gold">+10 points</strong> dès l'inscription de votre ami(e) et <strong className="text-pros-gold">+50 points</strong> lors de son premier achat pour débloquer nos vêtements & accessoires créés par l'administration !
                      </p>
                    </div>
                  </div>

                  {/* REFERRAL LINK DISPLAY BOX */}
                  <div className="p-3 bg-white/10 border border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
                    <div className="truncate text-xs font-bold text-pros-gold">
                      {userRefUrl}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(userRefUrl);
                          showToast('Lien de parrainage copié dans le presse-papier !');
                        }}
                        className="px-3.5 py-2 bg-pros-gold hover:bg-yellow-400 text-black font-sans font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy size={14} />
                        <span>COPIER MON LIEN</span>
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Rejoins-moi sur la maison de mode officielle PROS (Président Ousmane Sonko) et découvre la collection exclusive : ${userRefUrl}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#25D366] hover:bg-emerald-500 text-black font-sans font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy size={14} className="hidden" />
                        <span>PARTAGER SUR WHATSAPP</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono pt-2 border-t border-white/10">
                    <span>CODE PARRAIN : <strong className="text-pros-gold">{userRefCode}</strong></span>
                    <span>AMIS PARRAINÉS : <strong className="text-white">0 Membre(s)</strong></span>
                  </div>
                </div>

                {/* PHYSICAL PRODUCT REWARDS CATALOG */}
                <div className="space-y-4 font-sans">
                  <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                    <h3 className="font-display font-bold text-sm uppercase text-black flex items-center gap-1.5">
                      <Award size={16} className="text-pros-gold" /> CATALOGUE DES PRODUITS RÉCOMPENSES
                    </h3>
                    <span className="text-xs text-neutral-500 font-mono">Convertissez vos points parrainage en produits réels</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRewardsList.map((rew) => {
                      const canAfford = (loyaltyMember?.availablePoints || 0) >= rew.cost;
                      return (
                        <div key={rew.id} className="bg-white border border-neutral-200 overflow-hidden flex flex-col justify-between shadow-sm">
                          <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                            <img src={rew.image} alt={rew.title} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 px-2.5 py-1 bg-pros-black text-pros-gold font-mono font-bold text-xs uppercase shadow-md">
                              {rew.cost} PTS
                            </div>
                          </div>

                          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs uppercase text-black">{rew.title}</h4>
                              <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">{rew.description}</p>
                            </div>

                            <button
                              onClick={() => handleRedeemReward(rew)}
                              disabled={!canAfford}
                              className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all mt-3 ${
                                canAfford
                                  ? 'bg-pros-black hover:bg-neutral-800 text-white shadow-sm'
                                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                              }`}
                            >
                              {canAfford ? 'RÉCLAMER LE PRODUIT' : `POINTS INSUFFISANTS (${rew.cost} PTS)`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GENERATED PRODUCT REWARD VOUCHER NOTICE */}
                {generatedVoucher && (
                  <div className="p-5 bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3 font-sans shadow-md">
                    <div className="flex justify-between items-center">
                      <strong className="font-bold uppercase text-xs flex items-center gap-1.5 text-emerald-900">
                        <CheckCircle2 size={16} className="text-emerald-700" /> BONS DE PRODUIT CADEAU GÉNÉRÉ RÉUSSITE
                      </strong>
                      <button onClick={() => setGeneratedVoucher(null)} className="text-neutral-500 hover:text-black">
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Félicitations ! Votre produit offert ({generatedVoucher.title}) a été débloqué. Utilisez ce code cadeau lors de votre prochaine commande ou présentez-le en boutique.
                    </p>
                    <div className="p-3 bg-white border border-emerald-400 flex items-center justify-between font-mono font-bold text-black text-sm">
                      <span>{generatedVoucher.code}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedVoucher.code);
                          showToast('Code produit cadeau copié !');
                        }}
                        className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-sans font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} /> COPIER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MA LISTE DE SOUHAITS */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                    MA LISTE DE SOUHAITS ({savedWishlistProducts.length})
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">
                    Retrouvez tous vos articles enregistrés et ajoutez-les directement à votre panier.
                  </p>
                </div>

                {savedWishlistProducts.length === 0 ? (
                  <div className="p-12 bg-pros-bone border border-neutral-200 text-center space-y-4 font-sans max-w-lg mx-auto my-8">
                    <Heart size={42} className="mx-auto text-neutral-300" />
                    <h3 className="font-display font-bold text-sm uppercase text-black">
                      VOTRE LISTE DE SOUHAITS EST VIDE.
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Parcourez notre catalogue et enregistrez vos pièces coup de cœur.
                    </p>
                    <Link
                      to="/shop"
                      className="px-6 py-3 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide inline-block shadow-sm"
                    >
                      EXPLORER LES PRODUITS
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 font-sans">
                    {savedWishlistProducts.map((product) => {
                      const img = product.colors?.[0]?.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';
                      return (
                        <div key={product.id} className="bg-white border border-neutral-200 p-4 space-y-3 font-sans shadow-sm flex flex-col justify-between">
                          <div className="space-y-2">
                            <img src={img} alt={product.name} className="w-full h-44 object-cover border border-neutral-100" />
                            <h4 className="font-bold text-xs uppercase text-black">{product.name}</h4>
                            <span className="font-mono font-bold text-emerald-800 block text-xs">{formatPrice(product.price)}</span>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-neutral-100">
                            <button
                              onClick={() => {
                                const defaultSize = (product.sizes?.[0] || 'M') as ProductSize;
                                const defaultColor = product.colors?.[0]?.name || 'Noir';
                                addToCart(product, defaultColor, defaultSize, 1);
                                showToast(`Produit "${product.name}" ajouté à votre panier.`);
                              }}
                              className="w-full py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase cursor-pointer"
                            >
                              AJOUTER AU PANIER
                            </button>
                            <button
                              onClick={() => {
                                toggleWishlist(product.id);
                                saveUserWishlist(currentUser.id, userWishlistIds.filter((id) => id !== product.id));
                                showToast(`Produit "${product.name}" retiré de votre liste de souhaits.`, 'info');
                              }}
                              className="w-full py-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-600 font-bold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} /> RETIRER
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: MES INFORMATIONS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                    MES INFORMATIONS PERSONNELLES
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">
                    Mettez à jour vos coordonnées personnelles et de contact.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-bold text-black text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-bold text-black text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Adresse Email (Compte)</label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full p-2.5 bg-neutral-100 border border-neutral-300 font-mono text-neutral-500 text-xs font-bold cursor-not-allowed"
                    />
                    <span className="text-[10px] text-neutral-400 font-mono block">
                      L'adresse email est liée à votre compte.
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Téléphone Mobile (WhatsApp)</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Date de Naissance (Optionnel)</label>
                    <input
                      type="date"
                      value={profileForm.birthDate}
                      onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                      className="w-full p-2.5 bg-pros-bone border border-neutral-300 font-mono text-black text-xs focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingProfile && <Loader2 size={14} className="animate-spin" />}
                    <span>{isSavingProfile ? 'ENREGISTREMENT...' : 'ENREGISTREMENT DES MODIFICATIONS'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 6: MES ADRESSES */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                      MES ADRESSES DE LIVRAISON ({userAddresses.length})
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                      Configurez vos adresses de livraison habituelles au Sénégal.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingAddress(null);
                      setNewAddressForm({
                        label: 'DOMICILE',
                        recipientName: `${profileForm.firstName} ${profileForm.lastName}`,
                        phone: profileForm.phone,
                        addressLine1: '',
                        addressLine2: '',
                        city: 'Dakar',
                        region: 'Dakar',
                        country: 'Sénégal',
                      });
                      setIsAddAddressModalOpen(true);
                    }}
                    className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> + AJOUTER UNE ADRESSE
                  </button>
                </div>

                {userAddresses.length === 0 ? (
                  <div className="p-12 bg-pros-bone border border-neutral-200 text-center space-y-3 font-sans max-w-md mx-auto">
                    <MapPin size={36} className="mx-auto text-neutral-300" />
                    <h3 className="font-bold text-xs uppercase text-black">AUCUNE ADRESSE ENREGISTRÉE</h3>
                    <p className="text-xs text-neutral-500">Vous n'avez encore aucune adresse enregistrée.</p>
                    <button
                      onClick={() => setIsAddAddressModalOpen(true)}
                      className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                    >
                      AJOUTER UNE ADRESSE
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans text-xs">
                    {userAddresses.map((addr) => (
                      <div key={addr.id} className="p-5 bg-pros-bone border border-neutral-200 flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="font-bold uppercase text-black text-xs">{addr.label}</strong>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 bg-black text-white text-[9px] font-mono font-bold uppercase">
                                PRINCIPALE
                              </span>
                            )}
                          </div>
                          <p className="text-neutral-700 font-bold">{addr.recipientName}</p>
                          <p className="text-neutral-600">{addr.addressLine1} {addr.addressLine2}</p>
                          <p className="text-neutral-600">{addr.city}, {addr.region} — {addr.country}</p>
                          <p className="font-mono text-neutral-500">Tél: {addr.phone}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 font-bold text-[10px] uppercase cursor-pointer"
                            >
                              DÉFINIR COMME PRINCIPALE
                            </button>
                          )}
                          <button
                            onClick={() => setAddressToDeleteId(addr.id)}
                            className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-600 hover:text-red-700 font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={12} /> SUPPRIMER
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: RETOURS & REMBOURSEMENTS */}
            {activeTab === 'returns' && (
              <div className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                      RETOURS & REMBOURSEMENTS ({userReturnRequests.length})
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-0.5">
                      Suivez le statut de vos demandes de retour et d'échange sous 14 jours.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReturnModalOpen(true)}
                    className="px-4 py-2 bg-pros-black text-white font-bold text-xs uppercase flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Plus size={14} /> FAIRE UNE DEMANDE DE RETOUR
                  </button>
                </div>

                {userReturnRequests.length === 0 ? (
                  <div className="p-12 bg-pros-bone border border-neutral-200 text-center space-y-3 font-sans max-w-md mx-auto">
                    <RotateCcw size={36} className="mx-auto text-neutral-300" />
                    <h3 className="font-bold text-xs uppercase text-black">AUCUNE DEMANDE DE RETOUR EN COURS</h3>
                    <p className="text-xs text-neutral-500">Vous n'avez encore aucun retour.</p>
                  </div>
                ) : (
                  <div className="space-y-4 font-sans text-xs">
                    {userReturnRequests.map((ret) => (
                      <div key={ret.id} className="p-4 bg-pros-bone border border-neutral-200 space-y-2">
                        <div className="flex justify-between items-center border-b border-neutral-200 pb-2">
                          <span className="font-mono font-bold text-black uppercase">{ret.id} • Commande {ret.orderId}</span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[9px] uppercase">
                            {ret.status}
                          </span>
                        </div>
                        <p className="text-black font-bold">{ret.item}</p>
                        <p className="text-neutral-500 text-[11px]">Motif: {ret.reason}</p>
                        <span className="font-mono text-emerald-800 font-bold block">{formatPrice(ret.refundAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 8: SÉCURITÉ DU COMPTE */}
            {activeTab === 'security' && (
              <form onSubmit={handleSavePassword} className="space-y-6 font-sans">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-display font-bold text-lg uppercase text-pros-black">
                    SÉCURITÉ DU COMPTE
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans mt-0.5">
                    Gérez le mot de passe d'accès et la sécurité de votre compte PROS.
                  </p>
                </div>

                {currentUser.googleId && (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1 font-sans">
                    <strong className="font-bold uppercase block">COMPTE AUTHENTIFIÉ PAR GOOGLE</strong>
                    <p className="text-[11px] text-blue-800">
                      Votre compte utilise Google pour la connexion. Vous pouvez définir un mot de passe local optionnel.
                    </p>
                  </div>
                )}

                <div className="space-y-4 max-w-md text-xs font-sans">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Email du Compte</label>
                    <input
                      type="text"
                      disabled
                      value={profileForm.email}
                      className="w-full p-2.5 bg-neutral-100 border border-neutral-300 font-mono text-neutral-500 text-xs font-bold"
                    />
                  </div>

                  {!currentUser.googleId && (
                    <PasswordInput
                      label="Ancien Mot de Passe"
                      required
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      allowToggle={false}
                    />
                  )}

                  <PasswordInput
                    label="Nouveau Mot de Passe"
                    required
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                  />

                  <PasswordInput
                    label="Confirmer le Nouveau Mot de Passe"
                    required
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                  />
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-6 py-3 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPassword && <Loader2 size={14} className="animate-spin" />}
                    <span>{isSavingPassword ? 'TRAITEMENT...' : 'MODIFIER LE MOT DE PASSE'}</span>
                  </button>
                </div>
              </form>
            )}
          </main>

        {/* MODAL 1: ADD / EDIT DELIVERY ADDRESS */}
        {isAddAddressModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <form onSubmit={handleAddOrEditAddress} className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-sm uppercase text-black">
                  {editingAddress ? 'MODIFIER L\'ADRESSE' : 'AJOUTER UNE ADRESSE'}
                </h3>
                <button type="button" onClick={() => setIsAddAddressModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Libellé de l'adresse</label>
                  <select
                    value={newAddressForm.label}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value as AddressLabel })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 font-bold text-black"
                  >
                    <option value="DOMICILE">DOMICILE</option>
                    <option value="BUREAU">BUREAU</option>
                    <option value="AUTRE">AUTRE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Nom complet du destinataire *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.recipientName}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, recipientName: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 font-bold text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Téléphone de livraison *</label>
                  <input
                    type="text"
                    required
                    value={newAddressForm.phone}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 font-mono text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Adresse Ligne 1 *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Rue 10 x Corniche, Mermoz"
                    value={newAddressForm.addressLine1}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine1: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Adresse Ligne 2 (Appartement, Villa...)</label>
                  <input
                    type="text"
                    placeholder="ex: Immeuble B, Appt 4"
                    value={newAddressForm.addressLine2}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, addressLine2: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Ville *</label>
                    <input
                      type="text"
                      required
                      value={newAddressForm.city}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                      className="w-full p-2 bg-pros-bone border border-neutral-300 font-bold text-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-600 uppercase text-[10px]">Région *</label>
                    <select
                      value={newAddressForm.region}
                      onChange={(e) => setNewAddressForm({ ...newAddressForm, region: e.target.value })}
                      className="w-full p-2 bg-pros-bone border border-neutral-300 text-black"
                    >
                      {SENEGAL_REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer"
                >
                  ENREGISTRER L'ADRESSE
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL 2: CONFIRM DELETE ADDRESS MODAL */}
        {addressToDeleteId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-sm w-full p-6 space-y-4 text-black font-sans shadow-2xl text-center">
              <AlertCircle size={36} className="mx-auto text-amber-600" />
              <h3 className="font-bold uppercase text-sm text-black">CONFIRMER LA SUPPRESSION</h3>
              <p className="text-xs text-neutral-600">Voulez-vous vraiment supprimer cette adresse de livraison ?</p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => setAddressToDeleteId(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  onClick={confirmDeleteAddress}
                  className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs uppercase cursor-pointer shadow-sm"
                >
                  SUPPRIMER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: ORDER DETAILS MODAL WITH PDF & PRINT BUTTONS */}
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-xl w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h3 className="font-display font-bold text-base uppercase text-black">COMMANDE {selectedOrderDetails.id}</h3>
                  <span className="text-[10px] font-mono text-neutral-500 block">N° Suivi Expédition: {selectedOrderDetails.trackingNumber}</span>
                </div>
                <button onClick={() => setSelectedOrderDetails(null)} className="text-neutral-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs font-sans max-h-96 overflow-y-auto pr-1">
                {/* ITEMS LIST */}
                <div className="space-y-2">
                  <strong className="font-bold uppercase text-neutral-500 text-[10px] block">ARTICLES COMMANDÉS :</strong>
                  {(selectedOrderDetails.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-pros-bone border border-neutral-200 flex justify-between items-center font-mono">
                      <div>
                        <strong className="text-black block font-sans font-bold">{item.product?.name || 'Produit PROS'}</strong>
                        <span className="text-[10px] text-neutral-500">Taille: {item.size || 'M'} • Couleur: {item.color || 'Noir'} • Qte: {item.quantity}</span>
                      </div>
                      <span className="font-bold text-emerald-800">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                    </div>
                  ))}
                </div>

                {/* SHIPPING ADDRESS SUMMARY */}
                {selectedOrderDetails.customer && (
                  <div className="p-3 bg-pros-bone border border-neutral-200 space-y-1 font-sans">
                    <strong className="font-bold uppercase text-[10px] text-neutral-500 block">ADRESSE DE LIVRAISON :</strong>
                    <p className="font-bold text-black">{selectedOrderDetails.customer.firstName} {selectedOrderDetails.customer.lastName}</p>
                    <p className="text-neutral-600">{selectedOrderDetails.customer.address}</p>
                    <p className="text-neutral-600">{selectedOrderDetails.customer.city}, {selectedOrderDetails.customer.region} — {selectedOrderDetails.customer.country}</p>
                  </div>
                )}

                {/* TOTALS & PAYMENT BREAKDOWN */}
                <div className="p-3 bg-pros-bone border border-neutral-200 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-neutral-600"><span>Sous-total:</span><span>{formatPrice(selectedOrderDetails.subtotal || selectedOrderDetails.total)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Frais de livraison:</span><span>{formatPrice(selectedOrderDetails.shippingCost || 0)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Méthode de Paiement:</span><strong className="uppercase text-black">{selectedOrderDetails.paymentMethod || 'PAYÉ'}</strong></div>
                  <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-sm"><span>TOTAL NET:</span><span className="text-emerald-800">{formatPrice(selectedOrderDetails.total)}</span></div>
                </div>
              </div>

              {/* FOOTER ACTIONS: PRINT RECEIPT & PDF INVOICE */}
              <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrderDetails)}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <FileText size={14} /> FACTURE PDF
                  </button>

                  <button
                    onClick={() => handlePrintReceipt(selectedOrderDetails)}
                    className="px-3.5 py-2 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Imprimer le reçu officiel de cette commande"
                  >
                    <Printer size={14} /> IMPRIMER LE REÇU
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/order-tracking?tracking=${selectedOrderDetails.trackingNumber}`}
                    className="px-3 py-2 bg-pros-bone hover:bg-neutral-200 text-black border border-neutral-300 font-bold text-xs uppercase flex items-center gap-1"
                  >
                    <span>SUIVRE</span>
                    <ArrowRight size={14} />
                  </Link>

                  <button
                    onClick={() => setSelectedOrderDetails(null)}
                    className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    FERMER
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: CREATE RETURN REQUEST MODAL */}
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <form onSubmit={handleCreateReturnRequest} className="bg-white border border-neutral-300 max-w-md w-full p-6 space-y-4 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-sm uppercase text-black">DEMANDE DE RETOUR / ÉCHANGE</h3>
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="text-neutral-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Commande Concernée *</label>
                  <select
                    required
                    value={returnForm.orderId}
                    onChange={(e) => {
                      const sel = userOrders.find((o) => o.id === e.target.value);
                      setReturnForm({
                        ...returnForm,
                        orderId: e.target.value,
                        refundAmount: sel ? sel.total : 0,
                      });
                    }}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 font-mono text-black"
                  >
                    <option value="">Sélectionner une commande...</option>
                    {userOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.id} — {formatPrice(o.total)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Article Concerné</label>
                  <input
                    type="text"
                    placeholder="ex: Hoodie Oversize Noir Taille XL"
                    value={returnForm.item}
                    onChange={(e) => setReturnForm({ ...returnForm, item: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-neutral-600 uppercase text-[10px]">Motif du Retour *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Expliquez la raison du retour (ex: échange de taille, défaut...)"
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full p-2 bg-pros-bone border border-neutral-300 text-black font-sans"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="submit"
                  disabled={isCreatingReturn}
                  className="px-5 py-2 bg-pros-black text-white font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                >
                  {isCreatingReturn ? 'TRANSMISSION...' : 'ENVOYER LA DEMANDE'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DEDICATED BOTTOM LOGOUT FOOTER BAR */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-neutral-500 my-6">
          <span className="text-xs font-mono text-neutral-500">
            Compte client actif : <strong className="text-black">{currentUser.email}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-800 text-xs font-bold uppercase tracking-wider border border-neutral-300 flex items-center space-x-2 transition-all cursor-pointer font-sans shadow-sm"
          >
            <LogOut size={14} className="text-red-600" />
            <span>SE DÉCONNECTER DE MON COMPTE PROS</span>
          </button>
        </div>

      </div>
    </div>
  );
};
