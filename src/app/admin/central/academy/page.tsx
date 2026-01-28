'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

export default function AcademyAdmin() {
  const router = useRouter();
  const [cursos, setCursos] = useState<any[]>([]);
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '', categoria: 'Vendas' });
  const [pdfAula, setPdfAula] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  async function load() {
    const { data } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if(data) setCursos(data);
  }

  useEffect(() => { load(); }, []);

  async function salvar() {
    if(!novoCurso.titulo) return setToast({ msg: "Título obrigatório!", type: 'error' });
    setLoading(true);
    
    let urlPdf = '';
    if (pdfAula) {
      const nome = `aula-${Date.now()}`;
      await supabase.storage.from('materiais').upload(nome, pdfAula);
      const { data } = supabase.storage.from('materiais').getPublicUrl(nome);
      urlPdf = data.publicUrl;
    }

    // Inserindo com a nova propriedade de categoria
    const { error } = await supabase.from('cursos').insert([{ 
      titulo: novoCurso.titulo, 
      link_video: novoCurso.link, 
      link_material: urlPdf,
      categoria: novoCurso.categoria 
    }]);

    setLoading(false);

    if (error) {
      setToast({ msg: "Erro ao publicar conteúdo.", type: 'error' });
    } else {
      setToast({ msg: "Conteúdo publicado! 🚀", type: 'success' });
      // Resetando o formulário com a categoria padrão
      setNovoCurso({ titulo: '', link: '', categoria: 'Vendas' }); 
      setPdfAula(null);
      load();
    }
  }

  async function apagar(id: number) {
    if(!confirm("Excluir aula?")) return;
    const { error } = await supabase.from('cursos').delete().eq('id', id);
    if (!error) { setToast({ msg: "Aula removida.", type: 'success' }); load(); }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      
      <button onClick={() => router.push('/admin/central')} className="text-[10px] font-black uppercase mb-8 opacity-50 hover:opacity-100 transition-opacity">
        ← Voltar
      </button>

      <h1 className="text-2xl font-black italic uppercase mb-10 text-purple-400">Eleva Academy</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* FORMULÁRIO DE CADASTRO */}
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 space-y-4">
           <h3 className="text-xs font-black uppercase italic mb-4 text-purple-300">Novo Vídeo/Material</h3>
           
           <input 
            className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-purple-500" 
            placeholder="Título da Aula" 
            value={novoCurso.titulo} 
            onChange={e=>setNovoCurso({...novoCurso, titulo: e.target.value})} 
           />

           <input 
            className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-purple-500" 
            placeholder="ID do YouTube (ex: dQw4w9WgXcQ)" 
            value={novoCurso.link} 
            onChange={e=>setNovoCurso({...novoCurso, link: e.target.value})} 
           />

           {/* SELETOR DE CATEGORIA */}
           <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Categoria</label>
             <select 
               className="w-full bg-[#0f172a] p-4 rounded-2xl border border-slate-800 text-white outline-none focus:border-purple-500 font-bold"
               value={novoCurso.categoria}
               onChange={e => setNovoCurso({...novoCurso, categoria: e.target.value})}
             >
               <option value="Vendas">Vendas</option>
               <option value="Produto">Produto</option>
               <option value="Mentalidade">Mentalidade</option>
               <option value="Processos">Processos</option>
             </select>
           </div>

           <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
             <p className="text-[9px] font-black text-slate-500 uppercase mb-2">PDF Material</p>
             <input type="file" onChange={e=>setPdfAula(e.target.files?.[0] || null)} className="text-xs text-slate-400" />
           </div>

           <button 
            onClick={salvar} 
            disabled={loading} 
            className="w-full bg-purple-600 hover:bg-purple-500 p-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-purple-900/20"
           >
            {loading ? 'Publicando...' : 'Publicar Conteúdo'}
           </button>
        </div>

        {/* LISTAGEM DE AULAS */}
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800">
           <h3 className="text-xs font-black uppercase italic mb-4 text-slate-500">Aulas Ativas</h3>
           <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {cursos.map(c => (
                <div key={c.id} className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-purple-500/50 transition-all">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm uppercase italic">{c.titulo}</span>
                    <span className="text-[8px] font-black uppercase text-purple-500/70 tracking-tighter">
                      {c.categoria || 'Sem Categoria'}
                    </span>
                  </div>
                  <button onClick={() => apagar(c.id)} className="text-slate-600 hover:text-red-500 transition-colors p-2">
                    🗑️
                  </button>
                </div>
              ))}
              {cursos.length === 0 && <p className="text-center text-slate-600 text-xs italic py-10">Nenhuma aula cadastrada ainda.</p>}
           </div>
        </div>
      </div>
    </div>
  );
}