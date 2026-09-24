"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ROTULOS_TIPO_DOCUMENTO,
  calcularStatusVencimento,
  CORES_STATUS,
  ROTULOS_STATUS,
  diasAteVencimento,
} from "@/lib/alvaras/rotulos";
import type { DocumentoObra, TipoDocumentoObra } from "@/lib/types";

export default function DocumentosObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);
  const supabase = createClient();

  const [documentos, setDocumentos] = useState<DocumentoObra[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoDocumentoObra>("alvara_construcao");
  const [identificacao, setIdentificacao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const { data } = await supabase
      .from("documentos_obra")
      .select("*")
      .eq("obra_id", obraId)
      .order("data_vencimento", { ascending: true });
    setDocumentos(data ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obraId]);

  async function salvarDocumento(e: React.FormEvent) {
    e.preventDefault();
    if (!dataVencimento) return;
    setSalvando(true);

    const { data: usuario } = await supabase.auth.getUser();
    await supabase.from("documentos_obra").insert({
      obra_id: obraId,
      tipo,
      identificacao: identificacao || null,
      data_vencimento: dataVencimento,
      criado_por: usuario.user?.id,
    });

    setFormAberto(false);
    setIdentificacao("");
    setDataVencimento("");
    setSalvando(false);
    carregar();
  }

  return (
    <div className="min-h-dvh bg-concreto-100 pb-24">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-5 text-white">
        <h1 className="font-display text-xl">Documentos da obra</h1>
        <button
          type="button"
          onClick={() => setFormAberto(true)}
          className="touch-target rounded-xl bg-sinalizacao px-4 font-display text-sm font-medium"
        >
          + Documento
        </button>
      </header>

      {carregando ? (
        <p className="p-6 text-tinta-suave">Carregando...</p>
      ) : (
        <ul className="flex flex-col gap-2 px-4 pt-4">
          {documentos.length === 0 && (
            <p className="mt-8 text-center text-tinta-suave">
              Nenhum documento cadastrado ainda pra esta obra.
            </p>
          )}

          {documentos.map((doc) => {
            const status = calcularStatusVencimento(doc.data_vencimento);
            const dias = diasAteVencimento(doc.data_vencimento);
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-2xl border border-concreto-300 bg-white p-4"
              >
                <div>
                  <p className="font-medium">{ROTULOS_TIPO_DOCUMENTO[doc.tipo]}</p>
                  {doc.identificacao && (
                    <p className="text-sm text-tinta-suave">{doc.identificacao}</p>
                  )}
                  <p className="text-sm text-tinta-suave">
                    Vence em {new Date(doc.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                    {status !== "ok" && ` · ${dias >= 0 ? `${dias}d restantes` : `${-dias}d atrasado`}`}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-display font-medium text-white"
                  style={{ backgroundColor: CORES_STATUS[status] }}
                >
                  {ROTULOS_STATUS[status]}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {formAberto && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40" role="dialog">
          <form
            onSubmit={salvarDocumento}
            className="flex w-full flex-col gap-3 rounded-t-2xl bg-white p-5"
          >
            <h2 className="font-display text-lg">Novo documento</h2>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDocumentoObra)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            >
              {Object.entries(ROTULOS_TIPO_DOCUMENTO).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>

            <input
              placeholder="Número / identificação (opcional)"
              value={identificacao}
              onChange={(e) => setIdentificacao(e.target.value)}
              className="touch-target rounded-xl border border-concreto-300 px-3"
            />

            <label className="text-sm text-tinta-suave">
              Data de vencimento
              <input
                type="date"
                required
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="touch-target mt-1 w-full rounded-xl border border-concreto-300 px-3"
              />
            </label>

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
