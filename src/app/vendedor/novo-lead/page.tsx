'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoLead() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', telefone: '', valor: '', obs: '' });
  const [loading, setLoading] = useState(false);

  const salvar = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // 1. Salvar Lead
      await supabase.from('leads').insert([{
        nome_cliente: form.nome,
        telefone: form.telefone, // Garante que salva na coluna telefone
        valor_venda: form.valor,
        status: 'fechado',
        vendedor_id: user.id
      }]);

      // 2. Salvar Log com Nome correto
      const nomeVendedor = user.user_metadata?.nome || 'Vendedor';
      await supabase.from('logs_atividades').insert([{
        vendedor_id: user.id,
        vendedor_nome: nomeVendedor, // AQUI ESTÁ A CORREÇÃO DO LOG
        acao: `fechou venda de R$ ${form.valor} com ${form.nome}`,
        created_at: new Date()
      }]);

      alert('Venda registrada com sucesso!');
      router.push('/vendedor/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <h1 className="text-2xl font-black text-slate-900 mb-8 italic uppercase">Nova Venda</h1>
      <div className="bg-white p-8 rounded-[40px] shadow-xl space-y-4">
        <input className="w-full bg-slate-50 p-4 rounded-2xl border" placeholder="Nome do Cliente" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
        <input className="w-full bg-slate-50 p-4 rounded-2xl border" placeholder="WhatsApp / Contato" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
        <input className="w-full bg-slate-50 p-4 rounded-2xl border" type="number" placeholder="Valor da Venda (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} />
        <textarea className="w-full bg-slate-50 p-4 rounded-2xl border" placeholder="Observações" value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} />
        
        <button onClick={salvar} disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase italic">
          {loading ? 'Salvando...' : 'Confirmar Venda'}
        </button>
      </div>
    </div>
  );
}