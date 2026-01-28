'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DocsAdmin() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function load() {
    const { data } = await supabase.from('documentos_tecnicos').select('*');
    if(data) setDocs(data);
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if(!arquivo) return;
    const nome = `doc-${Date.now()}`;
    await supabase.storage.from('docs_internos').upload(nome, arquivo);
    const { data } = supabase.storage.from('docs_internos').getPublicUrl(nome);
    await supabase.from('documentos_tecnicos').insert([{ titulo, link_arquivo: data.publicUrl }]);
    load();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <button onClick={() => router.back()} className="text-[10px] font-black uppercase mb-8">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-8 text-cyan-500">Documentação Eleva</h1>

      <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 mb-8 flex gap-4">
        <input className="bg-[#0f172a] p-4 rounded-2xl flex-1" placeholder="Nome do Doc" value={titulo} onChange={e=>setTitulo(e.target.value)} />
        <input type="file" onChange={e=>setArquivo(e.target.files?.[0] || null)} className="text-xs self-center" />
        <button onClick={upload} className="bg-cyan-500 px-8 py-4 rounded-2xl font-black uppercase">Subir</button>
      </div>

      <div className="space-y-4">
        {docs.map(d => (
          <div key={d.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between">
            <span className="font-bold">{d.titulo}</span>
            <div className="flex gap-4">
              <a href={d.link_arquivo} target="_blank" className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Baixar</a>
              <button onClick={async () => { await supabase.from('documentos_tecnicos').delete().eq('id', d.id); load(); }} className="bg-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}