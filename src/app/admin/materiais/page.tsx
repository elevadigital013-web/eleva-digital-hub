'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminMateriais() {
  const router = useRouter();
  const [materiais, setMateriais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMateriais() {
    const { data } = await supabase.from('materiais').select('*').order('ordem', { ascending: true });
    if (data) setMateriais(data);
    setLoading(false);
  }

  const updateLink = async (id: string, novoLink: string) => {
    const { error } = await supabase.from('materiais').update({ link: novoLink }).eq('id', id);
    if (!error) {
      alert("Link atualizado!");
      fetchMateriais();
    }
  };

  useEffect(() => { fetchMateriais(); }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="text-slate-500 font-black text-[10px] uppercase mb-8">← Voltar para Central</button>
        <h1 className="text-2xl font-black mb-2 italic">EDITOR DE <span className="text-blue-500">MATERIAIS</span></h1>
        <p className="text-slate-500 text-xs mb-10 font-medium">Os links alterados aqui aparecem na hora no app dos vendedores.</p>

        <div className="space-y-4">
          {materiais.map((item) => (
            <div key={item.id} className="bg-slate-900 p-6 rounded-[28px] border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{item.icone}</span>
                <h3 className="font-black uppercase text-sm tracking-widest">{item.titulo}</h3>
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  defaultValue={item.link} 
                  id={`link-${item.id}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-blue-400 outline-none focus:border-blue-600"
                />
                <button 
                  onClick={() => {
                    const val = (document.getElementById(`link-${item.id}`) as HTMLInputElement).value;
                    updateLink(item.id, val);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 px-6 rounded-xl font-black text-xs uppercase"
                >
                  SALVAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}