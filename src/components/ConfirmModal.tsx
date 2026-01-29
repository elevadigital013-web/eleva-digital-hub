'use client'

interface ConfirmModalProps {
  isOpen: boolean;
  titulo: string;
  mensagem: string;
  onConfirm: () => void;
  onCancel: () => void;
  corBotao?: string;
}

export function ConfirmModal({ isOpen, titulo, mensagem, onConfirm, onCancel, corBotao = 'bg-blue-600' }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#1e293b] w-full max-w-sm rounded-[35px] p-8 border border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-300">
        <h3 className="text-xl font-black italic text-white uppercase mb-2">{titulo}</h3>
        <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">{mensagem}</p>
        
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 py-4 rounded-2xl ${corBotao} text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}