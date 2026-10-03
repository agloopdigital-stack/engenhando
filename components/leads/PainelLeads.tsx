"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeadLista } from "@/lib/crm/funil";
import { salvarQuadro, type QuadroLead } from "@/lib/crm/quadro";
import { EditorColunas } from "./EditorColunas";
import { ListaLeads } from "./ListaLeads";
import { QuadroLeads } from "./QuadroLeads";

type Visao = "lista" | "quadro";

const CHAVE_VISAO = "engenhando.leads.visao";

export function PainelLeads({
  leadsIniciais,
  quadroInicial,
  contaId,
}: {
  leadsIniciais: LeadLista[];
  quadroInicial: QuadroLead;
  contaId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [leads, setLeads] = useState(leadsIniciais);
  const [quadro, setQuadro] = useState(quadroInicial);
  const [visao, setVisao] = useState<Visao>("lista");
  const [editando, setEditando] = useState(false);
  const [salvandoQuadro, setSalvandoQuadro] = useState(false);
  const [erroQuadro, setErroQuadro] = useState<string | null>(null);
  const fecharEditor = useCallback(() => {
    setEditando(false);
    setErroQuadro(null);
  }, []);

  useEffect(() => {
    const salva = localStorage.getItem(CHAVE_VISAO);
    if (salva === "lista" || salva === "quadro") {
      setVisao(salva);
    } else if (window.matchMedia("(min-width: 768px)").matches) {
      setVisao("quadro");
    }
  }, []);

  function escolher(proxima: Visao) {
    setVisao(proxima);
    localStorage.setItem(CHAVE_VISAO, proxima);
  }

  async function salvar(proximo: QuadroLead) {
    if (!contaId) return;
    setSalvandoQuadro(true);
    setErroQuadro(null);
    const salvo = await salvarQuadro(supabase, contaId, proximo);
    setSalvandoQuadro(false);
    if (!salvo) {
      setErroQuadro("Não consegui salvar as colunas.");
      return;
    }
    setQuadro(salvo);
    setEditando(false);
  }

  return (
    <div className={`mx-auto flex w-full flex-col gap-4 pb-6 ${visao === "quadro" ? "max-w-none" : "max-w-3xl"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">Leads</h1>
          <p className="mt-1 text-sm text-tinta-suave">Quem pediu orçamento e quem está esperando retorno.</p>
          {contaId && (
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="mt-1 inline-flex touch-target items-center text-sm font-medium text-projeto-700"
            >
              Colunas
            </button>
          )}
        </div>
        <div role="group" aria-label="Visão" className="flex shrink-0 overflow-hidden rounded-xl border border-concreto-300 bg-white">
          {(["lista", "quadro"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-pressed={visao === opcao}
              onClick={() => escolher(opcao)}
              className={`touch-target px-4 font-display text-sm ${
                visao === opcao ? "bg-projeto-900 text-white" : "text-tinta"
              }`}
            >
              {opcao === "lista" ? "Lista" : "Quadro"}
            </button>
          ))}
        </div>
      </div>

      {visao === "quadro" ? (
        <QuadroLeads leads={leads} setLeads={setLeads} quadro={quadro} />
      ) : (
        <ListaLeads leads={leads} quadro={quadro} />
      )}

      {editando && (
        <EditorColunas
          quadro={quadro}
          salvando={salvandoQuadro}
          erro={erroQuadro}
          onSalvar={salvar}
          onFechar={fecharEditor}
        />
      )}
    </div>
  );
}
