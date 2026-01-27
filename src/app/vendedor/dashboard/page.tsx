'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
// 👇 O IMPORT QUE FALTAVA
import { AutoMotivation } from '@/components/AutoMotivation';

// Banco de Frases Motivacionais
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

export default function VendedorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ vendas: 0, comissao: 0, leads: 0 });
  const [vendedor, setVendedor] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/');
      setVendedor(user);

      const { data: leads } = await supabase.from('leads').select('*').eq('vendedor_id', user.id);
      if (leads) {
        let v = 0, c = 0;
        leads.forEach(l => {
          if (l.status === 'fechado') {
            const valor = Number(l.valor_venda) || 0;
            v += valor;
            const perc = valor >= 5000 ? 0.25 : 0.20;
            if (!l.pago) c += (valor * perc);
          }
        });
        setStats({ vendas: v, comissao: c, leads: leads.length });
      }
    }
    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      
      {/* 1. MOTIVAÇÃO AUTOMÁTICA */}
      <AutoMotivation phrases={FRASES_MOTIVACIONAIS} />

      {/* 2. HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">
            Olá, <span className="text-blue-600">{vendedor?.user_metadata?.nome || 'Campeão'}</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Painel de Performance</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
          className="bg-white p-3 rounded-2xl shadow-sm text-red-500 active:scale-90 transition-all border border-slate-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* 3. CARDS DE RESULTADOS */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] -mr-16 -mt-16"></div>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 italic">Vendas Fechadas</p>
          <p className="text-4xl font-black tracking-tighter">{formatCurrency(stats.vendas)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm">
            <p className="text-slate-400 text-[9px] font-black uppercase mb-1">Meus Leads</p>
            <p className="text-2xl font-black text-slate-800 tracking-tighter">{stats.leads}</p>
          </div>
          <div className="bg-amber-500 p-6 rounded-[35px] shadow-lg shadow-amber-500/20 text-slate-900">
            <p className="text-amber-900 text-[9px] font-black uppercase mb-1">Comissão (Pendente)</p>
            <p className="text-2xl font-black tracking-tighter">{formatCurrency(stats.comissao)}</p>
          </div>
        </div>
      </div>

      {/* 4. AÇÕES RÁPIDAS (COM CARD ACADEMY EM DESTAQUE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD ACADEMY */}
        <button 
          onClick={() => router.push('/vendedor/cursos')}
          className="bg-white border-2 border-slate-100 p-6 rounded-[35px] shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🎓</span>
              <p className="font-black text-xl uppercase italic text-slate-800 leading-none">Eleva Academy</p>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic pl-1">Acesse seus Cursos</p>
          </div>
          <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
            ➜
          </div>
        </button>

        {/* CARD NOVO LEAD */}
        <button 
          onClick={() => router.push('/vendedor/novo-lead')}
          className="bg-blue-600 text-white p-6 rounded-[35px] shadow-lg shadow-blue-600/20 flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="text-left">
            <p className="font-black text-xl uppercase italic leading-none">Novo Registro</p>
            <p className="text-[10px] text-blue-200 uppercase font-bold tracking-widest mt-1 italic">Venda de Campo</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-light">＋</div>
        </button>

      </div>

      <div className="mt-12 text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Eleva Digital v2.1</p>
      </div>
    </div>
  );
}