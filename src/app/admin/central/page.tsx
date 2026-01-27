'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { AutoMotivation } from '@/components/AutoMotivation';

// --- BANCO DE FRASES MOTIVACIONAIS ---
const FRASES_MOTIVACIONAIS = [
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Você é do tamanho dos seus sonhos. Voe alto!",
  "Hoje é dia de fazer história.",
  "O 'não' você já tem. Busque o 'SIM'!",
  "Foguete não tem ré. Pra cima deles!",
  "A meta é o chão, o céu é o limite.",
  "Vender é a arte de criar soluções. Você é um artista!",
  "Sua atitude determina sua altitude.",
  "Seja a mudança que você quer ver no seu bolso.",
  "Quem planta esforço, colhe resultado. Vamos pra cima!",
  "Mentalidade de campeão: Desistir não é opção.",
  "Você é gigante! Acredite no seu potencial.",
  "Vender não é sobre convencer, é sobre ajudar.",
  "O 'não' é apenas um degrau para o 'sim'.",
  "Seu sucesso é determinado pelo tamanho da sua persistência.",
  "Clientes compram benefícios, não características.",
  "A melhor hora para fazer uma venda é logo após ter feito uma.",
  "Não encontre clientes para seus produtos, encontre produtos para seus clientes.",
  "Qualidade é o melhor plano de negócios.",
  "O segredo do sucesso em vendas é falar com pessoas.",
  "Vendas curam tudo. Mantenha o funil cheio.",
  "Se você não cuidar do seu cliente, o seu concorrente cuidará.",
  "A venda começa quando o cliente diz não.",
  "Pessoas compram de pessoas em quem confiam.",
  "Entusiasmo é a eletricidade da vida. Como você vende sem ele?",
  "O fracasso é a oportunidade de começar de novo com mais inteligência.",
  "Não diminua a meta, aumente o esforço.",
  "Foque no relacionamento, não apenas na transação.",
  "Cada venda perdida é uma lição aprendida.",
  "O sucesso não acontece por acaso, é trabalho duro.",
  "Seja o especialista que seu cliente precisa.",
  "Vender é transferir confiança.",
  "A objeção é um pedido de mais informação.",
  "Grandes vendedores são grandes ouvintes.",
  "Não venda preço, venda valor.",
  "A motivação é o que te faz começar. O hábito é o que te faz continuar.",
  "Seu sorriso é o seu logotipo, sua personalidade é seu cartão de visitas.",
  "Hoje é um dia perfeito para bater metas.",
  "Crie valor antes de tentar extrair valor.",
  "A persistência realiza o impossível.",
  "Não espere por oportunidades. Crie-as.",
  "O cliente não compra o que você faz, ele compra o porquê você faz.",
  "Toda venda tem cinco obstáculos: falta de necessidade, de dinheiro, de pressa, de desejo ou de confiança.",
  "Faça o cliente se sentir o herói da história.",
  "Vender é a arte de plantar sementes hoje para colher amanhã.",
  "Não prometa o que não pode cumprir. Entregue mais do que prometeu.",
  "A disciplina é a ponte entre metas e realizações.",
  "Quem teme perder já perdeu.",
  "O medo de perder a venda é o maior inimigo do vendedor.",
  "Seja obstinado com a solução do problema do cliente.",
  "Resultados são a única coisa que importa no final do dia.",
  "A sorte favorece a mente preparada.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Conheça seu produto, mas conheça ainda mais seu cliente.",
  "Feito é melhor que perfeito, mas vendas feitas com excelência geram indicações.",
  "Pare de vender. Comece a ajudar.",
  "Sua rede de contatos é seu patrimônio líquido.",
  "Escute 80% do tempo, fale 20%.",
  "Acredite no que você vende ou ninguém acreditará.",
  "Metas claras geram resultados claros.",
  "Você é o único responsável pelo seu sucesso em vendas."
];

export default function AdminCentral() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });

  async function loadData() {
    const [leadsResp, logsResp] = await Promise.all([
      supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false }),
      supabase.from('logs_atividades').select('*').order('created_at', { ascending: false }).limit(15)
    ]);

    if (leadsResp.data) setLeads(leadsResp.data);
    if (logsResp.data) setLogs(logsResp.data);
  }

  useEffect(() => { loadData(); }, []);

  const salvarCurso = async () => {
    if (!novoCurso.titulo || !novoCurso.link) return alert("Preencha tudo!");
    await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link }]);
    alert('Curso postado!');
    setNovoCurso({ titulo: '', link: '' });
  };

  // --- ABA GESTÃO DE CURSOS ---
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white font-sans">
        <button onClick={() => setAba('dashboard')} className="mb-8 font-black text-blue-600 text-[10px] uppercase italic">← Voltar</button>
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800">
          <h2 className="text-2xl font-black italic mb-6 text-center uppercase">Postar Aula no Academy 🎓</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Título da Aula" className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm font-bold" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
            <input type="text" placeholder="URL do Vídeo (YouTube)" className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 text-sm font-bold" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
            <button onClick={salvarCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-blue-500 transition-all">Publicar Aula</button>
          </div>
        </div>
      </div>
    );
  }

  // --- ABA DOCUMENTAÇÃO ---
  if (aba === 'docs') {
    return (
      <div className="min-h-screen bg-white p-8 text-slate-900 font-sans">
        <button onClick={() => setAba('dashboard')} className="mb-6 font-black text-blue-600 uppercase text-xs tracking-widest">← Voltar</button>
        <h1 className="text-3xl font-black italic mb-4">Manual Operacional Eleva Digital</h1>
        <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-200">
          <p className="font-bold text-blue-600 mb-2 underline">Regras de Comissão:</p>
          <ul className="text-sm space-y-2 font-medium">
            <li>• Contratos até R$ 4.999,99: 20% de comissão.</li>
            <li>• Contratos a partir de R$ 5.000,00: 25% de comissão.</li>
          </ul>
        </div>
      </div>
    );
  }

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
      
      {/* COMPONENTE DE MOTIVAÇÃO - AGORA SIM! */}
      <AutoMotivation phrases={FRASES_MOTIVACIONAIS} />

      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic text-blue-500">ELEVA <span className="text-white text-sm">CENTRAL</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setAba('cursos')} className="bg-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest">＋ Academy</button>
          <button onClick={() => setAba('docs')} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic tracking-widest">Documentos</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Sair</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* CALENDÁRIO MENSAL */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-2xl">
          <h3 className="text-[10px] font-black uppercase mb-6 text-blue-500 text-center tracking-widest italic">Mapa de Vendas Mensal</h3>
          <div className="grid grid-cols-7 gap-2">
            {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map(dia => {
              const temVenda = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
              return (
                <div key={dia.toString()} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${temVenda ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-950 text-slate-800 border border-slate-800/50'}`}>
                  {dia.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {/* MONITORAMENTO DE LEADS (CORRIGIDO) */}
        <div className="lg:col-span-2 space-y-3">
           <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-6 h-full">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic tracking-widest">Monitoramento de Leads</h2>
            <div className="space-y-3">
              {leads.map(l => (
                <div key={l.id} className="bg-slate-950 p-5 rounded-[35px] border border-slate-800 flex justify-between items-center shadow-lg">
                  <div>
                    <p className="font-black text-lg italic text-slate-100 leading-none mb-2">{l.nome_cliente}</p>
                    <div className="flex gap-4 items-center">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">Vendedor: {l.vendedores?.nome || 'Admin'}</span>
                      <span className="text-[10px] font-bold text-slate-500 italic">Zap: {l.telefone || l.contato || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white mb-1">{formatCurrency(l.valor_venda)}</p>
                    <p className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${l.status === 'fechado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {l.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LOGS (CORRIGIDO) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-6 shadow-xl">
            <h2 className="text-[10px] font-black uppercase text-slate-500 mb-6 italic text-center tracking-widest">Logs em Tempo Real</h2>
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="border-l-2 border-slate-700 pl-4 py-1">
                  <p className="text-[10px] text-slate-300 leading-tight">
                    <span className="font-black text-blue-500 uppercase italic">{log.vendedor_nome || 'Sistema'}</span> {log.acao}
                  </p>
                  <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 italic">
                    {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : '--:--'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}