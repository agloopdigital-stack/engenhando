"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TipoServico } from "@/lib/types";

export default function NovoLeadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tiposServico, setTiposServico] = useState<TipoServico[]>([]);
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [tipoServicoId, setTipoServicoId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tipos_servico")
      .select("*")
      .order("nome")
      .then(({ data }) => setTiposServico(data ?? []));
  }, [supabase]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const { data: usuario } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("conta_id")
      .eq("id", usuario.user?.id)
      .single();

    if (!perfil) {
      setErro("Não encontrei sua conta. Fale com o suporte.");
      setSalvando(false);
      return;
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        conta_id: perfil.conta_id,
        nome,
        contato: contato || null,
        tipo_servico_id: tipoServicoId || null,
      })
      .select("id")
      .single();

    if (error || !lead) {
      setErro("Não consegui salvar o lead. Tenta de novo.");
      setSalvando(false);
      return;
    }

    router.push(`/leads/${lead.id}`);
  }

  return (
    <main className="flex min-h-dvh flex-col bg-concreto-100 px-4 py-6">
      <h1 className="mb-4 font-display text-xl">Novo lead</h1>

      <form onSubmit={salvar} className="flex flex-col gap-3">
        <input
          required
          placeholder="Nome do cliente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <input
          placeholder="Telefone ou e-mail"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <select
          value={tipoServicoId}
          onChange={(e) => setTipoServicoId(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        >
          <option value="">Tipo de serviço (opcional)</option>
          {tiposServico.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nome}
            </option>
          ))}
        </select>

        {erro && <p className="text-sm text-alerta">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="touch-target mt-2 rounded-xl bg-sinalizacao font-display font-medium disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar lead"}
        </button>
      </form>
    </main>
  );
}
