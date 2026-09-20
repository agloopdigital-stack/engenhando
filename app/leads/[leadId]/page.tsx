"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { extrairCamposTemplate } from "@/lib/crm/preencher-template";
import type { Lead, TemplateProposta, Proposta } from "@/lib/types";

export default function DetalheLeadPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = use(params);
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [templates, setTemplates] = useState<TemplateProposta[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const [gerando, setGerando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: leadData }, { data: propostasData }] = await Promise.all([
        supabase.from("leads").select("*").eq("id", leadId).single(),
        supabase
          .from("propostas")
          .select("*")
          .eq("lead_id", leadId)
          .order("criado_em", { ascending: false }),
      ]);

      setLead(leadData);
      setPropostas(propostasData ?? []);

      if (leadData) {
        const { data: templatesData } = await supabase
          .from("templates_proposta")
          .select("*")
          .eq("conta_id", leadData.conta_id);
        setTemplates(templatesData ?? []);
      }

      setCarregando(false);
    })();
  }, [leadId, supabase]);

  const templateEscolhido = templates.find((t) => t.id === templateId);
  const campos = templateEscolhido ? extrairCamposTemplate(templateEscolhido.corpo_template) : [];

  async function criarEGerarProposta() {
    if (!templateId || !lead) return;
    setGerando(true);

    const { data: proposta, error } = await supabase
      .from("propostas")
      .insert({ lead_id: lead.id, template_id: templateId, valores_preenchidos: valores })
      .select("*")
      .single();

    if (error || !proposta) {
      alert("Não consegui criar a proposta.");
      setGerando(false);
      return;
    }

    const resposta = await fetch(`/api/propostas/${proposta.id}/gerar-pdf`, { method: "POST" });
    const resultado = await resposta.json();

    setPropostas((atual) => [{ ...proposta, pdf_url: resultado.pdf_url, status: "enviada" }, ...atual]);
    setGerando(false);
    setTemplateId("");
    setValores({});
  }

  if (carregando) return <p className="p-6 text-tinta-suave">Carregando...</p>;
  if (!lead) return <p className="p-6 text-tinta-suave">Lead não encontrado.</p>;

  return (
    <div className="min-h-dvh bg-concreto-100 pb-16">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <h1 className="font-display text-xl">{lead.nome}</h1>
        {lead.contato && <p className="text-sm text-concreto-300">{lead.contato}</p>}
      </header>

      <section className="px-4 pt-4">
        <h2 className="mb-2 font-display text-sm font-medium uppercase tracking-wide text-tinta-suave">
          Nova proposta
        </h2>

        {templates.length === 0 ? (
          <p className="text-sm text-tinta-suave">
            Nenhum template cadastrado ainda para esta conta.
          </p>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-concreto-300 bg-white p-4">
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setValores({});
              }}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            >
              <option value="">Escolha um template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>

            {campos.map((campo) => (
              <input
                key={campo}
                placeholder={campo}
                value={valores[campo] ?? ""}
                onChange={(e) => setValores((v) => ({ ...v, [campo]: e.target.value }))}
                className="touch-target rounded-xl border border-concreto-300 px-3"
              />
            ))}

            {templateId && (
              <button
                type="button"
                disabled={gerando}
                onClick={criarEGerarProposta}
                className="touch-target rounded-xl bg-sinalizacao font-display font-medium disabled:opacity-50"
              >
                {gerando ? "Gerando PDF..." : "Gerar e marcar como enviada"}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-2 font-display text-sm font-medium uppercase tracking-wide text-tinta-suave">
          Propostas
        </h2>
        {propostas.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma ainda.</p>}
        <ul className="flex flex-col gap-2">
          {propostas.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-4"
            >
              <div>
                <p className="font-medium capitalize">{p.status}</p>
                {p.enviada_em && (
                  <p className="text-sm text-tinta-suave">
                    Enviada em {new Date(p.enviada_em).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              {p.pdf_url && (
                <a
                  href={p.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="touch-target flex items-center rounded-xl bg-projeto-700 px-4 text-sm font-medium text-white"
                >
                  Ver PDF
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
