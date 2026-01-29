'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal'; // IMPORTAÇÃO DO SEU MODAL

/**
 * PAINEL DE AUDITORIA DE CONTRATOS - ELEVA DIGITAL
 * Versão Completa com Modais Customizados para remover avisos da Netlify
 */
export default function AuditoriaContratos() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA O MODAL DE CONFIRMAÇÃO
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    titulo: '',
    mensagem: '',
    corBotao: 'bg-blue-600',
    acao: () => {}
  });

  // Busca todos os documentos enviados pela equipe
  async function loadArquivos() {
    setLoading(true);
    const { data } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setArquivos(data);
    setLoading(false);
  }

  useEffect(() => {
    loadArquivos();
  }, []);

  // --- LÓGICA DE APROVAÇÃO COM MODAL ---
  function prepararAprovacao(id: number, vendedor: string, titulo: string) {
    setModalConfig({
      isOpen: true,
      titulo: "Validar Contrato",
      mensagem: `Deseja aprovar o documento "${titulo}" do consultor ${vendedor}? Esta ação será registrada nos logs.`,
      corBotao: "bg-emerald-600",
      acao: () => executarAprovacao(id, vendedor, titulo)
    });
  }

  async function executarAprovacao(id: number, vendedor: string, titulo: string) {
    const { error } = await supabase
      .from('arquivos_vendedores')
      .update({ status: 'aprovado' })
      .eq('id', id);
    
    if (!error) {
      await supabase.from('logs_sistema').insert([{
        vendedor_nome: 'ADMIN',
        acao: 'Contrato Aprovado ✅',
        detalhes: `O documento "${titulo}" de ${vendedor} foi aprovado na auditoria.`
      }]);
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      loadArquivos();
    }
  }

  // --- LÓGICA DE EXCLUSÃO COM MODAL ---
  function prepararExclusao(id: number, titulo: string) {
    setModalConfig({
      isOpen: true,
      titulo: "Excluir Documento",
      mensagem: `Tem certeza que deseja apagar permanentemente o documento "${titulo}"? Esta ação não pode ser desfeita.`,
      corBotao: "bg-red-600",
      acao: () => executarExclusao(id)
    });
  }

  async function executarExclusao(id: number) {
    const { error } = await supabase
      .from('arquivos_vendedores')
      .delete()
      .eq('id', id);

    if (!error) {
      setModalConfig(prev => ({ ...prev, isOpen: false }));
      loadArquivos();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 text-white font-sans">
      
      {/* SEU MODAL CUSTOMIZADO INTEGRADO */}
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        titulo={modalConfig.titulo}
        mensagem={modalConfig.mensagem}
        onConfirm={modalConfig.acao}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        corBotao={modalConfig.corBotao}
      />

      <div className="max-w-7xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <button 
              onClick={() => router.push('/admin/central')} 
              className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors mb-2 block"
            >
              ← Voltar ao Painel
            </button>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              Auditoria de <span className="text-blue-500">Contratos</span>
            </h1>
          </div>
          <button onClick={loadArquivos} className="bg-slate-800 p-3 rounded-xl">🔄</button>
        </div>

        {/* LISTAGEM */}
        {loading ? (
          <div className="py-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-600">Sincronizando...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {arquivos.map(arq => (
              <div key={arq.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl group hover:border-blue-500/30 transition-all">
                
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-2xl">📄</div>
                  <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    arq.status === 'aprovado' ? 'bg-emerald-500 text-white' : 'bg-orange-500/20 text-orange-500'
                  }`}>
                    {arq.status === 'aprovado' ? 'Validado ✅' : 'Pendente ⏳'}
                  </span>
                </div>
                
                <h3 className="font-black italic uppercase text-sm mb-1 truncate">{arq.titulo}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-6 tracking-widest">
                  Consultor: <span className="text-blue-400">{arq.vendedor_nome}</span>
                </p>
                
                <div className="flex gap-2">
                  <a href={arq.link_arquivo} target="_blank" className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-3 rounded-xl text-[10px] font-black uppercase italic transition-all">Visualizar</a>
                  
                  {arq.status !== 'aprovado' ? (
                    <button 
                      onClick={() => prepararAprovacao(arq.id, arq.vendedor_nome, arq.titulo)} 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-[10px] font-black uppercase italic transition-all"
                    >
                      Aprovar
                    </button>
                  ) : (
                    <button 
                      onClick={() => prepararExclusao(arq.id, arq.titulo)}
                      className="bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white px-4 rounded-xl transition-all"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}