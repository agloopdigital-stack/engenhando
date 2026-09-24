import Link from "next/link";

// Landing simples de desenvolvimento — em produção isso vira a tela de
// login/lista de obras. Por enquanto, atalho direto pra tela de captação
// da obra de demonstração, pra testar o fluxo do RDO.
export default function Home() {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-projeto-900 px-6 text-center text-white">
      <h1 className="font-display text-3xl">Engenhando</h1>
      <p className="max-w-xs text-concreto-300">
        RDO automático: registre a obra com a voz e a câmera, o relatório se organiza sozinho.
      </p>
      <Link
        href="/obras"
        className="touch-target mt-4 rounded-2xl bg-sinalizacao px-6 py-3 font-display font-medium"
      >
        Ver obras
      </Link>
      <p className="text-xs text-concreto-300">
        Login: demo@engenhando.app / Engenhando@2026
      </p>
    </main>
  );
}
