'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [vendedoresRanking, setVendedoresRanking] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('todos');
  const [stats, setStats] = useState({ total: 0, faturamento: 0, comissaoPend: 0, comissaoPaga: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchDashboardData() {
    setLoading(true);
    const { data: leadsData, error } = await supabase
      .from('leads')
      .select(`*, vendedores ( id, nome )`)
      .order('created_at', { ascending: false });

    if (!error && leadsData) {
      setLeads(leadsData);
      
      const fechados = leadsData.filter(l => l.status === 'fechado');
      const faturamentoTotal = fechados.reduce((acc, curr) => acc + (curr.valor_venda || 0), 0);
      const pendente = fechados.filter(l => !l.pago).reduce((acc, curr) => acc + (curr.valor_venda * 0.25), 0);
      const pago = fechados.filter(l => l.pago).reduce((acc, curr) => acc + (curr.valor_venda * 0.25), 0);
      
      setStats({
        total: leadsData.length,
        faturamento: faturamentoTotal,
        comissaoPend: pendente,
        comissaoPaga: pago
      });

      // Gerar Ranking de Vendedores
      const rankingMap = new Map();
      fechados.forEach(l => {
        const nome = l.vendedores?.nome || 'Desconhecido';
        const total = rankingMap.get(nome) || 0;
        rankingMap.set(nome, total + (l.valor_venda || 0));
      });
      const rankingArray = Array.from(rankingMap, ([nome, vendas]) => ({ nome, vendas }))
        .sort((a, b) => b.vendas - a.vendas);
      setVendedoresRanking(rankingArray);
    }
    setLoading(false);
  }

  const marcarComoPago = async (id: string) => {
    const { error } = await supabase.from('leads').update({ pago: true }).eq('id', id);
    if (!error) fetchDashboardData();
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const leadsFiltrados = leads.filter(l => {
    if (filtro === 'pendente') return l.status === 'fechado' && !l.pago;
    if (filtro === 'aberto') return l.status === 'aberto';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black text-blue-500 italic uppercase">Eleva <span className="text-white">Admin</span></h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/admin/materiais')} className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-black">EDITAR LINKS</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-black text-xs">SAIR</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 text-center">
        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Faturamento Bruto</p>
          <p className="text-2xl font-black text-white">{formatCurrency(stats.faturamento)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800">
          <p className="text-amber-500 text-[10px] font-black uppercase mb-1">Pagar Vendedores (25%)</p>
          <p className="text-2xl font-black text-amber-500">{formatCurrency(stats.comissaoPend)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800">
          <p className="text-emerald-500 text-[10px] font-black uppercase mb-1">Total Já Pago</p>
          <p className="text-2xl font-black text-emerald-500">{formatCurrency(stats.comissaoPaga)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800">
          <p className="text-blue-500 text-[10px] font-black uppercase mb-1">Lucro Líquido</p>
          <p className="text-2xl font-black text-blue-500">{formatCurrency(stats.faturamento - stats.comissaoPend - stats.comissaoPaga)}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TABELA DE LEADS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest">Fluxo Eleva Digital</h2>
            <div className="flex gap-2">
              <button onClick={() => setFiltro('todos')} className={`text-[10px] px-3 py-1 rounded-lg font-black ${filtro === 'todos' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400'}`}>TODOS</button>
              <button onClick={() => setFiltro('pendente')} className={`text-[10px] px-3 py-1 rounded-lg font-black ${filtro === 'pendente' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>PENDENTES</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 text-[9px] uppercase font-black border-b border-slate-800">
                  <th className="p-5 tracking-tighter">Cliente / Consultor</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {leadsFiltrados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/20">
                    <td className="p-5">
                      <p className="font-bold text-slate-200">{lead.nome_cliente}</p>
                      <p className="text-[10px] text-blue-500 font-black">{lead.vendedores?.nome || 'Admin'}</p>
                    </td>
                    <td className="p-5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${lead.pago ? 'bg-emerald-500/20 text-emerald-500' : lead.status === 'fechado' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-500'}`}>
                        {lead.pago ? 'Pago' : lead.status === 'fechado' ? 'Pendente' : 'Aberto'}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {lead.status === 'fechado' && !lead.pago && (
                        <button onClick={() => marcarComoPago(lead.id)} className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase">Confirmar PIX</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RANKING DE VENDEDORES */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6">
          <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-blue-500">🏆 TOP Consultores</h2>
          <div className="space-y-6">
            {vendedoresRanking.map((v, i) => (
              <div key={i} className="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-slate-700 font-black text-lg italic">#{i+1}</span>
                  <p className="font-bold text-slate-200">{v.nome}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-500">{formatCurrency(v.vendas)}</p>
                  <p className="text-[8px] text-slate-500 font-black uppercase">Vendas Brutas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}