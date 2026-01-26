'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function GestaoVendedores() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Carregar lista de vendedores
  async function carregarVendedores() {
    const { data } = await supabase.from('vendedores').select('*');
    if (data) setVendedores(data);
  }

  useEffect(() => { carregarVendedores(); }, []);

  const cadastrarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // No Supabase, a forma mais segura de criar usuários via Admin 
    // é usando a API de Admin. Por enquanto, vamos simular o convite:
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: senha,
      email_confirm: true
    });

    if (error) {
      alert("Erro: " + error.message + ". Nota: Você precisa da Service Role Key para criar usuários direto do front.");
    } else {
      alert("Vendedor cadastrado com sucesso!");
      setEmail(''); setSenha('');
      carregarVendedores();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-black mb-8 text-blue-500">GESTÃO DE EQUIPE</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulário de Cadastro */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
          <h2 className="text-xl font-bold mb-6">Adicionar Novo Consultor</h2>
          <form onSubmit={cadastrarVendedor} className="space-y-4">
            <input 
              type="email" placeholder="E-mail do Vendedor"
              className="w-full p-4 bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input 
              type="password" placeholder="Senha Provisória"
              className="w-full p-4 bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              required
            />
            <button 
              className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
              disabled={loading}
            >
              {loading ? 'CADASTRANDO...' : 'CRIAR ACESSO'}
            </button>
          </form>
        </div>

        {/* Lista de Vendedores */}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
          <h2 className="text-xl font-bold mb-6">Consultores Ativos</h2>
          <div className="space-y-4">
            {vendedores.map((v) => (
              <div key={v.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl">
                <span>{v.email || v.nome}</span>
                <button className="text-red-500 text-xs font-bold hover:underline">REMOVER</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}