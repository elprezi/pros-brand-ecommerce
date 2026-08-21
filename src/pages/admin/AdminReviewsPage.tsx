import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog';
import { useStore } from '../../store/storeContext';
import type { CustomerReview, ReviewStatus } from '../../types/ecommerce';
import {
  Star,
  Check,
  X,
  Search,
  Download,
  Eye,
  Trash2,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  User,
  ShoppingBag,
  History,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const { reviews, updateReviewStatus, deleteReview } = useStore();
  const navigate = useNavigate();

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-desc' | 'rating-asc'>('newest');

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection & Modal State
  const [activeReviewDetail, setActiveReviewDetail] = useState<CustomerReview | null>(null);
  const [rejectingReview, setRejectingReview] = useState<CustomerReview | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Avis non conforme');
  const [customRejectNote, setCustomRejectNote] = useState<string>('');
  const [reviewToDelete, setReviewToDelete] = useState<CustomerReview | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Real-time KPI Stats calculated from PostgreSQL / Store Context
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'PENDING').length;
    const approved = reviews.filter((r) => r.status === 'APPROVED').length;
    const rejected = reviews.filter((r) => r.status === 'REJECTED' || r.status === 'HIDDEN').length;

    const approvedReviews = reviews.filter((r) => r.status === 'APPROVED');
    const averageRating = approvedReviews.length > 0
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '5.0';

    return { total, pending, approved, rejected, averageRating };
  }, [reviews]);

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          r.customerName.toLowerCase().includes(query) ||
          r.customerEmail.toLowerCase().includes(query) ||
          r.productName.toLowerCase().includes(query) ||
          r.comment.toLowerCase().includes(query) ||
          (r.title && r.title.toLowerCase().includes(query)) ||
          (r.orderId && r.orderId.toLowerCase().includes(query));

        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);
        const matchesVerified =
          verifiedFilter === 'all' ||
          (verifiedFilter === 'verified' && r.verifiedPurchase) ||
          (verifiedFilter === 'unverified' && !r.verifiedPurchase);

        return matchesSearch && matchesStatus && matchesRating && matchesVerified;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        if (sortBy === 'rating-asc') return a.rating - b.rating;
        return 0;
      });
  }, [reviews, searchTerm, statusFilter, ratingFilter, verifiedFilter, sortBy]);

  // Paginated Reviews
  const totalPages = Math.ceil(filteredReviews.length / pageSize) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  // Handle Moderation Actions
  const handleApprove = (review: CustomerReview) => {
    updateReviewStatus(review.id, 'APPROVED', undefined, 'Admin PROS');
    setSuccessMsg(`Avis de "${review.customerName}" approuvé avec succès.`);
    setOpenMenuId(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenRejectModal = (review: CustomerReview) => {
    setRejectingReview(review);
    setRejectReason('Avis non conforme');
    setCustomRejectNote('');
    setOpenMenuId(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingReview) return;
    const finalReason = rejectReason === 'Autre' ? customRejectNote || 'Avis non conforme' : rejectReason;
    updateReviewStatus(rejectingReview.id, 'REJECTED', finalReason, 'Admin PROS');
    setSuccessMsg(`Avis de "${rejectingReview.customerName}" refusé (${finalReason}).`);
    setRejectingReview(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleHide = (review: CustomerReview) => {
    updateReviewStatus(review.id, 'HIDDEN', 'Masqué par l\'administrateur', 'Admin PROS');
    setSuccessMsg(`Avis de "${review.customerName}" masqué de la boutique.`);
    setOpenMenuId(null);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const confirmDelete = () => {
    if (reviewToDelete) {
      deleteReview(reviewToDelete.id);
      setSuccessMsg(`Avis #${reviewToDelete.id} supprimé définitivement.`);
      setReviewToDelete(null);
      setOpenMenuId(null);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Bulk Export CSV (UTF-8 BOM ; delimiter for French Excel)
  const handleExportCSV = () => {
    const targetReviews = filteredReviews;
    if (targetReviews.length === 0) return;

    const BOM = '\uFEFF';
    const headers = ['ID', 'CLIENT', 'EMAIL', 'PRODUIT', 'NOTE', 'TITRE', 'COMMENTAIRE', 'ACHAT_VÉRIFIÉ', 'STATUT', 'DATE', 'MODÉRATEUR'];

    const rows = targetReviews.map((r) => [
      `"${r.id}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${r.customerEmail}"`,
      `"${r.productName.replace(/"/g, '""')}"`,
      `"${r.rating}/5"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.comment.replace(/"/g, '""')}"`,
      `"${r.verifiedPurchase ? 'OUI' : 'NON'}"`,
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleDateString('fr-FR')}"`,
      `"${r.moderatedBy || '—'}"`,
    ].join(';'));

    const csvContent = BOM + headers.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pros_avis_clients_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Star Rating Renderer
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs" title={`${rating}/5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={11}
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}
          />
        ))}
        <span className="ml-1 text-black font-mono font-bold text-[11px]">{rating}/5</span>
      </div>
    );
  };

  const getStatusBadge = (status: ReviewStatus) => {
    if (status === 'APPROVED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase font-sans">APPROUVÉ</span>;
    }
    if (status === 'PENDING') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase font-sans">EN ATTENTE</span>;
    }
    if (status === 'REJECTED') {
      return <span className="px-2 py-0.5 text-[9px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase font-sans">REFUSÉ</span>;
    }
    return <span className="px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300 uppercase font-sans">MASQUÉ</span>;
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="COMMUNAUTÉ & RÉPUTATION PROS"
          title="GESTION ET MODÉRATION DES AVIS CLIENTS"
          description="Modérez les avis soumis par vos clients, vérifiez l'authenticité des achats et contrôlez l'image de marque PROS."
          primaryAction={
            <div className="flex flex-wrap items-center gap-3 font-sans">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase flex items-center gap-2 cursor-pointer shadow-md font-sans"
              >
                <Download size={14} />
                <span>EXPORTER CSV</span>
              </button>
            </div>
          }
        />

        {/* Success Banner */}
        {successMsg && (
          <div className="p-4 bg-green-100 border border-green-300 text-green-900 text-xs font-bold flex items-center justify-between animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <Check size={18} className="text-green-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* 5 Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">TOTAL AVIS</span>
            <div className="text-2xl font-bold text-black">{stats.total}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">EN ATTENTE</span>
            <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">APPROUVÉS</span>
            <div className="text-2xl font-bold text-emerald-700">{stats.approved}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider">REFUSÉS / MASQUÉS</span>
            <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          </div>
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <span className="text-[10px] text-pros-gold uppercase font-bold tracking-wider">NOTE MOYENNE</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-xl font-bold text-pros-gold">{stats.averageRating}</span>
              <span className="text-xs text-neutral-400 font-bold">/ 5</span>
              <Star size={14} className="fill-pros-gold text-pros-gold ml-1" />
            </div>
          </div>
        </div>

        {/* Toolbar & Multi-Filters */}
        <div className="bg-pros-bone border border-neutral-200 p-4 space-y-4 shadow-sm font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-sans">
            
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par client, email, produit, commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">STATUT : TOUS</option>
              <option value="PENDING">EN ATTENTE DE MODÉRATION</option>
              <option value="APPROVED">APPROUVÉS (VISIBLES)</option>
              <option value="REJECTED">REFUSÉS</option>
              <option value="HIDDEN">MASQUÉS</option>
            </select>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="all">NOTE : TOUTES</option>
              <option value="5">5 ÉTOILES (★★★★★)</option>
              <option value="4">4 ÉTOILES (★★★★☆)</option>
              <option value="3">3 ÉTOILES (★★★☆☆)</option>
              <option value="2">2 ÉTOILES (★★☆☆☆)</option>
              <option value="1">1 ÉTOILE (★☆☆☆☆)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-neutral-300 px-3 py-2 text-black focus:outline-none focus:border-black uppercase font-sans cursor-pointer"
            >
              <option value="newest">PLUS RÉCENTS</option>
              <option value="oldest">PLUS ANCIENS</option>
              <option value="rating-desc">NOTE LA PLUS ÉLEVÉE</option>
              <option value="rating-asc">NOTE LA PLUS BASSE</option>
            </select>

          </div>
        </div>

        {/* Data Container: Responsive Desktop Table / Mobile Cards */}
        <div className="bg-white border border-neutral-200 shadow-sm font-sans">
          {reviews.length === 0 ? (
            /* Official Empty State when reviews.length === 0 */
            <div className="p-16 text-center font-sans">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-pros-bone border border-neutral-300 flex items-center justify-center mx-auto text-black">
                  <MessageSquare size={32} />
                </div>
                <h3 className="font-display font-bold text-xl uppercase text-black">AUCUN AVIS CLIENT</h3>
                <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                  Les avis clients apparaîtront ici après leur soumission et leur modération.
                </p>
              </div>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-16 text-center font-sans">
              <div className="max-w-sm mx-auto space-y-3">
                <Search className="mx-auto text-neutral-400" size={36} />
                <h3 className="font-display font-bold text-sm uppercase text-black">AUCUN AVIS TROUVÉ</h3>
                <p className="text-xs text-neutral-500">Aucun avis ne correspond actuellement à vos critères de recherche.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRatingFilter('all');
                    setVerifiedFilter('all');
                  }}
                  className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase hover:bg-neutral-800 inline-flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <RotateCcw size={14} />
                  <span>RÉINITIALISER FILTRES</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (Non-overflowing layout) */}
              <div className="hidden md:block overflow-x-auto font-sans">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                    <tr>
                      <th className="p-3 w-44">CLIENT</th>
                      <th className="p-3 w-48">PRODUIT & COMMANDE</th>
                      <th className="p-3 w-28">NOTE</th>
                      <th className="p-3">COMMENTAIRE</th>
                      <th className="p-3 text-center w-32">AUTHENTICITÉ</th>
                      <th className="p-3 w-24">DATE</th>
                      <th className="p-3 text-center w-28">STATUT</th>
                      <th className="p-3 text-right w-44">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-xs font-sans">
                    {paginatedReviews.map((review) => (
                      <tr key={review.id} className="hover:bg-pros-bone/70 transition-colors font-sans">
                        
                        {/* Client Column */}
                        <td className="p-3 align-top">
                          <div className="font-bold text-black uppercase font-sans text-xs whitespace-nowrap">{review.customerName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[160px]" title={review.customerEmail}>
                            {review.customerEmail}
                          </div>
                        </td>

                        {/* Produit Column */}
                        <td className="p-3 align-top">
                          <div className="font-bold text-black uppercase font-sans text-xs truncate max-w-[180px]" title={review.productName}>
                            {review.productName}
                          </div>
                          {review.orderId ? (
                            <button
                              type="button"
                              onClick={() => navigate('/admin/orders')}
                              className="text-[10px] text-pros-gold font-mono font-bold hover:underline cursor-pointer block mt-0.5 inline-flex items-center gap-1"
                            >
                              <span>Réf: {review.orderId}</span>
                              <ExternalLink size={10} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">Réf: —</span>
                          )}
                        </td>

                        {/* Note Column */}
                        <td className="p-3 align-top">
                          {renderStars(review.rating)}
                        </td>

                        {/* Commentaire Column */}
                        <td className="p-3 align-top">
                          {review.title && (
                            <div className="font-bold text-black text-[11px] uppercase mb-0.5 truncate max-w-[240px]">
                              {review.title}
                            </div>
                          )}
                          <p className="text-neutral-700 text-xs leading-relaxed line-clamp-2 max-w-[320px]">
                            "{review.comment}"
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveReviewDetail(review)}
                            className="text-[10px] font-bold text-pros-black hover:text-pros-gold uppercase mt-1 cursor-pointer underline"
                          >
                            VOIR DÉTAIL
                          </button>
                        </td>

                        {/* Authenticité Column */}
                        <td className="p-3 text-center align-top">
                          {review.verifiedPurchase ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-bold uppercase inline-flex items-center gap-1">
                              <ShieldCheck size={10} className="text-emerald-600" /> ACHAT VÉRIFIÉ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-300 text-[9px] font-bold uppercase">
                              NON VÉRIFIÉ
                            </span>
                          )}
                        </td>

                        {/* Date Column */}
                        <td className="p-3 font-mono text-[10px] text-neutral-600 align-top">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                        </td>

                        {/* Statut Badge Column */}
                        <td className="p-3 text-center align-top">
                          {getStatusBadge(review.status)}
                        </td>

                        {/* Actions Column */}
                        <td className="p-3 text-right align-top space-x-1.5 font-sans relative">
                          <button
                            onClick={() => setActiveReviewDetail(review)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                            title="Voir détail complet"
                          >
                            <Eye size={14} />
                          </button>

                          {review.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(review)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] uppercase cursor-pointer shadow-sm inline-flex items-center gap-1"
                                title="Approuver l'avis"
                              >
                                <Check size={12} /> APPROUVER
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(review)}
                                className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] uppercase cursor-pointer shadow-sm inline-flex items-center gap-1"
                                title="Refuser l'avis"
                              >
                                <X size={12} /> REFUSER
                              </button>
                            </>
                          )}

                          {review.status === 'APPROVED' && (
                            <button
                              onClick={() => handleHide(review)}
                              className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase cursor-pointer"
                              title="Masquer de la boutique"
                            >
                              MASQUER
                            </button>
                          )}

                          {(review.status === 'REJECTED' || review.status === 'HIDDEN') && (
                            <button
                              onClick={() => handleApprove(review)}
                              className="px-2.5 py-1 bg-pros-black text-white hover:bg-neutral-800 font-bold text-[10px] uppercase cursor-pointer"
                              title="Réévaluer et approuver"
                            >
                              RÉAFFICHER
                            </button>
                          )}

                          {/* Options Menu Toggle */}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                            className="p-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black cursor-pointer inline-flex items-center"
                            title="Plus d'actions"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* Dropdown Options */}
                          {openMenuId === review.id && (
                            <div className="absolute right-3 top-10 z-20 w-44 bg-white border border-neutral-300 shadow-xl py-1 text-left font-sans animate-fade-in">
                              <button
                                onClick={() => setActiveReviewDetail(review)}
                                className="w-full px-3 py-2 text-[11px] text-black font-bold uppercase hover:bg-pros-bone flex items-center gap-2"
                              >
                                <Eye size={12} /> Voir la fiche
                              </button>
                              {review.status !== 'HIDDEN' && (
                                <button
                                  onClick={() => handleHide(review)}
                                  className="w-full px-3 py-2 text-[11px] text-neutral-700 font-bold uppercase hover:bg-pros-bone flex items-center gap-2"
                                >
                                  <X size={12} /> Masquer l'avis
                                </button>
                              )}
                              <button
                                onClick={() => setReviewToDelete(review)}
                                className="w-full px-3 py-2 text-[11px] text-red-600 font-bold uppercase hover:bg-red-50 flex items-center gap-2 border-t border-neutral-200"
                              >
                                <Trash2 size={12} /> Supprimer
                              </button>
                            </div>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW */}
              <div className="block md:hidden divide-y divide-neutral-200 font-sans">
                {paginatedReviews.map((review) => (
                  <div key={review.id} className="p-4 space-y-3 bg-white font-sans">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-black uppercase text-sm">{review.customerName}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{review.customerEmail}</div>
                      </div>
                      <div>{getStatusBadge(review.status)}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-xs text-black uppercase">{review.productName}</div>
                      {renderStars(review.rating)}
                    </div>

                    <p className="text-xs text-neutral-700 italic font-sans leading-relaxed">
                      "{review.comment}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-100">
                      <span>{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                      {review.verifiedPurchase && (
                        <span className="text-emerald-800 font-bold uppercase">✓ ACHAT VÉRIFIÉ</span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 font-sans">
                      <button
                        onClick={() => setActiveReviewDetail(review)}
                        className="flex-1 py-2 bg-pros-bone border border-neutral-300 font-bold text-xs uppercase"
                      >
                        VOIR DÉTAIL
                      </button>
                      {review.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprove(review)}
                          className="flex-1 py-2 bg-emerald-700 text-white font-bold text-xs uppercase"
                        >
                          APPROUVER
                        </button>
                      ) : (
                        <button
                          onClick={() => handleHide(review)}
                          className="flex-1 py-2 bg-white border border-neutral-300 text-neutral-700 font-bold text-xs uppercase"
                        >
                          MASQUER
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {filteredReviews.length > 0 && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-pros-bone border-t border-neutral-200 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-bold uppercase text-[10px]">Afficher :</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-neutral-300 px-2 py-1 text-black text-xs focus:outline-none"
                >
                  <option value={20}>20 par page</option>
                  <option value={50}>50 par page</option>
                </select>
                <span className="text-neutral-500 text-[10px] uppercase font-mono ml-2">
                  {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredReviews.length)} sur {filteredReviews.length} avis
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> PRÉCÉDENT
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 font-bold text-xs uppercase cursor-pointer flex items-center gap-1"
                >
                  SUIVANT <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reject Reason Selection Modal */}
        {rejectingReview && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 p-8 max-w-md w-full space-y-6 text-black font-sans shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h3 className="font-display font-bold text-base uppercase text-black flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={20} />
                  <span>REFUSER L'AVIS CLIENT</span>
                </h3>
                <button onClick={() => setRejectingReview(null)} className="text-neutral-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>

              <div className="p-3 bg-pros-bone border border-neutral-200 text-xs space-y-1 font-sans">
                <div className="font-bold text-black uppercase">{rejectingReview.customerName}</div>
                <div className="text-[11px] text-neutral-600">Produit : {rejectingReview.productName}</div>
                <div className="italic text-neutral-500 pt-1">"{rejectingReview.comment}"</div>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <label className="font-bold uppercase text-black block">MOTIF DU REFUS *</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none uppercase font-sans font-bold"
                >
                  <option value="Avis non conforme">Avis non conforme</option>
                  <option value="Contenu offensant ou injurieux">Contenu offensant ou injurieux</option>
                  <option value="Spam ou publicité">Spam ou publicité</option>
                  <option value="Contenu trompeur">Contenu trompeur</option>
                  <option value="Hors sujet">Hors sujet</option>
                  <option value="Autre">Autre motif</option>
                </select>

                {rejectReason === 'Autre' && (
                  <textarea
                    rows={2}
                    placeholder="Saisissez la raison administrative..."
                    value={customRejectNote}
                    onChange={(e) => setCustomRejectNote(e.target.value)}
                    className="w-full bg-pros-bone border border-neutral-300 px-3 py-2 text-black focus:outline-none font-sans"
                  />
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setRejectingReview(null)}
                  className="px-4 py-2 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                >
                  ANNULER
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                >
                  CONFIRMER LE REFUS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Review Drawer Modal */}
        {activeReviewDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={22} className="text-black" />
                  <h3 className="font-display font-bold text-lg uppercase text-black">
                    DÉTAIL DE L'AVIS CLIENT #{activeReviewDetail.id}
                  </h3>
                </div>
                <button onClick={() => setActiveReviewDetail(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              {/* Status & Verification Badges */}
              <div className="flex items-center justify-between p-4 bg-pros-bone border border-neutral-200">
                <div className="flex items-center gap-2 font-sans">
                  <span className="text-xs font-bold uppercase text-neutral-600">Statut :</span>
                  {getStatusBadge(activeReviewDetail.status)}
                </div>
                {activeReviewDetail.verifiedPurchase && (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold uppercase flex items-center gap-1 font-sans">
                    <ShieldCheck size={14} /> ACHAT VÉRIFIÉ
                  </span>
                )}
              </div>

              {/* Rating & Comment Content */}
              <div className="p-5 border border-neutral-200 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  {renderStars(activeReviewDetail.rating)}
                  <span className="text-xs font-mono text-neutral-500">
                    Publié le {new Date(activeReviewDetail.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>

                {activeReviewDetail.title && (
                  <h4 className="font-bold text-sm uppercase text-black">{activeReviewDetail.title}</h4>
                )}

                <p className="text-xs text-neutral-800 leading-relaxed whitespace-pre-wrap font-sans">
                  "{activeReviewDetail.comment}"
                </p>
              </div>

              {/* Customer & Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 border border-neutral-200 space-y-1 font-sans">
                  <span className="font-bold text-pros-gold uppercase text-[10px] block flex items-center gap-1">
                    <User size={12} /> INFORMATIONS CLIENT
                  </span>
                  <div className="font-bold text-black uppercase">{activeReviewDetail.customerName}</div>
                  <div className="font-mono text-neutral-600 text-[11px]">{activeReviewDetail.customerEmail}</div>
                </div>

                <div className="p-4 border border-neutral-200 space-y-1 font-sans">
                  <span className="font-bold text-pros-gold uppercase text-[10px] block flex items-center gap-1">
                    <ShoppingBag size={12} /> PRODUIT & COMMANDE
                  </span>
                  <div className="font-bold text-black uppercase">{activeReviewDetail.productName}</div>
                  {activeReviewDetail.orderId && (
                    <div className="font-mono text-black text-[11px]">Commande : {activeReviewDetail.orderId}</div>
                  )}
                </div>
              </div>

              {/* Moderation History */}
              {activeReviewDetail.moderatedBy && (
                <div className="p-4 bg-amber-50/60 border border-amber-200 text-xs space-y-1 font-sans">
                  <span className="font-bold uppercase text-[10px] text-amber-900 block flex items-center gap-1">
                    <History size={12} /> HISTORIQUE DE MODÉRATION
                  </span>
                  <div className="text-amber-950 font-sans">
                    Modéré par : <strong className="font-mono">{activeReviewDetail.moderatedBy}</strong> le{' '}
                    <span className="font-mono">
                      {activeReviewDetail.moderatedAt ? new Date(activeReviewDetail.moderatedAt).toLocaleString('fr-FR') : '—'}
                    </span>
                  </div>
                  {activeReviewDetail.adminNote && (
                    <div className="text-amber-900 font-sans pt-1">
                      Motif / Note administrative : <strong className="italic">"{activeReviewDetail.adminNote}"</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 flex justify-end">
                <button
                  onClick={() => setActiveReviewDetail(null)}
                  className="px-6 py-2 bg-pros-black text-white font-bold text-xs uppercase hover:bg-neutral-800"
                >
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Confirmation Dialog for Review Deletion */}
        <AdminConfirmDialog
          isOpen={!!reviewToDelete}
          title="SUPPRIMER L'AVIS CLIENT"
          message={`Êtes-vous sûr de vouloir supprimer définitivement l'avis de "${reviewToDelete?.customerName}" ? Cette action est irréversible.`}
          confirmText="SUPPRIMER DÉFINITIVEMENT"
          onConfirm={confirmDelete}
          onCancel={() => setReviewToDelete(null)}
        />

      </div>
    </AdminLayout>
  );
};
