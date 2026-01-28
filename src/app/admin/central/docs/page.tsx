'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

export default function DocsAdmin() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  async function load() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if(data) setDocs(data);
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if(!titulo || !arquivo) return setToast({ msg: "Preencha tudo!", type: 'error' });
    setLoading(true);
    const nome = `doc-${Date.now()}`;
    const { error: storageErr } = await supabase.storage.from('docs_internos').upload(nome, arquivo);
    
    if(!storageErr) {
       const { data } = supabase.storage.from('docs_internos').getPublicUrl(nome);
       await supabase.from('documentos_tecnicos').insert([{ titulo, link_arquivo: data.publicUrl }]);
       setToast({ msg: "Documento salvo! 📄", type: 'success' });
       setTitulo(''); setArquivo(null); load();
    } else {
       setToast({ msg: "Erro no upload.", type: 'error' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      <button onClick={() => router.push('/admin/central')} className="text-[10px] font-black uppercase mb-8 opacity-50">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-8 text-cyan-500 italic tracking-tighter text-center lg:text-left">Documentação <span className="text-white">Privada Eleva</span></h1>
      <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-2xl">
        <input className="bg-[#0f172a] p-4 rounded-2xl flex-1 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-all" placeholder="Nome do Arquivo" value={titulo} onChange={e=>setTitulo(e.target.value)} />
        <input type="file" onChange={e=>setArquivo(e.target.files?.[0] || null)} className="text-[10px] text-slate-500 font-bold uppercase" />
        <button onClick={upload} disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-900/20 transition-all">
          {loading ? '...' : 'Subir Arquivo'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map(d => (
          <div key={d.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/50 transition-all">
            <span className="font-black italic uppercase text-sm tracking-tighter">{d.titulo}</span>
            <div className="flex gap-2">
              <a href={d.link_arquivo} target="_blank" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[10px] font-black transition-colors">Baixar</a>
              <button onClick={async () => { if(confirm("Apagar?")) { await supabase.from('documentos_tecnicos').delete().eq('id', d.id); load(); setToast({msg: 'Apagado', type: 'success'}); } }} className="bg-red-600/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}