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
        setVisible(false); // Inicia animação de saída
        setTimeout(onClose, 300); // Espera animação e limpa
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message && !visible) return null;

  const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl ${bgColor} text-white transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <span className="text-xl">{icon}</span>
      <p className="font-black text-xs uppercase tracking-widest">{message}</p>
      <button onClick={() => setVisible(false)} className="ml-2 opacity-50 hover:opacity-100 font-bold text-lg">✕</button>
    </div>
  );
}