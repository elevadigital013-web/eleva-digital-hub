'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';
import { Toast } from '@/components/Toast'; // <--- IMPORTADO AGORA!

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  const [vendedorNome, setVendedorNome] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo');

  useEffect(() => {
    async function getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setVendedorId(user.id);
            // Puxa o nome real do vendedor do banco ou metadado
            setVendedorNome(user.user_metadata?.nome || user.email?.split('@')[0] || 'Consultor');
        } else {
            router.push('/');
        }
    }
    getUser();
  }, [router]);

  async function handleSalvar() {
    if (!nome) return setToast({ msg: "Nome do cliente obrigatório!", type: 'error' });
    
    setLoading(true);
    const valorNumerico = valor ? parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) : 0;

    const { error } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_vendedor: vendedorNome, // Garante que o Admin veja o nome
      nome_cliente: nome,
      telefone: telefone, // Salva o WhatsApp para o vendedor usar depois
      valor_venda: valorNumerico,
      status: status
    }]);

    if (error) {
      setToast({ msg: "Erro ao salvar no banco.", type: 'error' });
      setLoading(false);
    } else {
      setToast({ msg: "Registro concluído com sucesso! 🚀", type: 'success' });
      setTimeout(() => router.push('/vendedor'), 1500);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 flex flex-col justify-center">
      {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({ ...toast, msg: '' })} />}
      
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl">
        <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 uppercase mb-4">← Voltar</button>
        <h1 className="text-2xl font-black italic text-slate-900 uppercase">Novo Registro</h1>
        <p className="text-[10px] font-bold text-blue-500 mb-6 uppercase">Vendedor: {vendedorNome}</p>

        <div className="space-y-4">
          <input type="text" placeholder="Nome do Cliente" className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none" value={nome} onChange={e => setNome(e.target.value)} />
          <input type="text" placeholder="WhatsApp (DDD + Número)" className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none" value={telefone} onChange={e => setTelefone(e.target.value)} />
          <NumericFormat className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none" placeholder="Valor (R$)" thousandSeparator="." decimalSeparator="," prefix="R$ " value={valor} onChange={e => setValor(e.target.value)} />
          
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${status === 'novo' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${status === 'fechado' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Venda</button>
          </div>

          <button onClick={handleSalvar} disabled={loading} className="w-full p-4 rounded-2xl bg-slate-900 text-white font-black uppercase shadow-lg">
            {loading ? 'Salvando...' : 'Confirmar Registro'}
          </button>
        </div>
      </div>
    </div>
  );
}