'use client'

import { useEffect, useState } from 'react';

interface AutoMotivationProps {
  phrases: string[];
}

export function AutoMotivation({ phrases }: AutoMotivationProps) {
  const [show, setShow] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Verifica sessão para não aparecer toda hora
    const hasShown = sessionStorage.getItem('eleva_motivation_shown');
    
    if (!hasShown && phrases && phrases.length > 0) {
      const randomQuote = phrases[Math.floor(Math.random() * phrases.length)];
      setQuote(randomQuote);
      setShow(true);
      sessionStorage.setItem('eleva_motivation_shown', 'true');
    }
  }, [phrases]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
        {/* Barra superior colorida */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-amber-500"></div>
        
        <div className="mb-6 text-6xl">🚀</div>
        
        <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">
          Bom dia, Campeão!
        </h2>
        
        <p className="text-slate-600 text-lg font-medium leading-relaxed mb-8 italic">
          "{quote}"
        </p>
        
        <button 
          onClick={() => setShow(false)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all uppercase italic tracking-widest text-xs"
        >
          VAMOS PRA CIMA! 🔥
        </button>
      </div>
    </div>
  );
}