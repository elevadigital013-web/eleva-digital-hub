'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedor, setVendedor] = useState<any>(null);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone: '',
    servico: 'Landing Page',
    valor_venda: '',
    status: 'aberto'
  });

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setVendedor(user);
    }
    getUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Salvar o Lead na tabela 'leads'
      const { error: leadError } = await supabase.from('leads').insert([{
        nome_cliente: formData.nome_cliente,
        telefone: formData.telefone, // Garante que salva na coluna certa
        servico: formData.servico,
        valor_venda: formData.status === 'fechado' ? Number(formData.valor_venda) : 0,
        status: formData.status,
        vendedor_id: vendedor.id,
        pago: false
      }]);

      if (leadError) throw leadError;

      // 2. Salvar o Log com o NOME REAL do vendedor
      const nomeVendedor = vendedor.user_metadata?.nome || 'Consultor';
      
      await supabase.from('logs_atividades').insert([{
        vendedor_nome: nomeVendedor, // Aqui resolvemos o problema do "CONSULTOR"
        acao: formData.status === 'fechado' ? 'FECHOU_VENDA' : 'CADASTRO_LEAD',
        detalhes: `Cliente: ${formData.nome_cliente} | Valor: ${formData.valor_venda}`
      }]);

      alert('Sucesso! Registro salvo na Eleva Digital.');
      router.push('/vendedor/dashboard');

    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <header className="mb-8">
        <button onClick={() => router.back()} className="text-blue-600 font-black text-xs uppercase tracking-widest mb-4">← Voltar</button>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">Novo Registro <br/><span className="text-blue-600">Eleva Digital</span></h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Nome do Cliente / Empresa</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Padaria do Zé"
              onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">WhatsApp de Contato</label>
            <input 
              required
              type="tel" 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-medium"
              placeholder="(13) 99999-9999"
              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Serviço</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-800 font-bold"
              onChange={(e) => setFormData({...formData, servico: e.target.value})}
            >
              <option>Landing Page</option>
              <option>Site Institucional</option>
              <option>Gestão de Tráfego</option>
              <option>Google Meu Negócio</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic tracking-widest">Status Inicial</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'aberto'})}
                className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.status === 'aberto' ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                Lead Aberto
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, status: 'fechado'})}
                className={`p-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
              >
                Venda Fechada
              </button>
            </div>
          </div>

          {formData.status === 'fechado' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <label className="text-[10px] font-black uppercase text-blue-600 ml-2 italic tracking-widest">Valor da Venda (R$)</label>
              <input 
                required
                type="number" 
                className="w-full bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 text-blue-600 font-black text-xl"
                placeholder="0.00"
                onChange={(e) => setFormData({...formData, valor_venda: e.target.value})}
              />
            </div>
          )}
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-slate-900 text-white p-6 rounded-[30px] font-black uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'FINALIZAR REGISTRO 🔥'}
        </button>
      </form>
    </div>
  );
}