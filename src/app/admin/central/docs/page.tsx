'use client'

import { useState, useEffect } from 'react'; // Adicionado
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Importante: Importar o supabase
import { format } from 'date-fns';

// Interface para tipagem
interface Documento {
  id: number;
  titulo: string;
  link_arquivo: string;
  created_at: string;
}

export default function Documentacao() {
  const router = useRouter();
  
  // Estados para Upload
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [listaDocs, setListaDocs] = useState<Documento[]>([]);
  const [tituloDoc, setTituloDoc] = useState('');

  // Carregar documentos ao iniciar
  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    const { data } = await supabase.from('documentos_tecnicos').select('*').order('created_at', { ascending: false });
    if (data) setListaDocs(data);
  }

  // Função de Upload
  async function handleUpload() {
    if (!arquivo || !tituloDoc) {
      alert("Por favor, preencha o nome e escolha um arquivo.");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload para o Storage
      const nomeArquivo = `${Date.now()}-${arquivo.name.replace(/\s/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('docs_internos')
        .upload(nomeArquivo, arquivo);

      if (uploadError) throw uploadError;

      // 2. Pegar Link Público
      const { data: publicUrl } = supabase.storage
        .from('docs_internos')
        .getPublicUrl(nomeArquivo);

      // 3. Salvar no Banco
      const { error: dbError } = await supabase.from('documentos_tecnicos').insert([{
        titulo: tituloDoc,
        link_arquivo: publicUrl.publicUrl
      }]);

      if (dbError) throw dbError;

      alert("Documento salvo com sucesso!");
      setArquivo(null);
      setTituloDoc('');
      fetchDocs(); // Atualiza a lista

    } catch (error) {
      console.error(error);
      alert("Erro ao subir documento.");
    } finally {
      setUploading(false);
    }
  }

  // Função para Deletar
  async function deletarDoc(id: number) {
    if(!confirm("Tem certeza que deseja excluir?")) return;
    await supabase.from('documentos_tecnicos').delete().eq('id', id);
    fetchDocs();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.back()}
          className="mb-8 text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:underline"
        >
          ← Voltar ao Painel
        </button>

        <header className="mb-12 border-b border-slate-200 pb-8">
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">
            Documentação Técnica <br/>
            <span className="text-blue-600 uppercase text-sm tracking-[0.3em]">Eleva Digital Hub v1.0</span>
          </h1>
          <p className="text-slate-500 font-medium">Manual de operações, arquitetura e arquivos internos.</p>
        </header>

        <section className="space-y-12">
          
          {/* --- NOVA SESSÃO: GESTÃO DE ARQUIVOS --- */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">0</span>
              Arquivos & Manuais (Upload)
            </h2>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              {/* Área de Upload */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">Novo Arquivo</p>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Nome do Documento (ex: Manual de Vendas)" 
                    className="p-3 rounded-xl border border-slate-300 text-sm flex-1"
                    value={tituloDoc}
                    onChange={e => setTituloDoc(e.target.value)}
                  />
                  <input 
                    type="file" 
                    className="p-2 bg-white rounded-xl border border-slate-300 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={e => setArquivo(e.target.files ? e.target.files[0] : null)}
                  />
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl transition-colors text-xs uppercase tracking-wider"
                  >
                    {uploading ? 'Enviando...' : 'Subir'}
                  </button>
                </div>
              </div>

              {/* Lista de Arquivos */}
              <div className="space-y-2">
                {listaDocs.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum documento anexado.</p>}
                
                {listaDocs.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{doc.titulo}</p>
                        <p className="text-[10px] text-slate-400">Enviado em: {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={doc.link_arquivo} 
                        target="_blank" 
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                      >
                        BAIXAR ⬇
                      </a>
                      <button 
                        onClick={() => deletarDoc(doc.id)}
                        className="text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* --- FIM DA NOVA SESSÃO --- */}

          {/* Sessão 1 (Antiga) */}
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

          {/* Sessão 2 (Antiga) */}
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
              </ul>
            </div>
          </div>

          {/* Sessão 3 (Antiga) */}
          <div>
            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
              <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px]">3</span>
              Segurança e Auditoria
            </h2>
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <p className="text-sm text-slate-400">O sistema possui logs ativos para as seguintes ações:</p>
              <div className="space-y-2">
                <code className="block bg-slate-800 p-2 rounded text-[10px] text-amber-400">CADASTRO_LEAD: Registra quem cadastrou, o cliente e o valor.</code>
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