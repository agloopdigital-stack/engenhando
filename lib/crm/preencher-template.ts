// Templates usam placeholders no formato {{campo}}. Mantém simples de
// propósito — nada de motor de template complexo, é só substituição direta.
export function preencherTemplate(corpo: string, valores: Record<string, string>): string {
  return corpo.replace(/\{\{(\w+)\}\}/g, (_, chave) => valores[chave] ?? `{{${chave}}}`);
}

export function extrairCamposTemplate(corpo: string): string[] {
  const encontrados = corpo.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...encontrados].map((m) => m[1]))];
}
