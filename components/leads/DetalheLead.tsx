"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Campo, CLASSE_CONTROLE } from "@/components/empresa/Campo";
import { mascararTelefone } from "@/lib/empresa";
import { extrairCamposTemplate } from "@/lib/crm/preencher-template";
import {
  CAMPOS_PROPOSTA_RESERVADOS,
  ESTAGIOS,
  abrirObraDoLead,
  atualizarEstagio,
  diasDesde,
  formatarMoeda,
  linkTelefone,
  linkWhatsapp,
  parseValor,
  separarContato,
} from "@/lib/crm/funil";
import type { ContatoLead, EstagioLead, Lead, Proposta, TemplateProposta, TipoServico } from "@/lib/types";

export function DetalheLead({ leadId }: { leadId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [lead, setLead] = useState<Lead | null>(null);
  const [tipos, setTipos] = useState<TipoServico[]>([]);
  const [templates, setTemplates] = useState<TemplateProposta[]>([]);
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [contatos, setContatos] = useState<ContatoLead[]>([]);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tipoServicoId, setTipoServicoId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [escopo, setEscopo] = useState("");
  const [valorTexto, setValorTexto] = useState("");
  const [prazoTexto, setPrazoTexto] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const [{ data: leadData }, { data: propostasData }, { data: contatosData }, { data: tiposData }] =
        await Promise.all([
          supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
          supabase.from("propostas").select("*").eq("lead_id", leadId).order("criado_em", { ascending: false }),
          supabase.from("contatos_lead").select("*").eq("lead_id", leadId).order("criado_em", { ascending: false }),
          supabase.from("tipos_servico").select("*").order("nome"),
        ]);

      if (!ativo) return;
      const encontrado = leadData as Lead | null;
      setLead(encontrado);
      setPropostas((propostasData as Proposta[] | null) ?? []);
      setContatos((contatosData as ContatoLead[] | null) ?? []);
      setTipos((tiposData as TipoServico[] | null) ?? []);

      if (encontrado) {
        const legado = separarContato(encontrado.contato);
        setNome(encontrado.nome);
        setWhatsapp(encontrado.whatsapp || legado.whatsapp);
        setEmail(encontrado.email || legado.email);
        setEndereco(encontrado.endereco ?? "");
        setTipoServicoId(encontrado.tipo_servico_id ?? "");
        const { data: templatesData } = await supabase
          .from("templates_proposta")
          .select("*")
          .eq("conta_id", encontrado.conta_id);
        if (!ativo) return;
        const lista = (templatesData as TemplateProposta[] | null) ?? [];
        setTemplates(lista);
        setTemplateId(lista[0]?.id ?? "");
      }

      setCarregando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [leadId, supabase]);

  const template = templates.find((item) => item.id === templateId);
  const camposExtras = useMemo(() => {
    if (!template) return [];
    return extrairCamposTemplate(template.corpo_template).filter((campo) => !CAMPOS_PROPOSTA_RESERVADOS.has(campo));
  }, [template]);

  const sujo = lead
    ? nome !== lead.nome ||
      whatsapp !== (lead.whatsapp || separarContato(lead.contato).whatsapp) ||
      email !== (lead.email || separarContato(lead.contato).email) ||
      endereco !== (lead.endereco ?? "") ||
      tipoServicoId !== (lead.tipo_servico_id ?? "")
    : false;

  const ultima = propostas[0] ?? null;
  const telefoneHref = linkTelefone(whatsapp);
  const conversaHref = linkWhatsapp(whatsapp, `Olá ${nome}, aqui é da engenharia. Podemos falar sobre o orçamento?`);

  async function salvarCampos() {
    if (!lead) return false;
    const { error } = await supabase
      .from("leads")
      .update({
        nome: nome.trim(),
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        endereco: endereco.trim() || null,
        contato: whatsapp.trim() || email.trim() || null,
        tipo_servico_id: tipoServicoId || null,
      })
      .eq("id", lead.id);

    if (error) {
      setErro("Não consegui salvar o lead.");
      return false;
    }

    setLead({
      ...lead,
      nome: nome.trim(),
      whatsapp: whatsapp.trim() || null,
      email: email.trim() || null,
      endereco: endereco.trim() || null,
      contato: whatsapp.trim() || email.trim() || null,
      tipo_servico_id: tipoServicoId || null,
    });
    return true;
  }

  async function mudarEstagio(estagio: EstagioLead) {
    if (!lead || lead.estagio === estagio) return;
    setErro(null);
    setAviso(null);
    const anterior = lead.estagio;
    setLead({ ...lead, estagio });
    const ok = await atualizarEstagio(supabase, lead.id, estagio);
    if (!ok) {
      setLead({ ...lead, estagio: anterior });
      setErro("Não consegui mudar o estágio.");
    }
  }

  async function faleiAgora() {
    if (!lead) return;
    setOcupado(true);
    setErro(null);
    const { data, error } = await supabase
      .from("contatos_lead")
      .insert({ lead_id: lead.id, conta_id: lead.conta_id, nota: "Falei agora" })
      .select("*")
      .single();

    if (error || !data) {
      setErro("Não consegui registrar o contato.");
      setOcupado(false);
      return;
    }

    setContatos((atual) => [data as ContatoLead, ...atual]);
    if (lead.estagio === "proposta_enviada") {
      await supabase.from("leads").update({ estagio: "follow_up" }).eq("id", lead.id);
      setLead({ ...lead, estagio: "follow_up" });
    }
    setAviso("Contato registrado.");
    setOcupado(false);
  }

  async function gerarPdf() {
    if (!lead || !templateId) return;
    setOcupado(true);
    setErro(null);
    setAviso(null);
    const salvou = await salvarCampos();
    if (!salvou) {
      setOcupado(false);
      return;
    }

    const valor = parseValor(valorTexto);
    const prazo = Number.parseInt(prazoTexto, 10);
    const valores = {
      ...extras,
      cliente_nome: nome.trim(),
      escopo: escopo.trim(),
      valor: valor != null ? formatarMoeda(valor) : "",
      prazo: Number.isFinite(prazo) ? String(prazo) : "",
    };

    const { data: proposta, error } = await supabase
      .from("propostas")
      .insert({
        lead_id: lead.id,
        template_id: templateId,
        valores_preenchidos: valores,
        valor,
        prazo_dias: Number.isFinite(prazo) ? prazo : null,
        escopo: escopo.trim() || null,
        status: "rascunho",
      })
      .select("*")
      .single();

    if (error || !proposta) {
      setErro("Não consegui criar a proposta.");
      setOcupado(false);
      return;
    }

    const resposta = await fetch(`/api/propostas/${proposta.id}/gerar-pdf`, { method: "POST" });
    const resultado = (await resposta.json()) as { pdf_url?: string; erro?: string };
    if (!resposta.ok || !resultado.pdf_url) {
      setErro(resultado.erro ?? "Não consegui gerar o PDF.");
      setOcupado(false);
      return;
    }

    setPropostas((atual) => [{ ...(proposta as Proposta), pdf_url: resultado.pdf_url ?? null, status: "rascunho" }, ...atual]);
    setAviso("PDF pronto. Marque como enviada quando o cliente receber.");
    setOcupado(false);
  }

  async function marcarEnviada(proposta: Proposta) {
    if (!lead || !proposta.pdf_url) return;
    setOcupado(true);
    setErro(null);
    const agora = new Date().toISOString();
    const { error } = await supabase
      .from("propostas")
      .update({ status: "enviada", enviada_em: agora })
      .eq("id", proposta.id);

    if (error) {
      setErro("Não consegui marcar a proposta como enviada.");
      setOcupado(false);
      return;
    }

    if (lead.estagio !== "fechado" && lead.estagio !== "perdido") {
      await supabase.from("leads").update({ estagio: "proposta_enviada" }).eq("id", lead.id);
      setLead({ ...lead, estagio: "proposta_enviada" });
    }

    setPropostas((atual) =>
      atual.map((item) => (item.id === proposta.id ? { ...item, status: "enviada", enviada_em: agora } : item))
    );
    await fetch(`/api/propostas/${proposta.id}/enviar`, { method: "POST" });
    setAviso("Proposta enviada. O retorno entra na lista em 3 dias.");
    setOcupado(false);
  }

  async function abrirObra() {
    if (!lead || lead.obra_relacionada) return;
    setOcupado(true);
    setErro(null);
    const salvou = await salvarCampos();
    if (!salvou) {
      setOcupado(false);
      return;
    }

    const resultado = await abrirObraDoLead(supabase, {
      id: lead.id,
      contaId: lead.conta_id,
      nome: nome.trim(),
      endereco: endereco.trim(),
      contato: whatsapp.trim() || email.trim(),
    });

    if ("erro" in resultado) {
      setErro(resultado.erro);
      setOcupado(false);
      return;
    }

    router.push(`/obras/${resultado.obraId}`);
  }

  async function acaoPrincipal() {
    if (!lead) return;
    if (sujo) {
      setOcupado(true);
      setErro(null);
      const salvou = await salvarCampos();
      setOcupado(false);
      if (salvou) setAviso("Lead salvo.");
      return;
    }
    if (lead.estagio === "fechado" && !lead.obra_relacionada) {
      await abrirObra();
      return;
    }
    if (ultima?.pdf_url && ultima.status === "rascunho") {
      await marcarEnviada(ultima);
      return;
    }
    if (templateId) await gerarPdf();
  }

  if (carregando) return <p className="p-6 text-tinta-suave">Carregando...</p>;
  if (!lead) return <p className="p-6 text-tinta-suave">Lead não encontrado.</p>;

  const rotuloPrincipal = sujo
    ? "Salvar lead"
    : lead.estagio === "fechado" && !lead.obra_relacionada
      ? "Abrir obra"
      : ultima?.pdf_url && ultima.status === "rascunho"
        ? "Marcar como enviada"
        : "Gerar PDF";

  const principalDesabilitada =
    ocupado || (!sujo && rotuloPrincipal === "Gerar PDF" && !templateId);

  return (
    <main className="min-h-full bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-28">
        <div>
          <Link href="/leads" className="text-sm font-medium text-projeto-700">
            Leads
          </Link>
          <h1 className="mt-2 font-display text-xl">{nome || lead.nome}</h1>
          <p className="mt-1 text-sm text-tinta-suave">{ESTAGIOS.find((item) => item.chave === lead.estagio)?.rotulo}</p>
        </div>

        <section className="rounded-xl border border-concreto-300 bg-white p-4">
          <h2 className="font-display text-base">Estágio</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {ESTAGIOS.map((estagio) => (
              <button
                key={estagio.chave}
                type="button"
                aria-pressed={lead.estagio === estagio.chave}
                onClick={() => mudarEstagio(estagio.chave)}
                className={`touch-target rounded-xl border px-3 font-display text-sm ${
                  lead.estagio === estagio.chave
                    ? "border-projeto-900 bg-projeto-900 text-white"
                    : "border-concreto-300 bg-white text-tinta"
                }`}
              >
                {estagio.rotulo}
              </button>
            ))}
          </div>
          {lead.estagio === "fechado" && lead.obra_relacionada && (
            <Link href={`/obras/${lead.obra_relacionada}`} className="mt-3 inline-flex text-sm font-medium text-projeto-700">
              Ver obra
            </Link>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-concreto-300 border-l-[3px] border-l-projeto-900 bg-white p-4">
          <h2 className="font-display text-base">Cliente</h2>
          <Campo label="Nome" value={nome} onChange={setNome} />
          <Campo
            label="WhatsApp"
            value={whatsapp}
            onChange={(valor) => setWhatsapp(mascararTelefone(valor))}
            inputMode="tel"
          />
          <Campo label="E-mail" value={email} onChange={setEmail} type="email" inputMode="email" />
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
                      : "border-concreto-300 bg-concreto-50 text-tinta"
                  }`}
                >
                  {tipo.nome}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {telefoneHref && (
              <a href={telefoneHref} className="touch-target inline-flex items-center rounded-xl bg-projeto-700 px-4 text-sm font-medium text-white">
                Ligar
              </a>
            )}
            {conversaHref && (
              <a
                href={conversaHref}
                target="_blank"
                rel="noreferrer"
                className="touch-target inline-flex items-center rounded-xl border border-concreto-300 px-4 text-sm font-medium"
              >
                WhatsApp
              </a>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-concreto-300 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base">Contatos</h2>
            <button
              type="button"
              disabled={ocupado}
              onClick={faleiAgora}
              className="touch-target rounded-xl border border-concreto-300 px-4 font-display text-sm disabled:opacity-50"
            >
              Falei agora
            </button>
          </div>
          {contatos.length === 0 ? (
            <p className="mt-3 text-sm text-tinta-suave">Nenhum contato registrado.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {contatos.slice(0, 5).map((contato) => (
                <li key={contato.id} className="text-sm">
                  <p>{contato.nota}</p>
                  <p className="text-tinta-suave">
                    {new Date(contato.criado_em).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border border-concreto-300 bg-white p-4">
          <h2 className="font-display text-base">Nova proposta</h2>
          {templates.length === 0 ? (
            <p className="text-sm text-tinta-suave">Nenhum template nesta conta.</p>
          ) : (
            <>
              <label className="text-sm text-tinta-suave">
                Template
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={CLASSE_CONTROLE + " border-concreto-300"}
                >
                  {templates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-tinta-suave">
                Escopo
                <textarea
                  value={escopo}
                  onChange={(e) => setEscopo(e.target.value)}
                  rows={3}
                  className={CLASSE_CONTROLE + " border-concreto-300"}
                />
              </label>
              <Campo label="Valor" value={valorTexto} onChange={setValorTexto} inputMode="text" dica="Ex.: 15000 ou 15.000,00" />
              <Campo label="Prazo em dias" value={prazoTexto} onChange={setPrazoTexto} inputMode="numeric" />
              {camposExtras.map((campo) => (
                <Campo
                  key={campo}
                  label={campo}
                  value={extras[campo] ?? ""}
                  onChange={(valorCampo) => setExtras((atual) => ({ ...atual, [campo]: valorCampo }))}
                />
              ))}
            </>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-sm uppercase tracking-wide text-tinta-suave">Propostas</h2>
          {propostas.length === 0 && <p className="text-sm text-tinta-suave">Nenhuma ainda.</p>}
          {propostas.map((proposta) => {
            const dias = diasDesde(proposta.enviada_em);
            const textoWhatsapp = `Olá ${nome}, segue a proposta${proposta.valor != null ? ` de ${formatarMoeda(Number(proposta.valor))}` : ""}: ${proposta.pdf_url}`;
            const whatsappPdf = proposta.pdf_url ? linkWhatsapp(whatsapp, textoWhatsapp) : "";
            return (
              <article key={proposta.id} className="rounded-2xl border border-concreto-300 bg-white p-4">
                <p className="font-medium capitalize">{proposta.status}</p>
                <p className="mt-1 text-sm text-tinta-suave">
                  {proposta.valor != null && formatarMoeda(Number(proposta.valor))}
                  {proposta.prazo_dias != null && ` · ${proposta.prazo_dias} dias`}
                  {dias !== null && ` · há ${dias} ${dias === 1 ? "dia" : "dias"}`}
                </p>
                {proposta.escopo && <p className="mt-1 line-clamp-2 text-sm text-tinta-suave">{proposta.escopo}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {proposta.pdf_url && (
                    <a
                      href={proposta.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-target inline-flex items-center rounded-xl bg-projeto-700 px-4 text-sm font-medium text-white"
                    >
                      Ver PDF
                    </a>
                  )}
                  {whatsappPdf && (
                    <a
                      href={whatsappPdf}
                      target="_blank"
                      rel="noreferrer"
                      className="touch-target inline-flex items-center rounded-xl border border-concreto-300 px-4 text-sm font-medium"
                    >
                      Enviar no WhatsApp
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-concreto-300 bg-concreto-100 px-4 py-3">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {erro && <p className="text-sm text-alerta">{erro}</p>}
          {aviso && <p className="text-sm text-concluido">{aviso}</p>}
          <button
            type="button"
            disabled={principalDesabilitada}
            onClick={acaoPrincipal}
            className="touch-target w-full rounded-xl bg-sinalizacao font-display text-base font-medium text-tinta disabled:opacity-50"
          >
            {ocupado ? "Salvando..." : rotuloPrincipal}
          </button>
        </div>
      </div>
    </main>
  );
}
