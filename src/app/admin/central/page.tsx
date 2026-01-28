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
  
  // Estado para o dia selecionado (clique ou hover fixo)
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  useEffect(() => {
    async function loadData() {
      // Alterado apenas o select para garantir a busca dos nomes vinculados conforme a tabela original
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (data) setLeads(data);
    }
    loadData();
  }, []);

  // --- PERFORMANCE: APENAS NOMES REAIS ---
  const rankingData = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      // Só processa se for fechado e o nome não for "Consultor Antigo" ou nulo
      if (l.status === 'fechado' && l.nome_vendedor && l.nome_vendedor !== 'Consultor Antigo') {
        stats[l.nome_vendedor] = (stats[l.nome_vendedor] || 0) + Number(l.valor_venda);
      }
    });
    return Object.entries(stats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const faturamentoTotal = leads
    .filter(l => l.status === 'fechado')
    .reduce((acc, curr) => acc + Number(curr.valor_venda), 0);

  const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Eleva <span className="text-blue-400">Central</span></h1>
        <div className="flex gap-4">
           <button onClick={() => router.push('/admin/central/vendedores_todos')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Vendedores</button>
           <button onClick={() => router.push('/admin/central/docs')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Docs</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA: FATURAMENTO E RANKING */}
        <div className="space-y-6">
          <div className="bg-cyan-500 p-8 rounded-[35px] shadow-lg shadow-cyan-500/20">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80">Faturamento Mês</p>
            <p className="text-4xl font-black italic">{money(faturamentoTotal)}</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-orange-500 mb-4 italic">Ranking Vendas</h2>
            <div className="space-y-3">
              {rankingData.map((v, i) => (
                <div key={i} className="flex justify-between text-xs border-b border-slate-800 pb-1">
                  <span className="font-bold opacity-70">#{i+1} {v.name}</span>
                  <span className="font-black text-emerald-400">{money(v.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL: CALENDÁRIO E DETALHES (RESOLVE O TREMOR) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-blue-400 mb-6 italic">Calendário de Atividade</h2>
            <div className="grid grid-cols-7 gap-3">
              {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map((dia, i) => {
                const vendasDia = leads.filter(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                const temVenda = vendasDia.length > 0;
                const estaSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);

                return (
                  <div 
                    key={i}
                    onClick={() => setDiaSelecionado(dia)}
                    onMouseEnter={() => setDiaSelecionado(dia)}
                    className={`h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer border-2 
                      ${temVenda ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20' : 'bg-[#0f172a] border-slate-800 text-slate-700'}
                      ${estaSelecionado ? 'scale-110 border-white z-10' : ''}
                    `}
                  >
                    {dia.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOX DE DETALHES FIXO (PARA NÃO TREMER) */}
          <div className="bg-white rounded-[35px] p-6 min-h-[120px] shadow-2xl">
            {diaSelecionado ? (
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                   <h3 className="font-black text-slate-900 uppercase text-xs italic">
                     Vendas de {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
                   </h3>
                   <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                     {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').length} Venda(s)
                   </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold text-xs uppercase">{v.nome_vendedor}</span>
                      <span className="text-emerald-600 font-black text-xs">{money(v.valor_venda)}</span>
                    </div>
                  ))}
                  {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').length === 0 && (
                    <p className="text-slate-400 text-xs italic">Nenhuma venda fechada neste dia.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic animate-pulse">
                  Passe o mouse ou clique em um dia para ver detalhes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: GRÁFICO DE PERFORMANCE */}
        <div className="lg:col-span-1 bg-[#1e293b] rounded-[40px] p-8 border border-slate-800">
           <h2 className="text-[10px] font-black uppercase text-slate-500 mb-8 italic">Performance Equipe</h2>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={rankingData} layout="vertical">
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} width={80} />
                 <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                 <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
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