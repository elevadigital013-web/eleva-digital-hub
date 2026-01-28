'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Comentario {
  id: number;
  created_at: string;
  nome_usuario: string;
  comentario: string;
  nota: number;
  cursos: { titulo: string };
}

export default function ModeracaoAdmin() {
  const router = useRouter();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  // --- CARREGAR COMENTÁRIOS ---
  async function load() {
    const { data } = await supabase
      .from('comentarios_aula')
      .select('*, cursos(titulo)')
      .order('created_at', { ascending: false });
    
    if (data) setComentarios(data as any);
  }

  useEffect(() => { load(); }, []);

  // --- FUNÇÃO PARA APAGAR ---
  async function apagar(id: number) {
    if (!confirm("Deseja remover este comentário permanentemente?")) return;
    
    const { error } = await supabase
      .from('comentarios_aula')
      .delete()
      .eq('id', id);

    if (!error) load();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <button 
        onClick={() => router.back()} 
        className="text-[10px] font-black uppercase mb-8 opacity-50 hover:opacity-100 transition-opacity"
      >
        ← Voltar ao Dashboard
      </button>

      <h1 className="text-2xl font-black italic uppercase mb-12 text-center tracking-tighter">
        Moderação de <span className="text-orange-500">Comentários</span>
      </h1>

      <div className="max-w-4xl mx-auto space-y-4">
        {comentarios.length === 0 && (
          <p className="text-center text-slate-500 italic text-sm">Nenhum comentário para moderar no momento.</p>
        )}

        {comentarios.map((c) => (
          <div 
            key={c.id} 
            className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-orange-500/30 transition-all"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full uppercase italic">
                  {c.cursos?.titulo || 'Aula'}
                </span>
                <span className="text-orange-400 text-xs font-bold">
                  {'★'.repeat(c.nota)}
                </span>
              </div>
              
              <p className="text-white font-bold text-sm mb-2 italic">"{c.comentario}"</p>
              
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                POR: {c.nome_usuario} • {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>

            <button 
              onClick={() => apagar(c.id)}
              className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2"
            >
              <span>🗑️</span> APAGAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}