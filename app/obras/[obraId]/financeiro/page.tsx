"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Orcamento, Gasto } from "@/lib/types";

const CATEGORIAS_PADRAO = [
  "Fundação",
  "Alvenaria",
  "Elétrica",
  "Hidráulica",
  "Acabamento",
  "Outros",
];

function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinanceiroObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);
  const supabase = createClient();

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formGastoAberto, setFormGastoAberto] = useState(false);
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [valor, setValor] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [arquivoNota, setArquivoNota] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const [{ data: orcs }, { data: gts }] = await Promise.all([
      supabase.from("orcamentos").select("*").eq("obra_id", obraId),
      supabase.from("gastos").select("*").eq("obra_id", obraId).order("data", { ascending: false }),
    ]);
    setOrcamentos(orcs ?? []);
    setGastos(gts ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  const categorias = [
    ...new Set([...CATEGORIAS_PADRAO, ...orcamentos.map((o) => o.categoria), ...gastos.map((g) => g.categoria)]),
  ];

  function totalGastoDaCategoria(cat: string) {
    return gastos.filter((g) => g.categoria === cat).reduce((soma, g) => soma + Number(g.valor), 0);
  }

  function orcadoDaCategoria(cat: string) {
    return orcamentos.find((o) => o.categoria === cat)?.valor_orcado ?? 0;
  }

  const totalOrcado = categorias.reduce((s, c) => s + orcadoDaCategoria(c), 0);
  const totalGasto = categorias.reduce((s, c) => s + totalGastoDaCategoria(c), 0);

  async function definirOrcamento(cat: string) {
    const atual = orcadoDaCategoria(cat);
    const valorStr = prompt(`Orçamento para "${cat}" (R$):`, atual ? String(atual) : "");
    if (valorStr === null) return;
    const valorNum = Number(valorStr.replace(",", "."));
    if (Number.isNaN(valorNum)) return;

    await supabase
      .from("orcamentos")
      .upsert({ obra_id: obraId, categoria: cat, valor_orcado: valorNum }, { onConflict: "obra_id,categoria" });
    carregar();
  }

  async function salvarGasto(e: React.FormEvent) {
    e.preventDefault();
    const valorNum = Number(valor.replace(",", "."));
    if (Number.isNaN(valorNum) || valorNum <= 0) return;
    setSalvando(true);

    const { data: usuario } = await supabase.auth.getUser();
    let notaFiscalUrl: string | null = null;

    if (arquivoNota) {
      const caminho = `${obraId}/gastos/${Date.now()}-${arquivoNota.name}`;
      const { error } = await supabase.storage.from("midias").upload(caminho, arquivoNota);
      if (!error) {
        notaFiscalUrl = supabase.storage.from("midias").getPublicUrl(caminho).data.publicUrl;
      }
    }

    await supabase.from("gastos").insert({
      obra_id: obraId,
      categoria,
      valor: valorNum,
      fornecedor: fornecedor || null,
      nota_fiscal_url: notaFiscalUrl,
      criado_por: usuario.user?.id,
    });

    setFormGastoAberto(false);
    setValor("");
    setFornecedor("");
    setArquivoNota(null);
    setSalvando(false);
    carregar();
  }

  return (
    <div className="min-h-dvh bg-concreto-100 pb-24">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <div>
          <h1 className="font-display text-xl">Orçado x Realizado</h1>
          <p className="text-sm text-concreto-300">
            {formatarReal(totalGasto)} de {formatarReal(totalOrcado)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormGastoAberto(true)}
          className="touch-target rounded-xl bg-sinalizacao px-4 font-display text-sm font-medium"
        >
          + Gasto
        </button>
      </header>

      {!carregando && (
        <div className="flex flex-col gap-4 px-4 pt-5">
          {categorias.map((cat) => {
            const orcado = orcadoDaCategoria(cat);
            const gasto = totalGastoDaCategoria(cat);
            const maximo = Math.max(orcado, gasto, 1);
            const estourou = orcado > 0 && gasto > orcado;

            return (
              <div key={cat} className="rounded-2xl border border-concreto-300 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => definirOrcamento(cat)}
                    className="font-display text-sm font-medium underline decoration-dotted"
                  >
                    {cat}
                  </button>
                  <span className={`text-sm ${estourou ? "text-alerta" : "text-tinta-suave"}`}>
                    {formatarReal(gasto)} / {formatarReal(orcado)}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-concreto-200">
                    <div
                      className="h-full rounded-full bg-concreto-300"
                      style={{ width: `${(orcado / maximo) * 100}%` }}
                    />
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-concreto-200">
                    <div
                      className={`h-full rounded-full ${estourou ? "bg-alerta" : "bg-projeto-700"}`}
                      style={{ width: `${(gasto / maximo) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="px-4 pt-6">
        <h2 className="mb-2 font-display text-sm font-medium uppercase tracking-wide text-tinta-suave">
          Últimos gastos
        </h2>
        <ul className="flex flex-col gap-2">
          {gastos.slice(0, 10).map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium">{g.categoria}</p>
                <p className="text-xs text-tinta-suave">
                  {g.fornecedor ?? "Sem fornecedor"} ·{" "}
                  {new Date(g.data + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className="font-display text-sm font-medium">{formatarReal(Number(g.valor))}</span>
            </li>
          ))}
        </ul>
      </section>

      {formGastoAberto && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" role="dialog">
          <form
            onSubmit={salvarGasto}
            className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-5"
          >
            <h2 className="font-display text-lg">Novo gasto</h2>

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              inputMode="decimal"
              required
              placeholder="Valor (R$)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />

            <input
              placeholder="Fornecedor (opcional)"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />

            <label className="touch-target flex items-center justify-center rounded-xl border-2 border-dashed border-concreto-300 text-sm text-tinta-suave">
              {arquivoNota ? arquivoNota.name : "Foto da nota (opcional)"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setArquivoNota(e.target.files?.[0] ?? null)}
              />
            </label>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setFormGastoAberto(false)}
                className="touch-target flex-1 rounded-xl border border-concreto-300 font-medium text-tinta-suave"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="touch-target flex-1 rounded-xl bg-projeto-700 font-display font-medium text-white disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
