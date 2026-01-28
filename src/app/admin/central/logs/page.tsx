'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LogsSistema() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLogs() {
    const { data } = await supabase
      .from('logs_sistema')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100); // Mostra os últimos 100 movimentos

    if (data) setLogs(data);
    setLoading(false);
  }

  useEffect(() => { loadLogs(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/admin/central')} className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest">← Voltar</button>
        
        <h1 className="text-3xl font-black italic text-orange-500 mb-2 uppercase tracking-tighter">Atividade <span className="text-white">do Sistema</span></h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase mb-10 tracking-widest">Histórico de ações em tempo real</p>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-20 animate-pulse text-slate-600 font-black uppercase text-xs italic tracking-widest">Carregando histórico...</p>
          ) : logs.length === 0 ? (
            <p className="text-center py-20 text-slate-700 italic">Nenhuma atividade registrada ainda.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-[#1e293b] p-6 rounded-[30px] border border-slate-800 flex items-start gap-4 hover:border-orange-500/30 transition-all group">
                <div className="bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-slate-800">
                  {log.acao.includes('Venda') ? '💰' : log.acao.includes('Lead') ? '👤' : '⚙️'}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-black uppercase italic text-sm ${log.acao.includes('Venda') ? 'text-emerald-400' : 'text-blue-400'}`}>
                      {log.acao}
                    </h3>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  
                  <p className="text-slate-300 text-xs font-bold mt-1 group-hover:text-white transition-colors">
                    {log.detalhes}
                  </p>
                  
                  <p className="text-[9px] font-black text-slate-500 uppercase mt-2 italic">
                    Executor: <span className="text-slate-400">{log.vendedor_nome || 'Sistema'}</span> • {new Date(log.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}