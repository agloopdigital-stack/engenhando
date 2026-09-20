"use client";

import { use } from "react";
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
  const { midias, carregando, enviando, erro, enviarArquivo, enviarTexto } =
    useCapturaObra(obraId);

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex h-dvh flex-col bg-concreto-100">
      <header className="border-b border-concreto-300 bg-projeto-900 px-4 py-4 text-white">
        <h1 className="font-display text-lg leading-tight">Registro de hoje</h1>
        <p className="text-sm capitalize text-concreto-300">{hoje}</p>
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
