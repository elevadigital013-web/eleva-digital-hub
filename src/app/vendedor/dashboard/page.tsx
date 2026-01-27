'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AutoMotivation } from '@/components/AutoMotivation';

// BANCO DE FRASES MOTIVACIONAIS
const FRASES_MOTIVACIONAIS = [
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Você é do tamanho dos seus sonhos. Voe alto!",
  "Hoje é dia de fazer história.",
  "O 'não' você já tem. Busque o 'SIM'!",
  "Foguete não tem ré. Pra cima deles!",
  "A meta é o chão, o céu é o limite.",
  "Vender é a arte de criar soluções. Você é um artista!",
  "Sua atitude determina sua altitude.",
  "Quem planta esforço, colhe resultado.",
  "Mentalidade de campeão: Desistir não é opção.",
  "Você é gigante! Acredite no seu potencial.",
  "Vender não é sobre convencer, é sobre ajudar.",
  "O 'não' é apenas um degrau para o 'sim'.",
  "Resultados são a única coisa que importa no final do dia.",
  "A sorte favorece a mente preparada.",
  "Pare de vender. Comece a ajudar.",
  "Metas claras geram resultados claros."
];

export default function VendedorDashboard() {
  const router = useRouter();
  
  // ESTADO DOS NÚMEROS
  const [stats, setStats] = useState({ 
    valorVendido: 0, 
    comissao: 0, 
    qtdFechado: 0, 
    qtdAberto: 0 
  });
  
  const [vendedorNome, setVendedorNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Verifica login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      
      setVendedorNome(user.user_metadata?.nome || 'Consultor');

      // 2. Busca Leads DO VENDEDOR
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id); // Filtro de segurança

      if (leads) {
        let valorTotal = 0;
        let comissaoTotal = 0;
        let fechados = 0;
        let abertos = 0;

        leads.forEach(l => {
          if (l.status === 'fechado') {
            fechados++; // Conta venda fechada
            const v = Number(l.valor_venda) || 0;
            valorTotal += v;
            
            // Calcula comissão (25% se > 5k, senão 20%)
            const perc = v >= 5000 ? 0.25 : 0.20;
            
            // Só soma comissão se ainda não foi pago
            if (!l.pago) comissaoTotal += (v * perc);
          } else {
            abertos++; // Conta lead em aberto
          }
        });

        setStats({ 
            valorVendido: valorTotal, 
            comissao: comissaoTotal, 
            qtdFechado: fechados, 
            qtdAberto: abertos 
        });
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* MENSAGEM DO DIA */}
      <AutoMotivation phrases={FRASES_MOTIVACIONAIS} />

      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic text-slate-900 tracking-tighter">
            Olá, <span className="text-blue-600">{loading ? '...' : vendedorNome}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Painel de Performance</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-white p-3 rounded-full shadow-sm text-red-500 border border-slate-100 hover:bg-red-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" /></svg>
        </button>
      </div>

      {/* CARDS FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* CARD 1: VALOR VENDIDO */}
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-[60px] rounded-full"></div>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Total Vendido</p>
          <p className="text-4xl font-black tracking-tighter">
            {loading ? '...' : formatCurrency(stats.valorVendido)}
          </p>
        </div>
        
        {/* CARD 2: COMISSÃO */}
        <div className="bg-amber-500 p-8 rounded-[40px] text-slate-900 shadow-lg shadow-amber-500/20">
          <p className="text-amber-900 text-[10px] font-black uppercase tracking-widest mb-1 italic">Comissão a Receber</p>
          <p className="text-4xl font-black tracking-tighter">
             {loading ? '...' : formatCurrency(stats.comissao)}
          </p>
        </div>

        {/* CARD 3: PLACAR (DIVIDIDO) */}
        <div className="bg-white p-6 rounded-[40px] text-slate-900 shadow-sm border border-slate-100 flex gap-4">
          
          {/* Lado Esquerdo: Vendas Fechadas */}
          <div className="flex-1 bg-emerald-50 rounded-3xl flex flex-col items-center justify-center p-2 border border-emerald-100">
             <span className="text-2xl">🏆</span>
             <p className="text-3xl font-black text-emerald-600 leading-none mt-1">
               {loading ? '-' : stats.qtdFechado}
             </p>
             <p className="text-[8px] font-black uppercase text-emerald-400 mt-1">Fechadas</p>
          </div>

          {/* Lado Direito: Leads em Aberto */}
          <div className="flex-1 bg-slate-50 rounded-3xl flex flex-col items-center justify-center p-2 border border-slate-200">
             <span className="text-2xl">⏳</span>
             <p className="text-3xl font-black text-slate-600 leading-none mt-1">
               {loading ? '-' : stats.qtdAberto}
             </p>
             <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Em Aberto</p>
          </div>

        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="space-y-4">
        
        {/* Botão ACADEMY */}
        <div 
          onClick={() => router.push('/vendedor/cursos')}
          className="bg-white border-2 border-blue-600 p-6 rounded-[35px] shadow-lg shadow-blue-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 bg-blue-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase italic">Novo Conteúdo</div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl">🎓</div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-slate-900 leading-none">Eleva Academy</h2>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1 italic">Treinamentos e Provas</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">→</div>
        </div>

        {/* Botão NOVO LEAD */}
        <button 
          onClick={() => router.push('/vendedor/novo-lead')}
          className="w-full bg-blue-600 text-white p-8 rounded-[35px] shadow-xl shadow-blue-600/30 flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="text-left">
            <p className="font-black text-2xl uppercase italic leading-none">Novo Registro</p>
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mt-1 italic">Cadastrar Venda no Campo</p>
          </div>
          <span className="text-4xl font-light group-hover:rotate-90 transition-transform">＋</span>
        </button>
      </div>
    </div>
  );
}