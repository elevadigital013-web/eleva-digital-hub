'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toast } from '@/components/Toast';

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  
  // Estado do Novo Curso (Agora com PDF)
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '', pdf: '' });
  
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  // Carrega os dados para o Painel Completo
  async function loadData() {
    const [leadsResp, logsResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  useEffect(() => { loadData(); }, []);

  const salvarCurso = async () => {
    if (!novoCurso.titulo || !novoCurso.link) {
      setToast({ msg: 'Preencha Título e Vídeo!', type: 'error' });
      return;
    }

    const { error } = await supabase.from('cursos').insert([{
      titulo: novoCurso.titulo,
      link_video: novoCurso.link,
      link_material: novoCurso.pdf // Salvando o PDF
    }]);
    
    if (error) {
      console.error(error);
      setToast({ msg: 'Erro ao salvar. Verifique o Banco.', type: 'error' });
    } else {
      setToast({ msg: 'Aula e Material Salvos! 🎓', type: 'success' });
      setNovoCurso({ titulo: '', link: '', pdf: '' });
    }
  };

  // ABA DOCUMENTOS
  if (aba === 'docs') {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900">
        <button onClick={() => setAba('dashboard')} className="mb-6 font-black text-blue-600 uppercase text-xs">← Voltar</button>
        <h1 className="text-3xl font-black italic mb-6">Manual Operacional</h1>
        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
          <p className="font-bold text-blue-600">Regras de Comissão:</p>
          <p className="text-sm">20% Fixo | 25% Acima de 5k.</p>
        </div>
      </div>
    );
  }

  // ABA CURSOS (COM CAMPO DE PDF)
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white relative">
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
        
        <button onClick={() => setAba('dashboard')} className="mb-8 font-black text-blue-600 uppercase text-xs">← Voltar</button>
        
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Título da Aula</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Link do Vídeo (YouTube)</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Link do Material PDF (Drive/Canva)</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" placeholder="https://..." value={novoCurso.pdf} onChange={e => setNovoCurso({...novoCurso, pdf: e.target.value})} />
            </div>

            <button onClick={salvarCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all mt-4">
              Publicar Conteúdo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PRINCIPAL (RESTAURADO)
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      <div className="max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setAba('cursos')} className="bg-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">＋ Academy</button>
          <button onClick={() => setAba('docs')} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Docs</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA 1: CALENDÁRIO & FATURAMENTO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
            <p className="text-blue-200 text-[9px] font-black uppercase mb-1 tracking-widest">Faturamento Mês</p>
            {/* Calculando total real */}
            <p className="text-3xl font-black">
              {formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0))}
            </p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 text-center italic">Mapa de Vendas</h3>
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(dia => {
                const temVenda = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                return (
                  <div key={dia.toString()} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${temVenda ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                    {dia.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUNA 2: LEADS (LISTA COMPLETA) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento de Leads</h2>
            <div className="space-y-3">
              {leads.map(l => (
                <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm italic">{l.nome_cliente}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[9px] font-black text-blue-500 uppercase">Vendedor: {l.vendedores?.nome || 'Admin'}</span>
                      <span className="text-[9px] font-bold text-slate-600 italic">{l.telefone || l.contato || 'Sem contato'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">{formatCurrency(l.valor_venda)}</p>
                    <p className={`text-[8px] font-black uppercase ${l.status === 'fechado' ? 'text-emerald-500' : 'text-amber-500'}`}>{l.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 3: LOGS */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs do Sistema</h2>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1">
                <p className="text-[10px] text-slate-300">
                  <span className="font-black text-blue-500 uppercase">{log.vendedor_nome || 'Sistema'}</span> {log.acao}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}