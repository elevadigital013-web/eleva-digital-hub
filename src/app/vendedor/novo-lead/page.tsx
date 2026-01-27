'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nome_cliente: '', telefone: '', servico: 'Criação de Site', valor_venda: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const valor = Number(formData.valor_venda) || 0;
    const status = valor > 0 ? 'fechado' : 'aberto';

    const { error } = await supabase.from('leads').insert([{ 
      nome_cliente: formData.nome_cliente, 
      telefone: formData.telefone, 
      servico: formData.servico, 
      status, 
      valor_venda: valor, 
      vendedor_id: user?.id 
    }]);

    if (!error) {
      await supabase.from('logs_atividades').insert([{
        vendedor_id: user?.id,
        vendedor_nome: user?.user_metadata?.nome || 'Consultor',
        acao: 'CADASTRO_LEAD',
        detalhes: `Cliente: ${formData.nome_cliente} | Valor: ${valor}`
      }]);
      setShowModal(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex items-center justify-center">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Sucesso Total!</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase mb-8 tracking-widest">A Eleva Digital agradece!</p>
            <button onClick={() => router.push('/vendedor/dashboard')} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg">VOLTAR</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-[35px] shadow-xl space-y-5">
        <h1 className="text-2xl font-black tracking-tighter mb-4">Novo Registro <br/><span className="text-blue-600 uppercase text-[10px] tracking-[0.3em]">Eleva Digital</span></h1>
        <input type="text" required placeholder="Nome do Cliente" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold" value={formData.nome_cliente} onChange={e => setFormData({...formData, nome_cliente: e.target.value})} />
        <input type="tel" required placeholder="WhatsApp" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
        <select className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none" value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})}>
          <option value="Criação de Site">Criação de Site</option>
          <option value="Landing Page">Landing Page</option>
          <option value="Tráfego Pago">Gestão de Tráfego</option>
        </select>
        <div className="bg-blue-50 p-5 rounded-2xl">
          <label className="text-[10px] font-black text-blue-500 uppercase">Valor do Contrato (R$)</label>
          <input type="number" step="0.01" className="w-full bg-transparent text-xl font-black outline-none border-b border-blue-200" value={formData.valor_venda} onChange={e => setFormData({...formData, valor_venda: e.target.value})} />
        </div>
        <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl">{loading ? '...' : 'CONFIRMAR'}</button>
      </form>
    </div>
  );
}