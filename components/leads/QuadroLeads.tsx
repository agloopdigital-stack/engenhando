"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ESTAGIOS,
  abrirObraDoLead,
  atualizarEstagio,
  formatarMoeda,
  ordenarLeads,
  somaValor,
  temPropostaEnviada,
  type LeadLista,
} from "@/lib/crm/funil";
import type { EstagioLead } from "@/lib/types";
import { ResumoLead } from "./ListaLeads";
import { FolhaEstagio } from "./FolhaEstagio";

const RECOLHIVEIS: EstagioLead[] = ["fechado", "perdido"];

type Aviso = { texto: string; leadObra?: string };

export function QuadroLeads({
  leads,
  setLeads,
}: {
  leads: LeadLista[];
  setLeads: Dispatch<SetStateAction<LeadLista[]>>;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [alvo, setAlvo] = useState<EstagioLead | null>(null);
  const [abertas, setAbertas] = useState<EstagioLead[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [abrindoObra, setAbrindoObra] = useState(false);

  const ordenados = useMemo(() => ordenarLeads(leads), [leads]);
  const leadSelecionado = leads.find((lead) => lead.id === selecionado) ?? null;
  const fecharFolha = useCallback(() => setSelecionado(null), []);

  async function mover(leadId: string, estagio: EstagioLead) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.estagio === estagio) return;

    setErro(null);
    setAviso(null);
    const anterior = lead.estagio;
    setLeads((atual) => atual.map((item) => (item.id === leadId ? { ...item, estagio } : item)));

    const ok = await atualizarEstagio(supabase, leadId, estagio);
    if (!ok) {
      setLeads((atual) => atual.map((item) => (item.id === leadId ? { ...item, estagio: anterior } : item)));
      setErro("Não consegui mudar o estágio.");
      return;
    }

    if (estagio === "fechado" && !lead.obraRelacionada) {
      setAviso({ texto: `${lead.nome} fechou. A obra ainda não foi aberta.`, leadObra: lead.id });
    } else if (estagio === "proposta_enviada" && !temPropostaEnviada(lead)) {
      setAviso({ texto: `${lead.nome} ainda não tem proposta enviada.` });
    }
  }

  async function abrirObra(leadId: string) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.obraRelacionada) return;

    setAbrindoObra(true);
    setErro(null);
    const resultado = await abrirObraDoLead(supabase, {
      id: lead.id,
      contaId: lead.contaId,
      nome: lead.nome,
      endereco: lead.endereco,
      contato: lead.whatsapp || lead.email,
    });

    if ("erro" in resultado) {
      setErro(resultado.erro);
      setAbrindoObra(false);
      return;
    }

    router.push(`/obras/${resultado.obraId}`);
  }

  function alternarColuna(estagio: EstagioLead) {
    setAbertas((atual) => (atual.includes(estagio) ? atual.filter((item) => item !== estagio) : [...atual, estagio]));
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && (
        <p className="text-sm text-alerta" role="alert">
          {erro}
        </p>
      )}
      {aviso && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-concreto-300 bg-white px-4 py-2"
        >
          <p className="text-sm">{aviso.texto}</p>
          <div className="flex gap-2">
            {aviso.leadObra && (
              <button
                type="button"
                disabled={abrindoObra}
                onClick={() => abrirObra(aviso.leadObra as string)}
                className="touch-target rounded-xl bg-projeto-700 px-4 font-display text-sm text-white disabled:opacity-50"
              >
                {abrindoObra ? "Abrindo..." : "Abrir obra"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAviso(null)}
              className="touch-target rounded-xl border border-concreto-300 px-4 font-display text-sm"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-tinta-suave md:hidden">Deslize para ver os outros estágios. Toque no lead para mudar.</p>

      <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:snap-none">
        {ESTAGIOS.map(({ chave, rotulo }) => {
          const doEstagio = ordenados.filter((lead) => lead.estagio === chave);
          const soma = somaValor(doEstagio);
          const recolhivel = RECOLHIVEIS.includes(chave);
          const recolhida = recolhivel && !abertas.includes(chave);

          return (
            <section
              key={chave}
              aria-label={rotulo}
              onDragOver={(e) => {
                if (!arrastando) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (alvo !== chave) setAlvo(chave);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setAlvo((atual) => (atual === chave ? null : atual));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || arrastando;
                setAlvo(null);
                setArrastando(null);
                if (id) mover(id, chave);
              }}
              className={`flex w-[85vw] max-w-sm shrink-0 snap-start flex-col rounded-xl border p-3 transition-colors md:max-w-none ${
                recolhida ? "md:w-44" : "md:w-72"
              } ${alvo === chave ? "border-projeto-500 bg-white" : "border-concreto-300 bg-concreto-50"}`}
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-sm">
                    {rotulo} · {doEstagio.length}
                  </h2>
                  {soma > 0 && <p className="mt-1 text-sm text-tinta-suave">{formatarMoeda(soma)}</p>}
                </div>
                {recolhivel && doEstagio.length > 0 && (
                  <button
                    type="button"
                    aria-expanded={!recolhida}
                    onClick={() => alternarColuna(chave)}
                    className="shrink-0 py-1 text-sm font-medium text-projeto-700"
                  >
                    {recolhida ? "Mostrar" : "Recolher"}
                  </button>
                )}
              </header>

              {!recolhida && (
                <ul className="mt-3 flex flex-col gap-2">
                  {doEstagio.length === 0 && <li className="py-4 text-center text-sm text-tinta-suave">Nenhum lead aqui.</li>}
                  {doEstagio.map((lead) => (
                    <li key={lead.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        draggable
                        aria-label={`${lead.nome}, ${rotulo}. Mudar estágio`}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", lead.id);
                          e.dataTransfer.effectAllowed = "move";
                          setArrastando(lead.id);
                        }}
                        onDragEnd={() => {
                          setArrastando(null);
                          setAlvo(null);
                        }}
                        onClick={() => setSelecionado(lead.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelecionado(lead.id);
                          }
                        }}
                        className={`cursor-pointer rounded-xl border border-concreto-300 bg-white p-3 outline-none focus-visible:border-projeto-500 ${
                          arrastando === lead.id ? "opacity-50" : ""
                        }`}
                      >
                        <ResumoLead lead={lead} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {leadSelecionado && (
        <FolhaEstagio
          lead={leadSelecionado}
          abrindoObra={abrindoObra}
          onEscolher={(estagio) => {
            fecharFolha();
            mover(leadSelecionado.id, estagio);
          }}
          onAbrirObra={() => abrirObra(leadSelecionado.id)}
          onFechar={fecharFolha}
        />
      )}
    </div>
  );
}
