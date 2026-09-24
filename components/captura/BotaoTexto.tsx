"use client";

import { useState } from "react";

interface BotaoTextoProps {
  onEnviar: (texto: string) => void;
  enviando: boolean;
}

export function BotaoTexto({ onEnviar, enviando }: BotaoTextoProps) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");

  if (aberto) {
    return (
      <div
        className="fixed right-0 z-40 border-t border-concreto-300 bg-concreto-50 p-3"
        style={{ bottom: "var(--nav-inferior, 0px)", left: "var(--nav-lateral, 0px)" }}
      >
        <textarea
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Anotação rápida sobre a obra hoje..."
          rows={3}
          className="w-full resize-none rounded-xl border border-concreto-300 bg-white p-3 text-base outline-none focus:border-projeto-500"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              setTexto("");
            }}
            className="touch-target flex-1 rounded-xl border border-concreto-300 font-medium text-tinta-suave"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!texto.trim() || enviando}
            onClick={() => {
              onEnviar(texto.trim());
              setAberto(false);
              setTexto("");
            }}
            className="touch-target flex-1 rounded-xl bg-projeto-700 font-display font-medium text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={enviando}
      onClick={() => setAberto(true)}
      className="touch-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-projeto-700 py-3 font-display text-sm font-medium text-projeto-700 transition-colors active:bg-projeto-700/10 disabled:opacity-50"
    >
      <TextoIcon />
      Nota rápida
    </button>
  );
}

function TextoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}
