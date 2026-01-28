'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function VendedoresTodos() {
  const router = useRouter();
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    // Busca os dados que você já cadastrou no Supabase
    const { data, error } = await supabase
      .from('dados_vendedores')
      .select('*')
      .order('nome', { ascending: true });
    
    if(data) setVendedores(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
       <button onClick={() => router.back()} className="mb-6 text-[10px] font-black uppercase text-slate-500 hover:text-white">← Voltar</button>
       
       <div className="flex justify-between items-end mb-10">
          <div>
             <h1 className="text-3xl font-black italic text-emerald-500 uppercase tracking-tighter">Equipe <span className="text-white">Eleva</span></h1>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Dados cadastrais extraídos do banco</p>
          </div>
          <div className="text-right">
             <p className="text-2xl font-black italic">{vendedores.length}</p>
             <p className="text-[9px] font-black text-slate-500 uppercase">Vendedores Ativos</p>
          </div>
       </div>

       {loading ? (
         <p className="text-center text-slate-500 animate-pulse">Carregando dados do Supabase...</p>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendedores.map(v => (
               <div key={v.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl group hover:border-emerald-500/50 transition-all">
                  <div className="mb-4 border-b border-slate-800 pb-4">
                     <h3 className="text-xl font-black text-white italic">{v.nome}</h3>
                     <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{v.email}</p>
                  </div>
                  
                  <div className="space-y-3">
                     <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Chave Pix</p>
                        <p className="font-mono text-sm text-emerald-400 bg-emerald-950/30 p-2 rounded-xl border border-emerald-900/20">{v.chave_pix || 'Não informado'}</p>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Senha (Login)</p>
                           <p className="font-mono text-sm text-orange-400 bg-orange-950/20 p-2 rounded-xl border border-orange-900/20">{v.senha_visualizacao || '****'}</p>
                        </div>
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Telefone</p>
                           <p className="font-mono text-sm text-slate-300 bg-slate-800/50 p-2 rounded-xl border border-slate-700">{v.telefone || '-'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
       )}
    </div>
  );
}