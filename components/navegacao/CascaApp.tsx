"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const CHAVE_OBRA = "engenhando.obraAtual";
const CHAVE_MENU = "engenhando.menu";

type Atalho = {
  id: string;
  rotulo: string;
  curto: string;
  href: string;
  ativo: (caminho: string) => boolean;
};

function destino(obraId: string | null, caminho: string) {
  return obraId ? caminho : "/obras";
}

function atalhos(obraId: string | null): Atalho[] {
  return [
    {
      id: "obras",
      rotulo: "Obras",
      curto: "Obras",
      href: "/obras",
      ativo: (caminho) =>
        caminho === "/obras" || caminho === "/obras/nova" || /^\/obras\/[^/]+$/.test(caminho),
    },
    {
      id: "registro",
      rotulo: "Registro",
      curto: "Registro",
      href: destino(obraId, `/obras/${obraId}/captura`),
      ativo: (caminho) => caminho.includes("/captura"),
    },
    {
      id: "painel",
      rotulo: "Painel",
      curto: "Painel",
      href: destino(obraId, `/obras/${obraId}/dashboard`),
      ativo: (caminho) => caminho.includes("/dashboard"),
    },
    {
      id: "documentos",
      rotulo: "Documentos",
      curto: "Docs",
      href: destino(obraId, `/obras/${obraId}/documentos`),
      ativo: (caminho) => caminho.includes("/documentos"),
    },
    {
      id: "financeiro",
      rotulo: "Financeiro",
      curto: "Caixa",
      href: destino(obraId, `/obras/${obraId}/financeiro`),
      ativo: (caminho) => caminho.includes("/financeiro"),
    },
    {
      id: "equipe",
      rotulo: "Mão de obra",
      curto: "Equipe",
      href: destino(obraId, `/obras/${obraId}/mao-de-obra`),
      ativo: (caminho) => caminho.includes("/mao-de-obra"),
    },
    {
      id: "leads",
      rotulo: "Leads",
      curto: "Leads",
      href: "/leads",
      ativo: (caminho) => caminho.startsWith("/leads"),
    },
  ];
}

export function CascaApp({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const ocultar = caminho === "/" || caminho.startsWith("/login");
  const [obraId, setObraId] = useState<string | null>(null);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    const noCaminho = caminho.match(/^\/obras\/([^/]+)/)?.[1];
    if (noCaminho && noCaminho !== "nova") {
      setObraId(noCaminho);
      sessionStorage.setItem(CHAVE_OBRA, noCaminho);
      return;
    }
    const guardada = sessionStorage.getItem(CHAVE_OBRA);
    if (guardada) setObraId(guardada);
  }, [caminho]);

  useEffect(() => {
    setAberta(localStorage.getItem(CHAVE_MENU) === "aberto");
  }, []);

  if (ocultar) return children;

  const itens = atalhos(obraId);

  function alternarMenu() {
    setAberta((atual) => {
      const proxima = !atual;
      localStorage.setItem(CHAVE_MENU, proxima ? "aberto" : "fechado");
      return proxima;
    });
  }

  return (
    <div
      className="app-casca flex h-dvh flex-col md:block md:h-auto md:min-h-dvh"
      data-menu={aberta ? "aberto" : "fechado"}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col bg-projeto-900 text-white transition-[width] duration-200 md:flex ${
          aberta ? "w-60" : "w-[4.5rem]"
        }`}
      >
        <Link
          href="/obras"
          className={`flex h-16 items-center border-b border-white/10 ${aberta ? "px-4" : "justify-center"}`}
        >
          <span className="font-display text-lg">{aberta ? "Engenhando" : "E"}</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Páginas">
          {itens.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.rotulo}
              aria-current={item.ativo(caminho) ? "page" : undefined}
              title={item.rotulo}
              className={`touch-target flex items-center gap-3 rounded-xl px-3 text-sm font-medium ${
                aberta ? "" : "justify-center px-0"
              } ${
                item.ativo(caminho)
                  ? "bg-white/10 text-sinalizacao"
                  : "text-concreto-200 hover:bg-white/5"
              }`}
            >
              <Icone nome={item.id} />
              {aberta && <span>{item.rotulo}</span>}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={alternarMenu}
          aria-expanded={aberta}
          className="touch-target m-2 flex items-center justify-center gap-3 rounded-xl text-concreto-200 hover:bg-white/5"
        >
          <Icone nome={aberta ? "recolher" : "expandir"} />
          {aberta && <span className="text-sm">Recolher</span>}
        </button>
      </aside>

      <div className="min-h-0 flex-1 overflow-y-auto md:min-h-dvh md:overflow-visible">{children}</div>

      <nav
        className="relative z-20 shrink-0 border-t border-white/10 bg-projeto-900 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Atalhos"
      >
        <ul className="flex h-[4.25rem]">
          {itens.map((item) => (
            <li key={item.id} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-label={item.rotulo}
                aria-current={item.ativo(caminho) ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium leading-none ${
                  item.ativo(caminho) ? "text-sinalizacao" : "text-concreto-200"
                }`}
              >
                <Icone nome={item.id} />
                <span className="max-w-full truncate">{item.curto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function Icone({ nome }: { nome: string }) {
  const comum = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    "aria-hidden": true as const,
  };

  switch (nome) {
    case "obras":
      return (
        <svg {...comum}>
          <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "registro":
      return (
        <svg {...comum}>
          <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v4" strokeLinecap="round" />
        </svg>
      );
    case "painel":
      return (
        <svg {...comum}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "documentos":
      return (
        <svg {...comum}>
          <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v5h5M8 13h8M8 17h5" strokeLinecap="round" />
        </svg>
      );
    case "financeiro":
      return (
        <svg {...comum}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M7 15h4" strokeLinecap="round" />
        </svg>
      );
    case "equipe":
      return (
        <svg {...comum}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2" />
          <path d="M3 19c.5-3 2.8-4.5 6-4.5s5.5 1.5 6 4.5M15 14.5c1.8 0 3.4.8 4 2.5" strokeLinecap="round" />
        </svg>
      );
    case "leads":
      return (
        <svg {...comum}>
          <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
        </svg>
      );
    case "expandir":
      return (
        <svg {...comum}>
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...comum}>
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
