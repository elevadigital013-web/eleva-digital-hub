'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // Importado

export default function ModeracaoAdmin() {
  const router = useRouter();
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  async function load() {
    const { data } = await supabase.from('comentarios_aula').select('*, cursos(titulo)').order('created_at', { ascending: false });
    if (data) setComentarios(data);
  }

  useEffect(() => { load(); }, []);

  async function apagar(id: number) {
    if(!confirm("Apagar comentário?")) return;
    const { error } = await supabase.from('comentarios_aula').delete().eq('id', id);
    if (!error) {
        setToast({ msg: "Comentário removido.", type: 'success' });
        load();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      
      <button onClick={() => router.push('/admin/central/dashboard')} className="text-[10px] font-black uppercase mb-8 opacity-50">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-12 text-center text-orange-500">Moderação</h1>
      
      <div className="max-w-4xl mx-auto space-y-4">
        {comentarios.map((c) => (
          <div key={c.id} className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-orange-500/30">
            <div className="flex-1">
              <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full uppercase italic mb-2 inline-block">{c.cursos?.titulo}</span>
              <p className="text-white font-bold text-sm italic">"{c.comentario}"</p>
              <p className="text-[10px] text-slate-500 uppercase font-black mt-1">POR: {c.nome_usuario}</p>
            </div>
            <button onClick={() => apagar(c.id)} className="text-red-500 font-black text-[10px] uppercase p-4">Apagar</button>
          </div>
        ))}
      </div>
    </div>
  );
}