import React, { useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { useCms } from '../../store/cmsContext';
import { useStore } from '../../store/storeContext';
import { useAuth } from '../../store/authContext';
import {
  Save,
  Send,
  Eye,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  RotateCcw,
  History,
  X,
  FileText,
} from 'lucide-react';

export const AdminHomepageCmsContent: React.FC = () => {
  const {
    draftCms,
    cmsAuditLogs,
    cmsVersions,
    isDraftModified,
    activeVersion,
    updateHeroSlide,
    addHeroSlide,
    deleteHeroSlide,
    updateCategory,
    updateCollection,
    updateAdvantage,
    addAdvantage,
    deleteAdvantage,
    toggleSlideStatus,
    toggleCategoryStatus,
    toggleCollectionStatus,
    toggleAdvantageStatus,
    saveDraft,
    validateDraft,
    publishCMS,
    restoreVersion,
  } = useCms();

  const { categories: storeCategories, collections: storeCollections } = useStore();
  const { hasPermission, currentUser } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'hero' | 'categories' | 'collections' | 'advantages' | 'audit'>('hero');
  const [auditSubTab, setAuditSubTab] = useState<'logs' | 'versions'>('logs');

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<'none' | 'desktop' | 'mobile'>('none');

  // Toast & Modal State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPublishSuccessModalOpen, setIsPublishSuccessModalOpen] = useState(false);
  const [publishedVersionInfo, setPublishedVersionInfo] = useState<{ version: string; date: string; author: string } | null>(null);

  // Media Picker Target Callback State
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    type: 'hero-desktop' | 'hero-mobile' | 'category' | 'collection';
    id: string;
  } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, msg });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Draft Save Handler
  const handleSaveDraft = () => {
    if (!hasPermission('EDIT_CMS')) {
      showToast("Vous n'avez pas la permission de modifier le CMS.", 'error');
      return;
    }
    saveDraft(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    showToast('Brouillon enregistré avec succès.', 'success');
  };

  // Publish Handler
  const handlePublish = () => {
    if (!hasPermission('PUBLISH_CMS')) {
      showToast("Vous n'avez pas la permission de publier en ligne.", 'error');
      return;
    }

    const validation = validateDraft();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showToast('Validation échouée : Veuillez corriger les erreurs avant publication.', 'error');
      return;
    }

    setValidationErrors([]);
    const res = publishCMS(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    if (res.success && res.version) {
      setPublishedVersionInfo({
        version: res.version,
        date: new Date().toLocaleString('fr-FR'),
        author: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS',
      });
      setIsPublishSuccessModalOpen(true);
    } else if (res.errors) {
      setValidationErrors(res.errors);
      showToast('Erreur lors de la publication.', 'error');
    }
  };

  // Version Restore Handler
  const handleRestoreVersion = (versionNumber: string) => {
    if (!hasPermission('PUBLISH_CMS')) {
      showToast("Vous n'avez pas la permission de restaurer des versions.", 'error');
      return;
    }
    restoreVersion(versionNumber, currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Admin PROS');
    showToast(`Version ${versionNumber} restaurée et publiée avec succès !`, 'success');
  };

  // Media Pick Handler
  const handleMediaSelected = (media: { id: string; url: string; altText: string; filename: string }) => {
    if (!mediaPickerTarget) return;

    if (mediaPickerTarget.type === 'hero-desktop') {
      const slide = draftCms.hero.find((s) => s.id === mediaPickerTarget.id);
      if (slide) {
        updateHeroSlide({
          ...slide,
          desktopMediaId: media.id,
          desktopImageUrl: media.url,
          imageAlt: media.altText || slide.imageAlt,
        });
      }
    } else if (mediaPickerTarget.type === 'hero-mobile') {
      const slide = draftCms.hero.find((s) => s.id === mediaPickerTarget.id);
      if (slide) {
        updateHeroSlide({
          ...slide,
          mobileMediaId: media.id,
          mobileImageUrl: media.url,
        });
      }
    } else if (mediaPickerTarget.type === 'category') {
      const cat = draftCms.categories.find((c) => c.id === mediaPickerTarget.id);
      if (cat) {
        updateCategory({
          ...cat,
          desktopMediaId: media.id,
          desktopImageUrl: media.url,
          mobileImageUrl: media.url,
        });
      }
    } else if (mediaPickerTarget.type === 'collection') {
      const col = draftCms.collections.find((c) => c.id === mediaPickerTarget.id);
      if (col) {
        updateCollection({
          ...col,
          mediaId: media.id,
          imageUrl: media.url,
        });
      }
    }

    setMediaPickerTarget(null);
    showToast(`Média "${media.filename}" sélectionné avec succès.`);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Unified Admin Header */}
        <AdminPageHeader
          eyebrow="GESTION DE CONTENU CMS"
          title="ADMINISTRATION DE LA PAGE D’ACCUEIL"
          description="Gérez les visuels, bannières responsive, catégories, avantages et collections publiées sur la homepage."
          primaryAction={
            <div className="flex items-center gap-3 font-sans">
              <button
                onClick={() => setPreviewMode(previewMode === 'none' ? 'desktop' : 'none')}
                className="px-3.5 py-2.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors font-sans cursor-pointer"
              >
                <Eye size={16} />
                <span>{previewMode !== 'none' ? 'FERMER APERÇU' : 'APERÇU'}</span>
              </button>

              {hasPermission('EDIT_CMS') && (
                <button
                  onClick={handleSaveDraft}
                  className="px-4 py-2.5 bg-white border border-pros-black hover:bg-neutral-100 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors font-sans cursor-pointer shadow-sm"
                >
                  <Save size={16} />
                  <span>ENREGISTRER BROUILLON</span>
                </button>
              )}

              {hasPermission('PUBLISH_CMS') && (
                <button
                  onClick={handlePublish}
                  className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 shadow-md transition-colors font-sans cursor-pointer"
                >
                  <Send size={16} />
                  <span>PUBLIER EN LIGNE ({activeVersion})</span>
                </button>
              )}
            </div>
          }
        />

        {/* Notifications & Banners */}
        {toastMessage && (
          <div
            className={`p-4 border text-xs font-bold flex items-center justify-between font-sans shadow-sm ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : toastMessage.type === 'error'
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-blue-50 border-blue-300 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-red-600" />}
              <span>{toastMessage.msg}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-neutral-500 hover:text-black">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-100 border border-red-300 text-red-900 text-xs space-y-2 font-sans">
            <div className="font-bold flex items-center gap-2 text-sm uppercase">
              <AlertCircle size={18} className="text-red-600" />
              <span>ERREURS DE VALIDATION AVANT PUBLICATION ({validationErrors.length})</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {isDraftModified && (
          <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between font-sans shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" />
              <span>Des modifications non publiées sont actuellement enregistrées en brouillon.</span>
            </div>
            {hasPermission('PUBLISH_CMS') && (
              <button onClick={handlePublish} className="underline font-bold hover:text-black cursor-pointer">
                Publier maintenant ({activeVersion}) &rarr;
              </button>
            )}
          </div>
        )}

        {/* Live Preview Modal (Desktop vs 390px Mobile Viewport) */}
        {previewMode !== 'none' && (
          <div className="bg-neutral-900 border border-neutral-700 p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase text-pros-gold font-mono">APERÇU TEMPS RÉEL CMS (BROUILLON)</span>
                <div className="flex bg-neutral-800 p-1 border border-neutral-700">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1 text-xs font-bold flex items-center gap-1 uppercase cursor-pointer ${
                      previewMode === 'desktop' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Monitor size={14} /> DESKTOP
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1 text-xs font-bold flex items-center gap-1 uppercase cursor-pointer ${
                      previewMode === 'mobile' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Smartphone size={14} /> MOBILE (390PX)
                  </button>
                </div>
              </div>
              <button onClick={() => setPreviewMode('none')} className="text-white font-bold text-xs uppercase cursor-pointer">
                ✕ FERMER APERÇU
              </button>
            </div>

            {/* Simulated Frame */}
            <div
              className={`mx-auto bg-white text-black overflow-hidden transition-all duration-300 ${
                previewMode === 'mobile' ? 'w-[390px] h-[650px] border-8 border-neutral-800 rounded-3xl overflow-y-auto' : 'w-full h-[450px] overflow-y-auto'
              }`}
            >
              <div className="p-3 bg-pros-black text-white text-center text-[10px] font-bold uppercase">
                HERO PREVIEW — {draftCms.hero[0]?.eyebrow || 'ACCUEIL PROS'}
              </div>
              <div className="relative min-h-[300px] bg-neutral-900 text-white p-6 flex flex-col justify-end">
                {previewMode === 'mobile' ? (
                  draftCms.hero[0]?.mobileImageUrl || draftCms.hero[0]?.desktopImageUrl ? (
                    <img
                      src={draftCms.hero[0]?.mobileImageUrl || draftCms.hero[0]?.desktopImageUrl}
                      alt="Preview Mobile"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">
                      IMAGE NON CONFIGURÉE
                    </div>
                  )
                ) : (
                  draftCms.hero[0]?.desktopImageUrl ? (
                    <img
                      src={draftCms.hero[0]?.desktopImageUrl}
                      alt="Preview Desktop"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">
                      IMAGE NON CONFIGURÉE
                    </div>
                  )
                )}
                <div className="relative z-10 space-y-2">
                  <h2 className="font-display font-bold text-2xl uppercase">
                    {draftCms.hero[0]?.titleLine1} {draftCms.hero[0]?.titleLine2} {draftCms.hero[0]?.titleLine3}
                  </h2>
                  <p className="text-xs uppercase text-neutral-300">{draftCms.hero[0]?.subtitle}</p>
                  <span className="inline-block bg-white text-black font-bold text-[10px] px-4 py-2 uppercase mt-2">
                    {draftCms.hero[0]?.ctaText}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 gap-2 font-sans overflow-x-auto">
          {[
            { id: 'hero', label: '1. HERO BANNER' },
            { id: 'categories', label: '2. CATÉGORIES' },
            { id: 'collections', label: '3. COLLECTIONS' },
            { id: 'advantages', label: '4. AVANTAGES' },
            { id: 'audit', label: '5. JOURNAL AUDIT & VERSIONS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-5 text-xs font-bold uppercase border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-pros-black text-black bg-pros-bone'
                  : 'border-transparent text-neutral-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: HERO SLIDES MANAGEMENT */}
        {activeTab === 'hero' && (
          <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase text-neutral-500">
                LISTE DES BANNIÈRES HERO DE LA HOMEPAGE ({draftCms.hero.length})
              </h3>
              {hasPermission('EDIT_CMS') && (
                <button
                  onClick={addHeroSlide}
                  className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>AJOUTER UNE BANNIÈRE HERO</span>
                </button>
              )}
            </div>

            {draftCms.hero.map((slide, idx) => (
              <div key={slide.id} className="bg-white border border-neutral-200 p-6 space-y-6 shadow-sm font-sans">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-pros-gold uppercase font-mono">SLIDE HERO #{idx + 1}</span>
                    <span
                      className={`px-2.5 py-0.5 text-[9px] font-bold border uppercase ${
                        slide.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {slide.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSlideStatus(slide.id)}
                      className="text-xs font-bold text-black underline uppercase cursor-pointer"
                    >
                      {slide.status === 'ACTIVE' ? 'DÉSACTIVER' : 'ACTIVER'}
                    </button>
                    {draftCms.hero.length > 1 && (
                      <button
                        onClick={() => deleteHeroSlide(slide.id)}
                        className="text-xs font-bold text-red-600 hover:underline uppercase cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={13} />
                        <span>SUPPRIMER</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
                  {/* Left Column: Text Fields */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Eyebrow (Petit Titre En-Tête)</label>
                      <input
                        type="text"
                        value={slide.eyebrow}
                        onChange={(e) => updateHeroSlide({ ...slide, eyebrow: e.target.value })}
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Ligne 1</label>
                        <input
                          type="text"
                          value={slide.titleLine1}
                          onChange={(e) => updateHeroSlide({ ...slide, titleLine1: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Ligne 2</label>
                        <input
                          type="text"
                          value={slide.titleLine2}
                          onChange={(e) => updateHeroSlide({ ...slide, titleLine2: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Ligne 3</label>
                        <input
                          type="text"
                          value={slide.titleLine3}
                          onChange={(e) => updateHeroSlide({ ...slide, titleLine3: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold uppercase text-black block">Sous-Titre / Devise</label>
                      <input
                        type="text"
                        value={slide.subtitle}
                        onChange={(e) => updateHeroSlide({ ...slide, subtitle: e.target.value })}
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Texte Bouton CTA *</label>
                        <input
                          type="text"
                          value={slide.ctaText}
                          onChange={(e) => updateHeroSlide({ ...slide, ctaText: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">URL Cible CTA *</label>
                        <input
                          type="text"
                          value={slide.ctaPath}
                          onChange={(e) => updateHeroSlide({ ...slide, ctaPath: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Responsive Images with Media Library Picker */}
                  <div className="space-y-4 border-l border-neutral-200 pl-6 font-sans">
                    {/* Desktop Image */}
                    <div className="space-y-2">
                      <label className="font-bold uppercase text-black flex items-center justify-between">
                        <span>Image Desktop (Large Viewport) *</span>
                        <Monitor size={14} className="text-neutral-500" />
                      </label>
                      <div className="flex gap-4 items-center">
                        {slide.desktopImageUrl ? (
                          <img src={slide.desktopImageUrl} alt="Desktop" className="w-28 h-20 object-cover border border-neutral-300" />
                        ) : (
                          <div className="w-28 h-20 bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-[9px] font-bold text-neutral-400 uppercase">IMAGE NON CONFIGURÉE</span>
                          </div>
                        )}
                        <div className="space-y-1 text-xs">
                          {slide.desktopMediaId && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-pros-black text-pros-gold uppercase">
                              {slide.desktopMediaId}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setMediaPickerTarget({ type: 'hero-desktop', id: slide.id })}
                              className="px-3 py-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <ImageIcon size={13} />
                              <span>REMPLACER</span>
                            </button>
                            {slide.desktopImageUrl && (
                              <button
                                type="button"
                                onClick={() => updateHeroSlide({ ...slide, desktopMediaId: '', desktopImageUrl: '' })}
                                className="px-2.5 py-1.5 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 font-bold text-xs uppercase cursor-pointer flex items-center gap-1 font-sans"
                              >
                                <X size={13} />
                                <span>RETIRER</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Image */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <label className="font-bold uppercase text-black flex items-center justify-between">
                        <span>Image Mobile (Viewport 390px)</span>
                        <Smartphone size={14} className="text-neutral-500" />
                      </label>
                      <div className="flex gap-4 items-center">
                        {slide.mobileImageUrl || slide.desktopImageUrl ? (
                          <img src={slide.mobileImageUrl || slide.desktopImageUrl} alt="Mobile" className="w-16 h-20 object-cover border border-neutral-300" />
                        ) : (
                          <div className="w-16 h-20 bg-neutral-900 border border-neutral-700 flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-[8px] font-bold text-neutral-400 uppercase">IMAGE NON CONFIGURÉE</span>
                          </div>
                        )}
                        <div className="space-y-1 text-xs">
                          {slide.mobileMediaId && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-pros-black text-pros-gold uppercase">
                              {slide.mobileMediaId}
                            </span>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setMediaPickerTarget({ type: 'hero-mobile', id: slide.id })}
                              className="px-3 py-1.5 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase cursor-pointer flex items-center gap-1 font-sans"
                            >
                              <ImageIcon size={13} />
                              <span>REMPLACER</span>
                            </button>
                            {slide.mobileImageUrl && (
                              <button
                                type="button"
                                onClick={() => updateHeroSlide({ ...slide, mobileMediaId: '', mobileImageUrl: '' })}
                                className="px-2.5 py-1.5 bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 font-bold text-xs uppercase cursor-pointer flex items-center gap-1 font-sans"
                              >
                                <X size={13} />
                                <span>RETIRER</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {!slide.mobileImageUrl && (
                        <div className="text-[10px] text-neutral-500 italic">
                          Remarque: Si aucune image mobile n'est sélectionnée, l'image Desktop sera utilisée comme fallback.
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 pt-2">
                      <label className="font-bold uppercase text-black block">Texte ALT Image (SEO / Accessibilité)</label>
                      <input
                        type="text"
                        value={slide.imageAlt}
                        onChange={(e) => updateHeroSlide({ ...slide, imageAlt: e.target.value })}
                        className="w-full bg-pros-bone border border-neutral-300 p-2.5 text-black font-sans focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-pros-bone border border-neutral-200 text-xs font-sans flex justify-between items-center">
              <div>
                <strong>CATÉGORIES DU CATALOGUE PROS ({storeCategories.length})</strong>
                <p className="text-neutral-500 text-[11px]">
                  Sélectionnez et personnalisez les catégories qui seront mises en avant sur la page d'accueil.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              {draftCms.categories.map((cat) => (
                <div key={cat.id} className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans flex flex-col justify-between">
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                      <h3 className="font-display font-bold text-sm uppercase text-black">{cat.title}</h3>
                      <button
                        onClick={() => toggleCategoryStatus(cat.id)}
                        className={`px-2 py-0.5 text-[9px] font-bold border uppercase cursor-pointer ${
                          cat.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {cat.status}
                      </button>
                    </div>

                    {cat.desktopImageUrl ? (
                      <img src={cat.desktopImageUrl} alt={cat.title} className="w-full h-36 object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-full h-36 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">
                        IMAGE NON CONFIGURÉE
                      </div>
                    )}

                    <div className="space-y-2 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Titre Affiché</label>
                        <input
                          type="text"
                          value={cat.title}
                          onChange={(e) => updateCategory({ ...cat, title: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Description Courte</label>
                        <textarea
                          rows={2}
                          value={cat.description}
                          onChange={(e) => updateCategory({ ...cat, description: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">URL Cible</label>
                        <input
                          type="text"
                          value={cat.url}
                          onChange={(e) => updateCategory({ ...cat, url: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget({ type: 'category', id: cat.id })}
                    className="px-3 py-2 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-1.5 w-full font-sans mt-4"
                  >
                    <ImageIcon size={14} />
                    <span>CHANGER VISUEL DE LA CATÉGRIE</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COLLECTIONS MANAGEMENT */}
        {activeTab === 'collections' && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-pros-bone border border-neutral-200 text-xs font-sans flex justify-between items-center">
              <div>
                <strong>COLLECTIONS DU CATALOGUE PROS ({storeCollections.length})</strong>
                <p className="text-neutral-500 text-[11px]">
                  Mettez en avant les collections phares sur la homepage publique.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              {draftCms.collections.map((col) => (
                <div key={col.id} className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans flex flex-col justify-between">
                  <div className="space-y-3 font-sans">
                    <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
                      <h3 className="font-display font-bold text-sm uppercase text-black">{col.title}</h3>
                      <button
                        onClick={() => toggleCollectionStatus(col.id)}
                        className={`px-2 py-0.5 text-[9px] font-bold border uppercase cursor-pointer ${
                          col.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {col.status}
                      </button>
                    </div>

                    {col.imageUrl ? (
                      <img src={col.imageUrl} alt={col.title} className="w-full h-44 object-cover border border-neutral-200" />
                    ) : (
                      <div className="w-full h-44 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400 uppercase">
                        IMAGE NON CONFIGURÉE
                      </div>
                    )}

                    <div className="space-y-2 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Titre Collection</label>
                        <input
                          type="text"
                          value={col.title}
                          onChange={(e) => updateCollection({ ...col, title: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">Description Lifestyle</label>
                        <input
                          type="text"
                          value={col.description}
                          onChange={(e) => updateCollection({ ...col, description: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold uppercase text-black block">URL Cible</label>
                        <input
                          type="text"
                          value={col.url}
                          onChange={(e) => updateCollection({ ...col, url: e.target.value })}
                          className="w-full bg-pros-bone border border-neutral-300 p-2 text-black focus:outline-none focus:border-black font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget({ type: 'collection', id: col.id })}
                    className="px-3 py-2 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-1.5 w-full font-sans mt-4"
                  >
                    <ImageIcon size={14} />
                    <span>MODIFIER LE VISUEL LIFESTYLE</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ADVANTAGES / SERVICES */}
        {activeTab === 'advantages' && (
          <div className="space-y-6 font-sans">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase text-neutral-500">
                BLOCS AVANTAGES & PRIVILÈGES PROS ({draftCms.advantages.length})
              </h3>
              {hasPermission('EDIT_CMS') && (
                <button
                  onClick={addAdvantage}
                  className="px-4 py-2 bg-pros-black text-white text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>AJOUTER UN AVANTAGE</span>
                </button>
              )}
            </div>

            <div className="space-y-4 font-sans">
              {draftCms.advantages.map((adv) => (
                <div key={adv.id} className="bg-white border border-neutral-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4 font-sans shadow-sm">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <span className="font-bold text-pros-gold font-mono text-sm">#{adv.order}</span>
                    
                    {/* Icon Select */}
                    <select
                      value={adv.iconName}
                      onChange={(e) => updateAdvantage({ ...adv, iconName: e.target.value })}
                      className="bg-pros-bone border border-neutral-300 p-2 text-xs font-mono font-bold text-black focus:outline-none cursor-pointer"
                    >
                      <option value="Truck">Truck (Livraison)</option>
                      <option value="ShieldCheck">ShieldCheck (Sécurité)</option>
                      <option value="Award">Award (Qualité)</option>
                      <option value="Headphones">Headphones (Support)</option>
                      <option value="RotateCcw">RotateCcw (Retours)</option>
                    </select>

                    <div className="space-y-1 flex-1">
                      <input
                        type="text"
                        value={adv.title}
                        onChange={(e) => updateAdvantage({ ...adv, title: e.target.value })}
                        className="font-bold text-black uppercase bg-pros-bone p-2 text-xs w-full focus:outline-none focus:border-black font-sans"
                      />
                      <input
                        type="text"
                        value={adv.subtitle}
                        onChange={(e) => updateAdvantage({ ...adv, subtitle: e.target.value })}
                        className="text-neutral-600 text-xs bg-pros-bone p-2 w-full focus:outline-none focus:border-black font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleAdvantageStatus(adv.id)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase border cursor-pointer ${
                        adv.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {adv.status}
                    </button>

                    {draftCms.advantages.length > 1 && (
                      <button
                        onClick={() => deleteAdvantage(adv.id)}
                        className="text-red-600 p-2 hover:bg-red-50 cursor-pointer"
                        title="Supprimer l'avantage"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CMS AUDIT LOG & VERSIONS */}
        {activeTab === 'audit' && (
          <div className="space-y-6 font-sans">
            {/* Sub-tabs */}
            <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase font-sans">
              <button
                onClick={() => setAuditSubTab('logs')}
                className={`pb-2.5 border-b-2 font-sans cursor-pointer flex items-center gap-2 ${
                  auditSubTab === 'logs' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
                }`}
              >
                <FileText size={16} />
                <span>JOURNAL D'AUDIT COMPLET ({cmsAuditLogs.length})</span>
              </button>
              <button
                onClick={() => setAuditSubTab('versions')}
                className={`pb-2.5 border-b-2 font-sans cursor-pointer flex items-center gap-2 ${
                  auditSubTab === 'versions' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
                }`}
              >
                <History size={16} />
                <span>HISTORIQUE DES VERSIONS PUBLIÉES ({cmsVersions.length})</span>
              </button>
            </div>

            {/* SUB-TAB 1: AUDIT LOGS */}
            {auditSubTab === 'logs' && (
              <div className="bg-white border border-neutral-200 p-6 space-y-4 shadow-sm font-sans">
                <h3 className="font-display font-bold text-sm uppercase text-black pb-3 border-b border-neutral-200">
                  ÉVÉNEMENTS RECOLTÉS PAR LE SYSTEME D'AUDIT PROS
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead className="bg-pros-bone border-b border-neutral-200 text-[10px] font-bold text-black uppercase font-sans">
                      <tr>
                        <th className="p-3">HORODATAGE</th>
                        <th className="p-3">ADMINISTRATEUR</th>
                        <th className="p-3">ACTION</th>
                        <th className="p-3">MODULE</th>
                        <th className="p-3">ÉLÉMENT MODIFIÉ</th>
                        <th className="p-3">VALEUR APPLIQUÉE</th>
                        <th className="p-3 text-center">VERSION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-sans text-[11px]">
                      {cmsAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-neutral-500 font-sans">
                            Aucun événement CMS enregistré pour le moment.
                          </td>
                        </tr>
                      ) : (
                        cmsAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-pros-bone/60 transition-colors font-sans">
                            <td className="p-3 font-mono text-[10px] text-neutral-500">{log.timestamp}</td>
                            <td className="p-3 font-bold text-black uppercase">{log.adminName}</td>
                            <td className="p-3 font-bold text-pros-gold uppercase">{log.action}</td>
                            <td className="p-3 uppercase font-mono">{log.section}</td>
                            <td className="p-3 font-bold text-black">{log.itemModified || '-'}</td>
                            <td className="p-3 font-mono text-[10px] text-neutral-700 truncate max-w-xs">{log.newValue}</td>
                            <td className="p-3 text-center font-mono font-bold text-black">{log.version || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: VERSION HISTORY & ROLLBACK */}
            {auditSubTab === 'versions' && (
              <div className="space-y-4 font-sans">
                <div className="p-4 bg-pros-bone border border-neutral-200 text-xs font-sans">
                  <strong>SYSTÈME DE VERSIONING CMS (VERSION ACTUELLE EN LIGNE : {activeVersion})</strong>
                  <p className="text-neutral-500 text-[11px]">
                    Consultez les anciennes versions publiées de la page d'accueil et restaurez une version antérieure si nécessaire.
                  </p>
                </div>

                <div className="space-y-4 font-sans">
                  {cmsVersions.map((ver, idx) => {
                    const isCurrent = idx === 0;
                    return (
                      <div key={ver.version} className="bg-white border border-neutral-200 p-6 space-y-3 font-sans shadow-sm">
                        <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-extrabold text-lg text-black">{ver.version}</span>
                              {isCurrent && (
                                <span className="px-2.5 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold font-mono uppercase">
                                  VERSION ACTUELLE EN LIGNE
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500 font-mono mt-1">
                              Publié le {new Date(ver.publishedAt).toLocaleString('fr-FR')} par <strong>{ver.publishedBy}</strong>
                            </div>
                          </div>

                          {!isCurrent && hasPermission('PUBLISH_CMS') && (
                            <button
                              onClick={() => handleRestoreVersion(ver.version)}
                              className="px-4 py-2 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer font-sans"
                            >
                              <RotateCcw size={14} />
                              <span>RESTAURER CETTE VERSION</span>
                            </button>
                          )}
                        </div>

                        {ver.notes && (
                          <div className="text-xs text-neutral-700 italic font-sans">
                            Notes de publication: "{ver.notes}"
                          </div>
                        )}

                        <div className="text-[11px] text-neutral-500 font-mono pt-1">
                          Contenu archivé: {ver.dataSnapshot.hero.length} Hero Slide(s), {ver.dataSnapshot.categories.length} Catégorie(s), {ver.dataSnapshot.collections.length} Collection(s), {ver.dataSnapshot.advantages.length} Avantage(s).
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEDIA PICKER MODAL */}
        <MediaPickerModal
          isOpen={!!mediaPickerTarget}
          onClose={() => setMediaPickerTarget(null)}
          onSelectMedia={handleMediaSelected}
        />

        {/* PUBLISH SUCCESS MODAL */}
        {isPublishSuccessModalOpen && publishedVersionInfo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-md w-full p-8 space-y-6 text-black font-sans shadow-2xl text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-bold text-xl uppercase text-black">PUBLICATION RÉUSSIE !</h3>
                <p className="text-xs text-neutral-600 font-sans">
                  La nouvelle version de la page d'accueil PROS est désormais active et visible pour tous les visiteurs.
                </p>
              </div>

              <div className="p-4 bg-pros-bone border border-neutral-200 text-xs font-mono space-y-1 text-left">
                <div><strong>Version publiée :</strong> {publishedVersionInfo.version}</div>
                <div><strong>Date :</strong> {publishedVersionInfo.date}</div>
                <div><strong>Publié par :</strong> {publishedVersionInfo.author}</div>
              </div>

              <button
                onClick={() => setIsPublishSuccessModalOpen(false)}
                className="w-full py-3 bg-pros-black text-white font-bold uppercase text-xs cursor-pointer shadow-md"
              >
                FERMER & CONTINUER
              </button>
            </div>
          </div>
        )}

      </div>
  );
};

export const AdminHomepageCmsPage: React.FC = () => (
  <AdminLayout>
    <AdminHomepageCmsContent />
  </AdminLayout>
);
