'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });

  async function loadData() {
    const [leadsResp, logsResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(20)
    ]);

    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  useEffect(() => { loadData(); }, []);

  const salvarCurso = async () => {
    if(!novoCurso.titulo || !novoCurso.link) return;
    await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link }]);
    alert('Curso Salvo!');
    setNovoCurso({ titulo: '', link: '' });
  };

  if (aba === 'docs') {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900">
        <button onClick={() => setAba('dashboard')} className="mb-6 font-black text-blue-600 uppercase text-xs tracking-widest">← Voltar</button>
        <h1 className="text-3xl font-black italic mb-6">Manual Operacional</h1>
        <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-200">
          <h3 className="font-black uppercase text-blue-600 mb-2">Regras de Comissão</h3>
          <p className="text-sm">Vendas &lt; 5k: 20% | Vendas &gt; 5k: 25%.</p>
        </div>
      </div>
    );
  }

  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <button onClick={() => setAba('dashboard')} className="mb-6 font-black text-blue-600 uppercase text-xs tracking-widest">← Voltar</button>
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-[40px]">
          <h2 className="text-xl font-black italic mb-4">Adicionar Aula</h2>
          <input className="w-full bg-slate-950 p-4 mb-2 rounded-2xl border border-slate-800" placeholder="Título" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
          <input className="w-full bg-slate-950 p-4 mb-4 rounded-2xl border border-slate-800" placeholder="Link YouTube" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
          <button onClick={salvarCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setAba('cursos')} className="bg-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic">＋ Academy</button>
          <button onClick={() => setAba('docs')} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Docs</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-[10px] font-black uppercase text-slate-500 italic">Monitoramento de Leads</h2>
          {leads.map(l => (
            <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center">
              <div>
                <p className="font-black text-base italic">{l.nome_cliente}</p>
                <div className="flex gap-3 text-[10px] font-black uppercase text-slate-500 mt-1">
                  <span className="text-blue-500">Vend: {l.vendedores?.nome || 'Admin'}</span>
                  {/* Lógica para mostrar o contato correto */}
                  <span>Zap: {l.telefone || l.contato || '---'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{formatCurrency(l.valor_venda)}</p>
                <span className={`text-[9px] font-black uppercase ${l.status === 'fechado' ? 'text-emerald-500' : 'text-amber-500'}`}>{l.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 p-6 rounded-[40px] border border-slate-800">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 text-center italic">Logs</h2>
          {logs.map(log => (
            <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-2 mb-2">
              <p className="text-[10px] text-slate-300">
                <span className="font-black text-blue-500 uppercase">{log.vendedor_nome || 'Sistema'}</span> {log.acao}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}