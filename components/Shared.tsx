import React, { useState } from 'react';

export const LiveDot = () => (
  <div className="w-2 h-2 bg-red-600 animate-pulse inline-block mr-2" />
);

export const Logo = ({ className = "h-20" }: { className?: string }) => {
    // 0 = Local File, 1 = External Backup, 2 = SVG Fallback
    const [loadState, setLoadState] = useState(0);
    
    // 1. Try absolute path from public root
    const localUrl = "/pr-logo.png";
    // 2. Fallback to official website logo if local fails
    const externalUrl = "https://www.penriceacademy.org/wp-content/uploads/2021/09/Penrice-Academy-Logo-2021-Web.png";

    const handleError = () => {
        setLoadState(prev => prev + 1);
    };

    if (loadState === 2) {
        // Fallback SVG Logo (Penrice Shield Style) - Renders if image fails
        return (
            <div className={`${className} flex items-center justify-center overflow-hidden`}>
                <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto">
                    {/* Shield Shape */}
                    <path d="M50 115C50 115 90 100 90 60V10H10V60C10 100 50 115 50 115Z" fill="#000000" stroke="#FFB81C" strokeWidth="4"/>
                    {/* Quarters Grid */}
                    <path d="M50 115V60M50 60V10M50 60H90M50 60H10" stroke="#FFB81C" strokeWidth="2"/>
                    {/* Gold Accents */}
                    <path d="M10 10H50V60H10V10Z" fill="#FFB81C" />
                    <path d="M50 60H90V60C90 85 75 105 50 115V60Z" fill="#FFB81C" />
                    {/* Initials */}
                    <text x="28" y="45" textAnchor="middle" fill="#000000" fontSize="28" fontFamily="sans-serif" fontWeight="900">P</text>
                    <text x="72" y="95" textAnchor="middle" fill="#000000" fontSize="28" fontFamily="sans-serif" fontWeight="900">A</text>
                </svg>
            </div>
        );
    }
    
    return (
        <img 
            src={loadState === 0 ? localUrl : externalUrl}
            alt="Penrice Logo" 
            className={`${className} w-auto object-contain`}
            onError={handleError}
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

// Utility to determine text color based on background hex
export const getContrastYIQ = (hexcolor: string) => {
    if (!hexcolor) return 'black';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(c => c + c).join('');
    }
    if (hexcolor.length !== 6) return 'black';
    
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}