'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface Lead { 
  id: number; created_at: string; nome_cliente: string; status: string; 
  valor_venda: number; nome_vendedor: string; 
}

export default function DashboardAdmin() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  async function loadData() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (data) setLeads(data);
  }

  useEffect(() => { loadData(); }, []);

  const rankingData = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      if (l.status === 'fechado' && l.nome_vendedor && l.nome_vendedor !== 'Consultor Antigo') {
        stats[l.nome_vendedor] = (stats[l.nome_vendedor] || 0) + Number(l.valor_venda);
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const faturamentoTotal = leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0);
  const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      
      {/* HEADER COM NAVEGAÇÃO COMPLETA */}
      <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-center lg:text-left">
          Eleva <span className="text-blue-400">Central</span>
        </h1>
        
        <div className="grid grid-cols-2 md:flex gap-3 w-full lg:w-auto">
   <button onClick={() => router.push('/admin/central/academy')} className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20">🎓 Academy</button>
   <button onClick={() => router.push('/admin/central/moderacao')} className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20">💬 Moderação</button>
   <button onClick={() => router.push('/admin/central/vendedores_todos')} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">👥 Vendedores</button>
   <button onClick={() => router.push('/admin/central/docs')} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">📄 Documentos</button>
</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* FINANCEIRO & RANKING */}
        <div className="space-y-6">
          <div className="bg-cyan-500 p-8 rounded-[35px] shadow-lg shadow-cyan-500/20">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80 italic">Faturamento Mensal</p>
            <p className="text-4xl font-black italic">{money(faturamentoTotal)}</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-orange-500 mb-4 italic tracking-widest">Ranking Performance</h2>
            <div className="space-y-3">
              {rankingData.map((v, i) => (
                <div key={i} className="flex justify-between text-xs border-b border-slate-800 pb-1">
                  <span className="font-bold opacity-70 italic">#{i+1} {v.name}</span>
                  <span className="font-black text-emerald-400">{money(v.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CALENDÁRIO CENTRAL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-xl">
            <h2 className="text-[10px] font-black uppercase text-blue-400 mb-6 italic tracking-widest text-center">Monitoramento de Atividade</h2>
            <div className="grid grid-cols-7 gap-3">
              {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map((dia, i) => {
                const temVenda = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                const estaSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
                return (
                  <div key={i} 
                    onMouseEnter={() => setDiaSelecionado(dia)}
                    className={`h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer border-2 
                      ${temVenda ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30' : 'bg-[#0f172a] border-slate-800 text-slate-700'}
                      ${estaSelecionado ? 'scale-110 border-white z-10' : ''}`}
                  >
                    {dia.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETALHES DO DIA (FIXO) */}
          <div className="bg-white rounded-[35px] p-6 min-h-[140px] shadow-2xl relative overflow-hidden">
            {diaSelecionado ? (
              <div className="relative z-10">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                   <h3 className="font-black text-slate-900 uppercase text-xs italic">
                     Vendas de {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
                   </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold text-[10px] uppercase">{v.nome_vendedor}</span>
                      <span className="text-emerald-600 font-black text-xs">{money(v.valor_venda)}</span>
                    </div>
                  ))}
                  {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').length === 0 && (
                    <p className="text-slate-400 text-[10px] italic uppercase font-bold">Sem vendas neste dia.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-300 font-black uppercase text-[10px] tracking-tighter italic animate-pulse">
                  Passe o rato no calendário para filtrar detalhes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO LATERAL */}
        <div className="lg:col-span-1 bg-[#1e293b] rounded-[40px] p-8 border border-slate-800 shadow-xl">
           <h2 className="text-[10px] font-black uppercase text-slate-500 mb-8 italic text-center tracking-widest">Performance Global</h2>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={rankingData} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} width={70} />
                 <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px', fontSize: '10px'}} />
                 <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={18}>
                    {rankingData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#06b6d4' : '#3b82f6'} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}