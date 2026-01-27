'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { Toast } from '@/components/Toast';

// Interfaces simplificadas
interface Lead { id: number; created_at: string; nome_cliente: string; status: string; valor_venda: number; nome_vendedor?: string; }
interface Log { id: number; created_at: string; acao: string; vendedor_nome?: string; }

export default function AdminCentral() {
  const router = useRouter();
  const [aba, setAba] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [updatingLead, setUpdatingLead] = useState<number | null>(null);

  // --- CARREGAR DADOS ---
  async function loadData() {
    // Agora buscamos direto, sem joins complexos que travam
    const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    const { data: logsData } = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(30);

    if (leadsData) setLeads(leadsData);
    if (logsData) setLogs(logsData);
  }

  useEffect(() => { loadData(); }, []);

  // --- RANKING ---
  const ranking = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
        if (l.status === 'fechado') {
            const nome = l.nome_vendedor || 'Consultor'; // Usa o nome salvo direto na lead
            stats[nome] = (stats[nome] || 0) + (Number(l.valor_venda) || 0);
        }
    });
    return Object.entries(stats).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  }, [leads]);

  // --- AÇÃO: MUDAR STATUS ---
  async function toggleStatus(lead: Lead) {
    if (updatingLead) return;
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    if (!confirm(`Mudar "${lead.nome_cliente}" para ${novoStatus.toUpperCase()}?`)) return;

    setUpdatingLead(lead.id);
    await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);
    setUpdatingLead(null);
    setToast({ msg: 'Status atualizado!', type: 'success' });
    loadData();
  }

  // --- AÇÃO: APAGAR LOG ---
  async function deleteLog(id: number) {
     if(confirm("Apagar log?")) {
         await supabase.from('logs_atividades').delete().eq('id', id);
         loadData();
     }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({ ...toast, msg: '' })} />}
      
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        <button onClick={() => loadData()} className="text-xs font-bold uppercase bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">Atualizar ↻</button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ESQUERDA: Métricas */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
                <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest">Faturamento</p>
                <p className="text-3xl font-black">{formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + curr.valor_venda, 0))}</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
                <h3 className="text-[10px] font-black uppercase text-amber-500 mb-4 text-center">🏆 Ranking</h3>
                <div className="space-y-3">
                    {ranking.length === 0 && <p className="text-center text-xs text-slate-600">Sem vendas.</p>}
                    {ranking.map((v, i) => (
                        <div key={i} className="flex justify-between text-xs border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-300">#{i+1} {v.nome}</span>
                            <span className="font-black text-emerald-500">{formatCurrency(v.total)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* CENTRO: Monitoramento */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic">Monitoramento</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {leads.length === 0 && <p className="text-center text-slate-600 mt-10">Nenhum lead registrado.</p>}
                {leads.map(l => (
                    <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center hover:border-blue-900 transition-colors">
                        <div>
                            <p className="font-black text-sm italic text-white">{l.nome_cliente}</p>
                            <p className="text-[9px] font-black text-blue-500 uppercase">{l.nome_vendedor || 'Consultor'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                            <button onClick={() => toggleStatus(l)} disabled={updatingLead === l.id} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${l.status === 'fechado' ? 'text-emerald-500 border-emerald-500/30' : 'text-amber-500 border-amber-500/30'}`}>
                                {updatingLead === l.id ? '...' : (l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* DIREITA: Logs */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {logs.map(log => (
                    <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1 group flex justify-between">
                        <div>
                            <p className="text-[10px] text-slate-300">
                                <span className="font-black text-blue-500 uppercase mr-1">{log.vendedor_nome || 'SISTEMA'}</span>
                                <span className="italic opacity-80">{log.acao}</span>
                            </p>
                        </div>
                        <button onClick={() => deleteLog(log.id)} className="text-red-500 opacity-0 group-hover:opacity-100 text-[10px] font-bold px-2">X</button>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}