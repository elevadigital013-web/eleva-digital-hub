'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  async function loadData() {
    const { data: l } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    const { data: g } = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(10);
    if(l) setLeads(l);
    if(g) setLogs(g);
  }

  useEffect(() => { loadData(); }, []);

  const totalFaturamento = leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0);

  return (
    <div className="min-h-screen bg-[#0b121e] text-white p-6 font-sans">
      {/* HEADER COM MENU À DIREITA */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-[#00e5ff] uppercase">ELEVA <span className="text-white">CENTRAL</span></h1>
        <div className="flex gap-2">
          <button className="bg-[#00e5ff] text-[#0b121e] px-4 py-2 rounded-xl text-[10px] font-black uppercase">Dashboard</button>
          <button onClick={() => router.push('/admin/central/academy')} className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:text-white">Academy</button>
          <button onClick={() => router.push('/admin/central/moderacao')} className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:text-white">Moderação</button>
          <button onClick={() => router.push('/admin/central/docs')} className="bg-slate-800 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:text-white tracking-widest">Docs</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* COLUNA 1: FINANCEIRO */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-[#00e5ff] p-8 rounded-[40px] shadow-lg shadow-[#00e5ff]/20">
            <p className="text-[10px] font-black text-[#0b121e] uppercase mb-1">Faturamento Total</p>
            <p className="text-4xl font-black text-[#0b121e] italic">R$ {totalFaturamento.toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="bg-[#1e293b]/50 p-6 rounded-[35px] border border-slate-800">
            <h3 className="text-[10px] font-black uppercase text-orange-500 mb-4 italic">🏆 Ranking</h3>
            <p className="text-[10px] text-slate-500 italic">Sem vendas ainda.</p>
          </div>

          <div className="bg-[#1e293b]/50 p-6 rounded-[35px] border border-slate-800">
            <h3 className="text-[10px] font-black uppercase text-blue-400 mb-4 italic">Atividade Diária</h3>
            <div className="grid grid-cols-7 gap-2">
              {[...Array(31)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-500 hover:bg-blue-500 hover:text-white transition-all cursor-pointer">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: MONITORAMENTO (CENTRAL) */}
        <div className="col-span-12 lg:col-span-6 bg-[#1e293b]/30 rounded-[40px] p-8 border border-slate-800">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic tracking-widest">Monitoramento em Tempo Real</h2>
          <div className="space-y-4">
            {leads.length === 0 && <p className="text-center text-slate-600 italic py-20 text-xs">Nenhum lead registrado.</p>}
            {leads.map(lead => (
              <div key={lead.id} className="bg-[#0b121e] p-6 rounded-[40px] border border-slate-800 flex justify-between items-center group hover:border-[#00e5ff]/50 transition-all">
                <div>
                  <p className="font-black text-lg italic text-white uppercase">{lead.nome_cliente}</p>
                  <p className="text-[10px] font-black text-[#00e5ff] uppercase">{lead.nome_vendedor || 'Consultor'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white mb-2">{formatCurrency(lead.valor_venda)}</p>
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full border uppercase ${lead.status === 'fechado' ? 'text-emerald-500 border-emerald-500/30' : 'text-orange-500 border-orange-500/30'}`}>
                    {lead.status === 'fechado' ? 'Fechado 🔒' : 'Aberto 🔓'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 3: LOGS */}
        <div className="col-span-12 lg:col-span-3 bg-[#1e293b]/30 rounded-[40px] p-6 border border-slate-800">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs do Sistema</h2>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-blue-500 pl-4 py-1">
                <p className="text-[9px] font-black text-blue-400 uppercase">{log.vendedor_nome || 'Sistema'}</p>
                <p className="text-[10px] text-slate-300 italic opacity-80 leading-tight">{log.acao}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}