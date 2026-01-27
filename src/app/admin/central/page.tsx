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

interface Lead {
  id: number;
  created_at: string;
  nome_cliente: string;
  status: string;
  valor_venda: number;
  vendedores?: Vendedor;
}

interface Log {
  id: number;
  created_at: string;
  acao: string;
  vendedor_nome?: string;
  vendedores?: Vendedor;
}

interface Curso {
  id: number;
  titulo: string;
  link_video?: string;   
  link_material?: string; 
}

interface Documento {
  id: number;
  titulo: string;
  link_arquivo: string;
  created_at: string;
}

interface ComentarioAdmin {
  id: number;
  created_at: string;
  nome_usuario: string;
  comentario: string;
  nota: number;
  cursos: { titulo: string };
}

export default function AdminCentral() {
  const router = useRouter();
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos' | 'avaliacoes'>('dashboard');
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  // ESTADOS GERAIS
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [listaCursos, setListaCursos] = useState<Curso[]>([]);
  const [listaDocs, setListaDocs] = useState<Documento[]>([]);
  const [listaComentarios, setListaComentarios] = useState<ComentarioAdmin[]>([]);
  const [updatingLead, setUpdatingLead] = useState<number | null>(null);

  // ESTADOS FORMULÁRIOS
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [arquivoPdfAula, setArquivoPdfAula] = useState<File | null>(null);
  const [uploadingCurso, setUploadingCurso] = useState(false);
  const [tituloDoc, setTituloDoc] = useState('');
  const [arquivoDoc, setArquivoDoc] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // --- CARREGAMENTO DE DADOS ---

  async function loadDashboardData() {
    const [leadsResp, logsResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*, vendedores(nome)').order('created_at', { ascending: false }).limit(10)
    ]);
    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  // --- RANKING ---
  const rankingVendedores = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(lead => {
        if (lead.status === 'fechado') {
            const nome = lead.vendedores?.nome || 'Admin/Outros';
            const valor = Number(lead.valor_venda) || 0;
            if (!stats[nome]) stats[nome] = 0;
            stats[nome] += valor;
        }
    });
    return Object.entries(stats)
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => b.total - a.total);
  }, [leads]);

  async function carregarCursos() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if (data) setListaCursos(data);
  }
  async function carregarDocs() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if (data) setListaDocs(data);
  }
  async function carregarComentarios() {
    const { data } = await supabase.from('comentarios_aula').select('*, cursos(titulo)').order('created_at', { ascending: false });
    if (data) setListaComentarios(data as any);
  }

  useEffect(() => { loadDashboardData(); }, []);
  useEffect(() => {
    if (aba === 'cursos') carregarCursos();
    if (aba === 'docs') carregarDocs();
    if (aba === 'avaliacoes') carregarComentarios();
  }, [aba]);

  // --- AÇÕES ---
  async function alternarStatusLead(lead: Lead) {
    if (updatingLead) return;
    const novoStatus = lead.status === 'fechado' ? 'novo' : 'fechado';
    const confirmacao = confirm(`Alterar status para ${novoStatus === 'fechado' ? 'FECHADO' : 'ABERTO'}?`);
    if (!confirmacao) return;

    setUpdatingLead(lead.id);
    const { error } = await supabase.from('leads').update({ status: novoStatus }).eq('id', lead.id);
    
    if (error) setToast({ msg: 'Erro ao atualizar.', type: 'error' });
    else { setToast({ msg: 'Status atualizado!', type: 'success' }); loadDashboardData(); }
    setUpdatingLead(null);
  }

  async function salvarCurso() {
    if (!novoCurso.titulo) return alert('Título obrigatório');
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
    setToast({ msg: 'Aula salva!', type: 'success' }); carregarCursos();
  }

  async function deletarCurso(id: number) {
    if (!confirm("Apagar aula?")) return;
    await supabase.from('cursos').delete().eq('id', id);
    carregarCursos();
  }

  async function salvarDoc() {
    if (!tituloDoc || !arquivoDoc) return alert('Preencha tudo');
    setUploadingDoc(true);
    try {
      const nome = `doc-${Date.now()}-${arquivoDoc.name.replace(/\s/g, '-')}`;
      await supabase.storage.from('docs_internos').upload(nome, arquivoDoc);
      const { data } = supabase.storage.from('docs_internos').getPublicUrl(nome);
      await supabase.from('documentos_tecnicos').insert([{ titulo: tituloDoc, link_arquivo: data.publicUrl }]);
      setTituloDoc(''); setArquivoDoc(null);
      setToast({ msg: 'Documento salvo!', type: 'success' }); carregarDocs();
    } catch { setToast({ msg: 'Erro upload', type: 'error' }); } 
    finally { setUploadingDoc(false); }
  }

  async function deletarDoc(id: number) {
    if (!confirm("Apagar doc?")) return;
    await supabase.from('documentos_tecnicos').delete().eq('id', id);
    carregarDocs();
  }

  async function deletarComentario(id: number) {
    if (!confirm("Apagar comentário?")) return;
    await supabase.from('comentarios_aula').delete().eq('id', id);
    carregarComentarios();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setAba('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${aba === 'dashboard' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-800'}`}>Dashboard</button>
          <button onClick={() => setAba('cursos')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${aba === 'cursos' ? 'bg-purple-600' : 'bg-slate-900 border border-slate-800'}`}>Academy</button>
          <button onClick={() => setAba('avaliacoes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${aba === 'avaliacoes' ? 'bg-amber-600' : 'bg-slate-900 border border-slate-800'}`}>Moderação</button>
          <button onClick={() => setAba('docs')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${aba === 'docs' ? 'bg-emerald-600' : 'bg-slate-900 border border-slate-800'}`}>Docs</button>
        </div>
      </div>

      {aba === 'dashboard' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
                <p className="text-blue-200 text-[9px] font-black uppercase mb-1 tracking-widest">Faturamento Mês</p>
                <p className="text-3xl font-black">{formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0))}</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-xl">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4 italic text-center">🏆 Ranking Vendas</h3>
                 <div className="space-y-3">
                    {rankingVendedores.map((vendedor, index) => (
                        <div key={vendedor.nome} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${index === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-800 text-slate-500'}`}>{index + 1}</span>
                                <p className="text-xs font-bold text-slate-300 truncate max-w-[100px]">{vendedor.nome}</p>
                            </div>
                            <p className="text-xs font-black text-emerald-500">{formatCurrency(vendedor.total)}</p>
                        </div>
                    ))}
                 </div>
              </div>

              {/* CALENDÁRIO COM TOOLTIP CORRIGIDO */}
              <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-2xl overflow-visible">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 text-center italic">Atividade Diária</h3>
                <div className="grid grid-cols-7 gap-2">
                  {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(dia => {
                    const vendasDoDia = leads.filter(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                    const temVenda = vendasDoDia.length > 0;
                    return (
                      <div key={dia.toString()} className={`group relative w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black cursor-pointer ${temVenda ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                        {dia.getDate()}
                        {/* TOOLTIP RESTAURADO AQUI: */}
                        {temVenda && (
                            <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 pointer-events-none">
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                                <p className="text-[9px] text-slate-400 uppercase font-bold mb-2 text-center border-b border-slate-700 pb-1">{format(dia, "dd 'de' MMM", { locale: ptBR })}</p>
                                <div className="space-y-2">
                                {vendasDoDia.map(venda => (
                                    <div key={venda.id} className="flex justify-between items-center text-[9px]">
                                    <span className="text-blue-400 font-bold truncate max-w-[80px]">{venda.vendedores?.nome || 'Admin'}</span>
                                    <span className="text-white font-medium">{formatCurrency(Number(venda.valor_venda))}</span>
                                    </div>
                                ))}
                                </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento (Clique para mudar status)</h2>
               <div className="space-y-3">
                  {leads.map(l => (
                    <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center hover:border-blue-900 transition-colors">
                      <div>
                        <p className="font-black text-sm italic text-white">{l.nome_cliente}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase">Vendedor: {l.vendedores?.nome || 'Admin'}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                        <button onClick={() => alternarStatusLead(l)} disabled={updatingLead === l.id} className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${l.status === 'fechado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                             {updatingLead === l.id ? '...' : (l.status === 'fechado' ? 'FECHADO 🔒' : 'ABERTO 🔓')}
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
              <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs</h2>
              <div className="space-y-4">
                {logs.map(log => (
                   <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1"><p className="text-[10px] text-slate-300"><span className="font-black text-blue-500 uppercase mr-1">{log.vendedores?.nome || 'Sistema'}</span> {log.acao}</p></div>
                ))}
              </div>
            </div>
          </div>
      )}
      {/* ... (Outras abas iguais) ... */}
      {aba === 'cursos' && (
        /* ... CÓDIGO DA ABA CURSOS IGUAL AO ANTERIOR ... */
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl h-fit">
              <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Título" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
                <input type="text" placeholder="Link YouTube" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
                <div><label className="text-[10px] font-bold text-slate-500 uppercase ml-2">PDF</label><input type="file" onChange={e => setArquivoPdfAula(e.target.files ? e.target.files[0] : null)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400" /></div>
                <button onClick={salvarCurso} disabled={uploadingCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all mt-4">{uploadingCurso ? '...' : 'Publicar'}</button>
              </div>
            </div>
            <div className="space-y-4">
                <h2 className="text-xl font-black italic mb-6 text-center uppercase text-slate-500">Aulas Ativas</h2>
                {listaCursos.map(curso => (<div key={curso.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center"><div className="overflow-hidden"><p className="font-bold text-sm truncate max-w-[180px]">{curso.titulo}</p></div><button onClick={() => deletarCurso(curso.id)} className="bg-slate-950 text-slate-500 hover:text-red-500 w-10 h-10 rounded-full">🗑️</button></div>))}
            </div>
        </div>
      )}
      {aba === 'avaliacoes' && (
        <div className="max-w-4xl mx-auto">
           <h2 className="text-xl font-black italic mb-6 text-center uppercase text-amber-500">Moderação</h2>
           <div className="space-y-4">
             {listaComentarios.map(c => (<div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center"><div className="flex-1"><p className="text-white font-bold text-sm">"{c.comentario}"</p><p className="text-[10px] text-slate-500 uppercase font-black">{c.nome_usuario} • {new Date(c.created_at).toLocaleDateString()}</p></div><button onClick={() => deletarComentario(c.id)} className="text-red-500 bg-red-500/10 px-4 py-2 rounded-xl text-xs font-black">APAGAR</button></div>))}
           </div>
        </div>
      )}
      {aba === 'docs' && (
        <div className="max-w-4xl mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800">
           <h2 className="text-xl font-black italic mb-6 text-center uppercase text-emerald-500">Documentos</h2>
           <div className="flex gap-4 mb-8"><input type="text" placeholder="Nome..." className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex-1" value={tituloDoc} onChange={e => setTituloDoc(e.target.value)} /><input type="file" className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-sm text-slate-400" onChange={e => setArquivoDoc(e.target.files ? e.target.files[0] : null)} /><button onClick={salvarDoc} disabled={uploadingDoc} className="bg-emerald-600 text-white font-bold px-6 rounded-xl text-xs">{uploadingDoc ? '...' : 'Subir'}</button></div>
           <div className="space-y-3">{listaDocs.map(doc => (<div key={doc.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-2xl"><div className="flex items-center gap-3"><span className="text-2xl">📄</span><p className="font-bold text-white">{doc.titulo}</p></div><div className="flex gap-2"><a href={doc.link_arquivo} target="_blank" className="bg-blue-900/30 text-blue-400 font-bold text-xs px-3 py-2 rounded-lg">BAIXAR</a><button onClick={() => deletarDoc(doc.id)} className="bg-red-900/30 text-red-500 font-bold text-xs px-3 py-2 rounded-lg">X</button></div></div>))}</div>
        </div>
      )}
    </div>
  );
}