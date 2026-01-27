'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AreaCursos() {
  const router = useRouter();
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursoAtivo, setCursoAtivo] = useState<any>(null);

  // Busca os cursos do banco
  useEffect(() => {
    async function fetchCursos() {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setCursos(data);
      setLoading(false);
    }
    fetchCursos();
  }, []);

  // Função ajustada para pegar o ID do vídeo (evita erros com null)
  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => cursoAtivo ? setCursoAtivo(null) : router.back()} 
          className="text-blue-600 font-black text-xs uppercase tracking-widest"
        >
          {cursoAtivo ? '← Voltar para Lista' : '← Voltar ao Dashboard'}
        </button>
        <h1 className="text-xl font-black italic text-slate-900 uppercase">Eleva Academy 🎓</h1>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Carregando aulas...</div>
      ) : (
        <>
          {/* ================= MODO ASSISTIR AULA ================= */}
          {cursoAtivo ? (
            <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
               
               {/* 1. SE TIVER VÍDEO, MOSTRA O YOUTUBE */}
               {cursoAtivo.link_video ? (
                  <div className="bg-black rounded-[30px] overflow-hidden shadow-2xl aspect-video mb-6 border-4 border-white">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${getYouTubeId(cursoAtivo.link_video)}`} 
                      title={cursoAtivo.titulo}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
               ) : (
                  /* 2. SE NÃO TIVER VÍDEO (SÓ PDF), MOSTRA O CARTÃO DE DOWNLOAD */
                  <div className="aspect-video w-full rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-8 text-center shadow-2xl mb-6">
                    <div className="bg-slate-800 p-6 rounded-full mb-4">
                      <span className="text-6xl">📄</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 uppercase italic">Material de Leitura</h3>
                    <p className="text-slate-400 mb-6 text-sm">Esta aula é um conteúdo exclusivo em PDF.</p>
                    
                    <a 
                      href={cursoAtivo.link_material} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 px-8 rounded-xl transition-all flex items-center gap-2"
                    >
                      Abrir Material PDF ↗
                    </a>
                  </div>
               )}

              <h2 className="text-2xl font-black text-slate-900 mb-2">{cursoAtivo.titulo}</h2>
              <p className="text-slate-600 leading-relaxed mb-6">{cursoAtivo.descricao || 'Sem descrição.'}</p>
              
              {/* Se tiver vídeo E material, mostra botão extra aqui em baixo */}
              {cursoAtivo.link_video && cursoAtivo.link_material && (
                 <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                    <span className="text-2xl">📚</span>
                    <div>
                        <p className="text-xs font-bold text-blue-400 uppercase">Material Complementar</p>
                        <a href={cursoAtivo.link_material} target="_blank" className="font-bold text-blue-700 hover:underline">
                          Baixar PDF da Aula
                        </a>
                    </div>
                 </div>
              )}
            </div>
            
          ) : (
            
            /* ================= MODO LISTA DE CURSOS ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.length === 0 ? (
                <div className="col-span-full text-center py-20 text-slate-400">
                  <p className="text-4xl mb-4">📭</p>
                  <p className="font-bold">Nenhuma aula disponível ainda.</p>
                </div>
              ) : (
                cursos.map(curso => (
                  <div 
                    key={curso.id} 
                    onClick={() => setCursoAtivo(curso)}
                    className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="bg-slate-100 h-32 rounded-2xl mb-4 flex items-center justify-center text-4xl group-hover:bg-blue-50 transition-colors relative overflow-hidden">
                      
                      {/* LÓGICA DA MINIATURA: VÍDEO OU PDF */}
                      {curso.link_video ? (
                        <>
                          <img 
                            src={`https://img.youtube.com/vi/${getYouTubeId(curso.link_video)}/mqdefault.jpg`} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            alt="Thumbnail"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all">
                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">▶</div>
                          </div>
                        </>
                      ) : (
                        // Se for só PDF, mostra ícone
                        <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                          <span className="text-4xl">📄</span>
                          <span className="text-[10px] font-bold uppercase mt-2">Leitura</span>
                        </div>
                      )}
                      
                    </div>
                    
                    <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {curso.titulo}
                    </h3>
                    
                    <div className="flex gap-2">
                        {curso.link_video && <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">VÍDEO</span>}
                        {curso.link_material && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">PDF</span>}
                    </div>
                    
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}