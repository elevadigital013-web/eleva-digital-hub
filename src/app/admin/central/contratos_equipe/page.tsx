'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ContratosEquipe() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Busca os arquivos que a equipe subiu
  async function loadArquivos() {
    setLoading(true);
    const { data } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setArquivos(data);
    setLoading(false);
  }

  // Função para aprovar o documento
  async function aprovarDocumento(id: number) {
    const { error } = await supabase
      .from('arquivos_vendedores')
      .update({ status: 'aprovado' })
      .eq('id', id);

    if (!error) {
      loadArquivos(); // Recarrega a lista para mostrar o novo status
    }
  }

  useEffect(() => { loadArquivos(); }, []);

  const arquivosFiltrados = arquivos.filter(arq =>
    arq.vendedor_nome.toLowerCase().includes(filtro.toLowerCase()) ||
    arq.titulo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* NAVEGAÇÃO */}
        <button onClick={() => router.push('/admin/central')} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">← Voltar ao Dashboard</button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black italic text-blue-500 uppercase tracking-tighter">Auditoria de <span className="text-white">Contratos</span></h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Arquivos enviados pela equipe de campo</p>
          </div>

          <input
            type="text"
            placeholder="Buscar por vendedor ou contrato..."
            className="bg-[#1e293b] border border-slate-800 p-4 rounded-2xl text-xs w-full md:w-80 outline-none focus:border-blue-500 transition-all font-bold"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-center py-20 text-slate-600 animate-pulse font-black uppercase italic">Sincronizando arquivos...</p>
        ) : arquivosFiltrados.length === 0 ? (
          <div className="py-20 text-center bg-[#1e293b]/30 rounded-[40px] border-2 border-dashed border-slate-800">
            <p className="text-slate-600 font-bold italic uppercase">Nenhum contrato encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {arquivosFiltrados.map((arq) => (
              <div key={arq.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-2xl group hover:border-blue-500/50 transition-all relative overflow-hidden flex flex-col justify-between">
                
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 text-2xl">
                      {arq.link_arquivo.includes('.pdf') ? '📕' : '📸'}
                    </div>
                    <div>
                      <h3 className="font-black text-white italic uppercase text-sm leading-none truncate w-40">{arq.titulo}</h3>
                      <p className="text-[10px] font-black text-blue-400 uppercase mt-1">Vendedor: {arq.vendedor_nome}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Data de Envio</p>
                      <p className="text-xs font-bold text-slate-300">{new Date(arq.created_at).toLocaleString('pt-BR')}</p>
                    </div>

                    {/* AÇÕES PRIMÁRIAS */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={arq.link_arquivo}
                        target="_blank"
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black py-3 rounded-xl uppercase text-center transition-all shadow-lg shadow-blue-600/10"
                      >
                        Abrir Arquivo
                      </a>
                      <button
                        onClick={async () => {
                          if (confirm('Deseja excluir permanentemente este documento?')) {
                            await supabase.from('arquivos_vendedores').delete().eq('id', arq.id);
                            loadArquivos();
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white text-[9px] font-black py-3 rounded-xl uppercase transition-all"
                      >
                        Excluir
                      </button>
                    </div>

                    {/* --- NOVO BLOCO DE STATUS E APROVAÇÃO --- */}
                    <div className="flex flex-col gap-2 mt-4">
                      <div className={`text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        arq.status === 'aprovado' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {arq.status === 'aprovado' ? '✅ Contrato Aprovado' : '⏳ Aguardando Auditoria'}
                      </div>

                      {arq.status !== 'aprovado' && (
                        <button
                          onClick={() => aprovarDocumento(arq.id)}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black py-3 rounded-xl uppercase transition-all shadow-lg shadow-emerald-600/10"
                        >
                          Aprovar Agora
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="absolute -right-2 -bottom-2 text-slate-800 text-6xl font-black italic opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  DOC
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}