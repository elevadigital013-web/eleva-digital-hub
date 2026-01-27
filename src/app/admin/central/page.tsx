'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ hoje: 0, semana: 0, mes: 0, total: 0, pendente: 0 });

  async function loadAdminData() {
    setLoading(true);
    const { data: leadsData } = await supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false });
    const { data: logsData } = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(10);

    if (leadsData) {
      const agora = new Date();
      const sDia = startOfDay(agora);
      const sSem = startOfWeek(agora);
      const sMes = startOfMonth(agora);

      let h = 0, s = 0, m = 0, t = 0, p = 0;
      const rankMap: any = {};

      leadsData.forEach(l => {
        const valor = Number(l.valor_venda) || 0;
        if (l.status === 'fechado') {
          t += valor;
          if (!l.pago) p += (valor * 0.25);
          const data = new Date(l.created_at);
          if (isAfter(data, sDia)) h += valor;
          if (isAfter(data, sSem)) s += valor;
          if (isAfter(data, sMes)) m += valor;

          const nome = l.vendedores?.nome || 'Admin';
          rankMap[nome] = (rankMap[nome] || 0) + valor;
        }
      });

      setStats({ hoje: h, semana: s, mes: m, total: t, pendente: p });
      setLeads(leadsData);
      setRanking(Object.entries(rankMap).map(([nome, vendas]) => ({ nome, vendas: Number(vendas) })).sort((a, b) => b.vendas - a.vendas));
    }
    if (logsData) setLogs(logsData);
    setLoading(false);
  }

  const confirmarPagamento = async (id: string) => {
    await supabase.from('leads').update({ pago: true }).eq('id', id);
    loadAdminData();
  };

  useEffect(() => { loadAdminData(); }, []);

  const filtrados = leads.filter(l => filtro === 'pendente' ? (l.status === 'fechado' && !l.pago) : true);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-blue-500 uppercase">ELEVA <span className="text-white">ADMIN</span></h1>
        <div className="flex gap-2">
          <button onClick={() => router.push('/admin/materiais')} className="bg-slate-900 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-800">LINKS</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black">SAIR</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-600 p-6 rounded-[30px] shadow-lg shadow-blue-900/20">
          <p className="text-blue-200 text-[10px] font-black uppercase mb-1">Hoje</p>
          <p className="text-3xl font-black">{formatCurrency(stats.hoje)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-slate-800">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Semana</p>
          <p className="text-3xl font-black">{formatCurrency(stats.semana)}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-[30px] border border-slate-800">
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Mês</p>
          <p className="text-3xl font-black">{formatCurrency(stats.mes)}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest">Fluxo de Vendas</h2>
              <button onClick={() => setFiltro(filtro === 'todos' ? 'pendente' : 'todos')} className="text-[9px] bg-amber-500 text-black px-3 py-1 rounded-lg font-black uppercase">
                {filtro === 'todos' ? 'Ver Pendentes' : 'Ver Todos'}
              </button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-800/50">
                  {filtrados.map(l => (
                    <tr key={l.id} className="text-sm">
                      <td className="py-4">
                        <p className="font-bold text-slate-200">{l.nome_cliente}</p>
                        <p className="text-[10px] text-blue-500 font-black uppercase">{l.vendedores?.nome || 'Admin'}</p>
                      </td>
                      <td className="py-4 text-right">
                        {l.status === 'fechado' && !l.pago && (
                          <button onClick={() => confirmarPagamento(l.id)} className="bg-emerald-600 text-[9px] font-black px-3 py-2 rounded-lg uppercase">Pagar 25%</button>
                        )}
                        {l.pago && <span className="text-emerald-500 text-[9px] font-black uppercase">Pago ✓</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
            <h2 className="text-[10px] font-black uppercase mb-6 text-blue-500 tracking-widest">🏆 Ranking</h2>
            {ranking.map((r, i) => (
              <div key={i} className="flex justify-between mb-4 last:mb-0 border-b border-slate-800 pb-2">
                <p className="text-sm font-bold">{i+1}. {r.nome}</p>
                <p className="text-sm font-black text-emerald-500">{formatCurrency(r.vendas)}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
            <h2 className="text-[10px] font-black uppercase mb-6 text-amber-500 tracking-widest">🛡️ Logs</h2>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border-l border-slate-700 pl-3">
                  <p className="text-[10px] text-slate-300"><span className="font-black">{log.vendedor_nome}</span>: {log.acao}</p>
                  <p className="text-[8px] text-slate-600 uppercase font-black">{new Date(log.created_at).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}