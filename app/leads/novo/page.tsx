"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Campo } from "@/components/empresa/Campo";
import { mascararTelefone } from "@/lib/empresa";
import type { TipoServico } from "@/lib/types";

export default function NovoLeadPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipoServicoId, setTipoServicoId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("tipos_servico")
      .select("*")
      .order("nome")
      .then(({ data }) => setTipos(data ?? []));
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
        nome: nome.trim(),
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        contato: whatsapp.trim() || email.trim() || null,
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
    <main className="min-h-full bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <form id="form-lead" onSubmit={salvar} className="mx-auto flex max-w-3xl flex-col gap-4 pb-28">
        <div>
          <Link href="/leads" className="text-sm font-medium text-projeto-700">
            Leads
          </Link>
          <h1 className="mt-2 font-display text-xl">Novo lead</h1>
          <p className="mt-1 text-sm text-tinta-suave">Nome e WhatsApp já bastam para não perder o contato.</p>
        </div>

        <section className="flex flex-col gap-3 rounded-xl border border-concreto-300 border-l-[3px] border-l-projeto-900 bg-white p-4">
          <Campo label="Nome do cliente" value={nome} onChange={setNome} autoComplete="name" />
          <Campo
            label="WhatsApp"
            value={whatsapp}
            onChange={(valor) => setWhatsapp(mascararTelefone(valor))}
            inputMode="tel"
            autoComplete="tel"
          />
          <Campo label="E-mail" value={email} onChange={setEmail} type="email" inputMode="email" autoComplete="email" />
          <Campo label="Endereço da obra" value={endereco} onChange={setEndereco} />
          <div>
            <p className="text-sm text-tinta-suave">Serviço</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tipos.map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  aria-pressed={tipoServicoId === tipo.id}
                  onClick={() => setTipoServicoId((atual) => (atual === tipo.id ? "" : tipo.id))}
                  className={`touch-target rounded-xl border px-4 font-display text-sm ${
                    tipoServicoId === tipo.id
                      ? "border-projeto-900 bg-projeto-900 text-white"
                      : "border-concreto-300 bg-white text-tinta"
                  }`}
                >
                  {tipo.nome}
                </button>
              ))}
            </div>
          </div>
        </section>
      </form>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-concreto-300 bg-concreto-100 px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {erro && <p className="text-sm text-alerta">{erro}</p>}
          <button
            type="submit"
            form="form-lead"
            disabled={salvando || nome.trim().length < 2}
            className="touch-target w-full rounded-xl bg-sinalizacao font-display text-base font-medium text-tinta disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar lead"}
          </button>
        </div>
      </div>
    </main>
  );
}
