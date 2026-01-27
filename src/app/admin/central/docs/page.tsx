'use client'

import { useRouter } from 'next/navigation';

export default function Documentacao() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-8 text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          ← Voltar ao Painel
        </button>

        <header className="mb-12 border-b border-slate-200 pb-8">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
            Documentação Técnica <br/>
            <span className="text-blue-600 uppercase text-sm tracking-[0.3em]">Eleva Digital Hub v1.0</span>
          </h1>
          <p className="text-slate-500 font-medium">Manual de operações, arquitetura e segurança do sistema.</p>
        </header>

        <section className="space-y-12">
          {/* Sessão 1 */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">1</span>
              Arquitetura do Sistema
            </h2>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <p className="text-sm leading-relaxed">O sistema utiliza **Next.js 16** no frontend e **Supabase** no backend. O deploy é automatizado via **Netlify**.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Banco de Dados</p>
                  <p className="font-bold">PostgreSQL (Supabase)</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Hospedagem</p>
                  <p className="font-bold">Netlify Edge</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sessão 2 */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">2</span>
              Regras de Negócio (Faturamento)
            </h2>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <ul className="space-y-3 text-sm font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>**Comissões:** Calculadas em 25% sobre o valor de contratos com status 'fechado'.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>**Filtro Temporal:** Os cálculos de Hoje, Semana e Mês utilizam a biblioteca `date-fns` para garantir precisão com o fuso horário de Mongaguá.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>**Tipagem:** Todos os valores financeiros são convertidos para `Float` antes da persistência para evitar erros de soma.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sessão 3 */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">3</span>
              Segurança e Auditoria
            </h2>
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <p className="text-sm text-slate-400">O sistema possui logs ativos para as seguintes ações:</p>
              <div className="space-y-2">
                <code className="block bg-slate-800 p-2 rounded text-[10px] text-amber-400">CADASTRO_LEAD: Registra quem cadastrou, o cliente e o valor.</code>
                <code className="block bg-slate-800 p-2 rounded text-[10px] text-amber-400">MIDDLEWARE_BLOCK: Bloqueia IPs sem e-mail administrativo em rotas sensíveis.</code>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-20 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.5em]">
          Eleva Digital © 2024 - Sistema de Alta Performance
        </footer>
      </div>
    </div>
  );
}