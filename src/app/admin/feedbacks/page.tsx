'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns'; // Opcional: npm install date-fns
import { ptBR } from 'date-fns/locale';

export default function AdminFeedbacks() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [respostaTemp, setRespostaTemp] = useState<{ [key: string]: string }>({});

  // 1. Carrega todos os feedbacks ordenados pelos mais recentes
  async function loadFeedbacks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('comentarios_academy')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setFeedbacks(data);
    setLoading(false);
  }

  useEffect(() => {
    loadFeedbacks();
  }, []);

  // 2. Envia a resposta do administrador para o banco
  async function enviarResposta(id: number) {
    const textoResposta = respostaTemp[id];
    if (!textoResposta?.trim()) return alert("Escreva uma resposta antes de enviar.");

    const { error } = await supabase
      .from('comentarios_academy')
      .update({ resposta_admin: textoResposta })
      .eq('id', id);

    if (!error) {
      alert("Resposta enviada com sucesso!");
      loadFeedbacks(); // Recarrega para mostrar a resposta salva
    } else {
      alert("Erro ao enviar resposta.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <button onClick={() => router.push('/admin/central')} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors mb-2 block">
            ← Voltar para Central
          </button>
          <h1 className="text-2xl font-black italic uppercase text-blue-400 tracking-tighter">
            Feedbacks <span className="text-white">Academy</span>
          </h1>
        </div>
        <div className="bg-blue-600/10 px-4 py-2 rounded-xl border border-blue-500/20">
          <p className="text-[10px] font-black uppercase text-blue-400">Total de Comentários</p>
          <p className="text-xl font-black">{feedbacks.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {feedbacks.map((f) => (
            <div key={f.id} className="bg-[#1e293b] rounded-[35px] border border-slate-800 overflow-hidden shadow-xl">
              
              {/* Topo do Card: Info do Vendedor */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/30">
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{f.aula_titulo}</p>
                  <h3 className="text-lg font-black italic uppercase leading-none">{f.vendedor_nome}</h3>
                  <p className="text-[9px] text-slate-500 font-bold mt-2 uppercase">
                    {new Date(f.created_at).toLocaleDateString('pt-BR')} às {new Date(f.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-1 text-amber-400 text-sm">
                  {Array.from({ length: f.estrelas }).map((_, i) => <span key={i}>★</span>)}
                </div>
              </div>

              {/* Conteúdo: Comentário do Vendedor */}
              <div className="p-6">
                <p className="text-slate-300 text-sm italic leading-relaxed bg-[#0f172a] p-5 rounded-2xl border border-slate-800">
                  "{f.comentario}"
                </p>
              </div>

              {/* Rodapé: Resposta do Admin */}
              <div className="p-6 pt-0">
                {f.resposta_admin ? (
                  <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl">
                    <p className="text-[9px] font-black text-blue-400 uppercase mb-2 italic">Sua Resposta:</p>
                    <p className="text-sm text-blue-100">{f.resposta_admin}</p>
                    <button 
                      onClick={() => {
                        const novoTexto = prompt("Editar resposta:", f.resposta_admin);
                        if(novoTexto) {
                            setRespostaTemp({ ...respostaTemp, [f.id]: novoTexto });
                            // Aqui você chamaria a função de update novamente
                        }
                      }}
                      className="text-[8px] font-black uppercase text-blue-500 mt-3 hover:underline"
                    >
                      Editar Resposta
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea 
                      placeholder="Escreva uma resposta para o consultor..."
                      className="w-full bg-[#0b121e] border border-slate-800 p-4 rounded-2xl text-xs outline-none focus:border-blue-500 text-slate-300 min-h-[80px]"
                      value={respostaTemp[f.id] || ''}
                      onChange={(e) => setRespostaTemp({ ...respostaTemp, [f.id]: e.target.value })}
                    />
                    <button 
                      onClick={() => enviarResposta(f.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                    >
                      Enviar Resposta
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {feedbacks.length === 0 && (
            <div className="text-center py-20 opacity-30 italic">
              Nenhum feedback recebido ainda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}