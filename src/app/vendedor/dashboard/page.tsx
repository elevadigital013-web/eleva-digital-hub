'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  
  // ESTADOS DO FORMULÁRIO
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo'); 

  // Verifica usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setVendedorId(data.user.id);
      else router.push('/');
    });
  }, [router]);

  async function handleSalvar() {
    if (!vendedorId) return alert("Aguarde, carregando seu perfil...");
    if (!nome) return alert("O nome do cliente é obrigatório!");

    // Se a venda está fechada, o valor é obrigatório
    if (status === 'fechado' && !valor) {
        return alert("Para fechar a venda, informe o valor!");
    }

    setLoading(true);

    // Converte R$ 1.500,00 para 1500.00 (número)
    // Se estiver vazio, assume 0.
    let valorNumerico = 0;
    if (valor) {
        valorNumerico = parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim());
    }

    // Tenta salvar
    const { error } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_cliente: nome,
      telefone: telefone,
      valor_venda: isNaN(valorNumerico) ? 0 : valorNumerico, // Proteção extra contra NaN
      status: status 
    }]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar venda: " + error.message); // Mostra o erro real se acontecer
    } else {
      if (status === 'fechado') alert("Parabéns pela venda! 🚀");
      else alert("Lead cadastrado com sucesso! 📝");
      router.push('/vendedor'); 
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl shadow-blue-900/10">
        
        <button onClick={() => router.back()} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-blue-600">← Cancelar</button>

        <h1 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Novo Registro</h1>
        <p className="text-slate-500 text-xs mb-8">Cadastre um interessado ou uma venda feita.</p>

        {/* SELETOR DE STATUS */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>📝 Apenas Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>💰 Venda Fechada</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Nome do Cliente *</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500" placeholder="Ex: Cliente Exemplo" value={nome} onChange={e => setNome(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-3">WhatsApp / Contato</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-500" placeholder="(13) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>

          <div>
            <label className={`text-[10px] font-black uppercase ml-3 ${status === 'fechado' ? 'text-emerald-600' : 'text-slate-400'}`}>
                {status === 'fechado' ? 'Valor da Venda (Obrigatório) *' : 'Valor Estimado (Opcional)'}
            </label>
            <NumericFormat
              className={`w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none transition-colors ${status === 'fechado' ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-800'}`}
              placeholder={status === 'fechado' ? "R$ 0,00" : "R$ (Em negociação)"}
              thousandSeparator="." decimalSeparator="," prefix="R$ " allowNegative={false}
              value={valor} onChange={e => setValor(e.target.value)}
            />
          </div>

          <button onClick={handleSalvar} disabled={loading} className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all mt-4 ${status === 'fechado' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? 'Salvando...' : (status === 'fechado' ? 'CONFIRMAR VENDA 🚀' : 'SALVAR LEAD 📝')}
          </button>
        </div>
      </div>
    </div>
  );
}