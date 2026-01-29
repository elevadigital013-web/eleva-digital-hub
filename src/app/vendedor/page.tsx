'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function VendedorDashboard() {
  const router = useRouter();
  
  // ESTADOS DE DADOS
  const [vendedorNome, setVendedorNome] = useState('');
  const [comissaoPercent, setComissaoPercent] = useState(20); 
  const [stats, setStats] = useState({ valorVendido: 0, comissao: 0, qtdVendas: 0, qtdLeads: 0 });
  const [leadsAtivos, setLeadsAtivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      // 1. BUSCA A COMISSÃO DINÂMICA E NOME
      const { data: vDados } = await supabase
        .from('dados_vendedores')
        .select('nome, comissao_percent')
        .eq('email', user.email)
        .single();

      let taxaComissao = 20; 
      if (vDados) {
        setVendedorNome(vDados.nome.toUpperCase());
        taxaComissao = vDados.comissao_percent || 20;
        setComissaoPercent(taxaComissao);
      } else {
        setVendedorNome(user.user_metadata?.nome?.toUpperCase() || user.email?.split('@')[0].toUpperCase() || 'CONSULTOR');
      }

      // 2. BUSCA TODOS OS LEADS PARA CÁLCULO DE PERFORMANCE
      const { data: todosLeads } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });

      if (todosLeads) {
        let faturamento = 0; 
        let v = 0; 
        let l = 0;
        
        todosLeads.forEach(item => {
          if (item.status === 'fechado') {
            faturamento += Number(item.valor_venda) || 0;
            v++;
          } else {
            l++;
          }
        });
        
        setStats({ 
          valorVendido: faturamento, 
          comissao: faturamento * (taxaComissao / 100), 
          qtdVendas: v, 
          qtdLeads: l 
        });
        
        // Filtra leads pendentes para a lista de contato rápida
        setLeadsAtivos(todosLeads.filter(item => item.status === 'novo' || item.status === 'pendente'));
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-white p-6 font-sans">
      
      {/* HEADER INTEGRADO */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black italic text-slate-900 tracking-tighter leading-none">
            OLÁ, <span className="text-blue-600">{vendedorNome}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sua Performance Eleva</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
          className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-200 p-1"
        >
          Sair
        </button>
      </div>

      {/* PLACAR FINANCEIRO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
          <p className="text-blue-400 text-[10px] font-black uppercase mb-1 tracking-widest">Total Vendido</p>
          <p className="text-4xl font-black italic tracking-tighter">{formatCurrency(stats.valorVendido)}</p>
        </div>
        
        <div className="bg-orange-400 p-8 rounded-[40px] text-slate-900 shadow-lg relative overflow-hidden">
          <p className="text-orange-900 text-[10px] font-black uppercase mb-1 tracking-widest">Sua Comissão ({comissaoPercent}%)</p>
          <p className="text-4xl font-black italic tracking-tighter">{formatCurrency(stats.comissao)}</p>
          <div className="absolute -right-4 -bottom-4 text-orange-300/30 text-7xl font-black italic">%</div>
        </div>
      </div>

      {/* ACESSOS RÁPIDOS (ACADEMY E AGORA: MINHA PASTA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div 
          onClick={() => router.push('/vendedor/academy')}
          className="bg-blue-600 p-6 rounded-[40px] flex items-center justify-between cursor-pointer hover:bg-blue-500 transition-colors shadow-xl shadow-blue-600/20 active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl">🎓</div>
            <div>
              <h3 className="text-white font-black italic uppercase text-sm leading-none">Eleva Academy</h3>
              <p className="text-blue-200 text-[9px] font-bold uppercase mt-1">Treinamentos e materiais</p>
            </div>
          </div>
          <span className="text-white font-black text-xl">→</span>
        </div>

        <div 
          onClick={() => router.push('/vendedor/meus-arquivos')}
          className="bg-slate-900 p-6 rounded-[40px] border border-slate-800 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl">📁</div>
            <div>
              <h3 className="text-white font-black italic uppercase text-sm leading-none">Minha Pasta</h3>
              <p className="text-slate-500 text-[9px] font-bold uppercase mt-1">Contratos e documentos</p>
            </div>
          </div>
          <span className="text-blue-500 text-xl">→</span>
        </div>
      </div>

      {/* MINI CARDS DE PERFORMANCE */}
      <div className="flex gap-4 mb-10">
        <div className="flex-1 bg-slate-50 rounded-[35px] border border-slate-100 flex flex-col items-center justify-center p-4">
           <span className="text-xl mb-1">🏆</span>
           <p className="text-2xl font-black text-slate-800 leading-none">{stats.qtdVendas}</p>
           <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Vendas</p>
        </div>
        <div className="flex-1 bg-slate-50 rounded-[35px] border border-slate-100 flex flex-col items-center justify-center p-4">
           <span className="text-xl mb-1">⏳</span>
           <p className="text-2xl font-black text-slate-800 leading-none">{stats.qtdLeads}</p>
           <p className="text-[8px] font-black uppercase text-slate-400 mt-1">Em Aberto</p>
        </div>
      </div>

      {/* LISTAGEM DE LEADS COM WHATSAPP INTEGRADO */}
      <div className="space-y-4 mb-24">
        <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-4">Leads para Contato</h2>
        
        {loading ? (
          <p className="text-center py-10 animate-pulse text-[10px] font-black uppercase text-slate-300 italic">Sincronizando Leads...</p>
        ) : leadsAtivos.length === 0 ? (
          <div className="bg-slate-50 rounded-[40px] p-12 text-center border-2 border-dashed border-slate-100">
             <p className="text-slate-400 text-xs font-bold italic">Nenhum lead em aberto no momento. 🚀</p>
          </div>
        ) : (
          leadsAtivos.map((l) => (
            <div key={l.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-slate-900 uppercase italic leading-none">{l.nome_cliente}</h3>
                  <span className="bg-blue-50 text-blue-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Pendente</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 italic">📱 {l.telefone || 'Sem número'}</p>
              </div>

              {l.telefone && (
                <a 
                  href={`https://wa.me/55${l.telefone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors"
                >
                  <span className="text-xl">💬</span>
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* BOTÃO FLUTUANTE NOVO REGISTRO */}
      <button 
        onClick={() => router.push('/vendedor/novo-lead')}
        className="fixed bottom-8 right-8 bg-blue-600 text-white w-16 h-16 rounded-full shadow-2xl shadow-blue-600/40 font-black text-3xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        ＋
      </button>
    </div>
  );
}