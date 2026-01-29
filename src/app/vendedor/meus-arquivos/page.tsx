'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MeusArquivos() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [vendedorInfo, setVendedorInfo] = useState({ id: '', nome: '' });

  // Carrega os ficheiros já enviados para a Auditoria
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
        setVendedorInfo({ id: user.id, nome: user.user_metadata?.nome || user.email?.split('@')[0] });
        loadArquivos(user.id);
      }
    }
    getUser();
  }, []);

  // Função disparada pelo BOTÃO de enviar
  async function handleEnviarParaAuditoria() {
    if (!arquivoSelecionado || !titulo) {
      alert("ERRO: Precisas de um Título e de selecionar um Arquivo!");
      return;
    }

    setLoading(true);
    try {
      const fileName = `${Date.now()}-${arquivoSelecionado.name}`;
      const filePath = `${vendedorInfo.id}/${fileName}`;

      // 1. Sobe para o Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, arquivoSelecionado);

      if (uploadError) throw uploadError;

      // 2. Pega o Link Público
      const { data: { publicUrl } } = supabase.storage.from('documentos').getPublicUrl(filePath);

      // 3. Salva na Tabela de Auditoria do Admin
      await supabase.from('arquivos_vendedores').insert([{
        vendedor_id: vendedorInfo.id,
        vendedor_nome: vendedorInfo.nome,
        titulo: titulo.toUpperCase(),
        link_arquivo: publicUrl
      }]);

      setTitulo('');
      setArquivoSelecionado(null);
      loadArquivos(vendedorInfo.id);
      alert("DOCUMENTO ENVIADO COM SUCESSO!");

    } catch (err: any) {
      alert("Erro ao enviar: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <button onClick={() => router.back()} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar</button>
      
      <h1 className="text-2xl font-black italic text-cyan-400 uppercase mb-10 tracking-tighter">Minha <span className="text-white">Pasta</span></h1>
      
      <div className="max-w-xl mx-auto space-y-8">
        {/* ÁREA DE ENVIO */}
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <label htmlFor="titulo-input" className="block text-[9px] font-black uppercase text-slate-500 mb-2 ml-2">Título do Documento</label>
          <input 
            id="titulo-input"
            placeholder="EX: MEU CONTRATO MEI" 
            className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm mb-6 outline-none focus:border-cyan-500 font-bold uppercase" 
            value={titulo} 
            onChange={e => setTitulo(e.target.value)} 
          />
          
          <label 
            htmlFor="file-upload" 
            className={`block w-full border-2 border-dashed p-8 rounded-2xl text-center cursor-pointer transition-all ${arquivoSelecionado ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-[#0f172a] hover:border-slate-600'}`}
          >
            <span className="text-xl mb-2 block">{arquivoSelecionado ? '✅' : '📁'}</span>
            <span className="text-[10px] font-black uppercase italic text-slate-500 leading-tight">
              {arquivoSelecionado ? arquivoSelecionado.name : 'CLIQUE PARA SELECIONAR DA GALERIA'}
            </span>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              onChange={(e) => setArquivoSelecionado(e.target.files ? e.target.files[0] : null)} 
              accept="image/*,application/pdf" 
            />
          </label>

          {/* O BOTÃO QUE FALTAVA (SÓ ATIVA SE TIVER TUDO PREENCHIDO) */}
          <button 
            disabled={loading || !arquivoSelecionado || !titulo}
            onClick={handleEnviarParaAuditoria}
            className={`w-full mt-6 p-5 rounded-[25px] font-black uppercase text-xs tracking-widest transition-all ${loading || !arquivoSelecionado || !titulo ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-cyan-500 text-[#0f172a] shadow-xl shadow-cyan-500/20 active:scale-95'}`}
          >
            {loading ? 'SINCRONIZANDO...' : 'ENVIAR PARA AUDITORIA'}
          </button>
        </div>

        {/* LISTA DE DOCUMENTOS JÁ ENVIADOS */}
        <div className="space-y-3">
          {arquivos.map(arq => (
            <div key={arq.id} className="bg-slate-900/50 p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group">
              <div>
                <p className="font-black text-sm uppercase italic">{arq.titulo}</p>
                <p className="text-[8px] font-bold text-cyan-500 mt-1 uppercase tracking-widest italic">Sincronizado p/ Auditoria</p>
              </div>
              <a href={arq.link_arquivo} target="_blank" className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-[9px] font-black uppercase italic shadow-lg transition-all">Ver</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}