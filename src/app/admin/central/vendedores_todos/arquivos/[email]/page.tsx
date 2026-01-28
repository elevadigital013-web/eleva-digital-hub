'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';

export default function ArquivosVendedorAdmin() {
  const router = useRouter();
  const params = useParams();
  const emailVendedor = params.email as string;

  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Busca os arquivos vinculados a este e-mail
  async function loadArquivos() {
    setLoading(true);
    // Assumindo que você tenha uma tabela 'arquivos_vendedores'
    const { data, error } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .eq('vendedor_email', decodeURIComponent(emailVendedor))
      .order('created_at', { ascending: false });

    if (data) setArquivos(data);
    setLoading(false);
  }

  useEffect(() => {
    if (emailVendedor) loadArquivos();
  }, [emailVendedor]);

  // Função para deletar um arquivo (opcional)
  async function deletarArquivo(id: number) {
    if (!confirm("Deseja remover este documento?")) return;
    const { error } = await supabase.from('arquivos_vendedores').delete().eq('id', id);
    if (!error) loadArquivos();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-12">
        <button 
          onClick={() => router.back()} 
          className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all mb-4 block"
        >
          ← Voltar para Equipe
        </button>
        
        <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
          Documentos de: <br />
          <span className="text-blue-500 lowercase">{decodeURIComponent(emailVendedor)}</span>
        </h1>
      </div>

      {/* LISTAGEM DE ARQUIVOS */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {arquivos.map((arq) => (
              <div key={arq.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex items-center justify-between group hover:border-blue-500/50 transition-all shadow-xl">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="bg-blue-600/20 w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-black text-xs uppercase italic truncate pr-2" title={arq.nome_arquivo}>
                      {arq.nome_arquivo}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                      Enviado em: {new Date(arq.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={arq.url_arquivo} 
                    target="_blank" 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-600/20"
                  >
                    Abrir
                  </a>
                  <button 
                    onClick={() => deletarArquivo(arq.id)}
                    className="text-slate-600 hover:text-red-500 p-2 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {arquivos.length === 0 && (
              <div className="col-span-full py-20 bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-800 text-center">
                <p className="text-slate-500 text-sm font-bold italic uppercase opacity-50">
                  Nenhum arquivo enviado por este consultor.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}