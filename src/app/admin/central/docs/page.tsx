'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DocsAdmin() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // --- CARREGAR DOCUMENTOS ---
  async function load() {
    const { data } = await supabase
      .from('documentos_tecnicos')
      .select('*')
      .order('created_at', { ascending: false });
    if(data) setDocs(data);
  }

  useEffect(() => { load(); }, []);

  // --- FUNÇÃO DE UPLOAD ---
  async function upload() {
    if(!titulo || !arquivo) return alert("Preencha o nome e selecione um arquivo.");
    setUploading(true);
    
    try {
      const nomeUnico = `doc-${Date.now()}-${arquivo.name.replace(/\s/g, '-')}`;
      
      // Envia para o storage
      const { error: storageError } = await supabase.storage
        .from('docs_internos')
        .upload(nomeUnico, arquivo);

      if (storageError) throw storageError;

      // Pega a URL pública
      const { data: urlData } = supabase.storage
        .from('docs_internos')
        .getPublicUrl(nomeUnico);
      
      // Salva no banco de dados
      await supabase.from('documentos_tecnicos').insert([
        { titulo, link_arquivo: urlData.publicUrl }
      ]);

      setTitulo('');
      setArquivo(null);
      // Reseta o input de arquivo manualmente
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      load();
    } catch (error) {
      console.error(error);
      alert("Erro ao subir arquivo.");
    } finally {
      setUploading(false);
    }
  }

  // --- FUNÇÃO DE EXCLUSÃO ---
  async function apagar(id: number) {
    if(!confirm("Tem certeza que deseja excluir este documento permanentemente?")) return;
    await supabase.from('documentos_tecnicos').delete().eq('id', id);
    load();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      {/* BOTÃO VOLTAR */}
      <button 
        onClick={() => router.back()} 
        className="text-[10px] font-black uppercase mb-8 opacity-50 hover:opacity-100 transition-opacity"
      >
        ← Voltar ao Dashboard
      </button>

      <h1 className="text-2xl font-black italic uppercase mb-8 text-cyan-500 tracking-tighter">
        Documentação <span className="text-white">Interna Eleva</span>
      </h1>

      {/* ÁREA DE UPLOAD (LAYOUT ORIGINAL) */}
      <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-2xl">
        <input 
          className="bg-[#0f172a] p-4 rounded-2xl flex-1 border border-slate-800 text-sm focus:border-cyan-500 outline-none transition-colors" 
          placeholder="Nome do Documento..." 
          value={titulo} 
          onChange={e => setTitulo(e.target.value)} 
        />
        <div className="bg-[#0f172a] p-3 rounded-2xl border border-slate-800 flex-1 w-full md:w-auto">
          <input 
            id="file-upload"
            type="file" 
            onChange={e => setArquivo(e.target.files?.[0] || null)} 
            className="text-[10px] text-slate-400 font-bold uppercase" 
          />
        </div>
        <button 
          onClick={upload} 
          disabled={uploading}
          className="bg-cyan-500 hover:bg-cyan-400 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Subir Arquivo'}
        </button>
      </div>

      {/* LISTA DE DOCUMENTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.length === 0 && (
          <p className="text-slate-500 italic text-sm p-4">Nenhum documento privado encontrado.</p>
        )}
        {docs.map(d => (
          <div 
            key={d.id} 
            className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-500 font-bold">
                doc
              </div>
              <div>
                <span className="font-black text-sm uppercase italic block">{d.titulo}</span>
                <span className="text-[9px] text-slate-500 font-bold">{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a 
                href={d.link_arquivo} 
                target="_blank" 
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors"
              >
                Baixar
              </a>
              <button 
                onClick={() => apagar(d.id)} 
                className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all"
              >
                X
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}