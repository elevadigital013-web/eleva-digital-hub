'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AutoMotivation } from '@/components/AutoMotivation';

// BANCO DE FRASES COMPLETO (FIXO)
const FRASES_MOTIVACIONAIS = [
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Você é do tamanho dos seus sonhos. Voe alto!",
  "Hoje é dia de fazer história.",
  "O 'não' você já tem. Busque o 'SIM'!",
  "Foguete não tem ré. Pra cima deles!",
  "A meta é o chão, o céu é o limite.",
  "Vender é a arte de criar soluções. Você é um artista!",
  "Sua atitude determina sua altitude.",
  "Quem planta esforço, colhe resultado.",
  "Mentalidade de campeão: Desistir não é opção.",
  "Você é gigante! Acredite no seu potencial.",
  "Vender não é sobre convencer, é sobre ajudar.",
  "O 'não' é apenas um degrau para o 'sim'.",
  "Resultados são a única coisa que importa no final do dia.",
  "A sorte favorece a mente preparada.",
  "Pare de vender. Comece a ajudar.",
  "Metas claras geram resultados claros."
];

export default function VendedorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ vendas: 0, comissao: 0, leads: 0 });
  const [vendedorNome, setVendedorNome] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Verifica quem está logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      
      setVendedorNome(user.user_metadata?.nome || 'Consultor');

      // 2. Busca APENAS os leads deste vendedor (Filtro de Segurança Ativo)
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id); // <--- ESTA É A TRAVA DE SEGURANÇA

      if (error) {
        console.error("Erro ao buscar leads:", error);
      }

      if (leads) {
        let v = 0, c = 0;
        leads.forEach(l => {
          if (l.status === 'fechado') {
            const valor = Number(l.valor_venda) || 0;
            v += valor;
            // Regra de comissão: 25% se venda >= 5000, senão 20%
            const perc = valor >= 5000 ? 0.25 : 0.20;
            // Só conta comissão se ainda não foi pago (campo 'pago' false ou null)
            if (!l.pago) c += (valor * perc);
          }
        });
        setStats({ vendas: v, comissao: c, leads: leads.length });
      }
      setLoading(false);
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      {/* MOTIVAÇÃO AUTOMÁTICA */}
      <AutoMotivation phrases={FRASES_MOTIVACIONAIS} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black italic text-slate-900 tracking-tighter">
            Olá, <span className="text-blue-600">{loading ? '...' : vendedorNome}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Painel de Performance</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-white p-3 rounded-full shadow-sm text-red-500 border border-slate-100 hover:bg-red-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" /></svg>
        </button>
      </div>

      {/* CARDS FINANCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-[60px] rounded-full"></div>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Total Vendido</p>
          <p className="text-4xl font-black tracking-tighter">
            {loading ? '...' : formatCurrency(stats.vendas)}
          </p>
        </div>
        
        <div className="bg-amber-500 p-8 rounded-[40px] text-slate-900 shadow-lg shadow-amber-500/20">
          <p className="text-amber-900 text-[10px] font-black uppercase tracking-widest mb-1 italic">Comissão a Receber</p>
          <p className="text-4xl font-black tracking-tighter">
             {loading ? '...' : formatCurrency(stats.comissao)}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[40px] text-slate-900 shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Meus Leads</p>
          <p className="text-4xl font-black tracking-tighter text-blue-600">
             {loading ? '...' : stats.leads}
          </p>
        </div>
      </div>

      {/* ACESSO RÁPIDO */}
      <div className="space-y-4">
        {/* CARD ACADEMY DESTAQUE */}
        <div 
          onClick={() => router.push('/vendedor/cursos')}
          className="bg-white border-2 border-blue-600 p-6 rounded-[35px] shadow-lg shadow-blue-100 flex items-center justify-between group active:scale-95 transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute right-0 top-0 bg-blue-600 text-white text-[8px] font-black px-4 py-1 rounded-bl-xl uppercase italic">Novo Conteúdo</div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl">🎓</div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-slate-900 leading-none">Eleva Academy</h2>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1 italic">Treinamentos e Provas</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">→</div>
        </div>

        {/* CARD NOVO LEAD */}
        <button 
          onClick={() => router.push('/vendedor/novo-lead')}
          className="w-full bg-blue-600 text-white p-8 rounded-[35px] shadow-xl shadow-blue-600/30 flex items-center justify-between active:scale-95 transition-all group"
        >
          <div className="text-left">
            <p className="font-black text-2xl uppercase italic leading-none">Novo Registro</p>
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mt-1 italic">Cadastrar Venda no Campo</p>
          </div>
          <span className="text-4xl font-light group-hover:rotate-90 transition-transform">＋</span>
        </button>
        
        {/* CARD MEUS LEADS (Link para lista detalhada se houver) */}
        {stats.leads > 0 && (
           <button 
             className="w-full bg-white text-slate-600 p-4 rounded-[30px] border border-slate-200 text-xs font-bold uppercase hover:bg-slate-50 transition-colors"
             onClick={() => alert("Funcionalidade de ver lista detalhada em breve.")}
           >
             Ver lista completa de clientes
           </button>
        )}
      </div>
    </div>
  );
}