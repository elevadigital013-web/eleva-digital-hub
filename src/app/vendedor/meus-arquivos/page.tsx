'use client'

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

/**
 * Página de gestão de documentos do vendedor
 * Permite upload direto para o Storage e visualização de status da auditoria
 */
export default function MeusArquivos() {
  const router = useRouter();
  const [arquivos, setArquivos] = useState<any[]>([]);
  const [titulo, setTitulo] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [vendedorInfo, setVendedorInfo] = useState({ id: '', nome: '' });
  const [loading, setLoading] = useState(false);

  // Busca informações do usuário logado ao carregar a página
  useEffect(() => {
    async function getVendedor() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setVendedorInfo({ 
          id: user.id, 
          nome: user.user_metadata?.nome || user.email?.split('@')[0] 
        });
        loadArquivos(user.id);
      } else {
        router.push('/'); // Proteção básica de rota
      }
    }
    getVendedor();
  }, [router]);

  // Carrega a lista de documentos vindos da tabela arquivos_vendedores
  async function loadArquivos(uid: string) {
    const { data } = await supabase
      .from('arquivos_vendedores')
      .select('*')
      .eq('vendedor_id', uid)
      .order('created_at', { ascending: false });
      
    if (data) setArquivos(data);
  }

  // Lógica principal de Upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivoSelecionado || !titulo) {
      return alert("Preencha o título e selecione um arquivo!");
    }

    setLoading(true);

    try {
      // Define extensão e nome único para o ficheiro no Storage
      const fileExt = arquivoSelecionado.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${vendedorInfo.id}/${fileName}`;

      // 1. Faz o upload para o bucket 'documentos' do Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, arquivoSelecionado);

      if (uploadError) throw uploadError;

      // 2. Recupera a URL pública do ficheiro recém-criado
      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      // 3. Insere o registo na base de dados com status 'pendente'
      const { error: dbError } = await supabase.from('arquivos_vendedores').insert([{
        vendedor_id: vendedorInfo.id,
        vendedor_nome: vendedorInfo.nome,
        titulo: titulo.toUpperCase(), // Padroniza títulos em maiúsculas
        link_arquivo: publicUrl,
        status: 'pendente' 
      }]);

      if (dbError) throw dbError;

      // Limpa os campos após o sucesso
      setTitulo('');
      setArquivoSelecionado(null);
      loadArquivos(vendedorInfo.id);
      alert("Arquivo enviado com sucesso!");

    } catch (error: any) {
      alert("Erro no upload: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 font-sans">
      <button 
        onClick={() => router.back()} 
        className="mb-8 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
      >
        ← Voltar
      </button>
      
      <h1 className="text-2xl font-black italic text-cyan-400 uppercase mb-10 tracking-tighter">
        Minha <span className="text-white">Pasta</span>
      </h1>

      <div className="space-y-8">
        {/* FORMULÁRIO DE UPLOAD DIRETO */}
        <div className="bg-[#1e293b] p-8 rounded-[40px] border border-slate-800 shadow-2xl">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">
            Enviar Documento / Foto
          </h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">
                Nome do Documento
              </label>
              <input 
                required 
                placeholder="Ex: Contrato assinado - Pedro Silva" 
                className="w-full bg-[#0f172a] border border-slate-800 p-4 rounded-2xl text-sm outline-none focus:border-cyan-400 font-bold uppercase" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-2 tracking-widest">
                Selecionar do Dispositivo
              </label>
              <div className="relative">
                <input 
                  required 
                  type="file" 
                  accept="image/*,application/pdf"
                  className="hidden" 
                  id="file-upload"
                  onChange={e => setArquivoSelecionado(e.target.files ? e.target.files[0] : null)}
                />
                <label 
                  htmlFor="file-upload" 
                  className={`flex items-center justify-center gap-3 w-full border-2 border-dashed p-6 rounded-2xl cursor-pointer transition-all ${
                    arquivoSelecionado ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-[#0f172a] hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl">{arquivoSelecionado ? '✅' : '📁'}</span>
                  <span className="text-xs font-black uppercase italic tracking-widest">
                    {arquivoSelecionado ? arquivoSelecionado.name : 'Escolher Arquivo ou Foto'}
                  </span>
                </label>
              </div>
            </div>

            <button 
              disabled={loading} 
              className="bg-cyan-500 text-slate-900 p-5 rounded-[25px] font-black uppercase text-xs tracking-widest active:scale-95 transition-all shadow-xl shadow-cyan-500/20 mt-4 disabled:opacity-50"
            >
              {loading ? 'Subindo arquivo...' : 'Sincronizar com a Eleva'}
            </button>
          </form>
        </div>

        {/* LISTAGEM DE ARQUIVOS COM STATUS */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-500 ml-4 mb-2 tracking-widest">
            Seus Arquivos Salvos
          </h3>
          {arquivos.map(arq => (
            <div key={arq.id} className="bg-slate-900 p-6 rounded-[35px] border border-slate-800 flex justify-between items-center group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 text-lg">📄</div>
                 <div>
                    <div className="flex items-center">
                        <p className="font-black text-sm uppercase italic leading-none">{arq.titulo}</p>
                        
                        {/* Indicador de Status Dinâmico */}
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ml-2 ${
                            arq.status === 'aprovado' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
                        }`}>
                            {arq.status === 'aprovado' ? 'Validado' : 'Em análise'}
                        </span>
                    </div>
                    <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase">
                      Sincronizado em {new Date(arq.created_at).toLocaleDateString()}
                    </p>
                 </div>
              </div>
              <a 
                href={arq.link_arquivo} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-[9px] font-black uppercase italic transition-colors"
              >
                Visualizar
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}