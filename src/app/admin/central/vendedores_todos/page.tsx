'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function VendedoresTodos() {
  const router = useRouter();
  
  // Estados para o formulário de cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pix, setPix] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissao, setComissao] = useState('20'); // Valor padrão de 20%
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ texto: '', tipo: '' });
  const [vendedores, setVendedores] = useState<any[]>([]);

  // Carrega a lista de vendedores cadastrados
  async function loadVendedores() {
    const { data, error } = await supabase
      .from('dados_vendedores')
      .select('*')
      .order('nome', { ascending: true });

    if (data) setVendedores(data);
  }

  useEffect(() => {
    loadVendedores();
  }, []);

  // Função para criar novo vendedor (Auth + Database)
  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ texto: '', tipo: '' });

    try {
      // 1. Cria o acesso de login no Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email,
        password: senha || 'mudar123',
        options: {
          data: { nome, role: 'vendedor' }
        }
      });

      if (authError) throw authError;

      // 2. Salva os dados comerciais na tabela 'dados_vendedores'
      const { error: dbError } = await supabase.from('dados_vendedores').insert([{
        nome,
        email,
        senha_visualizacao: senha || 'mudar123',
        chave_pix: pix,
        telefone,
        comissao_percent: parseFloat(comissao)
      }]);

      if (dbError) throw dbError;

      setMsg({ texto: `Vendedor ${nome} cadastrado com sucesso!`, tipo: 'sucesso' });
      
      // Limpa o formulário
      setNome(''); setEmail(''); setPix(''); setSenha(''); setTelefone(''); setComissao('20');
      loadVendedores();

    } catch (error: any) {
      setMsg({ texto: 'Erro ao cadastrar: ' + error.message, tipo: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir registro
  const excluirVendedor = async (id: number, nomeV: string) => {
    if (!confirm(`Deseja realmente remover ${nomeV} da equipe?`)) return;
    
    await supabase.from('dados_vendedores').delete().eq('id', id);
    loadVendedores();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      {/* Botão Voltar */}
      <button 
        onClick={() => router.push('/admin/central')} 
        className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest"
      >
        ← Voltar ao Painel
      </button>

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black italic text-blue-500 mb-10 uppercase tracking-tighter">
          Gestão de <span className="text-white">Equipe</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="lg:col-span-1">
            <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl sticky top-8">
              <h2 className="text-xl font-black mb-6 uppercase italic text-slate-200">Novo Consultor</h2>
              
              <form onSubmit={handleCadastrar} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Nome Completo</label>
                  <input required type="text" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={nome} onChange={e => setNome(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">E-mail de Login</label>
                  <input required type="email" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Senha Acesso</label>
                    <input type="text" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={senha} onChange={e => setSenha(e.target.value)} placeholder="mudar123" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Comissão %</label>
                    <input type="number" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all font-bold text-orange-400" value={comissao} onChange={e => setComissao(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Chave PIX</label>
                  <input type="text" className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-white outline-none focus:border-emerald-500 transition-all font-bold text-emerald-400" value={pix} onChange={e => setPix(e.target.value)} />
                </div>

                {msg.texto && (
                  <p className={`text-center text-[10px] font-black uppercase p-2 rounded-xl ${msg.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {msg.texto}
                  </p>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[25px] uppercase italic tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20 mt-4"
                >
                  {loading ? 'Sincronizando...' : 'Finalizar Cadastro'}
                </button>
              </form>
            </div>
          </div>

          {/* COLUNA DIREITA: LISTAGEM DE CARDS */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendedores.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-20 italic">Nenhum consultor cadastrado ainda.</div>
            ) : (
              vendedores.map(v => (
                <div key={v.id} className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  
                  {/* Badge de Comissão */}
                  <div className="absolute top-0 right-0 bg-blue-600 px-6 py-2 rounded-bl-[30px] text-[10px] font-black uppercase italic tracking-tighter">
                    {v.comissao_percent || 20}% Comissão
                  </div>

                  <h3 className="text-2xl font-black text-white italic uppercase mb-6 border-b border-slate-800 pb-4 pr-10">
                    {v.nome}
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Financeiro (PIX)</p>
                      <p className="font-mono text-sm text-emerald-400 bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/30 break-all">
                        {v.chave_pix || 'Não cadastrada'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Acesso Login</p>
                        <p className="font-mono text-[11px] text-orange-400 uppercase">{v.senha_visualizacao || '****'}</p>
                      </div>
                      <div className="bg-[#0f172a] p-4 rounded-2xl border border-slate-800">
                        <p className="text-[8px] font-black text-slate-500 uppercase mb-1">E-mail</p>
                        <p className="text-[9px] font-bold text-slate-300 truncate">{v.email}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => excluirVendedor(v.id, v.nome)}
                      className="w-full text-[9px] font-black text-slate-600 hover:text-red-500 uppercase transition-colors pt-4 border-t border-slate-800/50"
                    >
                      Remover Consultor
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}