"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BotaoGravarAudio } from "@/components/captura/BotaoGravarAudio";
import { BotaoFoto } from "@/components/captura/BotaoFoto";
import { BotaoTexto } from "@/components/captura/BotaoTexto";
import { FeedDoDia } from "@/components/captura/FeedDoDia";
import { useCapturaObra } from "@/components/captura/useCapturaObra";

export default function CapturaObraPage({
  params,
}: {
  params: Promise<{ obraId: string }>;
}) {
  const { obraId } = use(params);
  const { midias, registroDiaId, carregando, enviando, erro, enviarArquivo, enviarTexto } =
    useCapturaObra(obraId);
  const [fechando, setFechando] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  async function fecharDia() {
    if (!registroDiaId) return;
    setFechando(true);
    try {
      const resposta = await fetch(`/api/registros-dia/${registroDiaId}/fechar`, {
        method: "POST",
      });
      if (!resposta.ok) throw new Error();
      setDialogoAberto(false);
    } catch {
      alert("Não consegui fechar o dia agora. Tenta de novo em instantes.");
    } finally {
      setFechando(false);
    }
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex h-dvh flex-col bg-concreto-100">
      <header className="flex items-center justify-between border-b border-concreto-300 bg-projeto-900 px-4 py-4 text-white">
        <div>
          <h1 className="font-display text-lg leading-tight">Registro de hoje</h1>
          <p className="text-sm capitalize text-concreto-300">{hoje}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/obras/${obraId}/dashboard`} className="text-sm text-concreto-300 underline">
            Painel
          </Link>
          <Link href={`/obras/${obraId}/documentos`} className="text-sm text-concreto-300 underline">
            Documentos
          </Link>
          <Link href={`/obras/${obraId}/financeiro`} className="text-sm text-concreto-300 underline">
            Financeiro
          </Link>
          <Link href={`/obras/${obraId}/mao-de-obra`} className="text-sm text-concreto-300 underline">
            Mão de obra
          </Link>
          <Link href="/leads" className="text-sm text-concreto-300 underline">
            Leads
          </Link>
        </div>
      </header>

      {erro && (
        <div className="bg-alerta/10 px-4 py-2 text-sm text-alerta">{erro}</div>
      )}

      {carregando ? (
        <div className="flex flex-1 items-center justify-center text-tinta-suave">
          Carregando o dia...
        </div>
      ) : (
        <FeedDoDia midias={midias} />
      )}

      {midias.length > 0 && (
        <div className="fixed bottom-[92px] left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={() => setDialogoAberto(true)}
            className="rounded-full bg-projeto-900 px-4 py-2 text-sm font-display text-white shadow-lg"
          >
            Fechar o dia
          </button>
        </div>
      )}

      {dialogoAberto && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40" role="dialog">
          <div className="w-full rounded-t-2xl bg-white p-5">
            <h2 className="font-display text-lg">Fechar o dia?</h2>
            <p className="mt-1 text-sm text-tinta-suave">
              Vou transcrever os áudios e montar o RDO em PDF de hoje. Não dá pra adicionar mais
              nada depois de fechar.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setDialogoAberto(false)}
                className="touch-target flex-1 rounded-xl border border-concreto-300 font-medium text-tinta-suave"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={fechando}
                onClick={fecharDia}
                className="touch-target flex-1 rounded-xl bg-projeto-700 font-display font-medium text-white disabled:opacity-50"
              >
                {fechando ? "Processando..." : "Fechar e gerar RDO"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 flex gap-2 border-t border-concreto-300 bg-concreto-50 p-3">
        <BotaoGravarAudio
          enviando={enviando}
          onGravado={(blob) => enviarArquivo(blob, "audio", "audio.webm")}
        />
        <BotaoFoto
          enviando={enviando}
          onFoto={(arquivo) => enviarArquivo(arquivo, "foto", arquivo.name)}
        />
        <BotaoTexto enviando={enviando} onEnviar={enviarTexto} />
      </div>
    </div>
  );
}
