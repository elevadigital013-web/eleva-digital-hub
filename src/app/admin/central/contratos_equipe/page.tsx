'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuditoriaContratos() {
  const [arquivos, setArquivos] = useState<any[]>([]);

  async function loadArquivos() {
    const { data } = await supabase.from('arquivos_vendedores').select('*').order('created_at', { ascending: false });
    if (data) setArquivos(data);
  }

  // FUNÇÃO DE APROVAÇÃO RÁPIDA
  async function aprovar(id: number, vendedor: string, titulo: string) {
    const { error } = await supabase.from('arquivos_vendedores').update({ status: 'aprovado' }).eq('id', id);
    
    if (!error) {
      // Gera um log automático da aprovação
      await supabase.from('logs_sistema').insert([{
        vendedor_nome: 'ADMIN',
        acao: 'Contrato Aprovado ✅',
        detalhes: `Documento "${titulo}" de ${vendedor} foi validado.`
      }]);
      loadArquivos();
    }
  }

  useEffect(() => { loadArquivos(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] p-8 text-white">
      <h1 className="text-2xl font-black italic uppercase mb-10">Auditoria de <span className="text-blue-500">Contratos</span></h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arquivos.map(arq => (
          <div key={arq.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black italic uppercase text-sm">{arq.titulo}</h3>
              <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${arq.status === 'aprovado' ? 'bg-emerald-500 text-white' : 'bg-orange-500/20 text-orange-500'}`}>
                {arq.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
              </span>
            </div>
            
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-6">Por: {arq.vendedor_nome}</p>
            
            <div className="flex gap-2">
              <a href={arq.link_arquivo} target="_blank" className="flex-1 bg-slate-800 text-center py-3 rounded-xl text-[10px] font-black uppercase">Ver</a>
              {arq.status !== 'aprovado' && (
                <button onClick={() => aprovar(arq.id, arq.vendedor_nome, arq.titulo)} className="flex-1 bg-emerald-600 py-3 rounded-xl text-[10px] font-black uppercase">Aprovar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}