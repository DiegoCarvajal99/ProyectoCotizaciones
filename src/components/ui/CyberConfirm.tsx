import React from 'react';
import { CyberModal } from './CyberModal';
import { CyberButton } from './CyberButton';
import { AlertTriangle } from 'lucide-react';

interface CyberConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const CyberConfirm: React.FC<CyberConfirmProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <CyberModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-white font-mono text-base uppercase tracking-wider">Confirmar Acción</p>
          <p className="text-gray-400 font-mono text-xs leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>
        <div className="flex gap-4 w-full pt-2">
          <CyberButton 
            variant="secondary" 
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </CyberButton>
          <CyberButton 
            variant="danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1"
          >
            Confirmar
          </CyberButton>
        </div>
      </div>
    </CyberModal>
  );
};
