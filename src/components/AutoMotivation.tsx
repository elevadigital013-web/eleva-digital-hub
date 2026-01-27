'use client';

import React, { useState, useEffect } from 'react';

// Aceita as frases via Props para ser flexível
interface AutoMotivationProps {
  phrases: string[];
}

export const AutoMotivation = ({ phrases }: AutoMotivationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);
  const [fade, setFade] = useState(true);

  const INTERVAL_TIME = 10000; 

  useEffect(() => {
    // Só mostra se for o primeiro acesso da sessão
    const hasShown = sessionStorage.getItem('motivation_shown_v2');
    if (!hasShown && phrases.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * phrases.length));
      setShow(true);
      sessionStorage.setItem('motivation_shown_v2', 'true');
    }

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev === phrases.length - 1 ? 0 : prev + 1));
        setFade(true);
      }, 500);
    }, INTERVAL_TIME);

    return () => clearInterval(interval);
  }, [phrases]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl relative overflow-hidden p-8 md:p-12 text-center animate-in zoom-in duration-300">
        
        {/* Barra de progresso animada (Sua ideia top!) */}
        <div className="absolute top-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 w-full animate-[loading_10s_linear_infinite]" />

        <div className="flex flex-col items-center gap-6">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] bg-indigo-50 px-4 py-1.5 rounded-full">
            Mentalidade de Vendas
          </span>
          
          <div className={`transition-opacity duration-500 min-h-[120px] flex items-center justify-center ${fade ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-xl md:text-2xl font-black text-slate-800 italic leading-tight tracking-tighter">
              "{phrases[currentIndex]}"
            </p>
          </div>
          
          <button 
            onClick={() => setShow(false)}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase italic tracking-widest text-xs hover:bg-blue-600"
          >
            ENTENDI, VAMOS VENDER! 🔥
          </button>

          <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
            Slide #{currentIndex + 1}
          </span>
        </div>

        <style jsx>{`
          @keyframes loading {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
};