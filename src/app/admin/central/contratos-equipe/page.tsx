'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ContratosEquipe() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca todos os arquivos de todos os vendedores
  async function loadTodosArquivos() {
    setLoading(true);
    const { data } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setArquivos(data);
    setLoading(false);
  }

  useEffect(() => { loadTodosArquivos(); }, []);

  // Admin tem poder de limpar arquivos se necessário
  async function removerArquivo(id: number) {
    if (!confirm("Remover este documento da central?")) return;
    await supabase.from('arquivos_vendedores').delete().eq('id', id);
    loadTodosArquivos();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.push('/admin/central')} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar ao Dashboard</button>
        
        <h1 className="text-3xl font-black italic text-orange-500 mb-2 uppercase tracking-tighter">Contratos da <span className="text-white">Equipe</span></h1>
        <p className="text-xs text-slate-500 font-bold uppercase mb-10 tracking-widest">Auditoria de documentos enviados pelos consultores</p>

        {loading ? (
          <p className="text-center py-20 animate-pulse text-slate-500 font-black uppercase text-xs italic">Sincronizando arquivos...</p>
        ) : arquivos.length === 0 ? (
          <div className="bg-[#1e293b] rounded-[40px] p-20 text-center border border-slate-800">
            <p className="text-slate-500 italic font-bold">Nenhum consultor enviou documentos ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {arquivos.map((arq) => (
              <div key={arq.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl hover:border-orange-500/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-orange-500 text-[#0f172a] text-[9px] font-black px-3 py-1 rounded-full uppercase italic">
                      {arq.vendedor_nome}
                    </span>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">{new Date(arq.created_at).toLocaleDateString()}</p>
                  </div>
                  <h3 className="font-black text-lg text-white uppercase italic leading-tight mb-2">{arq.titulo}</h3>
                </div>

                <div className="flex gap-2 mt-4">
                  <a 
                    href={arq.link_arquivo} 
                    target="_blank" 
                    className="flex-1 bg-white text-slate-900 text-center py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                  >
                    Visualizar
                  </a>
                  <button 
                    onClick={() => removerArquivo(arq.id)}
                    className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}