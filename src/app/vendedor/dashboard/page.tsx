'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function VendedorDashboard() {
  const [vendedor, setVendedor] = useState({ nome: 'Consultor', pendente: 0, pago: 0 });
  const [leadsRecentes, setLeadsRecentes] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function carregarDadosVendedor() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase.from('vendedores').select('nome').eq('id', user.id).single();
      const { data: leads } = await supabase.from('leads').select('*').eq('vendedor_id', user.id).order('created_at', { ascending: false });
      const { data: materiaisData } = await supabase.from('materiais').select('*').order('ordem', { ascending: true });

      if (leads) {
        setLeadsRecentes(leads.slice(0, 5));
        const pendente = leads.filter(l => l.status === 'fechado' && !l.pago).reduce((acc, curr) => acc + (curr.valor_venda * 0.25), 0);
        const pago = leads.filter(l => l.status === 'fechado' && l.pago).reduce((acc, curr) => acc + (curr.valor_venda * 0.25), 0);
        setVendedor({ nome: profile?.nome || 'Consultor', pendente, pago });
      }
      if (materiaisData) setMateriais(materiaisData);
    }
    setLoading(false);
  }

  useEffect(() => { carregarDadosVendedor(); }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      <div className="bg-blue-600 p-8 rounded-b-[40px] shadow-xl">
        <div className="flex justify-between items-center text-white mb-6">
          <h2 className="text-xl font-black italic tracking-tighter uppercase">Eleva <span className="opacity-70">Digital</span></h2>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-lg">Sair</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <p className="text-blue-100 text-[9px] font-black uppercase mb-1">A Receber (25%)</p>
            <p className="text-lg font-black text-white">{formatCurrency(vendedor.pendente)}</p>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/20">
            <p className="text-emerald-100 text-[9px] font-black uppercase mb-1">Total Recebido</p>
            <p className="text-lg font-black text-white">{formatCurrency(vendedor.pago)}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 mb-8">
        <button onClick={() => router.push('/vendedor/novo-lead')} className="w-full bg-slate-900 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <span className="bg-blue-600 p-3 rounded-xl text-lg">➕</span>
            <div className="text-left">
              <p className="font-black">Novo Lead / Venda</p>
              <p className="text-slate-500 text-[9px] font-black uppercase">Registrar Negócio</p>
            </div>
          </div>
        </button>
      </div>

      <div className="px-8 mb-8">
        <h3 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest">Apoio Eleva Digital</h3>
        <div className="grid grid-cols-2 gap-3">
          {materiais.map((item) => (
            <a key={item.id} href={item.link} target="_blank" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <span className="text-xl">{item.icone}</span>
              <div>
                <p className="font-bold text-slate-800 text-[11px] leading-tight">{item.titulo}</p>
                <p className="text-[9px] text-slate-400 font-medium">{item.descricao}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="px-8">
        <h3 className="font-black text-slate-400 mb-4 text-[10px] uppercase tracking-widest">Atividade Recente</h3>
        <div className="space-y-3">
          {leadsRecentes.map((lead) => (
            <div key={lead.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate">{lead.nome_cliente}</p>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">{lead.servico}</p>
              </div>
              <div className="text-right min-w-fit ml-4">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${lead.status === 'fechado' ? (lead.pago ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600') : 'bg-slate-100 text-slate-400'}`}>
                  {lead.status === 'fechado' ? (lead.pago ? 'Pago' : 'Pendente') : 'Aberto'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}