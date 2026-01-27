'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';

export default function NovoLead() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState('');
  
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo'); 

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setVendedorId(data.user.id);
      else router.push('/');
    });
  }, [router]);

  async function handleSalvar() {
    if (!vendedorId) return alert("Carregando perfil...");
    if (!nome) return alert("Nome é obrigatório!");
    if (status === 'fechado' && !valor) return alert("Informe o valor da venda!");

    setLoading(true);

    let valorNumerico = 0;
    if (valor) valorNumerico = parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim());

    const { error } = await supabase.from('leads').insert([{
      vendedor_id: vendedorId,
      nome_cliente: nome,
      telefone: telefone,
      valor_venda: isNaN(valorNumerico) ? 0 : valorNumerico,
      status: status 
    }]);

    if (error) { alert("Erro ao salvar: " + error.message); } 
    else { alert(status === 'fechado' ? "Parabéns pela venda!" : "Lead cadastrado!"); router.push('/vendedor'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl">
        <button onClick={() => router.back()} className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">← Cancelar</button>
        <h1 className="text-2xl font-black italic text-slate-900 mb-2 uppercase">Novo Registro</h1>
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button onClick={() => setStatus('novo')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'novo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>📝 Lead</button>
            <button onClick={() => setStatus('fechado')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${status === 'fechado' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}>💰 Venda</button>
        </div>
        <div className="space-y-4">
          <div><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Cliente *</label><input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800" value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Contato</label><input type="text" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl font-bold text-slate-800" value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
          <div>
            <label className={`text-[10px] font-black uppercase ml-3 ${status === 'fechado' ? 'text-emerald-600' : 'text-slate-400'}`}>{status === 'fechado' ? 'Valor *' : 'Valor Estimado'}</label>
            <NumericFormat className={`w-full bg-slate-50 border p-4 rounded-2xl font-bold outline-none ${status === 'fechado' ? 'border-emerald-200 text-emerald-700' : 'border-slate-200 text-slate-800'}`} placeholder="R$ 0,00" thousandSeparator="." decimalSeparator="," prefix="R$ " allowNegative={false} value={valor} onChange={e => setValor(e.target.value)} />
          </div>
          <button onClick={handleSalvar} disabled={loading} className={`w-full p-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl mt-4 ${status === 'fechado' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{loading ? '...' : (status === 'fechado' ? 'CONFIRMAR' : 'SALVAR')}</button>
        </div>
      </div>
    </div>
  );
}