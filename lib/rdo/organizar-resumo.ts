import type { Midia } from "@/lib/types";

export interface ResumoEstruturado {
  atividades: string[];
  ocorrencias: string[];
  observacoes: string;
}

// Organiza o material bruto do dia (notas de texto + transcrições de
// áudio) em seções úteis pro RDO. Se ANTHROPIC_API_KEY não estiver
// configurada, cai num resumo simples (lista bruta em "observacoes")
// em vez de travar o fechamento do dia.
export async function organizarResumoDoDia(midias: Midia[]): Promise<ResumoEstruturado> {
  const trechos = midias
    .map((m) => (m.tipo === "texto" ? m.texto : m.transcricao))
    .filter((t): t is string => Boolean(t && t.trim()));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || trechos.length === 0) {
    return { atividades: [], ocorrencias: [], observacoes: trechos.join("\n") };
  }

  try {
    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system:
          "Você organiza anotações soltas de um relatório diário de obra (RDO) em JSON. " +
          'Responda APENAS com um objeto JSON no formato {"atividades": string[], ' +
          '"ocorrencias": string[], "observacoes": string}, sem nenhum texto antes ou depois.',
        messages: [{ role: "user", content: trechos.join("\n---\n") }],
      }),
    });

    if (!resposta.ok) throw new Error("Falha na API da Anthropic");

    const dados = await resposta.json();
    const texto = dados.content?.find((b: { type: string }) => b.type === "text")?.text ?? "{}";
    const limpo = texto.replace(/```json|```/g, "").trim();
    const parseado = JSON.parse(limpo);

    return {
      atividades: parseado.atividades ?? [],
      ocorrencias: parseado.ocorrencias ?? [],
      observacoes: parseado.observacoes ?? "",
    };
  } catch {
    return { atividades: [], ocorrencias: [], observacoes: trechos.join("\n") };
  }
}
