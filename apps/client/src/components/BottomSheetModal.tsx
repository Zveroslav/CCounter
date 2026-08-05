import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetModalProps {
  title: React.ReactNode;
  onClose: () => void;
  zIndex?: string; // Default: z-[60]
  bgClass?: string; // Default: bg-white
  children: React.ReactNode | ((closeModal: () => void) => React.ReactNode);
}

export default function BottomSheetModal({
  title,
  onClose,
  zIndex = 'z-[60]',
  bgClass = 'bg-white',
  children
}: BottomSheetModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger on next frame so the initial translateY(100%) is painted first
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320); // wait for transition to finish
  };

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex flex-col`}
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Backdrop click target */}
      <div className="absolute inset-0 z-[-1]" onClick={handleClose} />
      
      {/* Unified Header */}
      <div className="flex items-center justify-between px-4 py-4 backdrop-blur-md">
        <button 
          onClick={handleClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-white font-bold flex items-center">
          {title}
        </div>
        <div className="w-10"></div> {/* Spacer for centering title */}
      </div>

      {/* Modal Body */}
      <div
        className={`flex-1 ${bgClass} rounded-t-[2rem] flex flex-col overflow-hidden pb-8`}
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {typeof children === 'function' ? children(handleClose) : children}
      </div>
    </div>,
    document.body
  );
}
