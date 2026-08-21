import React, { useState, useMemo } from 'react';
import { useCms } from '../../store/cmsContext';
import { X, Search, Upload, Check, Image as ImageIcon, Plus } from 'lucide-react';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: { id: string; url: string; altText: string; filename: string }) => void;
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  title = 'SÉLECTIONNER UN MÉDIA DE LA MÉDIATHÈQUE PROS',
}) => {
  const { mediaLibrary, uploadMedia } = useCms();
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // New Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [altTextInput, setAltTextInput] = useState('');

  const filteredMedia = useMemo(() => {
    if (!searchQuery) return mediaLibrary;
    return mediaLibrary.filter(
      (m) =>
        m.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.altText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mediaLibrary, searchQuery]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadPreviewUrl(URL.createObjectURL(file));
      setAltTextInput(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleConfirmUpload = () => {
    if (!uploadFile || !uploadPreviewUrl) return;
    const newMedia = uploadMedia({
      filename: uploadFile.name,
      url: uploadPreviewUrl,
      altText: altTextInput.trim() || uploadFile.name,
      sizeKb: Math.round(uploadFile.size / 1024),
      format: uploadFile.type.split('/')[1]?.toUpperCase() || 'JPG',
    });
    onSelectMedia({
      id: newMedia.id,
      url: newMedia.url,
      altText: newMedia.altText,
      filename: newMedia.filename,
    });
    onClose();
  };

  const handleConfirmSelection = () => {
    const target = mediaLibrary.find((m) => m.id === selectedMediaId);
    if (!target) return;
    onSelectMedia({
      id: target.id,
      url: target.url,
      altText: target.altText,
      filename: target.filename,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-neutral-300 max-w-4xl w-full p-8 space-y-6 text-black font-sans shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-neutral-200 flex-shrink-0">
          <h3 className="font-display font-bold text-base uppercase text-black flex items-center gap-2">
            <ImageIcon size={20} className="text-pros-gold" />
            <span>{title}</span>
          </h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-black">
            <X size={22} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 gap-4 text-xs font-bold uppercase font-sans flex-shrink-0">
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-2.5 border-b-2 font-sans cursor-pointer ${
              activeTab === 'library' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            MÉDIATHÈQUE PROS ({mediaLibrary.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 border-b-2 font-sans cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upload' ? 'border-black text-black' : 'border-transparent text-neutral-500 hover:text-black'
            }`}
          >
            <Plus size={14} />
            <span>TÉLÉVERSER UN NOUVEAU FICHIER</span>
          </button>
        </div>

        {/* TAB 1: MEDIA LIBRARY GRID */}
        {activeTab === 'library' && (
          <div className="space-y-4 flex-1 overflow-y-auto min-h-0 font-sans pr-1">
            {/* Search Bar */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom de fichier ou texte ALT..."
                className="w-full pl-9 pr-4 py-2 bg-pros-bone border border-neutral-300 text-xs text-black font-sans focus:outline-none focus:border-black"
              />
            </div>

            {/* Media Grid */}
            {filteredMedia.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-200 font-sans">
                Aucun média disponible dans la médiathèque PROS.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((media) => {
                  const isSelected = selectedMediaId === media.id;
                  return (
                    <div
                      key={media.id}
                      onClick={() => setSelectedMediaId(media.id)}
                      className={`relative border cursor-pointer group transition-all p-2 bg-white flex flex-col justify-between ${
                        isSelected ? 'border-2 border-pros-black ring-2 ring-pros-gold' : 'border-neutral-200 hover:border-neutral-400'
                      }`}
                    >
                      <div className="h-32 bg-neutral-900 overflow-hidden relative mb-2">
                        <img src={media.url} alt={media.altText} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-pros-black text-pros-gold rounded-full flex items-center justify-center font-bold">
                            <Check size={14} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-black truncate uppercase">{media.filename}</div>
                        <div className="text-[10px] text-neutral-500 truncate">{media.altText}</div>
                        <div className="text-[9px] font-mono text-neutral-400 flex justify-between mt-1 pt-1 border-t border-neutral-100">
                          <span>{media.id}</span>
                          <span>{media.width || 1920}×{media.height || 1080}</span>
                          <span>{media.sizeKb} KB</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPLOAD NEW FILE */}
        {activeTab === 'upload' && (
          <div className="space-y-6 flex-1 overflow-y-auto font-sans p-4 bg-pros-bone border border-neutral-200">
            <div className="space-y-3 font-sans">
              <label className="font-bold text-xs uppercase text-black block">SÉLECTIONNER UN FICHIER DEPUIS VOTRE APPAREIL</label>
              <label className="border-2 border-dashed border-neutral-400 hover:border-black p-8 text-center flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                <Upload size={32} className="text-neutral-400 mb-2" />
                <span className="text-xs font-bold text-black uppercase">CLIQUER OU GLISSER UN FICHIER ICI</span>
                <span className="text-[10px] text-neutral-500 font-mono mt-1">JPG, PNG, WEBP, AVIF (Max 5 Mo)</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {uploadPreviewUrl && (
              <div className="space-y-4 pt-4 border-t border-neutral-300 font-sans">
                <h4 className="font-bold text-xs uppercase text-black">PRÉVISUALISATION ET METADONNÉES</h4>
                <div className="flex gap-4 items-center">
                  <img src={uploadPreviewUrl} alt="Preview" className="w-32 h-32 object-cover border border-neutral-300" />
                  <div className="space-y-3 flex-1 text-xs">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase font-bold">Nom du fichier :</span>
                      <strong className="text-black font-mono">{uploadFile?.name}</strong>
                    </div>
                    <div>
                      <label className="font-bold uppercase text-black block mb-1">TEXTE ALT (SEO / ACCESSIBILITÉ) *</label>
                      <input
                        type="text"
                        value={altTextInput}
                        onChange={(e) => setAltTextInput(e.target.value)}
                        placeholder="Description de l'image..."
                        className="w-full bg-white border border-neutral-300 p-2 text-xs text-black focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0 font-sans">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-neutral-300 text-black font-bold uppercase text-xs hover:bg-neutral-100 cursor-pointer"
          >
            ANNULER
          </button>
          
          {activeTab === 'library' ? (
            <button
              type="button"
              disabled={!selectedMediaId}
              onClick={handleConfirmSelection}
              className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer disabled:opacity-40"
            >
              UTILISER CE MÉDIA
            </button>
          ) : (
            <button
              type="button"
              disabled={!uploadFile || !uploadPreviewUrl}
              onClick={handleConfirmUpload}
              className="px-7 py-2.5 bg-pros-black hover:bg-neutral-800 text-white font-bold uppercase text-xs shadow-md cursor-pointer disabled:opacity-40"
            >
              ENREGISTRER & UTILISER
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
