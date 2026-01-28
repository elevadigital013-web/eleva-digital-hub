'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AutoMotivation } from '@/components/AutoMotivation';

export default function VendedorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ valorVendido: 0, comissao: 0, qtdFechado: 0, qtdAberto: 0 });
  const [vendedorNome, setVendedorNome] = useState('Consultor');
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. AS FRASES DEVEM FICAR AQUI (FORA DO RETORNO VISUAL)
  const frasesEleva = [
    "🚀 Pra cima deles! Cada lead é uma oportunidade de ouro.",
    "💰 O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "🏆 Você não fecha vendas, você constrói relacionamentos.",
    "🔥 Atitude é tudo. Transforme o 'não' em um próximo passo!",
    "💎 Foco no fechamento. A Eleva Digital conta com o seu talento!"
  ];

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      
      setVendedorNome(user.user_metadata?.nome || user.email?.split('@')[0] || 'Consultor');

      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });

      if (leadsData) {
        setLeads(leadsData);
        let vendido = 0; let f = 0; let a = 0;
        leadsData.forEach(l => {
          if (l.status === 'fechado') { vendido += Number(l.valor_venda); f++; } 
          else { a++; }
        });
        setStats({ valorVendido: vendido, comissao: vendido * 0.25, qtdFechado: f, qtdAberto: a });
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
            Olá, <span className="text-blue-600">{vendedorNome}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Performance Eleva</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-white px-4 py-2 rounded-full shadow-sm text-red-500 border border-slate-100 font-black text-[10px] uppercase">Sair</button>
      </div>

      {/* 2. PASSE AS FRASES PARA O COMPONENTE AQUI */}
      <div className="mb-8">
        <AutoMotivation phrases={frasesEleva} />
      </div>

      {/* PLACAR DE RESULTADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
          <p className="text-blue-400 text-[10px] font-black uppercase mb-1">Total Vendido</p>
          <p className="text-3xl font-black italic tracking-tighter">{formatCurrency(stats.valorVendido)}</p>
        </div>
        <div className="bg-amber-500 p-8 rounded-[40px] text-slate-900 shadow-lg">
          <p className="text-amber-900 text-[10px] font-black uppercase mb-1">Sua Comissão (25%)</p>
          <p className="text-3xl font-black italic tracking-tighter">{formatCurrency(stats.comissao)}</p>
        </div>
        <div className="bg-white p-6 rounded-[40px] border border-slate-100 flex gap-4">
          <div className="flex-1 bg-emerald-50 rounded-3xl flex flex-col items-center justify-center p-2 border border-emerald-100">
             <span className="text-xl">🏆</span>
             <p className="text-2xl font-black text-emerald-600 leading-none mt-1">{stats.qtdFechado}</p>
             <p className="text-[8px] font-black uppercase text-emerald-400">Vendas</p>
          </div>
          <div className="flex-1 bg-slate-50 rounded-3xl flex flex-col items-center justify-center p-2 border border-slate-200">
             <span className="text-xl">⏳</span>
             <p className="text-2xl font-black text-slate-600 leading-none mt-1">{stats.qtdAberto}</p>
             <p className="text-[8px] font-black uppercase text-slate-400">Leads</p>
          </div>
        </div>
      </div>

      {/* LISTA DE ATIVIDADE */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-4">Atividade Recente</h2>
        
        {leads.length === 0 ? (
          <p className="text-center text-slate-400 text-xs py-10 italic">Nenhum registro encontrado.</p>
        ) : (
          leads.map((l) => (
            <div key={l.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-black text-slate-900 text-sm uppercase italic">{l.nome_cliente}</h3>
                   <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${l.status === 'fechado' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {l.status === 'fechado' ? 'Fechado' : 'Aberto'}
                   </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic">📱 {l.telefone || 'Sem contacto'}</p>
              </div>

              {l.telefone && (
                <a 
                  href={`https://wa.me/55${l.telefone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                >
                  <span className="text-xl">💬</span>
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* BOTÃO NOVO REGISTRO */}
      <button 
        onClick={() => router.push('/vendedor/novo-lead')}
        className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center text-3xl font-bold transition-transform active:scale-90"
      >
        ＋
      </button>
    </div>
  );
}