'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // <--- Importamos o Toast

export default function AdminCentral() {
  const router = useRouter();
  const [aba, setAba] = useState<'dashboard' | 'docs' | 'cursos'>('dashboard');
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' }); // Estado do Toast
  const [leads, setLeads] = useState<any[]>([]);

  // ... (mantenha sua função loadData aqui) ...

  const salvarCurso = async () => {
    if (!novoCurso.titulo || !novoCurso.link) {
      setToast({ msg: 'Preencha todos os campos!', type: 'error' });
      return;
    }
    
    const { error } = await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link }]);
    
    if (error) {
      setToast({ msg: 'Erro ao salvar curso.', type: 'error' });
    } else {
      // SUCESSO ELEGANTE NO ADMIN TAMBÉM
      setToast({ msg: 'Curso publicado com sucesso! 🎓', type: 'success' });
      setNovoCurso({ titulo: '', link: '' });
    }
  };

  // ... (mantenha o resto dos if(aba === 'docs') etc.) ...

  // Dentro do if(aba === 'cursos'), adicione o componente:
  if (aba === 'cursos') {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white relative">
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
        {/* ... resto do código da aba cursos ... */}
          <button onClick={salvarCurso} className="...">Publicar Aula</button>
        {/* ... */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative">
       {/* Adicione o Toast no return principal também, caso precise de notificações no dashboard */}
       <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />
       
       {/* ... resto do seu código ... */}
    </div>
  );
}