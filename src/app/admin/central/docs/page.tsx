'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CentralDocs() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  // Busca documentos cadastrados
  async function loadDocs() {
    const { data } = await supabase
      .from('documentos_tecnicos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDocs(data);
  }

  useEffect(() => { loadDocs(); }, []);

  // Adiciona novo documento (Contratos/Manuais)
  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('documentos_tecnicos').insert([{
      titulo,
      link_arquivo: link
    }]);

    if (!error) {
      setTitulo('');
      setLink('');
      loadDocs();
    }
    setLoading(false);
  }

  // Remove documento
  async function deleteDoc(id: number) {
    if (!confirm("Excluir este documento permanentemente?")) return;
    await supabase.from('documentos_tecnicos').delete().eq('id', id);
    loadDocs();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.push('/admin/central')} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar ao Painel</button>
        
        <h1 className="text-3xl font-black italic text-cyan-400 mb-2 uppercase tracking-tighter">Documentos <span className="text-white">Oficiais</span></h1>
        <p className="text-xs text-slate-500 font-bold uppercase mb-10 tracking-widest">Gestão de Contratos e Arquivos Eleva Digital</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* FORMULÁRIO DE UPLOAD/LINK */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-2xl">
              <h2 className="text-sm font-black mb-6 uppercase italic text-slate-200">Novo Documento</h2>
              <form onSubmit={handleAddDoc} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Título (Ex: Contrato de Serviço)</label>
                  <input required type="text" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-cyan-500 font-bold text-sm" value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2">Link do Arquivo (PDF/Drive)</label>
                  <input required type="url" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-cyan-400 outline-none focus:border-cyan-500 font-mono text-xs" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
                </div>
                <button disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-black py-4 rounded-2xl uppercase italic text-xs tracking-widest transition-all shadow-lg shadow-cyan-600/20">
                  {loading ? 'Sincronizando...' : 'Adicionar Documento'}
                </button>
              </form>
            </div>
          </div>

          {/* LISTAGEM DE DOCUMENTOS */}
          <div className="lg:col-span-2 space-y-4">
            {docs.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic">Nenhum documento cadastrado.</div>
            ) : (
              docs.map(doc => (
                <div key={doc.id} className="bg-[#1e293b] p-6 rounded-[30px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/30 transition-all shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500">📄</div>
                    <div>
                      <h3 className="font-black text-white italic uppercase text-sm leading-none">{doc.titulo}</h3>
                      <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Postado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a href={doc.link_arquivo} target="_blank" className="bg-slate-800 hover:bg-slate-700 text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all">Baixar</a>
                    <button onClick={() => deleteDoc(doc.id)} className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all">Excluir</button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}