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
  const [diaHover, setDiaHover] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data) setLeads(data);
    }
    loadData();
  }, []);

  const rankingData = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      if (l.status === 'fechado') {
        stats[l.nome_vendedor] = (stats[l.nome_vendedor] || 0) + Number(l.valor_venda);
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [leads]);

  const faturamentoTotal = leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Eleva <span className="text-blue-400">Central</span></h1>
        <div className="flex gap-4">
           <button onClick={() => router.push('/admin/central/vendedores_todos')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Vendedores</button>
           <button onClick={() => router.push('/admin/central/docs')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Docs</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-6">
          <div className="bg-cyan-500 p-8 rounded-[35px] shadow-lg shadow-cyan-500/20">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80">Faturamento Mês</p>
            <p className="text-4xl font-black italic">R$ {faturamentoTotal.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-orange-500 mb-4 italic">Ranking Vendas</h2>
            {rankingData.map((v, i) => (
              <div key={i} className="flex justify-between text-xs mb-2 border-b border-slate-800 pb-1">
                <span className="font-bold opacity-70">#{i+1} {v.name}</span>
                <span className="font-black text-emerald-400">R$ {v.value.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 relative">
            <h2 className="text-[10px] font-black uppercase text-blue-400 mb-4 italic">Atividade Diária</h2>
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map((dia, i) => {
                const temVenda = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                return (
                  <div 
                    key={i}
                    onMouseEnter={() => setDiaHover(dia)}
                    onMouseLeave={() => setDiaHover(null)}
                    className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${temVenda ? 'bg-blue-500' : 'bg-[#0f172a] text-slate-700'}`}
                  >
                    {dia.getDate()}
                  </div>
                );
              })}
            </div>
            {diaHover && (
              <div className="absolute top-full mt-2 left-0 w-full bg-white text-slate-900 p-4 rounded-2xl shadow-2xl z-50">
                <p className="font-black text-[10px] uppercase border-b mb-2">{format(diaHover, "dd 'de' MMMM", { locale: ptBR })}</p>
                {leads.filter(l => isSameDay(new Date(l.created_at), diaHover) && l.status === 'fechado').map(v => (
                  <p key={v.id} className="text-[10px] flex justify-between font-bold"><span>{v.nome_vendedor}</span> <span>R$ {v.valor_venda}</span></p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#1e293b] rounded-[40px] p-8 border border-slate-800">
           <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic">Performance por Vendedor</h2>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={rankingData}>
                 <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                 <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                 <Bar dataKey="value" radius={[10, 10, 0, 0]}>
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