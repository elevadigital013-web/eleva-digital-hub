import { createClient } from '@supabase/supabase-js';

// Busca as chaves que você salvou no .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cria o cliente de conexão
export const supabase = createClient(supabaseUrl, supabaseAnonKey);