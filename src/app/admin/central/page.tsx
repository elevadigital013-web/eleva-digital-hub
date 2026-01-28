'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

interface Lead { 
  id: number; 
  created_at: string; 
  nome_cliente: string; 
  status: string; 
  valor_venda: number; 
  nome_vendedor?: string; // Nome novo
  vendedores?: { nome: string }; // Nome antigo (vínculo)
}

export default function DashboardAdmin() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [updatingLead, setUpdatingLead] = useState<number | null>(null);

  async function loadData() {
    // Buscamos os dados garantindo que o vínculo antigo também seja lido
    const { data } = await supabase
      .from('leads')
      .select('*, vendedores(nome)') 
      .order('created_at', { ascending: false });

    if (data) setLeads(data as any);
  }

  useEffect(() => { loadData(); }, []);

  async function toggleStatus(lead: Lead) {
    if (updatingLead) return;
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    if (!confirm(`Mudar status de "${lead.nome_cliente}" para ${novoStatus.toUpperCase()}?`)) return;

    setUpdatingLead(lead.id);
    await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);
    setUpdatingLead(null);
    setToast({ msg: 'Status atualizado!', type: 'success' });
    loadData();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({ msg: '', type: '' })} />}
      
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter">
          ELEVA <span className="text-cyan-400">CENTRAL</span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA 1: FINANCEIRO */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-cyan-500 p-8 rounded-[35px] shadow-lg shadow-cyan-500/20">
                <p className="text-[10px] font-black uppercase mb-1 opacity-80 italic">Faturamento Total</p>
                <p className="text-4xl font-black italic">
                  {formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + (curr.valor_venda || 0), 0))}
                </p>
            </div>
            {/* O Ranking aqui... */}
        </div>

        {/* COLUNA 2 e 3: MONITORAMENTO (NOMES VOLTAM AQUI) */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-8 italic tracking-widest">Monitoramento em Tempo Real</h2>
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {leads.map(l => (
                    <div key={l.id} className="bg-[#0f172a] p-5 rounded-[30px] border border-slate-800 flex justify-between items-center hover:border-cyan-900 transition-all">
                        <div>
                            <p className="font-black text-base italic text-white leading-tight">{l.nome_cliente}</p>
                            {/* LÓGICA HÍBRIDA DE NOME: Tenta o novo, se não tiver, usa o antigo (Lorena, Fernando, Maya) */}
                            <p className="text-[10px] font-black text-cyan-400 uppercase mt-1">
                                {l.nome_vendedor || l.vendedores?.nome || 'Consultor'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <p className="text-sm font-black text-white">{formatCurrency(l.valor_venda)}</p>
                            <button 
                                onClick={() => toggleStatus(l)} 
                                className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border transition-all
                                ${l.status === 'fechado' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500 hover:text-white' : 'text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500 hover:text-white'}`}
                            >
                                {l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓'}
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