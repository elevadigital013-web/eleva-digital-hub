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

  // Busca os arquivos que este vendedor já enviou
  async function loadArquivos(uid: string) {
    const { data } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .eq('vendedor_id', uid)
      .order('created_at', { ascending: false });
    
    if (data) setArquivos(data);
  }

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setVendedorInfo({ 
          id: user.id, 
          nome: user.user_metadata?.nome || user.email?.split('@')[0] 
        });
        loadArquivos(user.id);
      } else {
        router.push('/');
      }
    }
    getUser();
  }, [router]);

  // Lógica de upload para o Storage e Banco de Dados
  async function handleUpload(e: any) {
    const file = e.target.files[0];
    if (!file || !titulo) {
      alert("Dê um título e selecione um arquivo.");
      return;
    }

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${vendedorInfo.id}/${fileName}`;

      // 1. Upload para o Storage (Bucket: documentos)
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Pega a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      // 3. Salva na tabela para o Admin auditar
      const { error: dbError } = await supabase
        .from('arquivos_vendedores')
        .insert([{
          vendedor_id: vendedorInfo.id,
          vendedor_nome: vendedorInfo.nome,
          titulo: titulo.toUpperCase(),
          link_arquivo: publicUrl
        }]);

      if (dbError) throw dbError;

      setTitulo('');
      loadArquivos(vendedorInfo.id);
      alert("Documento enviado com sucesso!");
    } catch (err: any) {
      alert("Erro ao enviar arquivo: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <button 
        onClick={() => router.back()} 
        className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
      >
        ← Voltar
      </button>
      
      <h1 className="text-2xl font-black italic text-cyan-400 uppercase mb-10 tracking-tighter">
        Minha <span className="text-white">Pasta</span>
      </h1>

      <div className="max-w-xl mx-auto space-y-8">
        {/* FORMULÁRIO DE SELEÇÃO */}
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <div className="space-y-4">
            <div>
              <label htmlFor="titulo-doc" className="text-[9px] font-black uppercase text-slate-500 ml-2 mb-1 block">Nome do Arquivo</label>
              <input 
                id="titulo-doc"
                required 
                placeholder="Ex: Contrato Pedro Silva" 
                className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-500 font-bold uppercase" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
              />
            </div>
            
            <label className="block w-full border-2 border-dashed border-slate-800 bg-[#0f172a] p-8 rounded-2xl text-center cursor-pointer hover:border-slate-600 transition-all active:scale-95 shadow-inner">
              <span className="text-2xl mb-2 block">{loading ? '⌛' : '📁'}</span>
              <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-500">
                {loading ? 'Sincronizando...' : 'Escolher da Galeria ou PDF'}
              </span>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleUpload} 
                disabled={loading} 
                accept="image/*,application/pdf" 
              />
            </label>
          </div>
        </div>

        {/* LISTAGEM DE ARQUIVOS ENVIADOS */}
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase text-slate-600 ml-4 tracking-widest italic">Histórico de Envios</p>
          {arquivos.map(arq => (
            <div key={arq.id} className="bg-slate-900/50 p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 text-lg">📄</div>
                <div>
                  <p className="font-black text-sm uppercase italic leading-none">{arq.titulo}</p>
                  <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-widest italic opacity-60">Sincronizado</p>
                </div>
              </div>
              <a 
                href={arq.link_arquivo} 
                target="_blank" 
                className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-[9px] font-black uppercase italic transition-all shadow-lg active:scale-95"
              >
                Ver
              </a>
            </div>
          ))}
          {arquivos.length === 0 && (
            <p className="text-center py-10 text-slate-700 italic text-xs uppercase font-bold tracking-widest opacity-30">Nenhum contrato enviado.</p>
          )}
        </div>
      </div>
    </div>
  );
}