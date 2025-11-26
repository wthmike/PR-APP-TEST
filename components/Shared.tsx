import React, { useState } from 'react';

export const LiveDot = () => (
  <div className="w-2 h-2 bg-red-600 animate-pulse inline-block mr-2" />
);

export const Logo = ({ className = "h-20" }: { className?: string }) => {
    const [imgError, setImgError] = useState(false);

    if (imgError) {
        return (
            <div className={`${className} aspect-square flex items-center justify-center bg-penrice-navy rounded-xl border-4 border-penrice-gold shadow-lg`}>
                 <span className="text-white font-display font-bold text-4xl leading-none mt-1">P</span>
            </div>
        );
    }
    
    return (
        <img 
            src="/pr-logo.png"
            alt="Penrice Logo" 
            className={`${className} w-auto object-contain`}
            onError={() => setImgError(true)}
        />
    )
};

export const Badge = ({ children, color = 'gray' }: { children?: React.ReactNode, color?: 'red' | 'black' | 'gray' | 'navy' }) => {
  const colors = {
    red: 'bg-red-600 text-white',
    black: 'bg-black text-white',
    gray: 'bg-gray-100 text-gray-500',
    navy: 'bg-penrice-navy text-white'
  };
  return (
    <span className={`${colors[color]} text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wider`}>
      {children}
    </span>
  );
};

export const ScoreKey = ({ label, sub, color = 'white', onClick }: { label: string, sub?: string, color?: 'white' | 'black' | 'red' | 'navy' | 'orange', onClick: () => void }) => {
    const styles = {
        white: "bg-white border-gray-200 text-black active:bg-gray-100",
        black: "bg-black border-black text-white hover:bg-gray-900",
        red: "bg-red-600 border-red-600 text-white hover:bg-red-700",
        navy: "bg-penrice-navy border-penrice-navy text-white hover:bg-opacity-90",
        orange: "bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100"
    };

    return (
        <button onClick={onClick} className={`h-12 flex flex-col items-center justify-center font-display font-bold text-lg border transition-all active:scale-95 select-none ${styles[color]}`}>
            <span className="leading-none">{label}</span>
            {sub && <span className="text-[8px] font-sans font-bold uppercase leading-none mt-1">{sub}</span>}
        </button>
    );
};

interface ModalProps {
  title: string;
  children?: React.ReactNode;
  onClose: () => void;
  type?: 'default' | 'danger';
}

export const Modal = ({ title, children, onClose, type = 'default' }: ModalProps) => (
  <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
    <div className={`w-full max-w-sm bg-white border-2 border-black p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] max-h-[90vh] overflow-y-auto ${type === 'danger' ? 'border-red-600' : ''}`}>
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
         <h3 className={`font-display font-bold text-xl uppercase tracking-tight ${type === 'danger' ? 'text-red-600' : 'text-black'}`}>{title}</h3>
         <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-black"><i className="fa-solid fa-xmark"></i></button>
      </div>
      {children}
    </div>
  </div>
);

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  isDanger?: boolean;
}

export const ConfirmDialog = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", isDanger = false }: ConfirmDialogProps) => (
  <Modal title={title} onClose={onCancel} type={isDanger ? 'danger' : 'default'}>
     <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed">{message}</p>
     <div className="grid grid-cols-2 gap-4">
        <button onClick={onCancel} className="py-3 text-[10px] font-bold text-black border border-gray-200 hover:bg-gray-50 uppercase tracking-widest">Cancel</button>
        <button onClick={onConfirm} className={`py-3 text-[10px] font-bold text-white uppercase tracking-widest border transition-colors ${isDanger ? 'bg-red-600 border-red-600 hover:bg-red-700' : 'bg-black border-black hover:bg-penrice-gold hover:text-black'}`}>{confirmText}</button>
     </div>
  </Modal>
);