'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone: '',
    servico: 'Criação de Site',
    valor_venda: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      const valorFinal = parseFloat(formData.valor_venda) || 0;
      const statusFinal = valorFinal > 0 ? 'fechado' : 'aberto';

      const { error } = await supabase.from('leads').insert([
        { 
          nome_cliente: formData.nome_cliente,
          telefone: formData.telefone,
          servico: formData.servico,
          status: statusFinal,
          valor_venda: valorFinal,
          vendedor_id: user?.id || null
        }
      ]);

      if (error) throw error;
      alert('Registrado com sucesso na Eleva Digital!');
      router.push('/vendedor/dashboard');
      
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-md mx-auto bg-white p-8 rounded-[30px] shadow-xl border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-6">Novo Registro <br/><span className="text-blue-600 uppercase text-sm italic">Eleva Digital</span></h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Cliente</label>
            <input type="text" required className="w-full px-5 py-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-bold" placeholder="Nome da empresa" value={formData.nome_cliente} onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">WhatsApp</label>
            <input type="tel" required className="w-full px-5 py-4 bg-slate-50 rounded-xl outline-none focus:ring-2 ring-blue-500 font-bold" placeholder="(13) 99999-9999" value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Serviço</label>
            <select className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold appearance-none outline-none focus:ring-2 ring-blue-500" value={formData.servico} onChange={(e) => setFormData({...formData, servico: e.target.value})}>
              <option value="Criação de Site">Criação de Site</option>
              <option value="Landing Page">Landing Page</option>
              <option value="Tráfego Pago">Gestão de Tráfego</option>
              <option value="Identidade Visual">Identidade Visual</option>
            </select>
          </div>

          <div className="bg-blue-50 p-5 rounded-2xl">
            <label className="block text-[10px] font-black uppercase text-blue-500 mb-1">Valor do Contrato (R$)</label>
            <input type="number" step="0.01" className="w-full bg-transparent text-xl font-black outline-none border-b-2 border-blue-200 focus:border-blue-600" placeholder="0,00" value={formData.valor_venda} onChange={(e) => setFormData({...formData, valor_venda: e.target.value})} />
            <p className="text-[8px] text-blue-400 font-black mt-2 uppercase tracking-widest">* Lançar apenas se a venda foi fechada.</p>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all">
            {loading ? 'SALVANDO...' : 'CONFIRMAR REGISTRO'}
          </button>
        </form>
      </div>
    </div>
  );
}