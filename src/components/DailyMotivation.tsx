// src/components/DailyMotivation.tsx
'use client'; // Necessário se estiver usando Next.js App Router (devido ao useState)

import React, { useState, useEffect } from 'react';
import { salesQuotes } from '@/constants/salesQuotes'; // Certifique-se que o caminho bate com o Arquivo 1

export const DailyMotivation = () => {
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    // Garante que o código rode apenas no cliente para evitar erros de hidratação no Next.js
    const randomQuote = salesQuotes[Math.floor(Math.random() * salesQuotes.length)];
    setQuote(randomQuote);
  }, []);

  // Evita piscar vazio antes de carregar
  if (!quote) return null;

  return (
    <div className="w-full max-w-2xl mx-auto my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 rounded-r-lg shadow-sm">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
          Motivação Diária
        </span>
        <p className="text-xl font-medium text-gray-800 italic leading-relaxed">
          "{quote}"
        </p>
      </div>
    </div>
  );
};