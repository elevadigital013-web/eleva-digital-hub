'use client';

import React, { useState, useEffect } from 'react';
import { salesQuotes } from '@/constants/salesQuotes';

export const AutoMotivation = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Configuração do tempo de troca (em milissegundos)
  const INTERVAL_TIME = 10000; 

  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Inicia o fade out
      setFade(false);

      // 2. Aguarda a animação e troca o texto
      setTimeout(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === salesQuotes.length - 1 ? 0 : prevIndex + 1
        );
        setFade(true); // Fade in
      }, 500); // Meio segundo para transição suave

    }, INTERVAL_TIME);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto my-6">
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-8 relative overflow-hidden">
        
        {/* Barra de progresso animada no topo */}
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 w-full animate-[loading_8s_linear_infinite]" />

        <div className="flex flex-col items-center text-center gap-4">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
            Insight de Vendas
          </span>
          
          <div 
            className={`transition-opacity duration-500 ease-in-out min-h-[80px] flex items-center justify-center ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="text-xl md:text-2xl font-medium text-gray-800 italic leading-relaxed">
              "{salesQuotes[currentIndex]}"
            </p>
          </div>
          
          {/* Indicador de qual slide está (opcional, mostra 1 de 50) */}
          <span className="text-xs text-gray-400 absolute bottom-2 right-4">
            #{currentIndex + 1}
          </span>
        </div>
      </div>
      
      {/* Estilo inline para a animação da barra de progresso (Tailwind config seria o ideal, mas isso resolve aqui) */}
      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};