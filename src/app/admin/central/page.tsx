'use client'

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

interface Lead { 
  id: number; created_at: string; nome_cliente: string; status: string; 
  valor_venda: number; nome_vendedor: string; 
}

interface Curso { 
  id: number; titulo: string; link_video?: string; link_material?: string; 
}

export default function DashboardAdmin() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  
  // Estados Academy
  const [novoCurso, setNovoCurso] = useState({ titulo: '', link: '' });
  const [pdfAula, setPdfAula] = useState<File | null>(null);
  const [loadingAula, setLoadingAula] = useState(false);

  async function loadData() {
    const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    const { data: cursosData } = await supabase.from('cursos').select('*').order('created_at', { ascending: false });
    if (leadsData) setLeads(leadsData);
    if (cursosData) setCursos(cursosData);
  }

  useEffect(() => {
    loadData();
  }, []);

  // --- FUNÇÕES ACADEMY ---
  async function salvarAula() {
    if(!novoCurso.titulo) return alert("Título obrigatório");
    setLoadingAula(true);
    let urlPdf = '';
    
    if (pdfAula) {
      const nomeArq = `aula-${Date.now()}`;
      await supabase.storage.from('materiais').upload(nomeArq, pdfAula);
      const { data } = supabase.storage.from('materiais').getPublicUrl(nomeArq);
      urlPdf = data.publicUrl;
    }

    await supabase.from('cursos').insert([{ titulo: novoCurso.titulo, link_video: novoCurso.link, link_material: urlPdf }]);
    setNovoCurso({titulo: '', link: ''}); setPdfAula(null); setLoadingAula(false);
    loadData();
  }

  async function apagarAula(id: number) {
    if(!confirm("Excluir aula?")) return;
    await supabase.from('cursos').delete().eq('id', id);
    loadData();
  }

  const rankingData = useMemo(() => {
    const stats: Record<string, number> = {};
    leads.forEach(l => {
      if (l.status === 'fechado' && l.nome_vendedor && l.nome_vendedor !== 'Consultor Antigo') {
        stats[l.nome_vendedor] = (stats[l.nome_vendedor] || 0) + Number(l.valor_venda);
      }
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const faturamentoTotal = leads.filter(l => l.status === 'fechado').reduce((acc, curr) => acc + Number(curr.valor_venda), 0);
  const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Eleva <span className="text-blue-400">Central</span></h1>
        <div className="flex gap-4">
           <button onClick={() => router.push('/admin/central/vendedores_todos')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Vendedores</button>
           <button onClick={() => router.push('/admin/central/docs')} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase">Docs</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="space-y-6">
          <div className="bg-cyan-500 p-8 rounded-[35px] shadow-lg shadow-cyan-500/20">
            <p className="text-[10px] font-black uppercase mb-1 opacity-80">Faturamento Mês</p>
            <p className="text-4xl font-black italic">{money(faturamentoTotal)}</p>
          </div>
          <div className="bg-[#1e293b] p-6 rounded-[35px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-orange-500 mb-4 italic">Ranking Vendas</h2>
            {rankingData.map((v, i) => (
              <div key={i} className="flex justify-between text-xs border-b border-slate-800 pb-1 mb-2">
                <span className="font-bold opacity-70">#{i+1} {v.name}</span>
                <span className="font-black text-emerald-400">{money(v.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800">
            <h2 className="text-[10px] font-black uppercase text-blue-400 mb-6 italic">Calendário de Atividade</h2>
            <div className="grid grid-cols-7 gap-3">
              {eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }).map((dia, i) => {
                const temVenda = leads.some(l => isSameDay(new Date(l.created_at), dia) && l.status === 'fechado');
                const estaSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
                return (
                  <div key={i} onMouseEnter={() => setDiaSelecionado(dia)}
                    className={`h-12 rounded-xl flex items-center justify-center text-xs font-black transition-all cursor-pointer border-2 
                      ${temVenda ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#0f172a] border-slate-800 text-slate-700'}
                      ${estaSelecionado ? 'scale-110 border-white z-10' : ''}`}
                  >{dia.getDate()}</div>
                );
              })}
            </div>
          </div>
          <div className="bg-white rounded-[35px] p-6 min-h-[120px] shadow-2xl">
            {diaSelecionado ? (
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs italic mb-3 border-b pb-2">Vendas de {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {leads.filter(l => isSameDay(new Date(l.created_at), diaSelecionado) && l.status === 'fechado').map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-slate-600 font-bold text-xs uppercase">{v.nome_vendedor}</span>
                      <span className="text-emerald-600 font-black text-xs">{money(v.valor_venda)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-slate-400 font-bold uppercase text-[10px] text-center animate-pulse">Passe o mouse no calendário</p>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-[#1e293b] rounded-[40px] p-8 border border-slate-800">
           <h2 className="text-[10px] font-black uppercase text-slate-500 mb-8 italic">Performance Equipe</h2>
           <div className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={rankingData} layout="vertical">
                 <XAxis type="number" hide /><YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} width={80} />
                 <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '15px'}} />
                 <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                    {rankingData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#06b6d4' : '#3b82f6'} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* === ACADEMY (GESTÃO DE AULAS) === */}
      <div className="bg-[#1e293b] rounded-[40px] p-8 border border-slate-800">
         <h2 className="text-xl font-black uppercase text-cyan-400 mb-8 italic tracking-tighter">Eleva Academy</h2>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* NOVO CONTEÚDO */}
            <div className="bg-[#0f172a] p-8 rounded-[35px] border border-slate-800">
               <h3 className="text-sm font-black uppercase text-white mb-6 italic">Novo Conteúdo</h3>
               <div className="space-y-4">
                  <input className="w-full bg-[#1e293b] border border-slate-700 p-4 rounded-2xl text-sm" placeholder="Título da Aula" value={novoCurso.titulo} onChange={e => setNovoCurso({...novoCurso, titulo: e.target.value})} />
                  <input className="w-full bg-[#1e293b] border border-slate-700 p-4 rounded-2xl text-sm" placeholder="Link YouTube" value={novoCurso.link} onChange={e => setNovoCurso({...novoCurso, link: e.target.value})} />
                  <div className="bg-[#1e293b] p-4 rounded-2xl border border-slate-700">
                     <p className="text-[10px] font-black uppercase text-slate-500 mb-2">PDF (Material)</p>
                     <input type="file" onChange={e => setPdfAula(e.target.files ? e.target.files[0] : null)} className="text-xs text-slate-400" />
                  </div>
                  <button onClick={salvarAula} disabled={loadingAula} className="w-full bg-cyan-500 hover:bg-cyan-400 p-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                     {loadingAula ? 'Publicando...' : 'Publicar Conteúdo'}
                  </button>
               </div>
            </div>

            {/* AULAS ATIVAS */}
            <div className="bg-[#0f172a] p-8 rounded-[35px] border border-slate-800">
               <h3 className="text-sm font-black uppercase text-slate-500 mb-6 italic text-center">Aulas Ativas</h3>
               <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {cursos.map(c => (
                     <div key={c.id} className="bg-[#1e293b] p-4 rounded-2xl border border-slate-800 flex justify-between items-center group hover:border-cyan-500/50 transition-colors">
                        <div>
                           <p className="font-bold text-sm uppercase italic">{c.titulo}</p>
                           <div className="flex gap-2 mt-1">
                              {c.link_video && <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black">VÍDEO</span>}
                              {c.link_material && <span className="text-[8px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-black">PDF</span>}
                           </div>
                        </div>
                        <button onClick={() => apagarAula(c.id)} className="bg-[#0f172a] w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-red-500 transition-colors shadow-inner">🗑️</button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}