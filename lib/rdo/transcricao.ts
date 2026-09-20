// Transcreve um áudio a partir da sua URL pública no Storage.
// Usa a API da OpenAI (Whisper) se OPENAI_API_KEY estiver configurada;
// caso contrário, retorna null e o RDO segue sem aquela transcrição
// (marcado como pendente), em vez de quebrar o fechamento do dia inteiro.
export async function transcreverAudio(urlAudio: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const respostaAudio = await fetch(urlAudio);
    if (!respostaAudio.ok) return null;
    const blobAudio = await respostaAudio.blob();

    const formData = new FormData();
    formData.append("file", blobAudio, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");

    const resposta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    if (!resposta.ok) return null;
    const dados = await resposta.json();
    return dados.text ?? null;
  } catch {
    return null;
  }
}
