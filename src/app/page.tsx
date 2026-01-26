'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Tenta autenticar com o Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Erro no login: ' + error.message);
      setLoading(false);
      return;
    }

    // REGRA DE ACESSO:
    // Altere o email abaixo para o seu email de administrador.
    // Todos os outros emails serão tratados como vendedores.
    if (email === 'admin@elevadigital.com') {
      router.push('/admin/central');
    } else {
      router.push('/vendedor/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-black text-2xl italic">ED</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">ELEVA DIGITAL</h1>
          <p className="text-slate-500 font-medium">Sales Command Hub</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Acesso do Consultor</label>
            <input
              type="email"
              required
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-slate-800"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Senha de Segurança</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all text-slate-800"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'VALIDANDO ACESSO...' : 'ACESSAR PAINEL'}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Version 2.0.26</span>
          <span>Mongaguá / SP</span>
        </div>
      </div>
    </div>
  );
}