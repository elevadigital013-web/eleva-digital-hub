'use client'

import { useEffect, useState } from 'react'; // Importação do React
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Toast } from '@/components/Toast';

// --- DEFINIÇÃO DE TIPOS (INTERFACES) ---

interface Vendedor {
  nome: string;
}

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
  created_at: string;
  titulo: string;
  link_video?: string;   
  link_material?: string; 
}

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  
  // ESTADOS DO FORMULÁRIO
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' }); // Removi o campo de texto do PDF
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null); // Novo estado para o ARQUIVO real
  const [uploading, setUploading] = useState(false); // Estado para mostrar "Enviando..."

  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });
  const [listaCursos, setListaCursos] = useState<Curso[]>([]);

  // Carregar as aulas
  async function carregarCursos() {
    const { data } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setListaCursos(data);
  }

  useEffect(() => {
    if (aba === 'cursos') carregarCursos();
  }, [aba]); 

  // Deletar aula e arquivo
  async function deletarCurso(id: number) {
    if (!window.confirm("Tem certeza que deseja apagar esta aula?")) return;
    const { error } = await supabase.from('cursos').delete().eq('id', id);

    if (error) {
      setToast({ msg: 'Erro ao apagar.', type: 'error' });
    } else {
      setToast({ msg: 'Aula removida!', type: 'success' });
      carregarCursos();
    }
  }

  // Carregar dados gerais
  async function loadData() {
    const [leadsResp, logsResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*, vendedores(nome)').order('created_at', { ascending: false }).limit(10)
    ]);
    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }
  useEffect(() => { loadData(); }, []);


  // --- FUNÇÃO PARA SALVAR (AGORA COM UPLOAD) ---
  const salvarCurso = async () => {
    // 1. Validação Básica
    if (!novoCurso.titulo) {
      setToast({ msg: 'O Título é obrigatório!', type: 'error' });
      return;
    }

    if (!novoCurso.link && !arquivoPdf) {
      setToast({ msg: 'Adicione um Vídeo OU suba um PDF!', type: 'error' });
      return;
    }

    setUploading(true); // Começa o carregamento
    let urlPdfFinal = '';

    // 2. Se tiver arquivo selecionado, faz o upload para o Supabase Storage
    if (arquivoPdf) {
      try {
        // Cria um nome único para o arquivo (ex: 1723123-manual.pdf) para não substituir outros
        const nomeArquivo = `${Date.now()}-${arquivoPdf.name.replace(/\s/g, '-')}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('materiais') // Nome do bucket que criamos no passo 1
          .upload(nomeArquivo, arquivoPdf);

        if (uploadError) throw uploadError;

        // Pega o link público desse arquivo
        const { data: publicUrlData } = supabase.storage
          .from('materiais')
          .getPublicUrl(nomeArquivo);

        urlPdfFinal = publicUrlData.publicUrl;

      } catch (error) {
        console.error("Erro no upload:", error);
        setToast({ msg: 'Erro ao subir o PDF.', type: 'error' });
        setUploading(false);
        return;
      }
    }

    // 3. Salva no Banco de Dados com o link gerado
    const { error } = await supabase.from('cursos').insert([{
      titulo: novoCurso.titulo,
      link_video: novoCurso.link,      
      link_material: urlPdfFinal // Salva o link do Supabase, não do Drive
    }]);
    
    setUploading(false); // Termina carregamento

    if (error) {
      console.error(error);
      setToast({ msg: 'Erro ao salvar no banco.', type: 'error' });
    } else {
      setToast({ msg: 'Aula e Arquivo Salvos! 🚀', type: 'success' });
      // Limpa tudo
      setNovoCurso({ titulo: '', link: '' });
      setArquivoPdf(null); 
      // Reseta o input de arquivo visualmente
      const fileInput = document.getElementById('inputPdf') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      carregarCursos();
    }
  };
  
  // ... CÓDIGO DAS ABAS DE DASHBOARD E DOCS (MANTÉM IGUAL) ...
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

  // ABA CURSOS
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white relative">
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
        
        <button onClick={() => setAba('dashboard')} className="mb-8 font-black text-blue-600 uppercase text-xs">← Voltar</button>
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl h-fit">
            <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Título da Aula</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Link do Vídeo (YouTube)</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" placeholder="Link do Youtube..." value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
              </div>

              {/* --- MUDANÇA AQUI: INPUT DE ARQUIVO --- */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Arquivo PDF (Upload)</label>
                <div className="relative">
                    <input 
                        id="inputPdf"
                        type="file" 
                        accept="application/pdf"
                        onChange={e => setArquivoPdf(e.target.files ? e.target.files[0] : null)}
                        className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                    />
                </div>
                {arquivoPdf && <p className="text-[10px] text-emerald-500 mt-1 ml-2">Arquivo selecionado: {arquivoPdf.name}</p>}
              </div>

              <button 
                onClick={salvarCurso} 
                disabled={uploading}
                className={`w-full p-4 rounded-2xl font-black uppercase transition-all mt-4 ${uploading ? 'bg-slate-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {uploading ? 'Enviando PDF...' : 'Publicar Conteúdo'}
              </button>
            </div>
          </div>

          {/* LADO DIREITO: LISTA */}
          <div className="space-y-4">
             <h2 className="text-xl font-black italic mb-6 text-center uppercase text-slate-500">Aulas Ativas</h2>
             {listaCursos.length === 0 && <p className="text-center text-slate-600 text-xs">Nenhuma aula cadastrada ainda.</p>}
             
             {listaCursos.map(curso => (
               <div key={curso.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center group hover:border-blue-500 transition-colors">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate max-w-[200px]">{curso.titulo}</p>
                    <div className="flex gap-2 mt-1">
                        {curso.link_video && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-blue-400">VÍDEO</span>}
                        {curso.link_material && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-emerald-400">PDF</span>}
                    </div>
                  </div>
                  <button onClick={() => deletarCurso(curso.id)} className="bg-slate-950 text-slate-500 hover:text-red-500 hover:bg-red-500/10 w-10 h-10 rounded-full flex items-center justify-center transition-all">🗑️</button>
               </div>
             ))}
          </div>

        </div>
      </div>
    );
  }

  // ... DASHBOARD (MANTÉM IGUAL - vou simplificar aqui para não estourar o limite de texto, mas usa o que já tinhas) ...
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
        {/* COLUNA 1: FATURAMENTO & MAPA */}
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
                const temVenda = vendasDoDia.length > 0;
                return (
                  <div key={dia.toString()} className={`group relative w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black cursor-pointer transition-all hover:scale-110 ${temVenda ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                    {dia.getDate()}
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

        {/* COLUNA 2: LISTA LEADS */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6 h-full">
           <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento de Leads</h2>
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

        {/* COLUNA 3: LOGS */}
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
    </div>
  );
}