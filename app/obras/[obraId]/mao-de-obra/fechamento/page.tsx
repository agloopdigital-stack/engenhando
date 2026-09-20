"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { obterSemanaAtual, formatarReal } from "@/lib/mao-de-obra/semana";
import type { Trabalhador } from "@/lib/types";

interface ResumoTrabalhador {
  trabalhador: Trabalhador;
  diasTrabalhados: number;
  totalBruto: number;
  totalVales: number;
  totalLiquido: number;
}

export default function FechamentoSemanalPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);
  const supabase = createClient();
  const { inicio, fim } = obterSemanaAtual();

  const [resumos, setResumos] = useState<ResumoTrabalhador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [fechados, setFechados] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: trabalhadores } = await supabase
        .from("trabalhadores")
        .select("*")
        .eq("obra_id", obraId)
        .eq("ativo", true);

      const resultado: ResumoTrabalhador[] = [];

      for (const trabalhador of trabalhadores ?? []) {
        const [{ count: diasTrabalhados }, { data: valesDaSemana }] = await Promise.all([
          supabase
            .from("checkins")
            .select("*", { count: "exact", head: true })
            .eq("trabalhador_id", trabalhador.id)
            .eq("presente", true)
            .gte("data", inicio)
            .lte("data", fim),
          supabase
            .from("vales")
            .select("valor")
            .eq("trabalhador_id", trabalhador.id)
            .gte("data", inicio)
            .lte("data", fim),
        ]);

        const dias = diasTrabalhados ?? 0;
        const totalBruto = dias * Number(trabalhador.valor_diaria);
        const totalVales = (valesDaSemana ?? []).reduce((s, v) => s + Number(v.valor), 0);

        resultado.push({
          trabalhador,
          diasTrabalhados: dias,
          totalBruto,
          totalVales,
          totalLiquido: totalBruto - totalVales,
        });
      }

      setResumos(resultado);
      setCarregando(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId, inicio, fim]);

  async function fecharSemana(resumo: ResumoTrabalhador) {
    await supabase.from("fechamentos_semanais").upsert(
      {
        trabalhador_id: resumo.trabalhador.id,
        semana_inicio: inicio,
        semana_fim: fim,
        total_dias: resumo.diasTrabalhados,
        total_bruto: resumo.totalBruto,
        total_vales: resumo.totalVales,
        total_liquido: resumo.totalLiquido,
      },
      { onConflict: "trabalhador_id,semana_inicio" }
    );
    setFechados((atual) => new Set(atual).add(resumo.trabalhador.id));
  }

  return (
    <div className="min-h-dvh bg-concreto-100 pb-16">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <h1 className="font-display text-xl">Fechamento da semana</h1>
        <p className="text-sm text-concreto-300">
          {new Date(inicio + "T00:00:00").toLocaleDateString("pt-BR")} a{" "}
          {new Date(fim + "T00:00:00").toLocaleDateString("pt-BR")}
        </p>
      </header>

      {carregando ? (
        <p className="p-6 text-tinta-suave">Calculando...</p>
      ) : (
        <ul className="flex flex-col gap-3 px-4 pt-4">
          {resumos.length === 0 && (
            <p className="mt-8 text-center text-tinta-suave">Nenhum trabalhador cadastrado.</p>
          )}

          {resumos.map((r) => (
            <li key={r.trabalhador.id} className="rounded-2xl border border-concreto-300 bg-white p-4">
              <p className="font-display font-medium">{r.trabalhador.nome}</p>
              <div className="mt-2 flex flex-col gap-1 text-sm text-tinta-suave">
                <span>
                  {r.diasTrabalhados} dias × {formatarReal(Number(r.trabalhador.valor_diaria))} ={" "}
                  {formatarReal(r.totalBruto)}
                </span>
                {r.totalVales > 0 && <span>Vales descontados: −{formatarReal(r.totalVales)}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-concreto-200 pt-3">
                <span className="font-display text-lg font-medium">
                  {formatarReal(r.totalLiquido)}
                </span>
                <button
                  type="button"
                  onClick={() => fecharSemana(r)}
                  disabled={fechados.has(r.trabalhador.id)}
                  className="touch-target rounded-xl bg-projeto-700 px-4 font-display text-sm font-medium text-white disabled:opacity-40"
                >
                  {fechados.has(r.trabalhador.id) ? "Fechado ✓" : "Fechar semana"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
