'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MeusArquivos() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [link, setLink] = useState('');
  const [vendedorInfo, setVendedorInfo] = useState({ id: '', nome: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getVendedor() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setVendedorInfo({ id: user.id, nome: user.user_metadata?.nome || user.email?.split('@')[0] });
        loadArquivos(user.id);
      }
    }
    getVendedor();
  }, []);

  async function loadArquivos(uid: string) {
    const { data } = await supabase.from('arquivos_vendedores').select('*').eq('vendedor_id', uid).order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('arquivos_vendedores').insert([{
      vendedor_id: vendedorInfo.id,
      vendedor_nome: vendedorInfo.nome,
      titulo,
      link_arquivo: link
    }]);
    if (!error) { setTitulo(''); setLink(''); loadArquivos(vendedorInfo.id); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <button onClick={() => router.back()} className="mb-8 text-[10px] font-black uppercase text-slate-500">← Voltar</button>
      
      <h1 className="text-2xl font-black italic text-blue-500 uppercase mb-10 tracking-tighter">Minha <span className="text-white">Pasta</span></h1>

      <div className="space-y-8">
        {/* FORMULÁRIO RÁPIDO */}
        <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-4">Enviar Novo Documento</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            <input required placeholder="Título (Ex: Meu Contrato MEI)" className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-500" value={titulo} onChange={e => setTitulo(e.target.value)} />
            <input required type="url" placeholder="Link do Arquivo (Google Drive/PDF)" className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-xs font-mono outline-none focus:border-blue-500" value={link} onChange={e => setLink(e.target.value)} />
            <button disabled={loading} className="bg-blue-600 p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
              {loading ? 'Salvando...' : 'Adicionar à Pasta'}
            </button>
          </form>
        </div>

        {/* LISTAGEM */}
        <div className="space-y-3">
          {arquivos.map(arq => (
            <div key={arq.id} className="bg-slate-900/50 p-5 rounded-[30px] border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-black text-sm uppercase italic leading-none">{arq.titulo}</p>
                <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Enviado em {new Date(arq.created_at).toLocaleDateString()}</p>
              </div>
              <a href={arq.link_arquivo} target="_blank" className="bg-slate-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Ver</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}