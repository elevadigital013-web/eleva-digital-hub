'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';
import { Toast } from '@/components/Toast'; // Importa a notificação bonita

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  
  // ESTADOS DO FORMULÁRIO
  const [nome, setNome] = useState('');
  const [servico, setServico] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo'); 

  // ESTADO DA NOTIFICAÇÃO (TOAST)
  const [toast, setToast] = useState({ msg: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setVendedorId(data.user.id);
      else router.push('/');
    });
  }, [router]);

  async function handleSalvar() {
    if (!vendedorId) return setToast({ msg: "Carregando perfil...", type: 'error' });
    if (!nome) return setToast({ msg: "Nome é obrigatório!", type: 'error' });
    if (!servico) return setToast({ msg: "Informe o serviço!", type: 'error' });
    if (status === 'fechado' && !valor) return setToast({ msg: "Venda requer valor!", type: 'error' });

    setLoading(true);

    let valorNumerico = 0;
    if (valor) valorNumerico = parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim());

    const { error } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_cliente: nome,
      servico: servico,
      telefone: telefone,
      valor_venda: isNaN(valorNumerico) ? 0 : valorNumerico,
      status: status 
    }]);

    if (error) { 
      setToast({ msg: "Erro: " + error.message, type: 'error' });
      setLoading(false);
    } else { 
      // SUCESSO! Mostra mensagem bonita
      setToast({ msg: status === 'fechado' ? "Venda Registrada! 🚀" : "Lead Salvo! 📝", type: 'success' });
      
      // Espera 1.5s para o usuário ler a mensagem e volta
      setTimeout(() => {
          router.push('/vendedor'); 
      }, 1500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex flex-col justify-center relative">
      {/* COMPONENTE DE NOTIFICAÇÃO AQUI */}
      <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, msg: '' })} />

      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl">
        <button onClick={() => router.back()} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-blue-600 transition-colors">← Cancelar</button>
        <h1 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Novo Registro</h1>
        
        {/* STATUS SELECTOR */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>📝 Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>💰 Venda</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Cliente *</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" placeholder="Nome do Cliente" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Produto / Serviço *</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" placeholder="Ex: Criação de Site" value={servico} onChange={e => setServico(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Contato</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500 transition-all" placeholder="WhatsApp" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>

          <div>
            <label className={`text-[10px] font-black uppercase ml-3 ${status === 'fechado' ? 'text-emerald-600' : 'text-slate-400'}`}>{status === 'fechado' ? 'Valor *' : 'Valor Estimado'}</label>
            <NumericFormat className={`w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none transition-all ${status === 'fechado' ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30' : 'border-slate-200 text-slate-800'}`} placeholder="R$ 0,00" thousandSeparator="." decimalSeparator="," prefix="R$ " allowNegative={false} value={valor} onChange={e => setValor(e.target.value)} />
          </div>

          <button onClick={handleSalvar} disabled={loading} className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl mt-4 transition-all active:scale-95 ${status === 'fechado' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}>
            {loading ? 'Salvando...' : (status === 'fechado' ? 'CONFIRMAR VENDA 🚀' : 'SALVAR LEAD 📝')}
          </button>
        </div>
      </div>
    </div>
  );
}