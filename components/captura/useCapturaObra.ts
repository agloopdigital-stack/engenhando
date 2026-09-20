"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Midia } from "@/lib/types";

// Orquestra a captura em campo: garante o registro_dia de hoje, envia
// cada mídia pro Storage + insere a linha na tabela `midias`, e mantém
// a lista local atualizada sem precisar recarregar a tela.
export function useCapturaObra(obraId: string) {
  const supabase = createClient();
  const [midias, setMidias] = useState<Midia[]>([]);
  const [registroDiaId, setRegistroDiaId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const garantirRegistroDia = useCallback(async () => {
    const hoje = new Date().toISOString().slice(0, 10);

    const { data: existente } = await supabase
      .from("registros_dia")
      .select("id")
      .eq("obra_id", obraId)
      .eq("data", hoje)
      .maybeSingle();

    if (existente) return existente.id as string;

    const { data: usuario } = await supabase.auth.getUser();
    const { data: criado, error } = await supabase
      .from("registros_dia")
      .insert({ obra_id: obraId, data: hoje, criado_por: usuario.user?.id })
      .select("id")
      .single();

    if (error) throw error;
    return criado.id as string;
  }, [obraId, supabase]);

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const id = await garantirRegistroDia();
        if (!ativo) return;
        setRegistroDiaId(id);

        const { data, error } = await supabase
          .from("midias")
          .select("*")
          .eq("registro_dia_id", id)
          .order("criado_em", { ascending: true });

        if (error) throw error;
        if (ativo) setMidias(data as Midia[]);
      } catch (e) {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar o dia.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [garantirRegistroDia, supabase]);

  async function enviarArquivo(arquivo: Blob, tipo: "foto" | "audio", nomeArquivo: string) {
    if (!registroDiaId) return;
    setEnviando(true);
    setErro(null);

    try {
      const caminho = `${obraId}/${registroDiaId}/${Date.now()}-${nomeArquivo}`;
      const { error: erroUpload } = await supabase.storage
        .from("midias")
        .upload(caminho, arquivo);
      if (erroUpload) throw erroUpload;

      const { data: publicUrl } = supabase.storage.from("midias").getPublicUrl(caminho);
      const { data: usuario } = await supabase.auth.getUser();

      const { data: novaMidia, error: erroInsert } = await supabase
        .from("midias")
        .insert({
          obra_id: obraId,
          registro_dia_id: registroDiaId,
          tipo,
          url_storage: publicUrl.publicUrl,
          criado_por: usuario.user?.id,
        })
        .select("*")
        .single();

      if (erroInsert) throw erroInsert;
      setMidias((atual) => [...atual, novaMidia as Midia]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarTexto(texto: string) {
    if (!registroDiaId) return;
    setEnviando(true);
    setErro(null);

    try {
      const { data: usuario } = await supabase.auth.getUser();
      const { data: novaMidia, error } = await supabase
        .from("midias")
        .insert({
          obra_id: obraId,
          registro_dia_id: registroDiaId,
          tipo: "texto",
          texto,
          criado_por: usuario.user?.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      setMidias((atual) => [...atual, novaMidia as Midia]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao salvar a nota. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return { midias, carregando, enviando, erro, enviarArquivo, enviarTexto };
}
