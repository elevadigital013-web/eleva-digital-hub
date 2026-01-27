'use client'

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000); // 3 segundos na tela
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !visible) return null;

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${bgColor} text-white transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <span className="text-xl">{type === 'success' ? '✅' : '❌'}</span>
      <p className="font-black text-xs uppercase tracking-widest">{message}</p>
    </div>
  );
}