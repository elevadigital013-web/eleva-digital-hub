// Função para formatar números em Real Brasileiro (R$)
export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Função para formatar datas (ex: 26/01/2026)
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Função auxiliar para classes do Tailwind (opcional, mas útil)
export function cn(...inputs: string[]) {
  return inputs.filter(Boolean).join(' ');
}