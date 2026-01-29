'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * TIMELINE DE LOGS - ELEVA DIGITAL
 * Exibe o histórico de todas as ações importantes do sistema
 */
export default function LogsSistema() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('logs_sistema')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setLogs(data);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* NAVEGAÇÃO */}
        <button 
          onClick={() => router.push('/admin/central')} 
          className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors mb-4 block"
        >
          ← Voltar ao Painel
        </button>

        <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-10">
          Histórico do <span className="text-blue-500">Sistema</span>
        </h1>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-[10px] font-black uppercase text-slate-600 italic">
            Carregando linha do tempo...
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 md:ml-10 space-y-10">
            {logs.map((log) => (
              <div key={log.id} className="relative pl-10">
                {/* PONTO NA TIMELINE */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-[#0f172a] shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
                
                <div className="bg-[#1e293b] p-6 rounded-[30px] border border-slate-800 shadow-xl hover:border-blue-500/30 transition-all">
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <span className="text-[10px] font-black bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full uppercase italic">
                      {log.acao}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-200 mb-2 leading-relaxed">
                    {log.detalhes}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px]">👤</div>
                    <p className="text-[9px] font-black text-slate-500 uppercase">
                      Executor: <span className="text-slate-300">{log.vendedor_nome}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="pl-10 text-slate-600 italic">
                Nenhum registro encontrado no histórico.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}