'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { 
  startOfDay, startOfWeek, startOfMonth, 
  endOfMonth, eachDayOfInterval, isSameDay, 
  isAfter, format 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminCentral() {
  const router = useRouter();
  
  // --- ESTADOS GERAIS ---
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [provas, setProvas] = useState<any[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE CÁLCULO ---
  const [stats, setStats] = useState({ hoje: 0, semana: 0, mes: 0, total: 0, pendente: 0 });
  const [resumoPagamentos, setResumoPagamentos] = useState<any[]>([]);
  
  // --- ESTADO PARA NOVO CURSO ---
  const [novoCurso, setNovoCurso] = useState({ titulo: '', descricao: '', link: '' });

  // --- CARREGAMENTO DE DADOS ---
  async function loadAdminData() {
    setLoading(true);
    
    // 1. Busca Paralela (Leads, Logs, Provas)
    const [leadsResp, logsResp, provasResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('resultados_provas').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    // 2. Processamento dos Leads
    if (leadsResp.data) {
      const data = leadsResp.data;
      const agora = new Date();
      const sDia = startOfDay(agora); 
      const sSem = startOfWeek(agora); 
      const sMes = startOfMonth(agora);
      
      let h = 0, s = 0, m = 0, t = 0, pTotal = 0;
      const pagamentosMap: any = {};

      data.forEach(l => {
        const valor = Number(l.valor_venda) || 0;
        const nomeVendedor = l.vendedores?.nome || 'Admin';
        const dataLead = new Date(l.created_at);

        if (l.status === 'fechado') {
          t += valor;
          
          // Regra Híbrida: 25% se >= 5k, senão 20%
          const porcentagem = valor >= 5000 ? 0.25 : 0.20;
          const comissao = valor * porcentagem;

          // Mapa de Pagamentos Pendentes
          if (!l.pago) {
            pTotal += comissao;
            pagamentosMap[nomeVendedor] = (pagamentosMap[nomeVendedor] || 0) + comissao;
          }
          
          // Totais Temporais
          if (isAfter(dataLead, sDia)) h += valor;
          if (isAfter(dataLead, sSem)) s += valor;
          if (isAfter(dataLead, sMes)) m += valor;
        }
      });

      setStats({ hoje: h, semana: s, mes: m, total: t, pendente: pTotal });
      setLeads(data);
      setResumoPagamentos(Object.entries(pagamentosMap).map(([nome, valor]) => ({ nome, valor: Number(valor) })));
    }

    if (logsResp.data) setLogs(logsResp.data);
    if (provasResp.data) setProvas(provasResp.data);
    
    setLoading(false);
  }

  useEffect(() => { loadAdminData(); }, []);

  // --- FUNÇÕES DE AÇÃO ---
  
  // 1. Pagar Vendedor e Gerar Recibo WhatsApp
  const confirmarPagamentoVendedor = async (nomeVendedor: string, valorTotal: number) => {
    if (!confirm(`Confirmar pagamento de ${formatCurrency(valorTotal)} para ${nomeVendedor}?`)) return;
    
    const idsParaAtualizar = leads
      .filter(l => (l.vendedores?.nome === nomeVendedor || (!l.vendedores && nomeVendedor === 'Admin')) && l.status === 'fechado' && !l.pago)
      .map(l => l.id);

    if (idsParaAtualizar.length > 0) {
      await supabase.from('leads').update({ pago: true }).in('id', idsParaAtualizar);
      
      const mensagem = `*RECIBO DE COMISSÃO - ELEVA DIGITAL*%0A%0A` +
                       `*Beneficiário:* ${nomeVendedor}%0A` +
                       `*Valor Total:* ${formatCurrency(valorTotal)}%0A` +
                       `*Data:* ${new Date().toLocaleDateString('pt-BR')}%0A%0A` +
                       `Status: *PAGO* ✅%0A%0A` +
                       `_Obrigado pelo empenho! Vamos pra cima!_ 🚀`;
      
      window.open(`https://wa.me/?text=${mensagem}`, '_blank');
      loadAdminData();
    }
  };

  // 2. Salvar Novo Curso
  const salvarCurso = async () => {
    if (!novoCurso.titulo || !novoCurso.link) return alert('Preencha pelo menos Título e Link!');
    
    const { error } = await supabase.from('cursos').insert([{
      titulo: novoCurso.titulo,
      descricao: novoCurso.descricao,
      link_video: novoCurso.link
    }]);

    if (!error) {
      alert('Curso publicado com sucesso!');
      setNovoCurso({ titulo: '', descricao: '', link: '' });
      setAba('dashboard');
    } else {
      alert('Erro ao salvar curso.');
    }
  };

  // --- COMPONENTE INTERNO: CALENDÁRIO ---
  const CalendarioVendas = () => {
    const dias = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl h-full">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-6 text-center italic">Mapa de Calor: Janeiro</h3>
        <div className="grid grid-cols-7 gap-2">
          {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-center text-[8px] font-black text-slate-600">{d}</div>)}
          {dias.map(dia => {
            const vendasDoDia = leads.filter(l => l.status === 'fechado' && isSameDay(new Date(l.created_at), dia));
            const temVenda = vendasDoDia.length > 0;
            const totalDia = vendasDoDia.reduce((acc, curr) => acc + Number(curr.valor_venda), 0);

            return (
              <div key={dia.toString()} className="group relative flex flex-col items-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all
                  ${temVenda ? 'bg-blue-600 text-white shadow-lg scale-110 cursor-pointer' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                  {dia.getDate()}
                </div>
                {/* TOOLTIP INTERATIVO */}
                {temVenda && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-50 w-48 bg-white text-slate-950 p-3 rounded-2xl shadow-2xl border border-slate-200">
                    <p className="text-[10px] font-black uppercase text-blue-600 mb-1 border-b pb-1">
                      {format(dia, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    {vendasDoDia.map((v, i) => (
                      <div key={i} className="mb-1">
                        <p className="text-[10px] font-bold leading-tight">{v.nome_cliente}</p>
                        <p className="text-[9px] text-slate-500 italic">{v.vendedores?.nome} • {formatCurrency(v.valor_venda)}</p>
                      </div>
                    ))}
                    <p className="mt-2 text-[10px] font-black border-t pt-1">Total: {formatCurrency(totalDia)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- RENDERIZAÇÃO: MODO DOCUMENTAÇÃO ---
  if (aba === 'docs') {
    return (
      const [docReal, setDocReal] = useState('');

  // Adicione isso dentro do seu useEffect ou loadData
  async function carregarDoc() {
    const { data } = await supabase.from('sistema_configs').select('conteudo').eq('id', 'documentacao').single();
    if (data) setDocReal(data.conteudo);
  }

  const salvarDocReal = async () => {
    const { error } = await supabase.from('sistema_configs').upsert({ id: 'documentacao', conteudo: docReal });
    if (!error) alert('Documentação atualizada!');
  };

  if (aba === 'docs') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={() => setAba('dashboard')} className="text-blue-500 font-black uppercase text-xs">← Voltar</button>
            <h1 className="text-xl font-black italic uppercase">Editor de Documentação</h1>
            <button onClick={salvarDocReal} className="bg-emerald-600 px-6 py-2 rounded-xl font-black uppercase text-xs">Salvar Alterações</button>
          </div>

          <div className="bg-slate-950 p-6 rounded-[30px] border border-slate-800 shadow-2xl">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">
              Conteúdo Real da Documentação (Scripts, Regras, Prazos)
            </label>
            <textarea 
              className="w-full h-[60vh] bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300 font-mono text-sm focus:border-blue-500 outline-none"
              value={docReal}
              onChange={(e) => setDocReal(e.target.value)}
              placeholder="Cole aqui todo o texto da sua documentação..."
            />
            <p className="mt-4 text-[10px] text-slate-500 italic">
              * Dica: Você pode usar quebras de linha e espaços. O que você escrever aqui é o que ficará guardado.
            </p>
          </div>
        </div>
      </div>
    );
  }
      <div className="min-h-screen bg-white text-slate-900 p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10 no-print">
            <button onClick={() => setAba('dashboard')} className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2">← Voltar</button>
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Gerar Manual PDF</button>
          </div>
          <header className="mb-12 border-b-4 border-slate-900 pb-8">
            <h1 className="text-5xl font-black tracking-tighter mb-4 italic text-slate-900">Manual Operacional <br/><span className="text-blue-600 not-italic">Eleva Digital v2.1</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Confidencial • Uso Interno • Mongaguá/SP</p>
          </header>
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-black mb-4 uppercase tracking-widest border-l-4 border-blue-600 pl-4">01. Estrutura Financeira</h2>
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200">
                <p className="font-bold mb-4">Sistema de comissionamento híbrido:</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between border-b pb-2"><span>Até R$ 4.999,00</span><span className="font-black text-blue-600 italic">20% de Comissão</span></li>
                  <li className="flex justify-between border-b pb-2"><span>Acima de R$ 5.000,00</span><span className="font-black text-emerald-600 italic">25% (Bônus High-Ticket)</span></li>
                </ul>
              </div>
            </section>
          </div>
          <style jsx global>{`@media print {.no-print { display: none !important; } body { background: white !important; padding: 0 !important; }}`}</style>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: MODO CURSOS (UPLOAD) ---
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
        <button onClick={() => setAba('dashboard')} className="mb-8 text-blue-500 font-black uppercase text-xs tracking-widest">← Voltar ao Painel</button>
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <h2 className="text-xl font-black mb-6 italic text-center uppercase">Cadastrar Aula 🎓</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Título da Aula" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-600" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
            <textarea placeholder="Descrição curta do conteúdo..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm h-24 outline-none focus:border-blue-600" value={novoCurso.descricao} onChange={e => setNovoCurso({...novoCurso, descricao: e.target.value})} />
            <input type="text" placeholder="ID ou Link do Vídeo (YouTube)" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-blue-600" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
            <button onClick={salvarCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase tracking-tighter hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/50">Publicar no Academy</button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic text-blue-500">ELEVA <span className="text-white">CENTRAL</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setAba('cursos')} className="bg-purple-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase italic tracking-widest shadow-lg shadow-purple-900/40 hover:bg-purple-500 transition-all">＋ Academy</button>
          <button onClick={() => setAba('docs')} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Documentos</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA 1: KPI E CALENDÁRIO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-blue-600 p-6 rounded-[35px] text-center shadow-lg shadow-blue-900/20">
            <p className="text-blue-200 text-[9px] font-black uppercase mb-1 tracking-widest">Faturamento Mês</p>
            <p className="text-3xl font-black tracking-tighter">{formatCurrency(stats.mes)}</p>
          </div>
          
          <CalendarioVendas />

          {/* RANKING ACADEMY */}
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6">
            <h2 className="text-[9px] font-black uppercase mb-4 text-purple-400 text-center tracking-widest italic">Academy Ranking</h2>
            <div className="space-y-2">
              {provas.length === 0 ? <p className="text-[8px] text-slate-600 text-center">Sem dados.</p> : null}
              {provas.map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 last:border-0 last:mb-0">
                  <span className="text-[10px] font-bold text-slate-300 italic">{p.vendedor_nome}</span>
                  <span className={`text-[10px] font-black ${p.nota >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>{Number(p.nota).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: LISTA DE LEADS (MONITORAMENTO) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[40px] p-6">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 italic">Monitoramento de Leads Recentes</h2>
          <div className="space-y-3">
            {leads.slice(0, 15).map(l => (
              <div key={l.id} className="bg-slate-950 p-4 rounded-[30px] border border-slate-800 flex justify-between items-center group hover:border-slate-700 transition-all">
                <div>
                  <p className="font-black text-sm italic text-slate-200">{l.nome_cliente}</p>
                  <div className="flex gap-3 mt-1 items-center">
                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-tight">Vendedor: {l.vendedores?.nome || 'Admin'}</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    {/* TENTA LER TELEFONE OU CONTATO */}
                    <span className="text-[9px] font-bold text-slate-500 italic">{l.telefone || l.contato || 'Sem contato'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white">{formatCurrency(l.valor_venda)}</p>
                  <p className={`text-[8px] font-black uppercase tracking-widest ${l.status === 'fechado' ? 'text-emerald-500' : 'text-amber-500'}`}>{l.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 3: LOGS E PAGAMENTOS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* LOGS DE ATIVIDADE */}
          <div className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 shadow-xl">
            <h2 className="text-[10px] font-black uppercase mb-6 text-slate-500 text-center tracking-widest italic">Logs do Sistema</h2>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1">
                  <p className="text-[9px] text-slate-300 leading-tight">
                    <span className="font-black text-blue-500 uppercase">{log.vendedor_nome || 'Sistema'}</span> {log.acao}
                  </p>
                  <p className="text-[7px] text-slate-600 font-bold uppercase mt-1 italic">{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PAGAMENTOS PENDENTES */}
          <div className="bg-slate-900 border-2 border-amber-500/20 rounded-[35px] p-6 shadow-xl">
            <h2 className="text-[10px] font-black uppercase mb-6 text-amber-500 text-center italic">Pagamentos Pendentes</h2>
            {resumoPagamentos.length === 0 ? (
              <p className="text-[9px] text-slate-600 text-center uppercase">Tudo pago ✅</p>
            ) : (
              resumoPagamentos.map((p, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-3xl border border-slate-800 mb-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase italic">{p.nome}</span>
                    <span className="text-sm font-black text-emerald-500">{formatCurrency(p.valor)}</span>
                  </div>
                  <button 
                    onClick={() => confirmarPagamentoVendedor(p.nome, p.valor)} 
                    className="w-full bg-emerald-600 text-white text-[9px] font-black py-3 rounded-2xl uppercase active:scale-95 transition-all shadow-lg shadow-emerald-900/30 hover:bg-emerald-500"
                  >
                    Dar Baixa e Recibo
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}