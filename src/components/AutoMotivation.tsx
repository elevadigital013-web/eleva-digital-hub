'use client'

import { useEffect, useState } from 'react';

interface AutoMotivationProps {
  phrases: string[];
}

export function AutoMotivation({ phrases }: AutoMotivationProps) {
  const [show, setShow] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-amber-500"></div>
        <div className="mb-6 text-6xl">🚀</div>
        <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Bom dia, Campeão!</h2>
        <p className="text-slate-600 text-lg font-medium italic">"{quote}"</p>
        <button onClick={() => setShow(false)} className="mt-8 w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase italic">VAMOS PRA CIMA!</button>
      </div>
    </div>
  );
}