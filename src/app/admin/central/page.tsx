'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toast } from '@/components/Toast';

// --- INTERFACES ---
interface Vendedor { nome: string; }
interface Lead { id: number; created_at: string; nome_cliente: string; status: string; valor_venda: number; vendedores?: Vendedor; }
interface Log { id: number; created_at: string; acao: string; vendedor_nome?: string; valor?: number; }
interface Curso { id: number; titulo: string; link_video?: string; link_material?: string; }
interface ComentarioAdmin { id: number; created_at: string; nome_usuario: string; comentario: string; nota: number; cursos: { titulo: string }; }

export default function AdminCentral() {
  const router = useRouter();
  // REMOVIDA A ABA 'DOCS' DAQUI (POIS É UMA PÁGINA SEPARADA)
  const [aba, setAba] = useState<'dashboard' | 'cursos' | 'avaliacoes'>('dashboard');
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  // DADOS
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [listaCursos, setListaCursos] = useState<Curso[]>([]);
  const [listaComentarios, setListaComentarios] = useState<ComentarioAdmin[]>([]);
  const [updatingLead, setUpdatingLead] = useState<number | null>(null);

  // FORMULÁRIOS
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [arquivoPdfAula, setArquivoPdfAula] = useState<File | null>(null);
  const [uploadingCurso, setUploadingCurso] = useState(false);

  // --- CARREGAR DADOS ---
  async function loadDashboardData() {
    const leadsResp = await supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false });
    const logsResp = await supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(30);

    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  const rankingVendedores = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(lead => {
        if (lead.status && lead.status.toLowerCase() === 'fechado') {
            const nome = lead.vendedores?.nome || 'Admin/Outros';
            stats[nome] = (stats[nome] || 0) + (Number(lead.valor_venda) || 0);
        }
    });
    return Object.entries(stats).map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  }, [leads]);

  async function carregarCursos() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if (data) setListaCursos(data);
  }
  async function carregarComentarios() {
    const { data } = await supabase.from('comentarios_aula').select('*, cursos(titulo)').order('created_at', { ascending: false });
    if (data) setListaComentarios(data as any);
  }

  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => {
    if (aba === 'cursos') carregarCursos();
    if (aba === 'avaliacoes') carregarComentarios();
  }, [aba]);

  // --- AÇÕES ---

  async function alternarStatusLead(lead: Lead) {
    if (updatingLead) return;
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    // Substituindo o confirm nativo feio por Toast seria ideal, mas aqui mantemos lógica rápida
    if (!confirm(`Alterar status para ${novoStatus.toUpperCase()}?`)) return;
    
    setUpdatingLead(lead.id);
    await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);
    setUpdatingLead(null);
    setToast({ msg: 'Status atualizado!', type: 'success' });
    loadDashboardData();
  }

  async function deletarLog(id: number) {
    if (!confirm("Apagar este log?")) return;
    await supabase.from('logs_atividades').delete().eq('id', id);
    loadDashboardData();
  }

  async function salvarCurso() {
    if (!novoCurso.titulo) return setToast({ msg: 'Título obrigatório', type: 'error' });
    setUploadingCurso(true);
    let urlPdf = '';
    if (arquivoPdfAula) {
      const nome = `aula-${Date.now()}-${arquivoPdfAula.name.replace(/\s/g, '-')}`;
      await supabase.storage.from('materiais').upload(nome, arquivoPdfAula);
      const { data } = supabase.storage.from('materiais').getPublicUrl(nome);
      urlPdf = data.publicUrl;
    }
    await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link, link_material: urlPdf }]);
    setUploadingCurso(false); setNovoCurso({ titulo: '', link: '' }); setArquivoPdfAula(null);
    setToast({ msg: 'Aula publicada!', type: 'success' }); carregarCursos();
  }

  async function deletarCurso(id: number) {
    if (!confirm("Apagar aula?")) return;
    await supabase.from('cursos').delete().eq('id', id); carregarCursos();
  }

  async function deletarComentario(id: number) {
    if (!confirm("Apagar comentário?")) return;
    await supabase.from('comentarios_aula').delete().eq('id', id);
    setToast({ msg: 'Comentário removido.', type: 'success' }); carregarComentarios();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setAba('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${aba === 'dashboard' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-800'}`}>Dashboard</button>
          <button onClick={() => setAba('cursos')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${aba === 'cursos' ? 'bg-purple-600' : 'bg-slate-900 border border-slate-800'}`}>Academy</button>
          <button onClick={() => setAba('avaliacoes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${aba === 'avaliacoes' ? 'bg-amber-600' : 'bg-slate-900 border border-slate-800'}`}>Moderação</button>
          
          {/* BOTÃO DOCS AGORA É UM LINK PARA A PÁGINA SEPARADA */}
          <button 
            onClick={() => router.push('/admin/central/docs')} 
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-900/30 text-emerald-500 border border-emerald-900 hover:bg-emerald-900 hover:text-white transition-all"
          >
            Docs Internos ↗
          </button>
        </div>
      </div>

      {/* ABA DASHBOARD */}
      {aba === 'dashboard' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Esquerda: Faturamento e Ranking */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
                <p className="text-blue-200 text-[9px] font-black uppercase mb-1 tracking-widest">Faturamento Mês</p>
                <p className="text-3xl font-black">{formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0))}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-xl">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 italic text-center">🏆 Ranking Vendas</h3>
                 <div className="space-y-3">
                    {rankingVendedores.length === 0 && <p className="text-center text-xs text-slate-600">Sem dados.</p>}
                    {rankingVendedores.map((v, i) => (
                        <div key={v.nome} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${i===0?'bg-amber-400 text-amber-900':i===1?'bg-slate-400 text-slate-900':'bg-slate-800 text-slate-500'}`}>{i+1}</span>
                                <p className="text-xs font-bold text-slate-300 truncate max-w-[90px]">{v.nome}</p>
                            </div>
                            <p className="text-xs font-black text-emerald-500">{formatCurrency(v.total)}</p>
                        </div>
                    ))}
                 </div>
              </div>
              
              {/* Calendário Simplificado */}
              <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-2xl">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 text-center italic">Atividade Diária</h3>
                <div className="grid grid-cols-7 gap-2">
                  {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(dia => {
                    const ativo = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                    return (<div key={dia.toString()} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${ativo ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>{dia.getDate()}</div>);
                  })}
                </div>
              </div>
            </div>

            {/* Centro: Monitoramento Interativo */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento de Leads (Clique para alterar)</h2>
               <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {leads.map(l => (
                    <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center hover:border-blue-900 transition-colors">
                      <div>
                        <p className="font-black text-sm italic text-white">{l.nome_cliente}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase">{l.vendedores?.nome || 'Admin'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                          <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                          <button 
                            onClick={() => alternarStatusLead(l)}
                            disabled={updatingLead === l.id}
                            className={`text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1
                                ${l.status === 'fechado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500 hover:text-white'}`}
                          >
                            {updatingLead === l.id ? '...' : (l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓')}
                          </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Direita: Logs com Botão de Apagar */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
              <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {logs.length === 0 && <p className="text-center text-xs text-slate-500">Nenhum log.</p>}
                {logs.map(log => (
                   <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1 flex justify-between items-start group hover:bg-slate-800/30 rounded-r-lg transition-colors">
                      <div className="pr-2">
                        <p className="text-[10px] text-slate-300 leading-tight">
                            <span className="font-black text-blue-500 uppercase mr-1">{log.vendedor_nome || 'SISTEMA'}</span>
                            <span className="italic opacity-80">{log.acao}</span>
                        </p>
                      </div>
                      <button onClick={() => deletarLog(log.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold px-2 hover:bg-red-500/10 rounded cursor-pointer">X</button>
                   </div>
                ))}
              </div>
            </div>
          </div>
      )}

      {/* ABA CURSOS (ACADEMY) */}
      {aba === 'cursos' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl h-fit">
            <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Título" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
              <input type="text" placeholder="Link YouTube" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
              <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-2">PDF (Upload)</label><input type="file" accept="application/pdf" onChange={e => setArquivoPdfAula(e.target.files ? e.target.files[0] : null)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400" /></div>
              <button onClick={salvarCurso} disabled={uploadingCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all mt-4">{uploadingCurso ? 'Enviando...' : 'Publicar Conteúdo'}</button>
            </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-xl font-black italic mb-6 text-center uppercase text-slate-500">Aulas Ativas</h2>
             {listaCursos.map(curso => (
               <div key={curso.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center">
                  <div className="overflow-hidden"><p className="font-bold text-sm truncate max-w-[200px]">{curso.titulo}</p></div>
                  <button onClick={() => deletarCurso(curso.id)} className="bg-slate-950 text-slate-500 hover:text-red-500 w-10 h-10 rounded-full flex items-center justify-center">🗑️</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* ABA MODERAÇÃO */}
      {aba === 'avaliacoes' && (
        <div className="max-w-4xl mx-auto">
           <h2 className="text-xl font-black italic mb-6 text-center uppercase text-amber-500">Moderação de Comentários</h2>
           <div className="space-y-4">
             {listaComentarios.length === 0 && <p className="text-center text-slate-500">Nenhum comentário.</p>}
             {listaComentarios.map(c => (
               <div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-900 transition-colors">
                  <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-black bg-blue-600 px-2 py-1 rounded-lg uppercase">{c.cursos?.titulo || 'Aula'}</span><span className="text-amber-400 text-xs">{'★'.repeat(c.nota)}</span></div><p className="text-white font-bold text-sm mb-1">"{c.comentario}"</p><p className="text-[10px] text-slate-500 uppercase font-black">Por: {c.nome_usuario}</p></div>
                  <button onClick={() => deletarComentario(c.id)} className="text-red-500 hover:text-white px-4 py-2 bg-red-500/10 hover:bg-red-500 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2">🗑️ Apagar</button>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}