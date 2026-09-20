"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <FormularioLogin />
    </Suspense>
  );
}

function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    router.push(searchParams.get("redirect") ?? "/obras/demo/captura");
    router.refresh();
  }

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6 bg-projeto-900 px-6 text-white">
      <div className="w-full max-w-xs">
        <h1 className="mb-1 font-display text-2xl">Engenhando</h1>
        <p className="mb-6 text-sm text-concreto-300">Entre para acessar suas obras.</p>

        <form onSubmit={entrar} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="touch-target rounded-xl border border-concreto-300 bg-white px-4 text-tinta outline-none focus:border-sinalizacao"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="touch-target rounded-xl border border-concreto-300 bg-white px-4 text-tinta outline-none focus:border-sinalizacao"
          />

          {erro && <p className="text-sm text-alerta">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="touch-target mt-2 rounded-xl bg-sinalizacao font-display font-medium disabled:opacity-50"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
