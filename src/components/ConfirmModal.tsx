'use client'

/**
 * Interface de propriedades do Modal
 * Mantém exatamente o que você já usa para não quebrar nada
 */
interface ConfirmModalProps {
  isOpen: boolean;
  titulo: string;
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
  corBotao?: string;
}

export function ConfirmModal({ 
  isOpen, 
  titulo, 
  mensagem, 
  onConfirm, 
  onCancel, 
  corBotao = 'bg-blue-600' 
}: ConfirmModalProps) {
  
  // Se o modal não estiver aberto, não renderiza absolutamente nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Container do Modal com arredondamento e sombra premium */}
      <div className="bg-[#1e293b] w-full max-w-sm rounded-[40px] p-8 border border-slate-800 shadow-2xl animate-in zoom-in duration-300">
        
        {/* Ícone visual para reforçar a ação (Diferencial da versão anterior) */}
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-2xl mb-6 mx-auto">
          ❓
        </div>

        {/* Título e Mensagem Centralizados para melhor leitura */}
        <h3 className="text-xl font-black italic text-white uppercase mb-2 text-center tracking-tighter">
          {titulo}
        </h3>
        <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed text-center">
          {mensagem}
        </p>
        
        {/* Botões de Ação com feedback tátil (active:scale-95) */}
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
          >
            Cancelar
          </button>
          
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-4 rounded-2xl ${corBotao} text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all`}
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}