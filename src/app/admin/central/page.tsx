'use client'

import { useEffect, useState } from 'react';
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
  telefone?: string;
  contato?: string;
  vendedores?: Vendedor;
}

interface Log {
  id: number;
  created_at: string;
  acao: string;
  vendedor_nome?: string;
  valor?: number;
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

// Interface para Comentários (Moderação)
interface ComentarioAdmin {
  id: number;
  created_at: string;
  nome_usuario: string;
  comentario: string;
  nota: number;
  cursos: { titulo: string }; // Para mostrar o nome da aula
}

export default function AdminCentral() {
  const router = useRouter();
  // Adicionei a aba 'avaliacoes'
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos' | 'avaliacoes'>('dashboard');
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  // ESTADOS GERAIS
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [listaCursos, setListaCursos] = useState<Curso[]>([]);
  const [listaDocs, setListaDocs] = useState<Documento[]>([]);
  const [listaComentarios, setListaComentarios] = useState<ComentarioAdmin[]>([]);

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

  async function carregarCursos() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if (data) setListaCursos(data);
  }

  async function carregarDocs() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if (data) setListaDocs(data);
  }

  async function carregarComentarios() {
    // Busca comentários e o título do curso relacionado
    const { data } = await supabase
      .from('comentarios_aula')
      .select('*, cursos(titulo)')
      .order('created_at', { ascending: false });
    
    // O cast "as any" aqui é para evitar erro de tipagem complexa do Supabase no front
    if (data) setListaComentarios(data as any);
  }

  useEffect(() => { loadDashboardData(); }, []);
  
  useEffect(() => {
    if (aba === 'cursos') carregarCursos();
    if (aba === 'docs') carregarDocs();
    if (aba === 'avaliacoes') carregarComentarios();
  }, [aba]);


  // --- FUNÇÕES DE AÇÃO ---

  // 1. Cursos
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

    await supabase.from('cursos').insert([{
      titulo: novoCurso.titulo,
      link_video: novoCurso.link,      
      link_material: urlPdf 
    }]);
    
    setUploadingCurso(false);
    setNovoCurso({ titulo: '', link: '' });
    setArquivoPdfAula(null);
    setToast({ msg: 'Aula salva!', type: 'success' });
    carregarCursos();
  }

  async function deletarCurso(id: number) {
    if (!confirm("Apagar aula?")) return;
    await supabase.from('cursos').delete().eq('id', id);
    carregarCursos();
  }

  // 2. Docs
  async function salvarDoc() {
    if (!tituloDoc || !arquivoDoc) return alert('Preencha tudo');
    setUploadingDoc(true);
    try {
      const nome = `doc-${Date.now()}-${arquivoDoc.name.replace(/\s/g, '-')}`;
      await supabase.storage.from('docs_internos').upload(nome, arquivoDoc);
      const { data } = supabase.storage.from('docs_internos').getPublicUrl(nome);

      await supabase.from('documentos_tecnicos').insert([{ titulo: tituloDoc, link_arquivo: data.publicUrl }]);
      
      setTituloDoc(''); setArquivoDoc(null);
      const input = document.getElementById('inputDoc') as HTMLInputElement;
      if(input) input.value = '';
      setToast({ msg: 'Documento salvo!', type: 'success' });
      carregarDocs();
    } catch { setToast({ msg: 'Erro upload', type: 'error' }); } 
    finally { setUploadingDoc(false); }
  }

  async function deletarDoc(id: number) {
    if (!confirm("Apagar doc?")) return;
    await supabase.from('documentos_tecnicos').delete().eq('id', id);
    carregarDocs();
  }

  // 3. Comentários (NOVO)
  async function deletarComentario(id: number) {
    if (!confirm("Tem certeza que deseja apagar este comentário?")) return;
    
    const { error } = await supabase.from('comentarios_aula').delete().eq('id', id);
    
    if (error) {
        setToast({ msg: 'Erro ao apagar.', type: 'error' });
    } else {
        setToast({ msg: 'Comentário removido.', type: 'success' });
        carregarComentarios(); // Atualiza a lista
    }
  }


  // --- RENDERIZAÇÃO ---

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      {/* CABEÇALHO */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        
        {/* MENU DE ABAS */}
        <div className="flex gap-2 flex-wrap justify-center">
          <button onClick={() => setAba('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${aba === 'dashboard' ? 'bg-blue-600' : 'bg-slate-900 border border-slate-800'}`}>Dashboard</button>
          <button onClick={() => setAba('cursos')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${aba === 'cursos' ? 'bg-purple-600' : 'bg-slate-900 border border-slate-800'}`}>Academy</button>
          <button onClick={() => setAba('avaliacoes')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${aba === 'avaliacoes' ? 'bg-amber-600' : 'bg-slate-900 border border-slate-800'}`}>Moderação</button>
          <button onClick={() => setAba('docs')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${aba === 'docs' ? 'bg-emerald-600' : 'bg-slate-900 border border-slate-800'}`}>Docs</button>
        </div>
      </div>

      {/* --- CONTEÚDO DAS ABAS --- */}

      {/* 1. DASHBOARD */}
      {aba === 'dashboard' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* ... (Mesmo código do dashboard anterior) ... */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg">
                <p className="text-blue-200 text-[9px] font-black uppercase mb-1 tracking-widest">Faturamento Mês</p>
                <p className="text-3xl font-black">
                  {formatCurrency(leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0))}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl overflow-visible">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 text-center italic">Mapa de Vendas</h3>
                <div className="grid grid-cols-7 gap-2">
                  {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(dia => {
                    const vendasDoDia = leads.filter(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                    return (
                      <div key={dia.toString()} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${vendasDoDia.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                        {dia.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento</h2>
               <div className="space-y-3">
                  {leads.map(l => (
                    <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-black text-sm italic">{l.nome_cliente}</p>
                        <p className="text-[9px] font-black text-blue-500 uppercase">Vendedor: {l.vendedores?.nome || 'Admin'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black">{formatCurrency(l.valor_venda)}</p>
                        <p className={`text-[8px] font-black uppercase ${l.status === 'fechado' ? 'text-emerald-500' : 'text-amber-500'}`}>{l.status}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
              <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs</h2>
              <div className="space-y-4">
                {logs.map(log => (
                   <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1">
                      <p className="text-[10px] text-slate-300">
                        <span className="font-black text-blue-500 uppercase mr-1">{log.vendedores?.nome || log.vendedor_nome || 'Sistema'}</span>
                        <span className="italic opacity-80">{log.acao}</span>
                      </p>
                   </div>
                ))}
              </div>
            </div>
          </div>
      )}

      {/* 2. CURSOS (ACADEMY) */}
      {aba === 'cursos' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl h-fit">
            <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Título" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
              <input type="text" placeholder="Link YouTube" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">PDF (Upload)</label>
                <input type="file" accept="application/pdf" onChange={e => setArquivoPdfAula(e.target.files ? e.target.files[0] : null)} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400" />
              </div>
              <button onClick={salvarCurso} disabled={uploadingCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all mt-4">
                {uploadingCurso ? 'Enviando...' : 'Publicar Conteúdo'}
              </button>
            </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-xl font-black italic mb-6 text-center uppercase text-slate-500">Aulas Ativas</h2>
             {listaCursos.map(curso => (
               <div key={curso.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate max-w-[180px]">{curso.titulo}</p>
                    <div className="flex gap-2 mt-1">
                        {curso.link_video && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-blue-400">VÍDEO</span>}
                        {curso.link_material && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-emerald-400">PDF</span>}
                    </div>
                  </div>
                  <button onClick={() => deletarCurso(curso.id)} className="bg-slate-950 text-slate-500 hover:text-red-500 w-10 h-10 rounded-full">🗑️</button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* 3. MODERAÇÃO (NOVA ABA) */}
      {aba === 'avaliacoes' && (
        <div className="max-w-4xl mx-auto">
           <h2 className="text-xl font-black italic mb-6 text-center uppercase text-amber-500">Moderação de Comentários</h2>
           
           <div className="space-y-4">
             {listaComentarios.length === 0 && <p className="text-center text-slate-500">Nenhum comentário para moderar.</p>}

             {listaComentarios.map(c => (
               <div key={c.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-amber-500/50 transition-colors">
                  <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black bg-blue-600 px-2 py-1 rounded-lg uppercase">{c.cursos?.titulo || 'Aula Desconhecida'}</span>
                        <span className="text-amber-400 text-xs">{'★'.repeat(c.nota)}</span>
                     </div>
                     <p className="text-white font-bold text-sm mb-1">"{c.comentario}"</p>
                     <p className="text-[10px] text-slate-500 uppercase font-black">Por: {c.nome_usuario} • {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  <button 
                    onClick={() => deletarComentario(c.id)}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2"
                  >
                    🗑️ Apagar
                  </button>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* 4. DOCS (PAINEL INTERNO) */}
      {aba === 'docs' && (
        <div className="max-w-4xl mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800">
           <h2 className="text-xl font-black italic mb-6 text-center uppercase text-emerald-500">Gestão de Documentos</h2>
           
           {/* Upload */}
           <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-slate-950 rounded-2xl border border-slate-800">
               <input 
                 type="text" 
                 placeholder="Nome do Documento..." 
                 className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex-1"
                 value={tituloDoc}
                 onChange={e => setTituloDoc(e.target.value)}
               />
               <input 
                 id="inputDoc" type="file" 
                 className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-sm text-slate-400"
                 onChange={e => setArquivoDoc(e.target.files ? e.target.files[0] : null)}
               />
               <button onClick={salvarDoc} disabled={uploadingDoc} className="bg-emerald-600 text-white font-bold px-6 rounded-xl uppercase text-xs hover:bg-emerald-500">
                 {uploadingDoc ? '...' : 'Subir'}
               </button>
           </div>

           {/* Lista */}
           <div className="space-y-3">
             {listaDocs.map(doc => (
               <div key={doc.id} className="flex justify-between items-center p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <span className="text-2xl">📄</span>
                   <div>
                     <p className="font-bold text-white">{doc.titulo}</p>
                     <p className="text-[10px] text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <a href={doc.link_arquivo} target="_blank" className="bg-blue-900/30 text-blue-400 font-bold text-xs px-3 py-2 rounded-lg border border-blue-900">BAIXAR</a>
                   <button onClick={() => deletarDoc(doc.id)} className="bg-red-900/30 text-red-500 font-bold text-xs px-3 py-2 rounded-lg border border-red-900">X</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

    </div>
  );
}