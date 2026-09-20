import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usado só em Route Handlers de processamento (fechamento do dia), nunca
// exposto ao browser. Precisa da SUPABASE_SERVICE_ROLE_KEY (não a anon key)
// porque o processamento roda fora do contexto do usuário logado.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
