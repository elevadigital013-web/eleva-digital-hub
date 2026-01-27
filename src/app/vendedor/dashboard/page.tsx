'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { AutoMotivation } from '@/components/AutoMotivation';

// ... dentro do seu return
<AutoMotivation />

// Banco de Frases Motivacionais (Pode adicionar mais aqui!)
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
  "Sua atitude determina sua altitude.",
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
  const [loading, setLoading] = useState(true);
  const [vendedor, setVendedor] = useState<any>(null);
  const [stats, setStats] = useState({ vendas: 0, comissao: 0, leads: 0 });
  
  // Estados do Modal Motivacional
  const [showMotivation, setShowMotivation] = useState(false);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setVendedor(user);

      // Carregar dados de vendas
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('vendedor_id', user.id);

      if (leads) {
        let totalVendas = 0;
        let comissaoTotal = 0;
        
        leads.forEach(l => {
          if (l.status === 'fechado') {
            const valor = Number(l.valor_venda) || 0;
            totalVendas += valor;
            // Regra Híbrida (Visualização pro vendedor)
            const porcentagem = valor >= 5000 ? 0.25 : 0.20;
            if (!l.pago) comissaoTotal += (valor * porcentagem);
          }
        });

        setStats({
          vendas: totalVendas,
          comissao: comissaoTotal,
          leads: leads.length
        });
      }
      setLoading(false);

      // LÓGICA DA MOTIVAÇÃO
      // Verifica se já mostrou nessa sessão
      const jaMostrou = sessionStorage.getItem('motivational_shown');
      if (!jaMostrou) {
        const fraseSorteada = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];
        setQuote(fraseSorteada);
        setShowMotivation(true);
        sessionStorage.setItem('motivational_shown', 'true');
      }
    }

    loadData();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      
      {/* MODAL MOTIVACIONAL (POP-UP) */}
      {showMotivation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            {/* Efeito de Fundo */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
            
            <div className="mb-6 text-6xl animate-bounce">🚀</div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-4 uppercase italic">
              Bom dia, Campeão!
            </h2>
            
            <p className="text-slate-600 text-lg font-medium leading-relaxed mb-8 italic">
              "{quote}"
            </p>
            
            <button 
              onClick={() => setShowMotivation(false)}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-blue-600"
            >
              VAMOS PRA CIMA! 🔥
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Olá, {vendedor?.user_metadata?.nome || 'Consultor'}</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Painel do Vendedor</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="bg-white p-3 rounded-full shadow-md text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-slate-900 p-6 rounded-[35px] text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Vendido</p>
          <p className="text-4xl font-black">{formatCurrency(stats.vendas)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Leads</p>
            <p className="text-2xl font-black text-slate-800">{stats.leads}</p>
          </div>
          <div className="bg-amber-500 p-6 rounded-[30px] shadow-lg shadow-amber-500/20 text-slate-900">
            <p className="text-amber-900/70 text-[9px] font-black uppercase tracking-widest mb-1">A Receber</p>
            <p className="text-2xl font-black">{formatCurrency(stats.comissao)}</p>
          </div>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}

      <button onClick={() => router.push('/vendedor/cursos')} className="...">
  🎓 Treinamento
</button>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => router.push('/vendedor/novo-lead')}
          className="bg-blue-600 text-white p-6 rounded-[30px] shadow-lg shadow-blue-500/30 flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="text-left">
            <p className="font-black text-lg uppercase italic">Novo Registro</p>
            <p className="text-xs text-blue-200 font-medium">Cadastrar cliente ou venda</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl group-hover:rotate-90 transition-transform">
            ＋
          </div>
        </button>
      </div>
      
      {/* MENSAGEM DE RODAPÉ */}
      <div className="mt-8 text-center opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Eleva Digital System</p>
      </div>
    </div>
  );
}