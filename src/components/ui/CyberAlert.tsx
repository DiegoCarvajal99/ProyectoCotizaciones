import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { CyberButton } from './CyberButton';

interface CyberAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const CyberAlert: React.FC<CyberAlertProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}) => {
  const config = {
    success: {
      icon: <CheckCircle2 className="text-green-500" size={48} />,
      color: 'green',
      shadow: 'shadow-green-500/20',
      border: 'border-green-500/30'
    },
    error: {
      icon: <XCircle className="text-red-500" size={48} />,
      color: 'red',
      shadow: 'shadow-red-500/20',
      border: 'border-red-500/30'
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500" size={48} />,
      color: 'yellow',
      shadow: 'shadow-yellow-500/20',
      border: 'border-yellow-500/30'
    },
    info: {
      icon: <Info className="text-[#00A3E0]" size={48} />,
      color: 'blue',
      shadow: 'shadow-[#00A3E0]/20',
      border: 'border-[#00A3E0]/30'
    }
  };

  const current = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-sm bg-[#111112] ${current.border} border rounded-[2rem] p-8 ${current.shadow} shadow-2xl overflow-hidden`}
          >
            {/* Ambient Background Effect */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[100px] opacity-20 bg-${current.color}-500`} />
            
            <div className="flex flex-col items-center text-center gap-6 relative z-10">
              <div className={`w-20 h-20 rounded-3xl bg-${current.color}-500/10 flex items-center justify-center border ${current.border}`}>
                {current.icon}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">{title}</h3>
                <p className="text-xs font-mono text-gray-400 leading-relaxed uppercase">{message}</p>
              </div>

              <div className="w-full pt-4">
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 py-4 rounded-2xl font-mono text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>

            {/* Decorative close */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-gray-600 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
