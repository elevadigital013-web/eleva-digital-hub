'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ElevaAcademy() {
  const router = useRouter();
  const [aulas, setAulas] = useState<any[]>([]);
  const [aulaAtiva, setAulaAtiva] = useState<any>(null);

  // Estados para o formulário de feedback
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function loadAulas() {
      const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: true });
      if (data) setAulas(data);
    }
    loadAulas();
  }, []);

  // Função para salvar o comentário no banco
  async function enviarComentario() {
    if (!comentario.trim()) return alert("Por favor, escreva um comentário.");
    if (!aulaAtiva) return;

    setEnviando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const nomeVendedor = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Consultor';

      const { error } = await supabase.from('comentarios_academy').insert([{
        aula_titulo: aulaAtiva.titulo,
        vendedor_nome: nomeVendedor,
        comentario: comentario,
        estrelas: nota
      }]);

      if (error) throw error;

      alert("Feedback enviado com sucesso! 🚀");
      setComentario(''); 
      setNota(5);        
    } catch (error: any) {
      console.error("Erro ao comentar:", error);
      alert("Erro ao enviar comentário.");
    } finally {
      setEnviando(false);
    }
  }

  const getYoutubeId = (url: string) => {
    if (!url) return '';
    return url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : url.split('/').pop();
  };

  const getThumb = (url: string) => {
    return `https://img.youtube.com/vi/${getYoutubeId(url)}/maxresdefault.jpg`;
  };

  const categoriasUnicas = Array.from(new Set(aulas.map(a => a.categoria || 'Geral')));

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={() => router.back()} className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors">
          ← Voltar
        </button>
        <h1 className="text-xl font-black italic tracking-tighter uppercase">
          Eleva <span className="text-blue-500">Academy</span>
        </h1>
      </div>

      {/* PLAYER PRINCIPAL */}
      {aulaAtiva && (
        <div className="mb-16 animate-in fade-in slide-in-from-top-4 duration-700 max-w-5xl mx-auto">
          <div className="aspect-video w-full rounded-[40px] overflow-hidden border-4 border-blue-500/20 shadow-2xl shadow-blue-500/10">
            <iframe 
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${getYoutubeId(aulaAtiva.link_video)}?autoplay=1`}
              title={aulaAtiva.titulo}
              allowFullScreen
            ></iframe>
          </div>

          <div className="mt-6 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1 block">
                {aulaAtiva.categoria || 'Geral'}
              </span>
              <h2 className="text-3xl font-black italic uppercase text-white leading-none">{aulaAtiva.titulo}</h2>
            </div>
            {aulaAtiva.link_material && (
              <a href={aulaAtiva.link_material} target="_blank" className="bg-emerald-500 text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-emerald-400 transition-all">
                📥 Baixar Material
              </a>
            )}
          </div>

          {/* ÁREA DE FEEDBACK DA AULA (NOVO LAYOUT) */}
          <div className="mt-12 bg-[#1e293b]/50 p-8 rounded-[40px] border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-600/20 p-3 rounded-2xl text-xl">💬</div>
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-widest text-blue-400 leading-none">Avaliar Treinamento</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sua opinião ajuda a Eleva a crescer</p>
              </div>
            </div>
            
            {/* Estrelas Interativas */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <button 
                  key={estrela} 
                  onClick={() => setNota(estrela)}
                  className={`text-2xl transition-all ${nota >= estrela ? 'text-amber-400 scale-110' : 'text-slate-700 hover:text-slate-500'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea 
              className="w-full bg-[#0b121e] border border-slate-800 p-5 rounded-3xl text-sm font-medium outline-none focus:border-blue-500 transition-all min-h-[120px] mb-4 text-slate-300"
              placeholder="Escreva aqui sua dúvida ou o que achou da aula..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            ></textarea>

            <button 
              onClick={enviarComentario}
              disabled={enviando}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {enviando ? 'Enviando...' : 'Publicar Comentário'}
            </button>
          </div>

          <hr className="mt-16 border-slate-800" />
        </div>
      )}

      {/* LISTAGEM POR CATEGORIAS */}
      <div className="space-y-16">
        {categoriasUnicas.map(cat => (
          <div key={cat} className="space-y-6">
            <div className="flex items-center gap-4 ml-2">
              <h3 className="text-sm font-black uppercase text-blue-500 tracking-widest italic underline underline-offset-8 decoration-2">{cat}</h3>
              <div className="h-[1px] flex-1 bg-slate-800 mt-2"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {aulas.filter(a => (a.categoria || 'Geral') === cat).map(aula => (
                <div key={aula.id} onClick={() => { setAulaAtiva(aula); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group cursor-pointer">
                  <div className="relative aspect-video rounded-[30px] overflow-hidden border-2 border-slate-800 group-hover:border-blue-500 group-hover:scale-[1.03] transition-all duration-500">
                    <img src={getThumb(aula.link_video)} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent"></div>
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="font-black text-sm italic uppercase leading-tight group-hover:text-blue-400 transition-colors">
                        {aula.titulo}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}