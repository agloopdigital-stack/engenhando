"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UFS,
  cnpjValido,
  emailValido,
  mascararCep,
  mascararCnpj,
  mascararTelefone,
} from "@/lib/empresa";
import type { PerfilEmpresa } from "@/lib/types";

type Formulario = Omit<PerfilEmpresa, "id" | "conta_id">;

const VAZIO: Formulario = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  crea: "",
  responsavel_tecnico: "",
  cpf_responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  site: "",
  logo_url: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  inscricao_municipal: "",
  pix_chave: "",
  banco: "",
  agencia: "",
  conta_bancaria: "",
  observacoes_comerciais: "",
  assinatura_padrao: "",
};

function texto(valor: string | null | undefined) {
  return valor ?? "";
}

export default function EmpresaPage() {
  const supabase = createClient();
  const [contaId, setContaId] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    let ativo = true;

    (async () => {
      const { data: sessao } = await supabase.auth.getUser();
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("conta_id")
        .eq("id", sessao.user?.id)
        .single();

      if (!ativo) return;
      if (!usuario) {
        setErro("Não encontrei sua conta.");
        setCarregando(false);
        return;
      }

      setContaId(usuario.conta_id);
      const { data } = await supabase
        .from("perfis_empresa")
        .select("*")
        .eq("conta_id", usuario.conta_id)
        .maybeSingle();

      if (!ativo) return;
      if (data) {
        const perfil = data as PerfilEmpresa;
        setForm({
          razao_social: texto(perfil.razao_social),
          nome_fantasia: texto(perfil.nome_fantasia),
          cnpj: texto(perfil.cnpj),
          crea: texto(perfil.crea),
          responsavel_tecnico: texto(perfil.responsavel_tecnico),
          cpf_responsavel: texto(perfil.cpf_responsavel),
          telefone: texto(perfil.telefone),
          whatsapp: texto(perfil.whatsapp),
          email: texto(perfil.email),
          site: texto(perfil.site),
          logo_url: texto(perfil.logo_url),
          endereco: texto(perfil.endereco),
          cidade: texto(perfil.cidade),
          estado: texto(perfil.estado),
          cep: texto(perfil.cep),
          inscricao_municipal: texto(perfil.inscricao_municipal),
          pix_chave: texto(perfil.pix_chave),
          banco: texto(perfil.banco),
          agencia: texto(perfil.agencia),
          conta_bancaria: texto(perfil.conta_bancaria),
          observacoes_comerciais: texto(perfil.observacoes_comerciais),
          assinatura_padrao: texto(perfil.assinatura_padrao),
        });
      }
      setCarregando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [supabase]);

  function atualizar(campo: keyof Formulario, valor: string) {
    setSalvo(false);
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviarLogo(arquivo: File) {
    if (!contaId) return;
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["png", "jpg", "jpeg", "webp"].includes(extensao)) {
      setErro("A logo precisa ser PNG, JPG ou WebP.");
      return;
    }
    if (arquivo.size > 2_000_000) {
      setErro("A logo precisa ter no máximo 2 MB.");
      return;
    }

    setErro(null);
    const caminho = `${contaId}/logo.${extensao}`;
    const { error } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      upsert: true,
      contentType: arquivo.type,
    });
    if (error) {
      setErro("Não consegui enviar a logo. Tenta de novo.");
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
    atualizar("logo_url", `${data.publicUrl}?v=${Date.now()}`);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!contaId) return;
    setErro(null);
    setSalvo(false);

    if (form.cnpj && !cnpjValido(form.cnpj)) {
      setErro("CNPJ inválido.");
      return;
    }
    if (form.email && !emailValido(form.email)) {
      setErro("E-mail inválido.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from("perfis_empresa").upsert(
      {
        conta_id: contaId,
        ...form,
        cnpj: form.cnpj || null,
        email: form.email || null,
        estado: form.estado || null,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "conta_id" }
    );

    setSalvando(false);
    if (error) {
      const tabelaAusente =
        error.code === "PGRST205" || error.message.includes("perfis_empresa");
      setErro(
        tabelaAusente
          ? "Falta criar a tabela da empresa no banco. Rode a migration 0004 no Supabase."
          : "Não consegui salvar os dados da empresa."
      );
      return;
    }
    setSalvo(true);
  }

  if (carregando) {
    return (
      <main className="flex min-h-full items-center justify-center text-tinta-suave">
        Carregando empresa...
      </main>
    );
  }

  return (
    <main className="min-h-full bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <h1 className="font-display text-xl">Empresa</h1>
      <p className="mb-4 mt-1 max-w-md text-sm text-tinta-suave">
        Esses dados entram no cabeçalho dos RDOs, propostas e documentos.
      </p>

      <form onSubmit={salvar} className="mx-auto flex max-w-lg flex-col gap-6">
        <Secao titulo="Identificação">
          <Campo label="Razão social" value={form.razao_social} onChange={(v) => atualizar("razao_social", v)} />
          <Campo label="Nome fantasia" value={form.nome_fantasia} onChange={(v) => atualizar("nome_fantasia", v)} />
          <Campo
            label="CNPJ"
            value={form.cnpj}
            inputMode="numeric"
            onChange={(v) => atualizar("cnpj", mascararCnpj(v))}
          />
          <Campo label="CREA da empresa" value={form.crea} onChange={(v) => atualizar("crea", v)} />
          <Campo
            label="Inscrição municipal"
            value={form.inscricao_municipal}
            onChange={(v) => atualizar("inscricao_municipal", v)}
          />
        </Secao>

        <Secao titulo="Responsável técnico">
          <Campo
            label="Nome"
            value={form.responsavel_tecnico}
            onChange={(v) => atualizar("responsavel_tecnico", v)}
          />
          <Campo
            label="CPF"
            value={form.cpf_responsavel}
            onChange={(v) => atualizar("cpf_responsavel", v)}
          />
        </Secao>

        <Secao titulo="Contato">
          <Campo
            label="Telefone"
            value={form.telefone}
            inputMode="tel"
            onChange={(v) => atualizar("telefone", mascararTelefone(v))}
          />
          <Campo
            label="WhatsApp"
            value={form.whatsapp}
            inputMode="tel"
            onChange={(v) => atualizar("whatsapp", mascararTelefone(v))}
          />
          <Campo label="E-mail" type="email" value={form.email} onChange={(v) => atualizar("email", v)} />
          <Campo label="Site" value={form.site} onChange={(v) => atualizar("site", v)} />
        </Secao>

        <Secao titulo="Endereço">
          <Campo
            label="CEP"
            value={form.cep}
            inputMode="numeric"
            onChange={(v) => atualizar("cep", mascararCep(v))}
          />
          <Campo label="Endereço" value={form.endereco} onChange={(v) => atualizar("endereco", v)} />
          <Campo label="Cidade" value={form.cidade} onChange={(v) => atualizar("cidade", v)} />
          <label className="text-sm text-tinta-suave">
            UF
            <select
              value={form.estado ?? ""}
              onChange={(e) => atualizar("estado", e.target.value)}
              className="touch-target mt-1 w-full rounded-xl border border-concreto-300 bg-white px-4 outline-none focus:border-projeto-500"
            >
              <option value="">Selecione</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </label>
        </Secao>

        <Secao titulo="Marca">
          {form.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="Logo da empresa" className="h-16 w-auto rounded-lg bg-white object-contain" />
          )}
          <label className="text-sm text-tinta-suave">
            Logo (PNG, JPG ou WebP, até 2 MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) enviarLogo(arquivo);
              }}
              className="mt-1 block w-full text-sm"
            />
          </label>
        </Secao>

        <Secao titulo="Comercial">
          <Campo label="Chave PIX" value={form.pix_chave} onChange={(v) => atualizar("pix_chave", v)} />
          <Campo label="Banco" value={form.banco} onChange={(v) => atualizar("banco", v)} />
          <Campo label="Agência" value={form.agencia} onChange={(v) => atualizar("agencia", v)} />
          <Campo label="Conta" value={form.conta_bancaria} onChange={(v) => atualizar("conta_bancaria", v)} />
          <Campo
            label="Assinatura padrão"
            value={form.assinatura_padrao}
            onChange={(v) => atualizar("assinatura_padrao", v)}
          />
          <label className="text-sm text-tinta-suave">
            Observações comerciais
            <textarea
              value={form.observacoes_comerciais ?? ""}
              onChange={(e) => atualizar("observacoes_comerciais", e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-concreto-300 bg-white p-3 outline-none focus:border-projeto-500"
            />
          </label>
        </Secao>

        {erro && <p className="text-sm text-alerta">{erro}</p>}
        {salvo && <p className="text-sm text-concluido">Dados da empresa salvos.</p>}

        <button
          type="submit"
          disabled={salvando}
          className="touch-target rounded-xl bg-sinalizacao font-display font-medium disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar empresa"}
        </button>
      </form>
    </main>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-medium uppercase tracking-wide text-tinta-suave">{titulo}</h2>
      {children}
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string | null;
  onChange: (valor: string) => void;
  type?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <label className="text-sm text-tinta-suave">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="touch-target mt-1 w-full rounded-xl border border-concreto-300 bg-white px-4 text-tinta outline-none focus:border-projeto-500"
      />
    </label>
  );
}
