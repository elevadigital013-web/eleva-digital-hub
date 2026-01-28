'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { NumericFormat } from 'react-number-format';
import { Toast } from '@/components/Toast';

export default function NovoLead() {
  const router = useRouter();
  const [vendedorNome, setVendedorNome] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });
  
  // CAMPOS DO FORM
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState<'novo' | 'fechado'>('novo');

  useEffect(() => {
    async function getUser() {
        const { data } = await supabase.auth.getUser();
        // IMPORTANTE: Buscamos o nome exato no seu banco de dados
        if (data.user) {
            const { data: vData } = await supabase
                .from('vendedores')
                .select('nome')
                .eq('id', data.user.id)
                .single();
            if (vData) setVendedorNome(vData.nome);
        }
    }
    getUser();
  }, []);

  async function salvar() {
    const valorNumerico = valor ? parseFloat(valor.replace('R$', '').replace('.', '').replace(',', '.').trim()) : 0;

    const { error } = await supabase.from('leads').insert([{
      nome_vendedor: vendedorNome, // Envia o nome texto: "Lorena vendedora"
      nome_cliente: nomeCliente,
      valor_venda: valorNumerico,
      status: status
    }]);

    if (!error) {
        setToast({ msg: "Salvo com sucesso!", type: 'success' });
        setTimeout(() => router.push('/vendedor'), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
       {toast.msg && <Toast message={toast.msg} type={toast.type as any} onClose={() => setToast({msg:'', type:''})} />}
       {/* ... restante do seu layout de formulário ... */}
    </div>
  );
}