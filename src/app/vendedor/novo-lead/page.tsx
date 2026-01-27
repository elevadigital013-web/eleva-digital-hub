'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';
import { Toast } from '@/components/Toast';

// Função auxiliar para formatar moeda (evita erros de importação)
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  const [vendedorNome, setVendedorNome] = useState('');
  
  // Estado para a notificação (Toast)
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' | '' });

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo');

  useEffect(() => {
    async function getUser() {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
            setVendedorId(data.user.id);
            setVendedorNome(data.user.user_metadata?.nome || 'Vendedor');
        } else {
            router.push('/');
        }
    }
    getUser();
  }, [router]);

  async function handleSalvar() {
    // 1. Validações visuais (sem alert feio)
    if (!nome) {
        setToast({ msg: "O nome do cliente é obrigatório!", type: 'error' });
        return;
    } 
    if (status === 'fechado' && !valor) {
        setToast({ msg: "Para fechar a venda, informe o valor!", type: 'error' });
        return;
    }

    setLoading(true);

    const valorNumerico = valor 
      ? parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) 
      : 0;

    // 2. Salvar o Lead no Banco
    const { error: leadError } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_cliente: nome,
      telefone: telefone,
      valor_venda: valorNumerico,
      status: status
    }]);

    if (leadError) {
      console.error(leadError);
      setToast({ msg: "Erro ao salvar. Verifique sua conexão.", type: 'error' });
      setLoading(false);
      return;
    }

    // 3. Criar o Log de Atividade
    let acaoLog = '';
    if (status === 'fechado') {
        acaoLog = `fechou venda de ${formatarMoeda(valorNumerico)} com: ${nome}`;
    } else {
        acaoLog = `cadastrou novo lead: ${nome}`;
    }

    await supabase.from('logs_atividades').insert([{
        vendedor_id: vendedorId,
        vendedor_nome: vendedorNome,
        acao: acaoLog,
        valor: valorNumerico
    }]);

    // 4. Sucesso e Redirecionamento
    if (status === 'fechado') {
        setToast({ msg: "Venda registrada! Parabéns! 🚀", type: 'success' });
    } else {
        setToast({ msg: "Lead cadastrado com sucesso! 📝", type: 'success' });
    }
    
    // Aguarda 2 segundos para ler a mensagem e volta pro painel
    setTimeout(() => {
        router.push('/vendedor');
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex flex-col justify-center relative">
      
      {/* Componente de Mensagem Bonita */}
      {toast.msg && (
        <Toast 
            message={toast.msg} 
            type={toast.type === 'error' ? 'error' : 'success'} 
            onClose={() => setToast({ ...toast, msg: '' })} 
        />
      )}

      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl shadow-blue-900/10">
        <button onClick={() => router.back()} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-blue-600">← Cancelar</button>
        <h1 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Novo Registro</h1>
        
        {/* Seletor de Status */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 mt-6">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>📝 Apenas Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>💰 Venda Fechada</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Nome Cliente *</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Contato</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>
          <div>
            <label className={`text-[10px] font-black uppercase ml-3 ${status === 'fechado' ? 'text-emerald-600' : 'text-slate-400'}`}>{status === 'fechado' ? 'Valor Venda *' : 'Valor Estimado'}</label>
            <NumericFormat className={`w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none ${status === 'fechado' ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-800'}`} placeholder="R$ 0,00" thousandSeparator="." decimalSeparator="," prefix="R$ " allowNegative={false} value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          <button onClick={handleSalvar} disabled={loading} className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl mt-4 ${status === 'fechado' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading ? 'Salvando...' : (status === 'fechado' ? 'CONFIRMAR VENDA' : 'SALVAR LEAD')}</button>
        </div>
      </div>
    </div>
  );
}