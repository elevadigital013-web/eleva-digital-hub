'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Curso { id: number; titulo: string; link_video?: string; link_material?: string; }

export default function AcademyAdmin() {
  const router = useRouter();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [pdfAula, setPdfAula] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if(data) setCursos(data);
  }

  useEffect(() => { load(); }, []);

  async function salvar() {
    if(!novoCurso.titulo) return;
    setLoading(true);
    let urlPdf = '';
    if (pdfAula) {
      const nome = `aula-${Date.now()}`;
      await supabase.storage.from('materiais').upload(nome, pdfAula);
      const { data } = supabase.storage.from('materiais').getPublicUrl(nome);
      urlPdf = data.publicUrl;
    }
    await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link, link_material: urlPdf }]);
    setNovoCurso({titulo:'', link:''}); setPdfAula(null); setLoading(false);
    load();
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <button onClick={() => router.back()} className="text-[10px] font-black uppercase mb-8 opacity-50">← Voltar</button>
      <h1 className="text-2xl font-black italic uppercase mb-10 text-purple-400">Gestão Eleva Academy</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 space-y-4">
           <h3 className="text-xs font-black uppercase italic mb-4">Nova Aula</h3>
           <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="Título" value={novoCurso.titulo} onChange={e=>setNovoCurso({...novoCurso, titulo: e.target.value})} />
           <input className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800" placeholder="YouTube Link" value={novoCurso.link} onChange={e=>setNovoCurso({...novoCurso, link: e.target.value})} />
           <input type="file" onChange={e=>setPdfAula(e.target.files?.[0] || null)} className="text-xs text-slate-400" />
           <button onClick={salvar} disabled={loading} className="w-full bg-purple-600 p-4 rounded-2xl font-black uppercase text-xs">{loading ? '...' : 'Publicar'}</button>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800">
           <h3 className="text-xs font-black uppercase italic mb-4">Aulas Ativas</h3>
           <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {cursos.map(c => (
                <div key={c.id} className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-sm uppercase italic">{c.titulo}</span>
                  <button onClick={async () => { if(confirm("Apagar?")) { await supabase.from('cursos').delete().eq('id', c.id); load(); } }} className="text-slate-600 hover:text-red-500">🗑️</button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}