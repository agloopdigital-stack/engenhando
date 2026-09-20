"use client";

import { useRef } from "react";

interface BotaoFotoProps {
  onFoto: (arquivo: File) => void;
  enviando: boolean;
}

export function BotaoFoto({ onFoto, enviando }: BotaoFotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) onFoto(arquivo);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={enviando}
        onClick={() => inputRef.current?.click()}
        className="touch-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl bg-projeto-700 py-3 font-display text-sm font-medium text-white transition-colors active:bg-projeto-900 disabled:opacity-50"
      >
        <CameraIcon />
        Foto
      </button>
    </>
  );
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l2-2h6l2 2h3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8z" strokeLinejoin="round" />
      <circle cx="12" cy="14" r="3.5" />
    </svg>
  );
}
