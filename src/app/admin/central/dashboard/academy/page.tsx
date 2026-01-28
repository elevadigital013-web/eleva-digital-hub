'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // Importado

export default function AcademyAdmin() {
  const router = useRouter();
  const [cursos, setCursos] = useState<any[]>([]);
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [pdfAula, setPdfAula] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  async function load() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if(data) setCursos(data);
  }

  useEffect(() => { load(); }, []);

  async function salvar() {
    if(!novoCurso.titulo) return setToast({ msg: "Título é obrigatório!", type: 'error' });
    setLoading(true);
    let urlPdf = '';
    if (pdfAula) {
      const nome = `aula-${Date.now()}`;
      await supabase.storage.from('materiais').upload(nome, pdfAula);
      const { data } = supabase.storage.from('materiais').getPublicUrl(nome);
      urlPdf = data.publicUrl;
    }
    const { error } = await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link, link_material: urlPdf }]);
    
    setLoading(false);
    if (error) {
        setToast({ msg: "Erro ao salvar curso.", type: 'error' });
    } else {
        setToast({ msg: "Conteúdo publicado com sucesso! 🚀", type: 'success' });
        setNovoCurso({titulo:'', link:''}); setPdfAula(null);
        load();
    }
  }

  async function apagar(id: number) {
    if(!confirm("Apagar esta aula?")) return;
    const { error } = await supabase.from('cursos').delete().eq('id', id);
    if (!error) {
        setToast({ msg: "Aula removida.", type: 'success' });
        load();
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      
      <button onClick={() => router.push('/admin/central/dashboard')} className="text-[10px] font-black uppercase mb-8 opacity-50">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-10 text-purple-400">Eleva Academy</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 space-y-4">
           <h3 className="text-xs font-black uppercase italic mb-4">Nova Aula</h3>
           <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-purple-500" placeholder="Título" value={novoCurso.titulo} onChange={e=>setNovoCurso({...novoCurso, titulo: e.target.value})} />
           <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-purple-500" placeholder="Link YouTube" value={novoCurso.link} onChange={e=>setNovoCurso({...novoCurso, link: e.target.value})} />
           <input type="file" onChange={e=>setPdfAula(e.target.files?.[0] || null)} className="text-xs text-slate-400" />
           <button onClick={salvar} disabled={loading} className="w-full bg-purple-600 p-4 rounded-2xl font-black uppercase text-xs">{loading ? '...' : 'Publicar'}</button>
        </div>
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800">
           <h3 className="text-xs font-black uppercase italic mb-4 text-slate-500">Aulas Ativas</h3>
           <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {cursos.map(c => (
                <div key={c.id} className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm uppercase italic">{c.titulo}</span>
                  <button onClick={() => apagar(c.id)} className="text-slate-600 hover:text-red-500">🗑️</button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}