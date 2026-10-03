import type { PerfilEmpresa } from "@/lib/types";

export const COR_PADRAO = "#1B3A5C";

export const CORES_DOCUMENTO = [
  { id: "#1B3A5C", nome: "Projeto" },
  { id: "#14273B", nome: "Tinta" },
  { id: "#2E5C8A", nome: "Azul" },
  { id: "#1F4D3A", nome: "Verde" },
  { id: "#8A3B12", nome: "Terra" },
  { id: "#1A1A1A", nome: "Preto" },
] as const;

export type ContaVisual = {
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
};

export type IdentidadeDocumento = {
  nome: string;
  razaoSocial: string;
  cnpj: string;
  crea: string;
  cidadeUf: string;
  logoUrl: string | null;
  cor: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  pix: string;
  responsavel: string;
  registroResponsavel: string;
  carimboUrl: string | null;
  assinatura: string;
};

function limpo(valor: string | null | undefined) {
  return (valor ?? "").trim();
}

export function identidadeDocumento(
  conta: ContaVisual,
  perfil: Partial<PerfilEmpresa> | null
): IdentidadeDocumento {
  const nomeFantasia = limpo(perfil?.nome_fantasia);
  const razao = limpo(perfil?.razao_social);
  const cidade = limpo(perfil?.cidade);
  const estado = limpo(perfil?.estado);
  const corInformada = limpo(conta.cor_primaria);
  const cor = /^#[0-9A-Fa-f]{6}$/.test(corInformada) ? corInformada : COR_PADRAO;

  return {
    nome: nomeFantasia || razao || conta.nome,
    razaoSocial: razao && nomeFantasia ? razao : "",
    cnpj: limpo(perfil?.cnpj),
    crea: limpo(perfil?.crea),
    cidadeUf: [cidade, estado].filter(Boolean).join(" / "),
    logoUrl: limpo(perfil?.logo_url) || conta.logo_url,
    cor,
    telefone: limpo(perfil?.telefone),
    whatsapp: limpo(perfil?.whatsapp),
    email: limpo(perfil?.email),
    endereco: [
      limpo(perfil?.endereco),
      limpo(perfil?.numero),
      limpo(perfil?.complemento),
      [cidade, estado].filter(Boolean).join("/"),
    ]
      .filter(Boolean)
      .join(", "),
    pix: limpo(perfil?.pix_chave),
    responsavel: limpo(perfil?.responsavel_tecnico),
    registroResponsavel: limpo(perfil?.registro_responsavel),
    carimboUrl: limpo(perfil?.carimbo_url) || null,
    assinatura: limpo(perfil?.assinatura_padrao),
  };
}

export function valoresTemplateEmpresa(identidade: IdentidadeDocumento): Record<string, string> {
  return {
    empresa_nome: identidade.nome,
    cnpj: identidade.cnpj,
    crea: identidade.crea,
    cidade: identidade.cidadeUf,
    pix: identidade.pix,
  };
}

export function linhasRodape(identidade: IdentidadeDocumento) {
  return [
    [identidade.telefone, identidade.whatsapp].filter(Boolean).join(" · "),
    identidade.email,
    identidade.endereco,
    identidade.pix ? `PIX ${identidade.pix}` : "",
  ].filter(Boolean);
}
