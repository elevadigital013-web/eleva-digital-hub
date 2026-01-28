'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ModeracaoComentarios() {
  const router = useRouter();
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadComentarios() {
    const { data } = await supabase
      .from('comentarios_academy')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setComentarios(data);
    setLoading(false);
  }

  async function apagarComentario(id: number) {
    if (!confirm("Deseja realmente apagar este comentário?")) return;
    
    const { error } = await supabase.from('comentarios_academy').delete().eq('id', id);
    if (!error) loadComentarios();
  }

  useEffect(() => { loadComentarios(); }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      {/* NAVEGAÇÃO SUPERIOR */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-xl font-black italic text-blue-500 uppercase">Eleva <span className="text-white">Central</span></h1>
        <div className="flex gap-4">
          <button onClick={() => router.push('/admin/central')} className="text-[10px] font-black uppercase text-slate-500">Dashboard</button>
          <button onClick={() => router.push('/admin/central/academy')} className="text-[10px] font-black uppercase text-slate-500">Academy</button>
          <button className="text-[10px] font-black uppercase text-orange-500 border-b-2 border-orange-500 pb-1">Moderação</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-black text-center italic uppercase mb-10 tracking-widest text-orange-500">
          Moderação de Comentários
        </h2>

        <div className="space-y-6">
          {comentarios.length === 0 && !loading && (
            <p className="text-center text-slate-600 italic py-20">Nenhum comentário pendente de moderação.</p>
          )}

          {comentarios.map((item) => (
            <div key={item.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 shadow-xl flex justify-between items-center group hover:border-blue-500/30 transition-all">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-600 text-[9px] font-black px-3 py-1 rounded-full uppercase italic">
                    {item.aula_titulo}
                  </span>
                  <div className="text-amber-400 text-xs">
                    {'★'.repeat(item.estrelas)}{'☆'.repeat(5 - item.estrelas)}
                  </div>
                </div>
                
                <p className="text-sm font-bold italic text-slate-200 mb-2">
                  "{item.comentario}"
                </p>
                
                <p className="text-[9px] font-black text-slate-500 uppercase">
                  Por: {item.vendedor_nome} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* BOTÃO APAGAR ESTILO PRINT */}
              <button 
                onClick={() => apagarComentario(item.id)}
                className="ml-4 flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-2xl transition-all font-black text-[10px] uppercase group-hover:scale-105"
              >
                <span>🗑️</span>
                APAGAR
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}