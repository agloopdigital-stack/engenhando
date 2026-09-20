import { createClient } from "@/lib/supabase/server";

// A maioria das telas fora do RDO trabalha no nível da conta (escritório),
// não da obra — este helper resolve isso uma vez em vez de repetir o
// join usuarios->conta_id em cada Server Component.
export async function getContaDoUsuarioLogado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("conta_id")
    .eq("id", user.id)
    .single();

  return usuario?.conta_id ?? null;
}
