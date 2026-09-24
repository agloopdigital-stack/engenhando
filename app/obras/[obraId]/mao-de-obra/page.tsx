"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Trabalhador, FuncaoTrabalhador } from "@/lib/types";

const ROTULOS_FUNCAO: Record<FuncaoTrabalhador, string> = {
  pedreiro: "Pedreiro",
  servente: "Servente",
  eletricista: "Eletricista",
  encanador: "Encanador",
  outro: "Outro",
};

const hojeISO = new Date().toISOString().slice(0, 10);

export default function MaoDeObraPage({ params }: { params: Promise<{ obraId: string }> }) {
  const { obraId } = use(params);
  const supabase = createClient();

  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);
  const [presentesHoje, setPresentesHoje] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [formValeAberto, setFormValeAberto] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState<FuncaoTrabalhador>("pedreiro");
  const [valorDiaria, setValorDiaria] = useState("");
  const [valorVale, setValorVale] = useState("");

  async function carregar() {
    const [{ data: trabs }, { data: checkinsHoje }] = await Promise.all([
      supabase.from("trabalhadores").select("*").eq("obra_id", obraId).eq("ativo", true),
      supabase
        .from("checkins")
        .select("trabalhador_id")
        .eq("obra_id", obraId)
        .eq("data", hojeISO)
        .eq("presente", true),
    ]);
    setTrabalhadores(trabs ?? []);
    setPresentesHoje(new Set((checkinsHoje ?? []).map((c) => c.trabalhador_id)));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  async function alternarPresenca(trabalhadorId: string) {
    const estaPresente = presentesHoje.has(trabalhadorId);
    const novoConjunto = new Set(presentesHoje);

    if (estaPresente) {
      novoConjunto.delete(trabalhadorId);
      setPresentesHoje(novoConjunto);
      await supabase.from("checkins").delete().eq("trabalhador_id", trabalhadorId).eq("data", hojeISO);
    } else {
      novoConjunto.add(trabalhadorId);
      setPresentesHoje(novoConjunto);
      await supabase
        .from("checkins")
        .upsert(
          { trabalhador_id: trabalhadorId, obra_id: obraId, data: hojeISO, presente: true },
          { onConflict: "trabalhador_id,data" }
        );
    }
  }

  async function salvarTrabalhador(e: React.FormEvent) {
    e.preventDefault();
    const diaria = Number(valorDiaria.replace(",", "."));
    if (!nome || Number.isNaN(diaria)) return;

    await supabase.from("trabalhadores").insert({ obra_id: obraId, nome, funcao, valor_diaria: diaria });
    setFormAberto(false);
    setNome("");
    setValorDiaria("");
    carregar();
  }

  async function salvarVale(e: React.FormEvent) {
    e.preventDefault();
    const valorNum = Number(valorVale.replace(",", "."));
    if (!formValeAberto || Number.isNaN(valorNum) || valorNum <= 0) return;

    await supabase.from("vales").insert({ trabalhador_id: formValeAberto, valor: valorNum });
    setFormValeAberto(null);
    setValorVale("");
  }

  return (
    <div className="min-h-dvh bg-concreto-100 pb-24">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <div>
          <h1 className="font-display text-xl">Quem está na obra hoje</h1>
          <Link
            href={`/obras/${obraId}/mao-de-obra/fechamento`}
            className="text-sm text-concreto-300 underline"
          >
            Ver fechamento semanal
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setFormAberto(true)}
          className="touch-target rounded-xl bg-sinalizacao px-4 font-display text-sm font-medium"
        >
          + Pessoa
        </button>
      </header>

      {!carregando && (
        <ul className="flex flex-col gap-2 px-4 pt-4">
          {trabalhadores.length === 0 && (
            <p className="mt-8 text-center text-tinta-suave">
              Nenhum trabalhador cadastrado ainda pra esta obra.
            </p>
          )}

          {trabalhadores.map((t) => {
            const presente = presentesHoje.has(t.id);
            return (
              <li key={t.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alternarPresenca(t.id)}
                  className={`touch-target flex flex-1 items-center justify-between rounded-2xl border-2 px-4 font-medium transition-colors ${
                    presente
                      ? "border-concluido bg-concluido/10 text-concluido"
                      : "border-concreto-300 bg-white text-tinta"
                  }`}
                >
                  <span>
                    {t.nome}
                    <span className="ml-2 text-sm text-tinta-suave">
                      {ROTULOS_FUNCAO[t.funcao]}
                    </span>
                  </span>
                  <span>{presente ? "✓ Presente" : "Marcar presença"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormValeAberto(t.id)}
                  className="touch-target rounded-xl border border-concreto-300 px-3 text-sm text-tinta-suave"
                >
                  Vale
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {formAberto && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" role="dialog">
          <form
            onSubmit={salvarTrabalhador}
            className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-5"
          >
            <h2 className="font-display text-lg">Novo trabalhador</h2>
            <input
              required
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />
            <select
              value={funcao}
              onChange={(e) => setFuncao(e.target.value as FuncaoTrabalhador)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            >
              {Object.entries(ROTULOS_FUNCAO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
            <input
              required
              inputMode="decimal"
              placeholder="Valor da diária (R$)"
              value={valorDiaria}
              onChange={(e) => setValorDiaria(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFormAberto(false)}
                className="touch-target flex-1 rounded-xl border border-concreto-300 font-medium text-tinta-suave"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="touch-target flex-1 rounded-xl bg-projeto-700 font-display font-medium text-white"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {formValeAberto && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" role="dialog">
          <form onSubmit={salvarVale} className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-5">
            <h2 className="font-display text-lg">Registrar vale</h2>
            <input
              required
              autoFocus
              inputMode="decimal"
              placeholder="Valor do vale (R$)"
              value={valorVale}
              onChange={(e) => setValorVale(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFormValeAberto(null)}
                className="touch-target flex-1 rounded-xl border border-concreto-300 font-medium text-tinta-suave"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="touch-target flex-1 rounded-xl bg-projeto-700 font-display font-medium text-white"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
