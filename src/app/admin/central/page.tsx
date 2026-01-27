'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  startOfDay, startOfWeek, startOfMonth, 
  isAfter, format, eachDayOfInterval, endOfMonth 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminCentral() {
  const router = useRouter();
  
  // Estados de Dados
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [provas, setProvas] = useState<any[]>([]);
  const [resumoPagamentos, setResumoPagamentos] = useState<any[]>([]);
  const [vendasPorDia, setVendasPorDia] = useState<Record<string, number>>({});
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'dashboard' | 'docs'>('dashboard');
  const [stats, setStats] = useState({ hoje: 0, semana: 0, mes: 0, total: 0, pendente: 0 });

  async function loadAdminData() {
    setLoading(true);
    
    const [leadsResp, logsResp, provasResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('resultados_provas').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    if (leadsResp.data) {
      const leadsData = leadsResp.data;
      const agora = new Date();
      const sDia = startOfDay(agora); const sSem = startOfWeek(agora); const sMes = startOfMonth(agora);
      
      let h = 0, s = 0, m = 0, t = 0, pTotal = 0;
      const pagamentosMap: any = {};
      const diasMap: Record<string, number> = {};

      leadsData.forEach(l => {
        const valor = Number(l.valor_venda) || 0;
        const nomeVendedor = l.vendedores?.nome || 'Admin';
        const dataLead = new Date(l.created_at);

        if (l.status === 'fechado') {
          // Contagem para o Calendário
          const diaFormatado = format(dataLead, 'yyyy-MM-dd');
          diasMap[diaFormatado] = (diasMap[diaFormatado] || 0) + 1;

          t += valor;
          const comissao = valor >= 5000 ? valor * 0.25 : valor * 0.20;

          if (!l.pago) {
            pTotal += comissao;
            pagamentosMap[nomeVendedor] = (pagamentosMap[nomeVendedor] || 0) + comissao;
          }
          
          if (isAfter(dataLead, sDia)) h += valor;
          if (isAfter(dataLead, sSem)) s += valor;
          if (isAfter(dataLead, sMes)) m += valor;
        }
      });

      setVendasPorDia(diasMap);
      setStats({ hoje: h, semana: s, mes: m, total: t, pendente: pTotal });
      setLeads(leadsData);
      setResumoPagamentos(Object.entries(pagamentosMap).map(([nome, valor]) => ({ nome, valor: Number(valor) })));
    }

    if (logsResp.data) setLogs(logsResp.data);
    if (provasResp.data) setProvas(provasResp.data);
    
    setLoading(false);
  }

  useEffect(() => { loadAdminData(); }, []);

  // Renderização do Calendário de Vendas
  const renderCalendario = () => {
    const inicio = startOfMonth(new Date());
    const fim = endOfMonth(new Date());
    const dias = eachDayOfInterval({ start: inicio, end: fim });

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 mb-8">
        <h2 className="text-[10px] font-black uppercase mb-6 text-blue-400 tracking-widest italic text-center">
          📅 Mapa de Calor: Vendas em {format(new Date(), 'MMMM', { locale: ptBR })}
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-600">{d}</div>)}
          {dias.map(dia => {
            const key = format(dia, 'yyyy-MM-dd');
            const totalVendas = vendasPorDia[key] || 0;
            return (
              <div key={key} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all
                  ${totalVendas > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-110' : 'bg-slate-950 text-slate-700 border border-slate-800'}`}>
                  {dia.getDate()}
                </div>
                {totalVendas > 0 && <span className="text-[7px] mt-1 font-bold text-blue-400">{totalVendas}v</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (aba === 'docs') return <div>Documentação em construção...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-blue-500 uppercase tracking-tighter">ELEVA <span className="text-white">CENTRAL</span></h1>
        <button onClick={() => setAba('docs')} className="bg-slate-900 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-800 uppercase">Documentos</button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA: FINANCEIRO E CALENDÁRIO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-600 p-6 rounded-[35px] shadow-xl shadow-blue-900/20 text-center">
            <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest mb-1">Total do Mês</p>
            <p className="text-3xl font-black tracking-tighter">{formatCurrency(stats.mes)}</p>
          </div>
          
          {renderCalendario()}

          {/* RANKING ACADEMY */}
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
            <h2 className="text-[9px] font-black uppercase mb-4 text-purple-400 text-center tracking-widest">Aproveitamento Academy</h2>
            <div className="space-y-3">
              {provas.map((p) => (
                <div key={p.id} className="flex justify-between items-center bg-slate-950 p-2 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400">{p.vendedor_nome}</span>
                  <span className={`text-[10px] font-black ${p.nota >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>{Number(p.nota).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA CENTRAL: FLUXO DE VENDAS (COM CONTATO) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest italic">Monitoramento de Leads</h2>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {leads.map(l => (
                  <div key={l.id} className="bg-slate-950 p-4 rounded-[25px] border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-black text-slate-100">{l.nome_cliente}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Vendedor: {l.vendedores?.nome || 'Admin'}</span>
                        {/* CONTATO DO LEAD ADICIONADO AQUI */}
                        <span className="text-[9px] font-bold text-slate-500">{l.contato || 'Sem contato'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                      <p className={`text-[8px] font-black uppercase ${l.status === 'fechado' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {l.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: LOGS E PAGAMENTOS */}
        <div className="lg:col-span-1 space-y-6">
          {/* LOGS COM NOME DO VENDEDOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-xl">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-500 text-center tracking-widest italic">Logs do Sistema</h2>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1">
                  <p className="text-[9px] text-slate-300 leading-tight">
                    <span className="font-black text-blue-500 uppercase">{log.vendedor_nome || 'Sistema'}</span> {log.acao}
                  </p>
                  <p className="text-[7px] text-slate-600 font-bold uppercase mt-1">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PAGAMENTOS */}
          <div className="bg-slate-900 border-2 border-amber-500/20 rounded-[35px] p-6">
            <h2 className="text-[9px] font-black uppercase mb-6 text-amber-500 text-center italic">Comissões Pendentes</h2>
            <div className="space-y-2">
              {resumoPagamentos.map((p, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">{p.nome}</span>
                  <span className="text-[11px] font-black text-emerald-500">{formatCurrency(p.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}