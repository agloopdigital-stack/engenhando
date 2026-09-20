"use client";

import { useRef, useState } from "react";

interface BotaoGravarAudioProps {
  onGravado: (blob: Blob) => void;
  enviando: boolean;
}

// Um toque começa a gravar, outro toque termina. Sem segurar, sem gestos
// que exigem as duas mãos livres — no canteiro, isso não é opção.
export function BotaoGravarAudio({ onGravado, enviando }: BotaoGravarAudioProps) {
  const [gravando, setGravando] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function iniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onGravado(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
    } catch {
      alert("Não consegui acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop();
    setGravando(false);
  }

  return (
    <button
      type="button"
      disabled={enviando}
      onClick={gravando ? pararGravacao : iniciarGravacao}
      className={`touch-target flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-3 font-display text-sm font-medium text-white transition-colors disabled:opacity-50 ${
        gravando ? "bg-alerta animate-pulse" : "bg-sinalizacao active:bg-sinalizacao-escuro"
      }`}
      aria-pressed={gravando}
    >
      <MicIcon />
      {gravando ? "Toque para parar" : "Gravar áudio"}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" strokeLinecap="round" />
      <path d="M12 18v4M9 22h6" strokeLinecap="round" />
    </svg>
  );
}
