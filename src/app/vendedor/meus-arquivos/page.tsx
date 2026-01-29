'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuditoriaContratos() {
  const router = useRouter();
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca TODOS os arquivos enviados pela equipe
  async function loadContratos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao carregar auditoria:", error.message);
    } else {
      setContratos(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadContratos();
  }, []);

  async function apagarArquivo(id: number) {
    if (!confirm("Deseja remover este arquivo da auditoria?")) return;
    await supabase.from('arquivos_vendedores').delete().eq('id', id);
    loadContratos();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <button onClick={() => router.back()} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">← Voltar</button>
      
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black italic text-cyan-400 uppercase tracking-tighter">
          Auditoria <span className="text-white">de Contratos</span>
        </h1>
        <button onClick={loadContratos} className="bg-slate-800 p-3 rounded-xl text-xs font-bold uppercase">Atualizar ↻</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-slate-500 font-black uppercase italic animate-pulse">Sincronizando Auditoria...</p>
        ) : contratos.length === 0 ? (
          <div className="bg-slate-900/50 p-10 rounded-[40px] border border-dashed border-slate-800 text-center">
            <p className="text-slate-500 font-bold uppercase text-sm italic">Nenhum contrato enviado para análise ainda.</p>
          </div>
        ) : (
          contratos.map((item) => (
            <div key={item.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between items-center shadow-xl group hover:border-cyan-500/50 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="bg-cyan-500/10 text-cyan-500 text-[8px] font-black uppercase px-2 py-1 rounded-md italic">Documento</span>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <h3 className="text-lg font-black italic uppercase leading-none text-white">{item.titulo}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Enviado por: <span className="text-cyan-400">{item.vendedor_nome}</span></p>
              </div>

              <div className="flex gap-2">
                <a 
                  href={item.link_arquivo} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-cyan-500 text-[#0f172a] px-6 py-3 rounded-2xl text-[10px] font-black uppercase italic shadow-lg shadow-cyan-500/10 hover:scale-105 transition-all"
                >
                  Abrir Contrato
                </a>
                <button 
                  onClick={() => apagarArquivo(item.id)}
                  className="bg-red-500/10 text-red-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                >
                  X
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}