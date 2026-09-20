// Envia e-mail via Resend se RESEND_API_KEY estiver configurada.
// Sem a chave, retorna false (o chamador decide o que fazer) em vez de
// travar o processo — segue o mesmo padrão de transcricao.ts.
export async function enviarEmail(destinatario: string, assunto: string, corpo: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "engenhando@resend.dev",
        to: destinatario,
        subject: assunto,
        text: corpo,
      }),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}
