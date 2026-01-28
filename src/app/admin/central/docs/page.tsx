'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // Importado

export default function DocsAdmin() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  async function load() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if(data) setDocs(data);
  }

  useEffect(() => { load(); }, []);

  async function upload() {
    if(!titulo || !arquivo) return setToast({ msg: "Preencha todos os campos!", type: 'error' });
    setUploading(true);
    
    const nome = `doc-${Date.now()}`;
    const { error: storageError } = await supabase.storage.from('docs_internos').upload(nome, arquivo);
    
    if (storageError) {
        setToast({ msg: "Erro no upload do arquivo.", type: 'error' });
        setUploading(false);
        return;
    }

    const { data: urlData } = supabase.storage.from('docs_internos').getPublicUrl(nome);
    const { error: dbError } = await supabase.from('documentos_tecnicos').insert([{ titulo, link_arquivo: urlData.publicUrl }]);
    
    setUploading(false);
    if (!dbError) {
        setToast({ msg: "Documento salvo! 📂", type: 'success' });
        setTitulo(''); setArquivo(null);
        load();
    }
  }

  async function apagar(id: number) {
    if(!confirm("Excluir documento?")) return;
    const { error } = await supabase.from('documentos_tecnicos').delete().eq('id', id);
    if (!error) {
        setToast({ msg: "Documento excluído.", type: 'success' });
        load();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      
      <button onClick={() => router.back()} className="text-[10px] font-black uppercase mb-8">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-8 text-cyan-500 text-center md:text-left">Documentação Eleva</h1>

      <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <input className="bg-[#0f172a] p-4 rounded-2xl flex-1 border border-slate-800 text-white outline-none focus:border-cyan-500 transition-colors" placeholder="Nome do Doc" value={titulo} onChange={e=>setTitulo(e.target.value)} />
        <input type="file" onChange={e=>setArquivo(e.target.files?.[0] || null)} className="text-xs text-slate-400" />
        <button disabled={uploading} onClick={upload} className="bg-cyan-500 hover:bg-cyan-400 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
           {uploading ? 'Enviando...' : 'Subir'}
        </button>
      </div>

      <div className="space-y-4">
        {docs.map(d => (
          <div key={d.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/50">
            <span className="font-bold italic uppercase text-sm">{d.titulo}</span>
            <div className="flex gap-4">
              <a href={d.link_arquivo} target="_blank" className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Baixar</a>
              <button onClick={() => apagar(d.id)} className="bg-red-600/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black">X</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}