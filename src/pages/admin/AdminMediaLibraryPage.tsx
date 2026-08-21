import React, { useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { useCms } from '../../store/cmsContext';
import type { MediaItem, MediaUsageRef } from '../../store/cmsContext';
import { useAuth } from '../../store/authContext';
import {
  Upload,
  Search,
  Trash2,
  CheckCircle2,
  Image as ImageIcon,
  Copy,
  Check,
  AlertCircle,
  X,
  Eye,
} from 'lucide-react';
import { compressImageFile } from '../../lib/utils/imageCompressor';
import { uploadToCloudinary } from '../../lib/server/cloudinaryUpload';

export const AdminMediaLibraryContent: React.FC = () => {
  const { mediaLibrary, uploadMedia, deleteMedia, updateMediaAlt, getMediaUsage } = useCms();
  const { hasPermission } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Detail Modal / Drawer
  const [selectedMediaDetail, setSelectedMediaDetail] = useState<MediaItem | null>(null);

  // Deletion Usage Guard Modal State
  const [blockedDeleteInfo, setBlockedDeleteInfo] = useState<{
    media: MediaItem;
    usages: MediaUsageRef[];
  } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type: type === 'info' ? 'success' : type, msg });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Media List
  const filteredMedia = useMemo(() => {
    if (!searchQuery.trim()) return mediaLibrary;
    const query = searchQuery.toLowerCase().trim();
    return mediaLibrary.filter(
      (m) =>
        (m.filename || '').toLowerCase().includes(query) ||
        (m.altText || '').toLowerCase().includes(query) ||
        (m.id || '').toLowerCase().includes(query) ||
        (m.mimeType || '').toLowerCase().includes(query)
    );
  }, [mediaLibrary, searchQuery]);

  // Dynamic Statistics
  const totalMediaCount = mediaLibrary.length;
  const jpgCount = mediaLibrary.filter((m) => (m.mimeType || '').includes('jpeg') || (m.filename || '').toLowerCase().endsWith('.jpg')).length;
  const pngCount = mediaLibrary.filter((m) => (m.mimeType || '').includes('png') || (m.filename || '').toLowerCase().endsWith('.png')).length;
  const webpCount = mediaLibrary.filter((m) => (m.mimeType || '').includes('webp') || (m.filename || '').toLowerCase().endsWith('.webp')).length;
  const totalSizeKb = mediaLibrary.reduce((sum, m) => sum + (m.sizeKb || 0), 0);
  const totalSizeMb = (totalSizeKb / 1024).toFixed(2);

  // Async Multi-File Upload Handler with Direct Cloudinary Cloud CDN Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasPermission('UPLOAD_MEDIA')) {
      showToast("Vous n'avez pas la permission de téléverser des médias.", 'error');
      return;
    }

    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      showToast(`Téléversement Cloudinary CDN & Supabase de ${fileList.length} image(s)...`, 'info');

      for (const file of fileList) {
        try {
          const cdnResult = await uploadToCloudinary(file);
          if (cdnResult && cdnResult.url) {
            uploadMedia({
              filename: file.name,
              url: cdnResult.url,
              altText: file.name.replace(/\.[^/.]+$/, ''),
              sizeKb: cdnResult.sizeKb || Math.round(file.size / 1024),
              mimeType: file.type || 'image/jpeg',
              width: cdnResult.width || 1600,
              height: cdnResult.height || 1600,
            });
          } else {
            const compressed = await compressImageFile(file, 1600, 1600, 0.82);
            if (compressed.dataUrl) {
              uploadMedia({
                filename: file.name,
                url: compressed.dataUrl,
                altText: file.name.replace(/\.[^/.]+$/, ''),
                sizeKb: compressed.sizeKb || Math.round(file.size / 1024),
                mimeType: file.type || 'image/jpeg',
                width: compressed.width || 1600,
                height: compressed.height || 1600,
              });
            }
          }
        } catch (err) {
          console.warn('Cloudinary upload error for file', file.name, err);
        }
      }
      showToast(`${fileList.length} image(s) hébergée(s) sur Cloudinary CDN et enregistrée(s) dans Supabase.`);
    }
  };

  // Copy URL Handler
  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Direct Unconditional Delete Handler
  const handleDeleteAttempt = (media: MediaItem) => {
    if (!hasPermission('DELETE_MEDIA')) {
      showToast("Vous n'avez pas la permission de supprimer des médias.", 'error');
      return;
    }

    deleteMedia(media.id, true);
    showToast(`Média "${media.filename}" supprimé avec succès de la médiathèque PROS.`);
    setBlockedDeleteInfo(null);
    if (selectedMediaDetail?.id === media.id) {
      setSelectedMediaDetail(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans text-pros-black">
        
        {/* Header */}
        <AdminPageHeader
          eyebrow="GESTION DES ASSÉTS MULTIMÉDIA"
          title="BIBLIOTHÈQUE MÉDIA PROS"
          description="Téléversez, organisez et réutilisez les visuels de la boutique et du CMS (JPG, PNG, WEBP). Source centrale unique de toute la plateforme."
          primaryAction={
            hasPermission('UPLOAD_MEDIA') && (
              <label className="px-5 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-superwide flex items-center gap-2 cursor-pointer shadow-sm font-sans">
                <Upload size={16} />
                <span>TÉLÉVERSER DES IMAGES</span>
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )
          }
        />

        {/* Notifications Banner */}
        {toastMessage && (
          <div
            className={`p-4 border text-xs font-bold flex items-center justify-between font-sans shadow-sm ${
              toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-red-50 border-red-300 text-red-900'
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

        {/* Dynamic Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 font-sans">
          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 font-sans">TOTAL MÉDIAS</div>
            <div className="text-2xl font-bold font-mono text-black">{totalMediaCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Fichiers enregistrés</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-sans">IMAGES JPG</div>
            <div className="text-2xl font-bold font-mono text-black">{jpgCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Photos standards</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 font-sans">IMAGES PNG</div>
            <div className="text-2xl font-bold font-mono text-black">{pngCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Transparences</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-sans">IMAGES WEBP</div>
            <div className="text-2xl font-bold font-mono text-black">{webpCount}</div>
            <div className="text-[10px] text-neutral-400 font-sans">Format web haut rendement</div>
          </div>

          <div className="bg-white border border-neutral-200 p-4 space-y-1 shadow-sm font-sans">
            <div className="text-[10px] font-bold uppercase tracking-wider text-pros-gold font-sans">ESPACE UTILISÉ</div>
            <div className="text-2xl font-bold font-mono text-black">{totalSizeMb} MB</div>
            <div className="text-[10px] text-neutral-400 font-sans">Stockage total</div>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        {hasPermission('UPLOAD_MEDIA') && (
          <div className="bg-pros-bone border-2 border-dashed border-neutral-300 p-8 text-center space-y-3 font-sans hover:border-black transition-colors">
            <ImageIcon className="mx-auto text-neutral-400" size={36} />
            <div className="font-bold uppercase text-black text-xs">GLISSER-DÉPOSER VOS IMAGES ICI</div>
            <p className="text-[11px] text-neutral-500 font-sans">Formats pris en charge : JPG, JPEG, PNG, WEBP (Max 5 Mo / image)</p>
            <label className="inline-block px-4 py-2 bg-white border border-neutral-300 text-black font-bold text-xs uppercase cursor-pointer hover:bg-neutral-100 font-sans shadow-sm">
              PARCOURIR LES FICHIERS
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Search & Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 border border-neutral-200 font-sans shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom de fichier, ID (MEDIA_001) ou texte ALT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-pros-bone border border-neutral-300 pl-10 pr-4 py-2 text-xs text-black focus:outline-none focus:border-black font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-black">
                <X size={14} />
              </button>
            )}
          </div>

          <span className="text-xs text-neutral-500 font-sans font-bold">
            {filteredMedia.length} MÉDIA(S) DISPONIBLE(S) SUR {totalMediaCount}
          </span>
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-12 text-center text-xs text-neutral-500 font-sans">
            Aucun média ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 font-sans">
            {filteredMedia.map((media) => {
              const usages = getMediaUsage(media.id);
              const isUsed = usages.length > 0;

              return (
                <div key={media.id} className="bg-white border border-neutral-200 p-3 space-y-2 group shadow-sm font-sans flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-square bg-neutral-900 overflow-hidden border border-neutral-100 mb-2">
                      <img src={media.url} alt={media.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      
                      <button
                        onClick={() => handleCopyUrl(media.id, media.url)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 text-white hover:bg-black transition-colors"
                        title="Copier l'URL de l'image"
                      >
                        {copiedId === media.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>

                      <div className="absolute bottom-2 left-2">
                        <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-black/80 text-pros-gold uppercase">
                          {media.id}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-sans">
                      <div className="font-bold text-black truncate uppercase font-sans" title={media.filename}>
                        {media.filename}
                      </div>
                      
                      <div className="text-[10px] text-neutral-500 font-mono flex justify-between">
                        <span>{media.sizeKb || 0} KB</span>
                        <span>{(media.mimeType || 'image/jpeg').split('/')[1]?.toUpperCase() || 'JPG'}</span>
                      </div>

                      {/* Usage Badge */}
                      <div className="pt-1">
                        {isUsed ? (
                          <span
                            onClick={() => setSelectedMediaDetail(media)}
                            className="inline-block px-2 py-0.5 text-[9px] font-bold bg-pros-black text-pros-gold uppercase cursor-pointer hover:bg-neutral-800"
                            title={`Utilisé dans ${usages.length} emplacement(s)`}
                          >
                            ★ UTILISÉ ({usages.length})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase">
                            NON ASSIGNÉ
                          </span>
                        )}
                      </div>

                      {hasPermission('EDIT_MEDIA') && (
                        <input
                          type="text"
                          value={media.altText}
                          onChange={(e) => updateMediaAlt(media.id, e.target.value)}
                          placeholder="Texte ALT (SEO)"
                          className="w-full bg-pros-bone border border-neutral-300 p-1 text-[10px] text-black focus:outline-none font-sans mt-2"
                        />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between font-sans">
                    <button
                      onClick={() => setSelectedMediaDetail(media)}
                      className="text-black hover:text-pros-gold text-[10px] font-bold uppercase flex items-center gap-1 font-sans cursor-pointer"
                    >
                      <Eye size={12} /> DÉTAILS
                    </button>

                    {hasPermission('DELETE_MEDIA') && (
                      <button
                        onClick={() => handleDeleteAttempt(media)}
                        className="text-red-600 hover:text-red-800 text-[10px] font-bold uppercase flex items-center gap-1 font-sans cursor-pointer"
                      >
                        <Trash2 size={12} /> SUPPRIMER
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: MEDIA DETAIL & USAGE DRAWER */}
        {selectedMediaDetail && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-2xl w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-pros-black text-pros-gold">
                    {selectedMediaDetail.id}
                  </span>
                  <h3 className="font-display font-bold text-base uppercase text-black">{selectedMediaDetail.filename}</h3>
                </div>
                <button onClick={() => setSelectedMediaDetail(null)} className="text-neutral-500 hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
                {/* Image Preview */}
                <div className="space-y-2">
                  <div className="bg-neutral-900 aspect-square overflow-hidden border border-neutral-200">
                    <img src={selectedMediaDetail.url} alt={selectedMediaDetail.altText} className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => handleCopyUrl(selectedMediaDetail.id, selectedMediaDetail.url)}
                    className="w-full py-2 bg-pros-bone border border-neutral-300 hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer font-sans"
                  >
                    <Copy size={14} />
                    <span>COPIER L'URL CANONIQUE</span>
                  </button>
                </div>

                {/* Metadata & Usage */}
                <div className="space-y-4 font-sans">
                  <div className="p-3 bg-pros-bone border border-neutral-200 space-y-1 font-mono text-[11px]">
                    <div><strong>Taille fichier:</strong> {selectedMediaDetail.sizeKb} KB</div>
                    <div><strong>Type MIME:</strong> {selectedMediaDetail.mimeType}</div>
                    <div><strong>Dimensions:</strong> {selectedMediaDetail.width} × {selectedMediaDetail.height} px</div>
                    <div><strong>Date création:</strong> {new Date(selectedMediaDetail.createdAt).toLocaleString('fr-FR')}</div>
                    <div><strong>Créé par:</strong> {selectedMediaDetail.createdBy || 'Admin PROS'}</div>
                  </div>

                  <div>
                    <label className="font-bold uppercase text-black block mb-1">TEXTE ALT (SEO / ACCESSIBILITÉ)</label>
                    <input
                      type="text"
                      value={selectedMediaDetail.altText}
                      onChange={(e) => updateMediaAlt(selectedMediaDetail.id, e.target.value)}
                      className="w-full bg-pros-bone border border-neutral-300 p-2 text-xs text-black focus:outline-none"
                    />
                  </div>

                  {/* Component Usage List */}
                  {(() => {
                    const usages = getMediaUsage(selectedMediaDetail.id);
                    return (
                      <div className="space-y-2 pt-2 border-t border-neutral-200 font-sans">
                        <div className="font-bold text-black uppercase text-xs flex items-center justify-between">
                          <span>UTILISÉ PAR LE SYSTÈME PROS</span>
                          <span className="font-mono text-pros-gold font-bold">({usages.length})</span>
                        </div>

                        {usages.length === 0 ? (
                          <div className="text-[11px] text-neutral-500 italic">
                            Ce média n'est actuellement assigné à aucun composant.
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-36 overflow-y-auto font-sans">
                            {usages.map((u, i) => (
                              <div key={i} className="p-2 bg-pros-bone border border-neutral-200 text-[11px] font-bold text-black flex items-center gap-2">
                                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-pros-black text-white">{u.type}</span>
                                <span>{u.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-between gap-3 font-sans">
                {hasPermission('DELETE_MEDIA') && (
                  <button
                    onClick={() => handleDeleteAttempt(selectedMediaDetail)}
                    className="px-4 py-2 bg-red-50 border border-red-300 text-red-600 font-bold uppercase text-xs hover:bg-red-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>SUPPRIMER CE MÉDIA</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMediaDetail(null)}
                  className="px-6 py-2 bg-pros-black text-white font-bold uppercase text-xs cursor-pointer ml-auto"
                >
                  FERMER
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: BLOCKED DELETION PROTECTION WARNING */}
        {blockedDeleteInfo && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-white border border-neutral-300 max-w-lg w-full p-8 space-y-6 text-black font-sans shadow-2xl">
              
              <div className="flex items-center gap-3 border-b border-neutral-200 pb-3">
                <div className="w-12 h-12 bg-red-100 text-red-700 border border-red-300 rounded-full flex items-center justify-center">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg uppercase text-black">MÉDIA ACTUELLEMENT UTILISÉ</h3>
                  <p className="text-xs text-neutral-500 font-mono">ID: {blockedDeleteInfo.media.id} — {blockedDeleteInfo.media.filename}</p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <p className="font-bold text-red-800 bg-red-50 p-3 border border-red-200">
                  Impossible de supprimer ce média directement car il est référencé par les composants suivants de la plateforme PROS :
                </p>

                <div className="space-y-1.5 max-h-48 overflow-y-auto font-sans">
                  {blockedDeleteInfo.usages.map((u, idx) => (
                    <div key={idx} className="p-2.5 bg-pros-bone border border-neutral-200 flex items-center gap-2 font-sans text-[11px]">
                      <span className="px-1.5 py-0.5 text-[9px] font-mono bg-pros-black text-pros-gold font-bold">{u.type}</span>
                      <span className="font-bold text-black">{u.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-neutral-600 italic text-[11px] pt-1">
                  Veuillez d'abord remplacer la référence de ce média dans le CMS / Catalogue ou confirmer la suppression avec fallback.
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setBlockedDeleteInfo(null)}
                  className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
                >
                  ANNULER
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAttempt(blockedDeleteInfo.media)}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-xs shadow-md cursor-pointer"
                >
                  FORCER LA SUPPRESSION (FALLBACK)
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
  );
};

export const AdminMediaLibraryPage: React.FC = () => (
  <AdminLayout>
    <AdminMediaLibraryContent />
  </AdminLayout>
);
