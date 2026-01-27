'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// CONFIGURAÇÃO DOS CURSOS E PERGUNTAS
const CURSO_ATUAL = {
  titulo: "Módulo 1: Abordagem e Fechamento",
  descricao: "Aprenda a contornar objeções e fechar contratos na hora.",
  videoId: "ScMzIvxBSi4", // Exemplo: ID de um vídeo do YouTube (Toguro ou teu)
  perguntas: [
    {
      pergunta: "O cliente diz 'Vou pensar'. O que você faz?",
      opcoes: [
        "Agradeço e vou embora.",
        "Pergunto 'O que te impede de fechar agora?' e isolo a objeção.",
        "Deixo um cartão e espero ele ligar.",
        "Fico bravo e insisto."
      ],
      correta: 1 // Índice da resposta certa (começa em 0)
    },
    {
      pergunta: "Qual a regra de comissão para High-Ticket (acima de 5k)?",
      opcoes: ["10%", "15%", "20%", "25%"],
      correta: 3
    },
    {
      pergunta: "Qual o foco principal da Eleva Digital?",
      opcoes: ["Vender pastel.", "Transformar negócios locais com tecnologia.", "Apenas criar sites feios.", "Fazer spam no WhatsApp."],
      correta: 1
    },
    {
      pergunta: "O que é um Lead?",
      opcoes: ["Um cliente potencial interessado.", "Um tipo de vírus.", "O nome do dono da empresa.", "Um boleto pago."],
      correta: 0
    },
    {
      pergunta: "Se o cliente não tem dinheiro agora, o que oferecemos?",
      opcoes: ["Nada, tchau.", "Parcelamento ou foco no retorno do investimento (ROI).", "Desconto de 90%.", "Fiado."],
      correta: 1
    }
  ]
};

export default function AreaCursos() {
  const router = useRouter();
  const [fase, setFase] = useState<'video' | 'prova' | 'resultado'>('video');
  const [respostas, setRespostas] = useState<number[]>([]);
  const [notaFinal, setNotaFinal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const finalizarProva = async () => {
    setLoading(true);
    let acertos = 0;
    respostas.forEach((resp, index) => {
      if (resp === CURSO_ATUAL.perguntas[index].correta) acertos++;
    });

    // Calcula nota de 0 a 10
    const nota = (acertos / CURSO_ATUAL.perguntas.length) * 10;
    setNotaFinal(nota);
    
    // Salva no Banco
    if (user) {
      await supabase.from('resultados_provas').insert({
        vendedor_id: user.id,
        vendedor_nome: user.user_metadata?.nome || 'Consultor',
        curso_titulo: CURSO_ATUAL.titulo,
        nota: nota,
        aprovado: nota >= 7
      });
    }
    
    setFase('resultado');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <button onClick={() => router.back()} className="mb-6 text-blue-600 font-black text-xs uppercase tracking-widest">← Voltar</button>

      {/* FASE 1: VÍDEO AULA */}
      {fase === 'video' && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-slate-900 mb-2">{CURSO_ATUAL.titulo}</h1>
          <p className="text-slate-500 mb-6">{CURSO_ATUAL.descricao}</p>
          
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl mb-8">
            <iframe 
              width="100%" height="100%" 
              src={`https://www.youtube.com/embed/${CURSO_ATUAL.videoId}`} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>

          <button 
            onClick={() => setFase('prova')}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all uppercase"
          >
            Estudei! Quero fazer a Prova 📝
          </button>
        </div>
      )}

      {/* FASE 2: PROVA */}
      {fase === 'prova' && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-xl">
          <h2 className="text-xl font-black text-center mb-8 uppercase text-slate-400 tracking-widest">Avaliação Oficial</h2>
          
          {CURSO_ATUAL.perguntas.map((p, i) => (
            <div key={i} className="mb-8">
              <p className="font-bold text-slate-800 mb-3">{i+1}. {p.pergunta}</p>
              <div className="space-y-2">
                {p.opcoes.map((opt, idx) => (
                  <label key={idx} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${respostas[i] === idx ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>
                    <input 
                      type="radio" 
                      name={`pergunta-${i}`} 
                      className="hidden"
                      onChange={() => {
                        const novas = [...respostas];
                        novas[i] = idx;
                        setRespostas(novas);
                      }}
                    />
                    <span className="text-sm font-medium text-slate-600">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button 
            disabled={respostas.length < CURSO_ATUAL.perguntas.length || loading}
            onClick={finalizarProva}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl disabled:opacity-50"
          >
            {loading ? 'Corrigindo...' : 'FINALIZAR PROVA'}
          </button>
        </div>
      )}

      {/* FASE 3: RESULTADO */}
      {fase === 'resultado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-sm">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center animate-in zoom-in">
            <div className="text-6xl mb-4">{notaFinal >= 7 ? '🎓' : '📚'}</div>
            <h2 className="text-3xl font-black text-slate-800 mb-2">Nota: {notaFinal.toFixed(1)}</h2>
            
            {notaFinal >= 7 ? (
              <>
                <p className="text-emerald-500 font-black uppercase tracking-widest mb-6">APROVADO!</p>
                <p className="text-slate-500 text-sm mb-8">Parabéns! Você domina esse conteúdo. Continue evoluindo.</p>
              </>
            ) : (
              <>
                <p className="text-red-500 font-black uppercase tracking-widest mb-6">REPROVADO</p>
                <p className="text-slate-500 text-sm mb-8">Você precisa de no mínimo 7.0. Assista a aula novamente.</p>
              </>
            )}

            <button onClick={() => { setFase('video'); setRespostas([]); }} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl">
              {notaFinal >= 7 ? 'VOLTAR AO MENU' : 'TENTAR NOVAMENTE'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}