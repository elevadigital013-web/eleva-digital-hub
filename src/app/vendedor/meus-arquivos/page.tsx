'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MeusArquivos() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendedorInfo, setVendedorInfo] = useState({ id: '', nome: '' });

  async function loadArquivos(uid: string) {
    const { data } = await supabase.from('arquivos_vendedores').select('*').eq('vendedor_id', uid).order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setVendedorInfo({ id: user.id, nome: user.user_metadata?.nome || user.email?.split('@')[0] });
        loadArquivos(user.id);
      }
    }
    getUser();
  }, []);

  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file || !titulo) return alert("Preencha o título e selecione o arquivo!");
    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${vendedorInfo.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('documentos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);
      await supabase.from('arquivos_vendedores').insert([{
        vendedor_id: vendedorInfo.id, vendedor_nome: vendedorInfo.nome, titulo: titulo.toUpperCase(), link_arquivo: publicUrl
      }]);
      setTitulo(''); loadArquivos(vendedorInfo.id); alert("Arquivo Sincronizado!");
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <button onClick={() => router.back()} className="mb-8 text-[10px] font-black uppercase text-slate-500">← Voltar</button>
      <h1 className="text-2xl font-black italic text-cyan-400 uppercase mb-10 tracking-tighter">Minha <span className="text-white">Pasta</span></h1>
      
      <div className="max-w-xl mx-auto space-y-8">
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <label htmlFor="titulo-input" className="block text-[9px] font-black uppercase text-slate-500 mb-2 ml-2">Título do Documento</label>
          <input id="titulo-input" placeholder="EX: CONTRATO MEI" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm mb-6 outline-none focus:border-cyan-500 font-bold uppercase" value={titulo} onChange={e => setTitulo(e.target.value)} />
          
          <label htmlFor="file-input" className="block w-full border-2 border-dashed border-slate-800 bg-[#0f172a] p-8 rounded-2xl text-center cursor-pointer hover:border-slate-600 transition-all">
            <span className="text-xl mb-2 block">{loading ? '⌛' : '📁'}</span>
            <span className="text-[10px] font-black uppercase italic text-slate-500">
              {loading ? 'Subindo...' : 'Clique para selecionar da galeria'}
            </span>
            <input id="file-input" type="file" className="hidden" onChange={handleUpload} disabled={loading} accept="image/*,application/pdf" />
          </label>
        </div>

        <div className="space-y-3">
          {arquivos.map(arq => (
            <div key={arq.id} className="bg-slate-900/50 p-6 rounded-[35px] border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-black text-sm uppercase italic leading-none">{arq.titulo}</p>
                <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Enviado para Auditoria</p>
              </div>
              <a href={arq.link_arquivo} target="_blank" className="bg-slate-800 px-6 py-2 rounded-xl text-[9px] font-black uppercase italic shadow-lg">Ver</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}