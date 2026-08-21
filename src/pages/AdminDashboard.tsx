import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Package, Plus, Trash2, Edit3, Save, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/storeContext';
import type { Product, ProductSize, OrderStatus } from '../types/ecommerce';

export const AdminDashboard: React.FC = () => {
  const { products, orders, settings, promoCodes, updateProduct, addProduct, deleteProduct, updateOrderStatus, updateSettings, addPromoCode, formatPrice } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'promos' | 'settings'>('overview');
  
  // Product edit modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'homme' | 'femme' | 'accessoires'>('homme');
  const [newProdPrice, setNewProdPrice] = useState(35000);
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80');

  // Settings form
  const [announcementInput, setAnnouncementInput] = useState(settings.announcementText);
  const [whatsAppInput, setWhatsAppInput] = useState(settings.whatsAppNumber);

  // Promo code form
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState(15);

  // Metrics calculation
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;

  const lowStockProducts = products.filter((p) => {
    const totalStock = Object.values(p.stockPerSize).reduce((a, b) => a + b, 0);
    return totalStock > 0 && totalStock <= 10;
  });

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct);
      setEditingProduct(null);
    }
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const newProd: Product = {
      id: `pros-${Date.now()}`,
      slug: newProdName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: newProdName,
      category: newProdCategory,
      subCategory: 'hoodie',
      price: newProdPrice,
      shortDescription: 'Pièce exclusive de la collection PROS.',
      description: 'Confectionnée avec un coton d’exception selon les plus hauts standards de la marque.',
      material: '100% Coton Biologique Premium (450 GSM)',
      care: 'Lavage en machine à 30°C à l’envers.',
      fit: 'Coupe Oversize contemporaine.',
      colors: [
        {
          name: 'Noir Profond',
          hex: '#111111',
          images: [newProdImage]
        }
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'],
      stockPerSize: { S: 10, M: 15, L: 20, XL: 10, XXL: 5, XXXL: 2, XXXXL: 1 },
      badge: 'nouveau',
      isFeatured: true,
      rating: 5.0,
      reviewsCount: 1
    };

    addProduct(newProd);
    setIsNewProductModalOpen(false);
    setNewProdName('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      announcementText: announcementInput,
      whatsAppNumber: whatsAppInput
    });
    alert('Paramètres du store mis à jour !');
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode) return;
    addPromoCode({
      id: `coupon-${Date.now()}`,
      code: newPromoCode.toUpperCase(),
      name: `Code Promo ${newPromoCode.toUpperCase()}`,
      discountType: 'PERCENTAGE',
      discountValue: newPromoDiscount,
      discountPercent: newPromoDiscount,
      usageCount: 0,
      status: 'ACTIVE',
      active: true,
      createdAt: new Date().toISOString(),
    });
    setNewPromoCode('');
  };

  return (
    <div className="min-h-screen bg-pros-black text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Header */}
        <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-pros-sand font-bold uppercase tracking-wider">
              <ShieldCheck size={16} />
              <span>DASHBOARD ADMINISTRATEUR PROS</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-wider mt-1">
              GESTION STORE OFFICIEL
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/shop" className="btn-pros-secondary py-2.5 px-4 text-xs flex items-center space-x-2">
              <ArrowLeft size={14} />
              <span>VOIR BOUTIQUE EN LIGNE</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2 border-b border-white/10 text-xs font-bold uppercase">
          {[
            { key: 'overview', label: 'VUE D’ENSEMBLE' },
            { key: 'products', label: `PRODUITS (${totalProductsCount})` },
            { key: 'orders', label: `COMMANDES (${totalOrdersCount})` },
            { key: 'promos', label: `CODES PROMO (${promoCodes.length})` },
            { key: 'settings', label: 'PARAMÈTRES STORE' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-5 py-3 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-black font-extrabold'
                  : 'bg-pros-dark text-white/70 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* 4 Cards Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-pros-dark border border-white/10 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/50 text-xs">
                  <span>CHIFFRE D'AFFAIRES</span>
                  <DollarSign size={20} className="text-pros-sand" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">{formatPrice(totalRevenue)}</div>
                <div className="text-[10px] text-green-400 font-mono">Calculé sur l'ensemble des commandes</div>
              </div>

              {/* Card 2 */}
              <div className="bg-pros-dark border border-white/10 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/50 text-xs">
                  <span>TOTAL COMMANDES</span>
                  <ShoppingBag size={20} className="text-pros-sand" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">{totalOrdersCount}</div>
                <div className="text-[10px] text-white/40 font-mono">Enregistrées en base</div>
              </div>

              {/* Card 3 */}
              <div className="bg-pros-dark border border-white/10 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/50 text-xs">
                  <span>CATALOGUE PIÈCES</span>
                  <Package size={20} className="text-pros-sand" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">{totalProductsCount}</div>
                <div className="text-[10px] text-white/40 font-mono">Variantes actives</div>
              </div>

              {/* Card 4 */}
              <div className="bg-pros-dark border border-white/10 p-6 space-y-2">
                <div className="flex justify-between items-center text-white/50 text-xs">
                  <span>ALERTES STOCK FAIBLE</span>
                  <AlertTriangle size={20} className="text-pros-sand" />
                </div>
                <div className="font-mono text-2xl font-bold text-pros-sand">{lowStockProducts.length}</div>
                <div className="text-[10px] text-pros-sand font-mono">Pièces &lt;= 10 unités</div>
              </div>
            </div>

            {/* Low Stock Warning Box */}
            {lowStockProducts.length > 0 && (
              <div className="bg-pros-dark border border-white/10 p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-pros-sand flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span>PIÈCES EN STOCK FAIBLE (RÉAPPROVISIONNEMENT NÉCESSAIRE)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {lowStockProducts.map((p) => {
                    const totalS = Object.values(p.stockPerSize).reduce((a, b) => a + b, 0);
                    return (
                      <div key={p.id} className="p-4 bg-black/40 border border-white/10 flex justify-between items-center text-xs">
                        <span className="font-bold uppercase text-white line-clamp-1">{p.name}</span>
                        <span className="font-mono font-bold text-pros-sand">{totalS} restants</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products Management Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-bold text-xl uppercase text-white">CATALOGUE PRODUITS</h2>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="btn-pros-primary py-2.5 px-4 text-xs flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>AJOUTER UN NOUVEAU PRODUIT</span>
              </button>
            </div>

            <div className="bg-pros-dark border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-pros-sand uppercase font-bold tracking-wider">
                    <th className="py-4 px-4">Produit</th>
                    <th className="py-4 px-4">Catégorie</th>
                    <th className="py-4 px-4">Prix FCFA</th>
                    <th className="py-4 px-4">Stock Total</th>
                    <th className="py-4 px-4">Badge</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {products.map((p) => {
                    const totalStock = Object.values(p.stockPerSize).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 flex items-center space-x-3 font-sans">
                          <img src={p.colors[0]?.images[0]} alt={p.name} className="w-10 h-12 object-cover bg-black" />
                          <div>
                            <div className="font-bold text-white uppercase">{p.name}</div>
                            <div className="text-[10px] text-white/40">{p.slug}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 uppercase text-white/70">{p.category}</td>
                        <td className="py-3 px-4 font-bold text-pros-sand">{formatPrice(p.price)}</td>
                        <td className="py-3 px-4 text-white">
                          {totalStock === 0 ? (
                            <span className="text-red-400 font-bold">ÉPUISÉ (0)</span>
                          ) : (
                            <span>{totalStock} unités</span>
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase text-white/60">{p.badge || '-'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 bg-white/10 hover:bg-white text-white hover:text-black transition-colors"
                            title="Modifier le produit"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Supprimer ${p.name} ?`)) deleteProduct(p.id);
                            }}
                            className="p-1.5 bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Management Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-display font-bold text-xl uppercase text-white">COMMANDES CLIENTS</h2>

            <div className="bg-pros-dark border border-white/10 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-pros-sand uppercase font-bold tracking-wider">
                    <th className="py-4 px-4">N° Suivi</th>
                    <th className="py-4 px-4">Client</th>
                    <th className="py-4 px-4">Téléphone</th>
                    <th className="py-4 px-4">Région</th>
                    <th className="py-4 px-4">Montant</th>
                    <th className="py-4 px-4">Paiement</th>
                    <th className="py-4 px-4">Statut Commande</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="py-3 px-4 font-bold text-white">{o.trackingNumber}</td>
                      <td className="py-3 px-4 font-sans text-white/90">
                        {o.customer.firstName} {o.customer.lastName}
                      </td>
                      <td className="py-3 px-4 text-white/70">{o.customer.phone}</td>
                      <td className="py-3 px-4 text-white/70 uppercase">{o.customer.region}</td>
                      <td className="py-3 px-4 font-bold text-pros-sand">{formatPrice(o.total)}</td>
                      <td className="py-3 px-4 text-green-400 uppercase">{o.paymentMethod}</td>
                      <td className="py-3 px-4">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className="bg-black border border-white/20 text-white text-[11px] px-2 py-1 uppercase focus:outline-none focus:border-pros-sand font-bold"
                        >
                          <option value="recue">RECUE</option>
                          <option value="preparation">PREPARATION</option>
                          <option value="expedie">EXPEDIE</option>
                          <option value="transit">EN TRANSIT</option>
                          <option value="livree">LIVREE</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promos' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-display font-bold text-xl uppercase text-white">GESTION DES CODES PROMO</h2>

            <form onSubmit={handleAddPromo} className="bg-pros-dark border border-white/10 p-6 flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-white/70 font-semibold uppercase">Code Promo (Ex: SONKO2026)</label>
                <input
                  type="text"
                  required
                  value={newPromoCode}
                  onChange={(e) => setNewPromoCode(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white uppercase"
                />
              </div>
              <div className="w-36 space-y-1">
                <label className="text-xs text-white/70 font-semibold uppercase">Réduction (%)</label>
                <input
                  type="number"
                  required
                  value={newPromoDiscount}
                  onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <button type="submit" className="btn-pros-primary py-2.5 px-6 text-xs">
                CRÉER CODE
              </button>
            </form>

            <div className="bg-pros-dark border border-white/10 p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase text-pros-sand">CODES ACTIFS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                {promoCodes.map((p) => (
                  <div key={p.code} className="p-4 bg-black/40 border border-white/10 flex justify-between items-center">
                    <span className="font-bold text-white">{p.code}</span>
                    <span className="text-pros-sand">-{p.discountPercent || 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Store Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-2xl">
            <h2 className="font-display font-bold text-xl uppercase text-white">PARAMÈTRES DU STORE</h2>

            <form onSubmit={handleSaveSettings} className="bg-pros-dark border border-white/10 p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/70 font-semibold uppercase">Texte Barre d'Annonce (Header Top)</label>
                <input
                  type="text"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70 font-semibold uppercase">Numéro WhatsApp Service Client</label>
                <input
                  type="text"
                  value={whatsAppInput}
                  onChange={(e) => setWhatsAppInput(e.target.value)}
                  className="w-full bg-black border border-white/20 px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <button type="submit" className="btn-pros-primary py-3 px-8 text-xs flex items-center space-x-2">
                <Save size={16} />
                <span>SAUVEGARDER LES PARAMÈTRES</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Modal: New Product */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-pros-dark border border-white/20 p-6 max-w-lg w-full space-y-4">
            <h3 className="font-display font-bold text-lg uppercase text-pros-sand">AJOUTER UN PRODUIT AU CATALOGUE</h3>
            <div className="space-y-1">
              <label className="text-xs text-white/70 uppercase">Nom du Produit</label>
              <input
                type="text"
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="Ex: Bomber Luxe PROS Noir"
                className="w-full bg-black border border-white/20 p-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-white/70 uppercase">Catégorie</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value as any)}
                  className="w-full bg-black border border-white/20 p-2 text-xs text-white uppercase"
                >
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="accessoires">Accessoires</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70 uppercase">Prix (FCFA)</label>
                <input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(Number(e.target.value))}
                  className="w-full bg-black border border-white/20 p-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/70 uppercase">URL Image Produit</label>
              <input
                type="text"
                value={newProdImage}
                onChange={(e) => setNewProdImage(e.target.value)}
                className="w-full bg-black border border-white/20 p-2 text-xs text-white font-mono"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button type="button" onClick={() => setIsNewProductModalOpen(false)} className="btn-pros-secondary py-2 px-4 text-xs">
                ANNULER
              </button>
              <button type="submit" className="btn-pros-primary py-2 px-4 text-xs">
                CRÉER PRODUIT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Product Price & Stock */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleSaveProductEdit} className="bg-pros-dark border border-white/20 p-6 max-w-lg w-full space-y-4">
            <h3 className="font-display font-bold text-lg uppercase text-pros-sand">MODIFIER {editingProduct.name}</h3>

            <div className="space-y-1">
              <label className="text-xs text-white/70 uppercase">Prix (FCFA)</label>
              <input
                type="number"
                value={editingProduct.price}
                onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                className="w-full bg-black border border-white/20 p-2 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/70 uppercase">Stocks par Taille</label>
              <div className="grid grid-cols-3 gap-2 font-mono">
                {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as ProductSize[]).map((size) => (
                  <div key={size} className="space-y-0.5">
                    <span className="text-[10px] text-white/50">{size}</span>
                    <input
                      type="number"
                      value={editingProduct.stockPerSize[size] || 0}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stockPerSize: {
                            ...editingProduct.stockPerSize,
                            [size]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-black border border-white/20 p-1.5 text-xs text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button type="button" onClick={() => setEditingProduct(null)} className="btn-pros-secondary py-2 px-4 text-xs">
                ANNULER
              </button>
              <button type="submit" className="btn-pros-primary py-2 px-4 text-xs">
                ENREGISTRER
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
