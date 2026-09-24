"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NovaObraPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteContato, setClienteContato] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("conta_id")
      .eq("id", sessao.user?.id)
      .single();

    if (!perfil) {
      setErro("Não encontrei sua conta. Fale com o suporte.");
      setSalvando(false);
      return;
    }

    const { data: obra, error } = await supabase
      .from("obras")
      .insert({
        conta_id: perfil.conta_id,
        nome,
        endereco: endereco || null,
        cliente_nome: clienteNome || null,
        cliente_contato: clienteContato || null,
        data_inicio: dataInicio || null,
      })
      .select("id")
      .single();

    if (error || !obra) {
      setErro("Não consegui registrar a obra. Tenta de novo.");
      setSalvando(false);
      return;
    }

    router.push(`/obras/${obra.id}`);
  }

  return (
    <main className="flex min-h-full flex-col bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <Link href="/obras" className="mb-3 text-sm font-medium text-projeto-700">
        Obras
      </Link>
      <h1 className="mb-1 font-display text-xl">Nova obra</h1>
      <p className="mb-4 text-sm text-tinta-suave">
        Depois deste cadastro, o registro do dia, os documentos, o caixa e a equipe ficam nesta obra.
      </p>

      <form onSubmit={salvar} className="flex flex-col gap-3">
        <input
          required
          placeholder="Nome da obra"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <input
          placeholder="Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <input
          placeholder="Cliente"
          value={clienteNome}
          onChange={(e) => setClienteNome(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <input
          placeholder="Telefone do cliente"
          value={clienteContato}
          onChange={(e) => setClienteContato(e.target.value)}
          className="touch-target rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
        />
        <label className="text-sm text-tinta-suave">
          Início
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="touch-target mt-1 w-full rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
          />
        </label>

        {erro && <p className="text-sm text-alerta">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="touch-target mt-2 rounded-xl bg-sinalizacao font-display font-medium disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Registrar obra"}
        </button>
      </form>
    </main>
  );
}
