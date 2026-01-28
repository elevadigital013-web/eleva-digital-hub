'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function VendedoresTodos() {
  const router = useRouter();
  const [vendedores, setVendedores] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase.from('dados_vendedores').select('*').order('nome');
    if(data) setVendedores(data);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
       <button onClick={() => router.push('/admin/central')} className="mb-6 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar</button>
       <h1 className="text-3xl font-black italic text-emerald-500 mb-10 uppercase tracking-tighter">Equipe <span className="text-white">Eleva</span></h1>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendedores.map(v => (
             <div key={v.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl hover:border-emerald-500/50 transition-all">
                <h3 className="text-xl font-black text-white italic mb-4 border-b border-slate-800 pb-2">{v.nome}</h3>
                <div className="space-y-4">
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Chave Pix</p>
                      <p className="font-mono text-sm text-emerald-400 bg-emerald-950/20 p-2 rounded-xl">{v.chave_pix || '-'}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Senha Login</p>
                        <p className="font-mono text-sm text-orange-400 bg-orange-950/20 p-2 rounded-xl">{v.senha_visualizacao || '****'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Contato</p>
                        <p className="font-mono text-sm text-slate-400 bg-slate-900 p-2 rounded-xl">{v.telefone || '-'}</p>
                      </div>
                   </div>
                   <p className="text-[9px] font-black text-slate-500 uppercase">Acesso: <span className="text-blue-400">{v.email}</span></p>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}