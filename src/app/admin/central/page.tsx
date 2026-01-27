'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

// Interface ajustada para ler TANTO o novo quanto o velho formato de nome
interface Lead { 
  id: number; 
  created_at: string; 
  nome_cliente: string; 
  status: string; 
  valor_venda: number; 
  nome_vendedor?: string; // Novo
  vendedores?: { nome: string }; // Velho (Vinculo)
}

export default function AdminCentral() {
  const router = useRouter();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [updatingLead, setUpdatingLead] = useState<number | null>(null);

  // --- CARREGAR DADOS ---
  async function loadData() {
    // Buscamos TUDO: dados novos e o vínculo antigo (vendedores(nome)) para garantir que ninguém fique sem nome
    const { data } = await supabase
      .from('leads')
      .select('*, vendedores(nome)') 
      .order('created_at', { ascending: false });

    if (data) setLeads(data as any);
  }

  useEffect(() => { loadData(); }, []);

  // --- RANKING ---
  const ranking = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
        if (l.status === 'fechado') {
            // Lógica Híbrida: Tenta o nome novo, se não tiver, usa o antigo
            const nome = l.nome_vendedor || l.vendedores?.nome || 'Consultor';
            stats[nome] = (stats[nome] || 0) + (Number(l.valor_venda) || 0);
        }
    });
    return Object.entries(stats).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  }, [leads]);

  // --- MUDAR STATUS ---
  async function toggleStatus(lead: Lead) {
    if (updatingLead) return;
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    
    // Confirmação nativa (simples e direta como pediu)
    if (!confirm(`Mudar status de "${lead.nome_cliente}"?`)) return;

    setUpdatingLead(lead.id);
    await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);
    setUpdatingLead(null);
    setToast({ msg: 'Status atualizado!', type: 'success' });
    loadData();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({ ...toast, msg: '' })} />}
      
      {/* CABEÇALHO LIMPO (SEM BOTÃO ATUALIZAR) */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
      </div>

      {/* GRID AGORA COM 3 COLUNAS (Logs removido) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA 1: FATURAMENTO + RANKING */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
                <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest">Faturamento Total</p>
                <p className="text-3xl font-black">
                  {formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + (curr.valor_venda || 0), 0))}
                </p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
                <h3 className="text-[10px] font-black uppercase text-amber-500 mb-4 text-center">🏆 Ranking</h3>
                <div className="space-y-3">
                    {ranking.length === 0 && <p className="text-center text-xs text-slate-600">Sem vendas ainda.</p>}
                    {ranking.map((v, i) => (
                        <div key={i} className="flex justify-between text-xs border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-300">#{i+1} {v.nome}</span>
                            <span className="font-black text-emerald-500">{formatCurrency(v.total)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* COLUNA 2 e 3: MONITORAMENTO (Expandido, já que tiramos os Logs) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic">Monitoramento</h2>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {leads.length === 0 && <p className="text-center text-slate-600 mt-10">Nenhum lead registrado.</p>}
                
                {leads.map(l => (
                    <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center hover:border-blue-900 transition-colors">
                        <div>
                            <p className="font-black text-sm italic text-white">{l.nome_cliente}</p>
                            {/* AQUI ESTÁ A CORREÇÃO DOS NOMES: Tenta o novo, se falhar, pega o velho */}
                            <p className="text-[9px] font-black text-blue-500 uppercase">
                                {l.nome_vendedor || l.vendedores?.nome || 'Consultor'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                            
                            <button 
                                onClick={() => toggleStatus(l)} 
                                disabled={updatingLead === l.id} 
                                className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border transition-all
                                ${l.status === 'fechado' ? 'text-emerald-500 border-emerald-500/30 hover:bg-emerald-900/20' : 'text-amber-500 border-amber-500/30 hover:bg-amber-900/20'}`}
                            >
                                {updatingLead === l.id ? '...' : (l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}