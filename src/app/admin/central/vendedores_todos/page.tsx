'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function VendedoresTodos() {
  const router = useRouter();
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '', pix: '', telefone: '' });

  async function load() {
    const { data } = await supabase.from('dados_vendedores').select('*');
    if(data) setVendedores(data);
  }

  useEffect(() => { load(); }, []);

  async function salvar() {
    await supabase.from('dados_vendedores').insert([novo]);
    setNovo({ nome: '', email: '', senha: '', pix: '', telefone: '' });
    load();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <button onClick={() => router.back()} className="text-[10px] font-black uppercase mb-8 opacity-50 hover:opacity-100">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-8 text-emerald-500">Gestão de Vendedores</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 space-y-4 h-fit">
          <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="Nome" value={novo.nome} onChange={e=>setNovo({...novo, nome:e.target.value})} />
          <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="Email" value={novo.email} onChange={e=>setNovo({...novo, email:e.target.value})} />
          <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="Senha Visual" value={novo.senha} onChange={e=>setNovo({...novo, senha:e.target.value})} />
          <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="Chave Pix" value={novo.pix} onChange={e=>setNovo({...novo, pix:e.target.value})} />
          <button onClick={salvar} className="w-full bg-emerald-600 p-4 rounded-2xl font-black uppercase">Cadastrar</button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {vendedores.map(v => (
            <div key={v.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between">
              <div>
                <p className="font-black text-lg">{v.nome}</p>
                <p className="text-xs opacity-50">{v.email}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-400 font-mono text-xs">{v.chave_pix}</p>
                <p className="text-orange-400 font-mono text-xs">{v.senha_visualizacao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}