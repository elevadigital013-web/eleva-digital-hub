'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function GestaoVendedores() {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Carrega lista de vendedores
  useEffect(() => {
    loadVendedores();
  }, []);

  async function loadVendedores() {
    // Busca usuários que são vendedores (ajuste conforme sua lógica de role se tiver)
    // Por enquanto, listamos da tabela auth ou de uma tabela 'perfis' se você tiver
    // Como o supabase admin client é restrito no front, aqui listamos leads para pegar nomes únicos como exemplo
    // Ou se você tiver uma tabela 'vendedores', use ela.
    // Para simplificar, deixei o formulário de cadastro funcional:
  }

  const criarVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      // Criação de usuário (Requer backend ou supabase admin, mas vamos tentar o signUp básico)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'mudar123', // Senha padrão
        options: {
          data: { nome, role: 'vendedor' } // Metadados importantes para o Log
        }
      });

      if (error) throw error;
      setMsg(`Vendedor ${nome} criado! Senha padrão: mudar123`);
      setEmail('');
      setNome('');
    } catch (error: any) {
      setMsg('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <h1 className="text-2xl font-black text-blue-500 mb-8 uppercase italic">Gestão de Equipe</h1>
      
      <div className="max-w-md bg-slate-900 p-8 rounded-[40px] border border-slate-800">
        <h2 className="text-xl font-black mb-6">Cadastrar Novo Consultor</h2>
        <form onSubmit={criarVendedor} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500">E-mail de Acesso</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="joao@elevadigital.com"
            />
          </div>
          
          {msg && <p className="text-center text-xs font-bold text-emerald-400">{msg}</p>}

          <button 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase italic tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Criar Acesso'}
          </button>
        </form>
      </div>
    </div>
  );
}