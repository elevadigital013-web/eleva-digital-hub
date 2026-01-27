'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- TIPOS ATUALIZADOS PARA UUID (STRING) ---
interface Curso {
  id: string; // MUDANÇA: Agora é string porque é UUID
  titulo: string;
  descricao?: string;
  link_video?: string;
  link_material?: string;
}

interface Comentario {
  id: number;
  created_at: string;
  nome_usuario: string;
  comentario: string;
  nota: number;
}

export default function AreaCursos() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursoAtivo, setCursoAtivo] = useState<Curso | null>(null);

  // ESTADOS DOS COMENTÁRIOS
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [meuNome, setMeuNome] = useState(''); 
  const [minhaNota, setMinhaNota] = useState(5);
  const [enviando, setEnviando] = useState(false);

  // Busca os cursos ao carregar
  useEffect(() => {
    async function fetchCursos() {
      const { data } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setCursos(data);
      setLoading(false);
    }
    fetchCursos();
  }, []);

  // Sempre que mudar a aula ativa, carrega os comentários dela
  useEffect(() => {
    if (cursoAtivo) {
      buscarComentarios(cursoAtivo.id);
    }
  }, [cursoAtivo]);

  // Função atualizada para aceitar ID como string
  async function buscarComentarios(cursoId: string) {
    const { data } = await supabase
      .from('comentarios_aula')
      .select('*')
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: false }); 
    
    if (data) setComentarios(data);
  }

  async function enviarComentario() {
    if (!novoComentario.trim() || !meuNome.trim()) {
      alert("Preencha seu nome e o comentário!");
      return;
    }
    if (!cursoAtivo) return;

    setEnviando(true);

    const { error } = await supabase.from('comentarios_aula').insert([{
      curso_id: cursoAtivo.id,
      nome_usuario: meuNome,
      comentario: novoComentario,
      nota: minhaNota
    }]);

    if (!error) {
      setNovoComentario('');
      buscarComentarios(cursoAtivo.id); // Recarrega a lista
    } else {
      console.error(error);
      alert("Erro ao enviar comentário.");
    }
    setEnviando(false);
  }

  // Pega ID do Youtube
  const getYouTubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Filtros de Listagem
  const listaVideos = cursos.filter(c => c.link_video && c.link_video.length > 5);
  const listaPdfs = cursos.filter(c => (!c.link_video || c.link_video.length < 5) && c.link_material);

  // Componente de Estrelas
  const RenderEstrelas = ({ nota }: { nota: number }) => (
    <div className="flex text-yellow-400 text-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= nota ? '★' : '☆'}</span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto">
        <button 
          onClick={() => cursoAtivo ? setCursoAtivo(null) : router.back()} 
          className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline"
        >
          {cursoAtivo ? '← Voltar para a Estante' : '← Voltar ao Dashboard'}
        </button>
        <h1 className="text-xl font-black italic text-slate-900 uppercase">Eleva Academy 🎓</h1>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Carregando conteúdo...</div>
      ) : (
        <>
          {cursoAtivo ? (
            /* ================= MODO AULA ATIVA ================= */
            <div className="max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
               
               {/* PLAYER DE MÍDIA */}
               {cursoAtivo.link_video ? (
                  <div className="bg-black rounded-[30px] overflow-hidden shadow-2xl aspect-video mb-6 border-4 border-white">
                    <iframe 
                      width="100%" height="100%" 
                      src={`https://www.youtube.com/embed/${getYouTubeId(cursoAtivo.link_video)}`} 
                      title={cursoAtivo.titulo}
                      allowFullScreen className="w-full h-full"
                    />
                  </div>
               ) : (
                  <div className="aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-8 text-center shadow-2xl mb-6">
                    <div className="bg-slate-800 p-6 rounded-full mb-4"><span className="text-6xl">📄</span></div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic">Documento PDF</h3>
                    <a href={cursoAtivo.link_material} target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 px-8 rounded-xl transition-all flex items-center gap-2">
                      Abrir/Baixar Arquivo ↗
                    </a>
                  </div>
               )}

              {/* DETALHES DA AULA */}
              <div className="bg-white p-8 rounded-[30px] shadow-sm border border-slate-100 mb-8">
                <h2 className="text-2xl font-black text-slate-900 mb-2">{cursoAtivo.titulo}</h2>
                <p className="text-slate-600 leading-relaxed mb-6">{cursoAtivo.descricao || 'Conteúdo exclusivo para membros.'}</p>
                
                {cursoAtivo.link_video && cursoAtivo.link_material && (
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                      <span className="text-2xl">📚</span>
                      <div>
                          <p className="text-xs font-bold text-blue-400 uppercase">Material Complementar</p>
                          <a href={cursoAtivo.link_material} target="_blank" className="font-bold text-blue-700 hover:underline">Baixar PDF da Aula</a>
                      </div>
                   </div>
                )}
              </div>

              {/* --- ÁREA DE COMENTÁRIOS E AVALIAÇÃO --- */}
              <div className="bg-slate-100 p-6 rounded-[30px] border border-slate-200">
                <h3 className="text-lg font-black text-slate-700 uppercase mb-4 flex items-center gap-2">
                   💬 Comunidade & Dúvidas
                </h3>

                {/* Formulário de Envio */}
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-8">
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Sua Avaliação:</label>
                      <div className="flex gap-1 cursor-pointer">
                        {[1, 2, 3, 4, 5].map((star) => (
                           <button key={star} onClick={() => setMinhaNota(star)} className="text-xl focus:outline-none transition-transform hover:scale-125">
                             {star <= minhaNota ? '⭐' : '☆'}
                           </button>
                        ))}
                      </div>
                   </div>
                   
                   <input 
                      type="text" 
                      placeholder="Seu nome..." 
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl mb-2 text-sm font-bold"
                      value={meuNome}
                      onChange={e => setMeuNome(e.target.value)}
                   />
                   <textarea 
                      placeholder="O que achou da aula? Tem alguma dúvida?" 
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm min-h-[80px]"
                      value={novoComentario}
                      onChange={e => setNovoComentario(e.target.value)}
                   />
                   <button 
                      onClick={enviarComentario} 
                      disabled={enviando}
                      className="w-full bg-blue-600 text-white font-black uppercase py-3 rounded-xl mt-2 hover:bg-blue-500 transition-colors"
                   >
                      {enviando ? 'Enviando...' : 'Publicar Comentário'}
                   </button>
                </div>

                {/* Lista de Comentários */}
                <div className="space-y-4">
                  {comentarios.length === 0 && (
                    <p className="text-center text-slate-400 text-sm py-4">Seja o primeiro a comentar!</p>
                  )}
                  
                  {comentarios.map(c => (
                     <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="font-black text-slate-800 text-sm">{c.nome_usuario}</p>
                              <p className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                              </p>
                           </div>
                           <RenderEstrelas nota={c.nota} />
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{c.comentario}</p>
                     </div>
                  ))}
                </div>
              </div>

            </div>
            
          ) : (
            /* ================= MODO ESTANTE (LISTAGEM) ================= */
            <div className="max-w-7xl mx-auto space-y-12">
              
              {cursos.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                  <p className="text-4xl mb-4">📭</p>
                  <p className="font-bold">Nenhum conteúdo disponível.</p>
                </div>
              )}

              {/* VÍDEO AULAS */}
              {listaVideos.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="text-blue-600 text-xl">▶</span> Aulas em Vídeo
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listaVideos.map(curso => (
                      <div key={curso.id} onClick={() => setCursoAtivo(curso)} className="bg-white p-5 rounded-[30px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group active:scale-95">
                        <div className="bg-slate-100 h-40 rounded-2xl mb-4 overflow-hidden relative group-hover:bg-blue-50 transition-colors">
                          <img src={`https://img.youtube.com/vi/${getYouTubeId(curso.link_video)}/mqdefault.jpg`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Thumbnail" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-blue-600 pl-1">▶</div>
                          </div>
                        </div>
                        <h3 className="font-black text-base text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">{curso.titulo}</h3>
                        {curso.link_material && <span className="text-[9px] text-emerald-500 font-bold mt-2 block uppercase">+ Material Incluso</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BIBLIOTECA PDF */}
              {listaPdfs.length > 0 && (
                <div>
                  <h2 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-t border-slate-200 pt-8">
                    <span className="text-emerald-500 text-xl">📄</span> Biblioteca & Leituras
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {listaPdfs.map(curso => (
                      <div key={curso.id} onClick={() => setCursoAtivo(curso)} className="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group active:scale-95 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl mb-3 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📄</div>
                        <h3 className="font-bold text-xs text-slate-700 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-3">{curso.titulo}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}