'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast'; // Agora vai funcionar!

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Estado para controlar a notificação
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone: '',
    valor_venda: '',
    obs: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setToast({ msg: 'Erro: Faça login novamente.', type: 'error' });
      setLoading(false);
      return;
    }

    // Remove R$ e pontos para salvar como numero
    const valorLimpo = formData.valor_venda.toString().replace('R$', '').replace(/\./g, '').replace(',', '.');
    const valorFinal = parseFloat(valorLimpo) || 0;

    const { error } = await supabase.from('leads').insert([{
      vendedor_id: user.id,
      nome_cliente: formData.nome_cliente,
      telefone: formData.telefone,
      valor_venda: valorFinal,
      obs: formData.obs,
      status: 'aberto'
    }]);

    if (error) {
      setToast({ msg: 'Erro ao salvar venda.', type: 'error' });
    } else {
      setToast({ msg: 'Venda registrada com sucesso! 🚀', type: 'success' });
      setFormData({ nome_cliente: '', telefone: '', valor_venda: '', obs: '' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans relative">
      {/* Aqui está o componente visual */}
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      <div className="flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="text-blue-600 font-black text-xs uppercase tracking-widest">← Voltar</button>
        <h1 className="text-xl font-black italic text-slate-900 uppercase">Novo Registro</h1>
      </div>

      <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4 mb-1 block">Cliente</label>
            <input type="text" required className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formData.nome_cliente} onChange={e => setFormData({...formData, nome_cliente: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4 mb-1 block">WhatsApp</label>
            <input type="text" required placeholder="(13) 99999-9999" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4 mb-1 block">Valor (R$)</label>
            <input type="text" required placeholder="0,00" className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-all" value={formData.valor_venda} onChange={e => setFormData({...formData, valor_venda: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-blue-200 mt-6 disabled:opacity-50">
            {loading ? 'Salvando...' : 'Registrar Venda 🔥'}
          </button>
        </form>
      </div>
    </div>
  );
}