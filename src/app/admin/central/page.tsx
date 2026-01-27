'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // Importação corrigida

export default function AdminCentral() {
  const router = useRouter();
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });
  const [leads, setLeads] = useState<any[]>([]);

  // Carregar dados (simplificado para exemplo)
  async function loadData() {
    const { data } = await supabase.from('leads').select(`*, vendedores(nome)`).order('created_at', { ascending: false });
    if (data) setLeads(data);
  }
  useEffect(() => { loadData(); }, []);

  const salvarCurso = async () => {
    if (!novoCurso.titulo || !novoCurso.link) {
      setToast({ msg: 'Preencha todos os campos!', type: 'error' });
      return;
    }
    const { error } = await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link }]);
    if (error) {
      setToast({ msg: 'Erro ao salvar.', type: 'error' });
    } else {
      setToast({ msg: 'Curso publicado! 🎓', type: 'success' }); // Toast em vez de alert
      setNovoCurso({ titulo: '', link: '' });
    }
  };

  // Renderização da ABA CURSOS
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white relative">
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
        <button onClick={() => setAba('dashboard')} className="mb-8 font-black text-blue-600 uppercase text-xs">← Voltar</button>
        <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-[40px] border border-slate-800">
          <h2 className="text-xl font-black italic mb-6 text-center uppercase">Nova Aula</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Título" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
            <input type="text" placeholder="Link do Vídeo" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
            <button onClick={salvarCurso} className="w-full bg-blue-600 p-4 rounded-2xl font-black uppercase hover:bg-blue-500">Publicar</button>
          </div>
        </div>
      </div>
    );
  }

  // Renderização PADRÃO (Dashboard)
  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 relative">
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-blue-500">ELEVA CENTRAL</h1>
        <button onClick={() => setAba('cursos')} className="bg-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">＋ Academy</button>
      </div>
      
      {/* Seus cards de leads aqui... */}
      <div className="bg-slate-900 p-6 rounded-[30px] border border-slate-800">
         <h2 className="text-[10px] font-black uppercase text-slate-500 mb-4">Leads Recentes</h2>
         {leads.map(l => (
             <div key={l.id} className="mb-2 p-2 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                 <span className="font-bold text-sm">{l.nome_cliente}</span>
                 <span className="text-xs text-blue-500 font-black">{formatCurrency(l.valor_venda)}</span>
             </div>
         ))}
      </div>
    </div>
  );
}