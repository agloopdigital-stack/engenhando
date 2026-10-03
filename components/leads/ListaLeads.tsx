"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  DIAS_FOLLOWUP,
  ESTAGIOS,
  diasDesde,
  formatarMoeda,
  ordenarLeads,
  pedeRetorno,
  type LeadLista,
} from "@/lib/crm/funil";
import type { EstagioLead } from "@/lib/types";

type Filtro = EstagioLead | "todos" | "atencao";

export function ListaLeads({ leads }: { leads: LeadLista[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const ordenados = useMemo(() => ordenarLeads(leads), [leads]);
  const atencao = ordenados.filter(pedeRetorno).length;

  const visiveis =
    filtro === "todos"
      ? ordenados
      : filtro === "atencao"
        ? ordenados.filter(pedeRetorno)
        : ordenados.filter((lead) => lead.estagio === filtro);

  return (
    <div className="flex flex-col gap-4">
      {atencao > 0 && (
        <button
          type="button"
          onClick={() => setFiltro("atencao")}
          className="rounded-xl bg-alerta/10 px-4 py-3 text-left text-sm font-medium text-alerta"
        >
          {atencao === 1 ? "1 proposta pede retorno" : `${atencao} propostas pedem retorno`}
        </button>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>
          Todos · {ordenados.length}
        </Chip>
        {ESTAGIOS.map((estagio) => {
          const quantidade = ordenados.filter((lead) => lead.estagio === estagio.chave).length;
          return (
            <Chip
              key={estagio.chave}
              ativo={filtro === estagio.chave}
              onClick={() => setFiltro(estagio.chave)}
            >
              {estagio.rotulo} · {quantidade}
            </Chip>
          );
        })}
      </div>

      {visiveis.length === 0 ? (
        <p className="py-10 text-center text-sm text-tinta-suave">
          {ordenados.length === 0
            ? "Nenhum lead ainda. O primeiro cliente entra pelo botão abaixo."
            : "Nenhum lead neste estágio."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((lead) => (
            <li key={lead.id}>
              <CardLead lead={lead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`touch-target shrink-0 rounded-xl border px-4 font-display text-sm ${
        ativo ? "border-projeto-900 bg-projeto-900 text-white" : "border-concreto-300 bg-white text-tinta"
      }`}
    >
      {children}
    </button>
  );
}

function CardLead({ lead }: { lead: LeadLista }) {
  const dias = diasDesde(lead.proposta?.enviada_em);
  const atrasada =
    pedeRetorno(lead) && dias !== null && dias >= DIAS_FOLLOWUP && lead.proposta?.status === "enviada";
  const contato = lead.whatsapp || lead.email;

  return (
    <Link href={`/leads/${lead.id}`} className="block rounded-2xl border border-concreto-300 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base leading-tight">{lead.nome}</p>
          {lead.tipoServico && <p className="mt-1 text-sm text-tinta-suave">{lead.tipoServico}</p>}
          {contato && <p className="mt-1 text-sm text-tinta-suave">{contato}</p>}
        </div>
        <span className="shrink-0 text-sm text-projeto-700">{rotuloCurto(lead.estagio)}</span>
      </div>
      {(lead.proposta?.valor != null || dias !== null) && (
        <p className={`mt-2 text-sm ${atrasada ? "font-medium text-alerta" : "text-tinta-suave"}`}>
          {lead.proposta?.valor != null && formatarMoeda(lead.proposta.valor)}
          {lead.proposta?.valor != null && dias !== null && " · "}
          {dias !== null && `Proposta há ${dias} ${dias === 1 ? "dia" : "dias"}`}
        </p>
      )}
    </Link>
  );
}

function rotuloCurto(estagio: LeadLista["estagio"]) {
  return ESTAGIOS.find((item) => item.chave === estagio)?.rotulo ?? estagio;
}
