'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CentralDocs() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadDocs() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data);
  }

  useEffect(() => { loadDocs(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivoSelecionado || !titulo) return alert("Preencha o título e selecione o arquivo!");

    setLoading(true);

    try {
      // 1. Upload para o Storage (Pasta Admin)
      const fileName = `${Date.now()}-${arquivoSelecionado.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(`admin/${fileName}`, arquivoSelecionado);

      if (uploadError) throw uploadError;

      // 2. URL do Arquivo
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(`admin/${fileName}`);

      // 3. Salva no Banco
      const { error: dbError } = await supabase.from('documentos_tecnicos').insert([{
        titulo,
        link_arquivo: publicUrl
      }]);

      if (dbError) throw dbError;

      setTitulo('');
      setArquivoSelecionado(null);
      loadDocs();
      alert("Documento arquivado com sucesso!");
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <button onClick={() => router.push('/admin/central')} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar</button>
      
      <h1 className="text-3xl font-black italic text-cyan-400 mb-10 uppercase tracking-tighter">Meus <span className="text-white">Docs Privados</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
            <h2 className="text-xs font-black mb-6 uppercase italic text-slate-400">Novo Upload</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <input required placeholder="Título do Documento" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-500 font-bold" value={titulo} onChange={e => setTitulo(e.target.value)} />
              
              <div className="relative">
                <input type="file" className="hidden" id="admin-file" onChange={e => setArquivoSelecionado(e.target.files ? e.target.files[0] : null)} />
                <label htmlFor="admin-file" className={`flex items-center justify-center border-2 border-dashed p-6 rounded-2xl cursor-pointer transition-all ${arquivoSelecionado ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-[#0f172a]'}`}>
                  <span className="text-xs font-black uppercase italic">{arquivoSelecionado ? arquivoSelecionado.name : 'Selecionar do PC/Cel'}</span>
                </label>
              </div>

              <button disabled={loading} className="w-full bg-cyan-600 text-slate-900 font-black py-4 rounded-2xl uppercase italic text-[10px] tracking-widest shadow-lg shadow-cyan-600/20 transition-all active:scale-95">
                {loading ? 'Subindo...' : 'Arquivar Documento'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {docs.map(doc => (
            <div key={doc.id} className="bg-[#1e293b] p-6 rounded-[30px] border border-slate-800 flex justify-between items-center group shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500">📄</div>
                <h3 className="font-black text-white italic uppercase text-sm">{doc.titulo}</h3>
              </div>
              <div className="flex gap-2">
                <a href={doc.link_arquivo} target="_blank" className="bg-slate-800 hover:bg-slate-700 text-[9px] font-black px-4 py-2 rounded-xl uppercase transition-all">Baixar</a>
                <button onClick={async () => { if(confirm('Apagar?')) { await supabase.from('documentos_tecnicos').delete().eq('id', doc.id); loadDocs(); } }} className="bg-red-500/10 text-red-500 text-[9px] font-black px-4 py-2 rounded-xl uppercase hover:bg-red-600 hover:text-white transition-all">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}