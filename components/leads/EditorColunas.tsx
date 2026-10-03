"use client";

import { useEffect, useId, useState } from "react";
import {
  QUADRO_PADRAO,
  colunaObrigatoria,
  rotuloPadrao,
  type CabecalhoQuadro,
  type QuadroLead,
} from "@/lib/crm/quadro";

const CABECALHOS: { chave: CabecalhoQuadro; rotulo: string }[] = [
  { chave: "contagem", rotulo: "Contagem" },
  { chave: "soma", rotulo: "Soma" },
  { chave: "ambos", rotulo: "As duas" },
];

export function EditorColunas({
  quadro,
  salvando,
  erro,
  onSalvar,
  onFechar,
}: {
  quadro: QuadroLead;
  salvando: boolean;
  erro: string | null;
  onSalvar: (quadro: QuadroLead) => void;
  onFechar: () => void;
}) {
  const tituloId = useId();
  const [rascunho, setRascunho] = useState(quadro);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function mover(indice: number, direcao: -1 | 1) {
    const destino = indice + direcao;
    if (destino < 0 || destino >= rascunho.colunas.length) return;
    const colunas = [...rascunho.colunas];
    const [item] = colunas.splice(indice, 1);
    colunas.splice(destino, 0, item);
    setRascunho({ ...rascunho, colunas });
  }

  function renomear(indice: number, rotulo: string) {
    const colunas = rascunho.colunas.map((coluna, atual) => (atual === indice ? { ...coluna, rotulo } : coluna));
    setRascunho({ ...rascunho, colunas });
  }

  function alternarVisivel(indice: number) {
    const coluna = rascunho.colunas[indice];
    if (!coluna || colunaObrigatoria(coluna.estagio)) return;
    const colunas = rascunho.colunas.map((item, atual) =>
      atual === indice ? { ...item, visivel: !item.visivel } : item
    );
    setRascunho({ ...rascunho, colunas });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tinta/40 md:items-center" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        onClick={(evento) => evento.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white outline-none md:rounded-2xl"
      >
        <div className="overflow-y-auto px-4 pt-4">
          <h2 id={tituloId} className="font-display text-lg">
            Colunas do quadro
          </h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Vale para toda a conta. A lista e o detalhe do lead usam estes nomes. Uma coluna escondida sai do quadro, e os
            leads dela continuam na lista.
          </p>

          <p className="mt-4 text-sm text-tinta-suave">Cabeçalho de cada coluna</p>
          <div role="group" aria-label="Cabeçalho" className="mt-2 flex overflow-hidden rounded-xl border border-concreto-300">
            {CABECALHOS.map((opcao) => (
              <button
                key={opcao.chave}
                type="button"
                aria-pressed={rascunho.cabecalho === opcao.chave}
                onClick={() => setRascunho({ ...rascunho, cabecalho: opcao.chave })}
                className={`touch-target flex-1 px-2 font-display text-sm ${
                  rascunho.cabecalho === opcao.chave ? "bg-projeto-900 text-white" : "bg-white text-tinta"
                }`}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>

          <ul className="mt-4 flex flex-col gap-3 pb-4">
            {rascunho.colunas.map((coluna, indice) => {
              const obrigatoria = colunaObrigatoria(coluna.estagio);
              return (
                <li key={coluna.estagio} className="rounded-xl border border-concreto-300 p-3">
                  <label className="block text-sm text-tinta-suave" htmlFor={`coluna-${coluna.estagio}`}>
                    {rotuloPadrao(coluna.estagio)}
                  </label>
                  <input
                    id={`coluna-${coluna.estagio}`}
                    value={coluna.rotulo}
                    maxLength={40}
                    onChange={(evento) => renomear(indice, evento.target.value)}
                    className="touch-target mt-1 w-full rounded-xl border border-concreto-300 bg-white px-4 text-base text-tinta outline-none focus:border-projeto-500"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={indice === 0}
                      onClick={() => mover(indice, -1)}
                      className="touch-target rounded-xl border border-concreto-300 px-4 font-display text-sm disabled:opacity-40"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      disabled={indice === rascunho.colunas.length - 1}
                      onClick={() => mover(indice, 1)}
                      className="touch-target rounded-xl border border-concreto-300 px-4 font-display text-sm disabled:opacity-40"
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      aria-pressed={coluna.visivel}
                      disabled={obrigatoria}
                      onClick={() => alternarVisivel(indice)}
                      className={`touch-target rounded-xl border px-4 font-display text-sm disabled:opacity-70 ${
                        coluna.visivel ? "border-projeto-900 text-projeto-700" : "border-concreto-300 text-tinta-suave"
                      }`}
                    >
                      {obrigatoria ? "Sempre no quadro" : coluna.visivel ? "No quadro" : "Só na lista"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-concreto-300 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {erro && <p className="mb-2 text-sm text-alerta">{erro}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRascunho(QUADRO_PADRAO)}
              className="touch-target rounded-xl border border-concreto-300 px-4 font-display text-sm"
            >
              Padrão
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="touch-target flex-1 rounded-xl border border-concreto-300 font-display text-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={salvando}
              onClick={() => onSalvar(rascunho)}
              className="touch-target flex-1 rounded-xl bg-sinalizacao font-display text-sm font-medium text-tinta disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
