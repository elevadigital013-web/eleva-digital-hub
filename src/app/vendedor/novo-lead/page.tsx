'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';
import { Toast } from '@/components/Toast';

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  const [vendedorNome, setVendedorNome] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });

  // CAMPOS
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo');

  useEffect(() => {
    async function getUser() {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            setVendedorId(data.user.id);
            // Pega o nome do login ou usa um padrão
            setVendedorNome(data.user.user_metadata?.nome || 'Consultor');
        } else {
            router.push('/');
        }
    }
    getUser();
  }, [router]);

  async function handleSalvar() {
    if (!nome) return setToast({ msg: "Nome do cliente obrigatório!", type: 'error' });
    if (status === 'fechado' && !valor) return setToast({ msg: "Informe o valor da venda!", type: 'error' });

    setLoading(true);

    const valorNumerico = valor ? parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) : 0;

    // 1. SALVA O LEAD COM O NOME DO VENDEDOR (Agora sem depender de outra tabela)
    const { error } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_vendedor: vendedorNome, // <--- SALVANDO O NOME AQUI
      nome_cliente: nome,
      telefone: telefone,
      valor_venda: valorNumerico,
      status: status
    }]);

    if (error) {
      console.error(error);
      setToast({ msg: "Erro ao salvar.", type: 'error' });
      setLoading(false);
      return;
    }

    // 2. CRIA O LOG
    const acao = status === 'fechado' 
        ? `fechou venda de ${formatarMoeda(valorNumerico)} com ${nome}` 
        : `cadastrou lead: ${nome}`;

    await supabase.from('logs_atividades').insert([{
        vendedor_nome: vendedorNome,
        acao: acao,
        valor: valorNumerico
    }]);

    setToast({ msg: "Salvo com sucesso!", type: 'success' });
    setTimeout(() => router.push('/vendedor'), 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center relative">
      {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({ ...toast, msg: '' })} />}
      
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-xl">
        <button onClick={() => router.back()} className="text-xs font-black text-slate-400 uppercase mb-6">← Cancelar</button>
        <h1 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Novo Registro</h1>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 mt-6">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>📝 Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>💰 Venda</button>
        </div>

        <div className="space-y-4">
          <input type="text" placeholder="Nome do Cliente" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none" value={nome} onChange={e => setNome(e.target.value)} />
          <input type="text" placeholder="WhatsApp / Contato" className="w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none" value={telefone} onChange={e => setTelefone(e.target.value)} />
          <NumericFormat className={`w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none ${status === 'fechado' ? 'border-emerald-200 text-emerald-700' : ''}`} placeholder={status === 'fechado' ? "Valor (R$)" : "Valor (Opcional)"} thousandSeparator="." decimalSeparator="," prefix="R$ " value={valor} onChange={e => setValor(e.target.value)} />
          
          <button onClick={handleSalvar} disabled={loading} className={`w-full p-4 rounded-2xl font-black uppercase text-white shadow-lg mt-2 ${status === 'fechado' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
