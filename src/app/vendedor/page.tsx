'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function VendedorDashboard() {
  const router = useRouter();
  const [vendedorNome, setVendedorNome] = useState('CONSULTOR');
  const [stats, setStats] = useState({ valorVendido: 0, comissao: 0, qtdVendas: 0, qtdLeads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Define o nome do consultor no topo
      setVendedorNome(user.user_metadata?.nome?.toUpperCase() || 'CONSULTOR');

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id);

      if (leads) {
        const fechados = leads.filter(l => l.status === 'fechado');
        const total = fechados.reduce((acc, curr) => acc + (Number(curr.valor_venda) || 0), 0);
        
        setStats({ 
          valorVendido: total, 
          comissao: total * 0.20, // Comissão padrão de 20%
          qtdVendas: fechados.length, 
          qtdLeads: leads.length - fechados.length 
        });
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-white p-6 font-sans pb-24">
      {/* CABEÇALHO COM NOME DO CONSULTOR */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
            OLÁ, <span className="text-blue-600">{vendedorNome}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Eleva Performance</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
          className="text-[10px] font-black text-slate-400 uppercase border border-slate-200 px-5 py-2 rounded-full"
        >
          Sair
        </button>
      </div>

      {/* PLACAR DE COMISSÕES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
          <p className="text-blue-400 text-[10px] font-black uppercase mb-1 italic">Total Vendido</p>
          <p className="text-3xl font-black italic tracking-tighter">
            {formatCurrency(stats.valorVendido)}
          </p>
        </div>
        <div className="bg-orange-400 p-8 rounded-[40px] text-slate-900 shadow-lg">
          <p className="text-orange-900 text-[10px] font-black uppercase mb-1 italic">Sua Comissão (20%)</p>
          <p className="text-3xl font-black italic tracking-tighter">
            {formatCurrency(stats.comissao)}
          </p>
        </div>
      </div>

      {/* MINI STATS */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 bg-emerald-50/50 rounded-[35px] border border-emerald-100 flex flex-col items-center justify-center p-6 text-center">
           <span className="text-xl mb-1">🏆</span>
           <p className="text-2xl font-black text-emerald-600 leading-none">{stats.qtdVendas}</p>
           <p className="text-[8px] font-black uppercase text-emerald-400 mt-1">Fechadas</p>
        </div>
        <div className="flex-1 bg-slate-50 rounded-[35px] border border-slate-100 flex flex-col items-center justify-center p-6 text-center">
           <span className="text-xl mb-1">⏳</span>
           <p className="text-2xl font-black text-slate-800 leading-none">{stats.qtdLeads}</p>
           <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Em Aberto</p>
        </div>
      </div>

      {/* O BOTÃO QUE VOCÊ PRECISA: MINHA PASTA */}
      <div 
        onClick={() => router.push('/vendedor/meus-arquivos')}
        className="bg-white p-6 rounded-[35px] border-2 border-blue-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all mb-4 group active:scale-95"
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform text-white shadow-lg shadow-blue-500/20">
            📂
          </div>
          <div>
            <h2 className="text-slate-900 font-black italic uppercase text-sm leading-none tracking-tighter">Minha Pasta</h2>
            <p className="text-blue-500 text-[9px] font-black uppercase mt-1 tracking-widest italic">Subir Contratos p/ Auditoria</p>
          </div>
        </div>
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all font-black">
          ＋
        </div>
      </div>

      {/* BOTÃO DA ACADEMY */}
      <div 
        onClick={() => router.push('/vendedor/academy')}
        className="bg-white p-6 rounded-[35px] border-2 border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all mb-10 group"
      >
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform text-slate-400">
            🎓
          </div>
          <div>
            <h2 className="text-slate-900 font-black italic uppercase text-sm leading-none tracking-tighter">Eleva Academy</h2>
            <p className="text-slate-400 text-[9px] font-bold uppercase mt-1 tracking-widest italic">Cursos e Treinamentos</p>
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
          →
        </div>
      </div>

      {/* BOTÃO PRINCIPAL DE VENDA */}
      <button 
        onClick={() => router.push('/vendedor/novo-lead')}
        className="w-full bg-blue-600 p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/40 flex items-center justify-between group active:scale-95 transition-all"
      >
        <div className="text-left">
          <p className="font-black italic uppercase text-xl leading-none tracking-tighter">Novo Registro</p>
          <p className="text-blue-200 text-[9px] font-bold uppercase mt-1 tracking-widest">Cadastrar venda no campo</p>
        </div>
        <span className="text-4xl font-light group-hover:rotate-90 transition-transform">＋</span>
      </button>
    </div>
  );
}