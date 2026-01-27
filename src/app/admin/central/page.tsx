'use client'

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

// 1. Nova interface criada para os Cursos
interface Curso {
  id: number;
  created_at: string;
  titulo: string;
  link_video?: string;   // Opcional (pode ser nulo)
  link_material?: string; // Opcional
}

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  
  // Estado do Novo Curso
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '', pdf: '' });
  
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  // 2. Agora usamos o tipo Curso[] em vez de any[]
  const [listaCursos, setListaCursos] = useState<Curso[]>([]);

  // Função para carregar as aulas do banco
  async function carregarCursos() {
    const { data } = await supabase
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setListaCursos(data);
  }

  // Carregar as aulas assim que entrar na aba de cursos
  useEffect(() => {
    if (aba === 'cursos') {
      carregarCursos();
    }
  }, [aba]); 

  // Função de Deletar
  async function deletarCurso(id: number) {
    const confirmacao = window.confirm("Tem certeza que deseja apagar esta aula?");
    if (!confirmacao) return;

    const { error } = await supabase.from('cursos').delete().eq('id', id);

    if (error) {
      setToast({ msg: 'Erro ao apagar.', type: 'error' });
    } else {
      setToast({ msg: 'Aula removida!', type: 'success' });
      carregarCursos(); // Atualiza a lista na hora
    }
  }

  // Carrega os dados para o Painel Completo
  async function loadData() {
    const [leadsResp, logsResp] = await Promise.all([
      // Carrega leads com o nome do vendedor
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      
      // Carrega logs e tenta pegar o nome do vendedor
      supabase
        .from('logs_atividades')
        .select('*, vendedores(nome)')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  useEffect(() => { loadData(); }, []);

  const salvarCurso = async () => {
    // Validação: Título + (Vídeo OU PDF)
    if (!novoCurso.titulo || (!novoCurso.link && !novoCurso.pdf)) {
      setToast({ msg: 'Preencha o Título e pelo menos um Link (Vídeo ou PDF)!', type: 'error' });
      return;
    }

    const { error } = await supabase.from('cursos').insert([{
      titulo: novoCurso.titulo,
      link_video: novoCurso.link,      
      link_material: novoCurso.pdf 
    }]);
    
    if (error) {
      console.error(error);
      setToast({ msg: 'Erro ao salvar. Verifique o Banco.', type: 'error' });
    } else {
      setToast({ msg: 'Conteúdo Salvo com Sucesso! 🎓', type: 'success' });
      setNovoCurso({ titulo: '', link: '', pdf: '' }); // Limpa os campos
      carregarCursos(); // Atualiza a lista
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

  // ABA CURSOS (COM LISTAGEM E EXCLUSÃO)
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white relative">
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
        
        <button onClick={() => setAba('dashboard')} className="mb-8 font-black text-blue-600 uppercase text-xs">← Voltar</button>
        
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LADO ESQUERDO: FORMULÁRIO DE CADASTRO */}
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl h-fit">
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
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Link do Material PDF</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" placeholder="https://..." value={novoCurso.pdf} onChange={e => setNovoCurso({...novoCurso, pdf: e.target.value})} />
              </div>

              <button onClick={async () => { await salvarCurso(); carregarCursos(); }} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500 transition-all mt-4">
                Publicar Conteúdo
              </button>
            </div>
          </div>

          {/* LADO DIREITO: LISTA DE AULAS EXISTENTES */}
          <div className="space-y-4">
             <h2 className="text-xl font-black italic mb-6 text-center uppercase text-slate-500">Aulas Ativas</h2>
             
             {listaCursos.length === 0 && (
                <p className="text-center text-slate-600 text-xs">Nenhuma aula cadastrada ainda.</p>
             )}

             {listaCursos.map(curso => (
               <div key={curso.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex justify-between items-center group hover:border-blue-500 transition-colors">
                  <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{curso.titulo}</p>
                    <div className="flex gap-2 mt-1">
                        {curso.link_video && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-blue-400">VÍDEO</span>}
                        {curso.link_material && <span className="text-[9px] bg-slate-800 px-2 py-1 rounded text-emerald-400">PDF</span>}
                    </div>
                  </div>

                  {/* BOTÃO DE EXCLUIR */}
                  <button 
                    onClick={() => deletarCurso(curso.id)}
                    className="bg-slate-950 text-slate-500 hover:text-red-500 hover:bg-red-500/10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    title="Excluir aula"
                  >
                    🗑️
                  </button>
               </div>
             ))}
          </div>

        </div>
      </div>
    );
  }

  // DASHBOARD PRINCIPAL
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
                  <div 
                    key={dia.toString()} 
                    className={`group relative w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black cursor-pointer transition-all hover:scale-110 ${temVenda ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}
                  >
                    {dia.getDate()}

                    {/* Tooltip Hover */}
                    {temVenda && (
                      <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl z-50 pointer-events-none">
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mb-2 text-center border-b border-slate-700 pb-1">
                          {format(dia, "dd 'de' MMM", { locale: ptBR })}
                        </p>
                        <div className="space-y-2">
                          {vendasDoDia.map(venda => (
                            <div key={venda.id} className="flex justify-between items-center text-[9px]">
                              <span className="text-blue-400 font-bold truncate max-w-[80px]">
                                {venda.vendedores?.nome || 'Admin'}
                              </span>
                              <span className="text-white font-medium">
                                {formatCurrency(Number(venda.valor_venda))}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center text-[9px] font-black text-emerald-400">
                          <span>TOTAL</span>
                          <span>
                            {formatCurrency(vendasDoDia.reduce((acc, curr) => acc + Number(curr.valor_venda), 0))}
                          </span>
                        </div>
                      </div>
                    )}
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

        {/* COLUNA 3: LOGS DO SISTEMA */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
          <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center">Logs do Sistema</h2>
          <div className="space-y-4">
            {logs.map(log => {
              const nomeVendedor = log.vendedores?.nome || log.vendedor_nome || 'Sistema';
              
              return (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1">
                  <p className="text-[10px] text-slate-300">
                    <span className="font-black text-blue-500 uppercase mr-1">
                      {nomeVendedor}
                    </span>
                    <span className="italic opacity-80">
                      {log.acao}
                    </span>
                    {log.valor && (
                        <span className="text-emerald-400 font-bold ml-1">
                          {formatCurrency(log.valor)}
                        </span>
                    )}
                  </p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">
                    {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}