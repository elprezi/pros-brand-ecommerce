import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRMER L’ACTION',
  cancelText = 'ANNULER',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans text-pros-black animate-fade-in">
      <div className="bg-white border border-neutral-300 p-6 max-w-md w-full space-y-6 shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="font-display font-bold text-base uppercase text-black">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-neutral-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-neutral-600 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 text-xs font-bold">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-pros-bone border border-neutral-300 text-black hover:bg-neutral-200 uppercase font-bold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 uppercase shadow-md font-bold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
