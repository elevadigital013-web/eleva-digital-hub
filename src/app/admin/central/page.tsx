'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [feedbacksPendentes, setFeedbacksPendentes] = useState(0);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    
    // 1. Busca Leads
    const { data: l } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    
    // 2. Busca Logs recentes para a coluna da direita
    const { data: g } = await supabase.from('logs_sistema').select('*').order('created_at', { ascending: false }).limit(10);
    
    // 3. Busca contagem de feedbacks
    const { count } = await supabase
      .from('comentarios_academy')
      .select('*', { count: 'exact', head: true })
      .is('resposta_admin', null);

    if (l) setLeads(l);
    if (g) setLogs(g);
    if (count !== null) setFeedbacksPendentes(count);
    
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // --- LÓGICA DO RANKING ---
  const rankingVendedores = useMemo(() => {
    const resumo: { [key: string]: number } = {};
    leads.filter(l => l.status === 'fechado').forEach(l => {
      const nome = l.nome_vendedor || 'Consultor';
      resumo[nome] = (resumo[nome] || 0) + Number(l.valor_venda);
    });
    return Object.entries(resumo)
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [leads]);

  // --- FATURAMENTO TOTAL ---
  const faturamentoTotal = useMemo(() => {
    return leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0);
  }, [leads]);

  // --- FUNÇÃO TOGGLE STATUS ---
  async function toggleStatus(lead: any) {
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    if (novoStatus === 'fechado' && !confirm(`Fechar venda de ${lead.nome_cliente}?`)) return;

    const { error } = await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);

    if (!error) {
      await supabase.from('logs_sistema').insert([{
        vendedor_nome: 'ADMIN',
        acao: novoStatus === 'fechado' ? 'Venda Fechada 🔒' : 'Venda Reaberta 🔓',
        detalhes: `${novoStatus === 'fechado' ? 'Fechou' : 'Abriu'} a venda de ${lead.nome_cliente} (${lead.nome_vendedor})`
      }]);
      loadData(); 
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      
      {/* HEADER COMPLETO */}
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center mb-10 gap-4">
        <h1 className="text-xl font-black italic text-blue-500 uppercase">ELEVA <span className="text-white">CENTRAL</span></h1>
        
        <div className="flex flex-wrap gap-4 items-center">
          <button onClick={() => router.push('/admin/central/vendedores_todos')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-lg shadow-blue-600/20">Gestão Equipe</button>
          
          <div className="flex gap-4 items-center">
            <button onClick={() => router.push('/admin/central/academy')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Academy</button>
            <button onClick={() => router.push('/admin/central/moderacao')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Moderação</button>
            <button onClick={() => router.push('/admin/central/logs')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">Logs</button>
            
            <button 
              onClick={() => router.push('/admin/feedbacks')} 
              className="relative text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-1"
            >
              Feedbacks
              {feedbacksPendentes > 0 && (
                <span className="bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full animate-pulse">{feedbacksPendentes}</span>
              )}
            </button>
          </div>

          <button onClick={() => router.push('/admin/central/docs')} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">📂 Docs</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: RANKING E CARDS */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-blue-600 p-8 rounded-[35px] shadow-2xl shadow-blue-600/20">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80 italic text-blue-100">Faturamento Total</p>
            <p className="text-3xl font-black italic tracking-tighter">{formatCurrency(faturamentoTotal)}</p>
          </div>
          
          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-orange-500 mb-6 italic tracking-widest">🏆 Ranking Eleva</h2>
            <div className="space-y-4">
              {rankingVendedores.map((v, index) => (
                <div key={index} className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black ${index === 0 ? 'text-amber-400' : 'text-slate-500'}`}>#{index + 1}</span>
                    <p className="text-[11px] font-black uppercase italic">{v.nome}</p>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-400">{formatCurrency(v.total)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ATALHO AUDITORIA */}
          <div 
            onClick={() => router.push('/admin/central/contratos_equipe')}
            className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 cursor-pointer hover:border-blue-500 transition-all group"
          >
            <p className="text-[10px] font-black uppercase text-blue-500 mb-1">Auditoria</p>
            <h3 className="text-xs font-black text-white uppercase italic">Contratos da Equipe ➔</h3>
          </div>
        </div>

        {/* MONITORAMENTO (CENTRO) */}
        <div className="col-span-12 lg:col-span-6 bg-[#1e293b] rounded-[40px] p-8 border border-slate-800 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-8 italic tracking-widest">Monitoramento de Vendas</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {leads.map(l => (
              <div key={l.id} className="bg-[#0f172a] p-6 rounded-[30px] border border-slate-800 flex justify-between items-center group transition-all">
                <div>
                  <p className="font-black text-sm uppercase italic">{l.nome_cliente}</p>
                  <p className="text-[10px] font-black text-blue-500 uppercase italic mt-1">{l.nome_vendedor}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-black italic text-sm">{formatCurrency(l.valor_venda)}</p>
                  <button 
                    onClick={() => toggleStatus(l)}
                    className={`text-[9px] font-black px-4 py-2 rounded-full border transition-all uppercase tracking-widest
                      ${l.status === 'fechado' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'text-amber-500 border-amber-500/30 hover:bg-amber-500/10'}`}
                  >
                    {l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA LOGS (DIREITA) */}
        <div className="col-span-12 lg:col-span-3 bg-[#1e293b]/50 rounded-[40px] p-6 border border-slate-800">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs Recentes</h2>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-[9px] font-black text-blue-400 uppercase">{log.vendedor_nome}</p>
                <p className="text-[10px] text-slate-300 italic leading-tight">{log.acao}</p>
              </div>
            ))}
            <button onClick={() => router.push('/admin/central/logs')} className="w-full py-3 text-[9px] font-black uppercase text-slate-500 hover:text-white border border-dashed border-slate-800 rounded-xl mt-4">Ver tudo</button>
          </div>
        </div>

      </div>
    </div>
  );
}