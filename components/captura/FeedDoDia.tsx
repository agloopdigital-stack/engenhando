import type { Midia } from "@/lib/types";

interface FeedDoDiaProps {
  midias: Midia[];
}

export function FeedDoDia({ midias }: FeedDoDiaProps) {
  if (midias.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center text-tinta-suave">
        <p className="font-display text-lg">Nada registrado ainda hoje</p>
        <p className="text-sm">
          Toque em gravar áudio, tirar foto ou nota rápida assim que algo acontecer na obra.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-4">
      {midias.map((midia) => (
        <li
          key={midia.id}
          className="rounded-2xl border border-concreto-300 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs text-tinta-suave">
            <span className="font-display font-medium uppercase tracking-wide">
              {rotuloTipo(midia.tipo)}
            </span>
            <span>{formatarHora(midia.criado_em)}</span>
          </div>

          {midia.tipo === "foto" && midia.url_storage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={midia.url_storage}
              alt="Foto da obra"
              className="mt-2 max-h-56 w-full rounded-xl object-cover"
            />
          )}

          {midia.tipo === "audio" && (
            <div className="mt-2 space-y-1">
              {midia.url_storage && (
                <audio controls src={midia.url_storage} className="w-full" />
              )}
              <p className="text-sm text-tinta-suave">
                {midia.transcricao ?? "Transcrição pendente — processada no fechamento do dia."}
              </p>
            </div>
          )}

          {midia.tipo === "texto" && (
            <p className="mt-2 text-sm text-tinta">{midia.texto}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function rotuloTipo(tipo: Midia["tipo"]) {
  if (tipo === "foto") return "Foto";
  if (tipo === "audio") return "Áudio";
  return "Nota";
}

function formatarHora(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
