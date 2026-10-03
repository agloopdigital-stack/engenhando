"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UFS,
  apenasDigitos,
  buscarCep,
  buscarCnpj,
  cnpjValido,
  cpfValido,
  emailValido,
  faltasCabecalho,
  mascararCep,
  mascararCnpj,
  mascararCpf,
  mascararTelefone,
} from "@/lib/empresa";
import { CORES_DOCUMENTO, COR_PADRAO } from "@/lib/documentos/identidade";
import type { PerfilEmpresa } from "@/lib/types";
import { Campo, CLASSE_CONTROLE, Secao } from "@/components/empresa/Campo";
import { PreviaCabecalho } from "@/components/empresa/PreviaCabecalho";

type Formulario = {
  [K in keyof Omit<PerfilEmpresa, "id" | "conta_id">]: string;
};

const VAZIO: Formulario = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  crea: "",
  responsavel_tecnico: "",
  registro_responsavel: "",
  cpf_responsavel: "",
  telefone: "",
  whatsapp: "",
  email: "",
  site: "",
  logo_url: "",
  carimbo_url: "",
  endereco: "",
  numero: "",
  complemento: "",
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

function perfilParaForm(perfil: PerfilEmpresa): Formulario {
  const proximo = { ...VAZIO };
  (Object.keys(VAZIO) as (keyof Formulario)[]).forEach((chave) => {
    proximo[chave] = texto(perfil[chave]);
  });
  return proximo;
}

function cobrancaPreenchida(form: Formulario) {
  return [
    form.inscricao_municipal,
    form.cpf_responsavel,
    form.telefone,
    form.whatsapp,
    form.email,
    form.site,
    form.cep,
    form.endereco,
    form.numero,
    form.complemento,
    form.pix_chave,
    form.banco,
    form.agencia,
    form.conta_bancaria,
    form.assinatura_padrao,
    form.observacoes_comerciais,
  ].some((valor) => texto(valor).trim());
}

export default function EmpresaPage() {
  const supabase = createClient();
  const [contaId, setContaId] = useState<string | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoCarimbo, setEnviandoCarimbo] = useState(false);
  const [cor, setCor] = useState(COR_PADRAO);
  const [cnpjEstado, setCnpjEstado] = useState<"buscando" | "nao-encontrado" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [cepEstado, setCepEstado] = useState<"buscando" | "nao-encontrado" | null>(null);
  const [cobrancaAberta, setCobrancaAberta] = useState(false);
  const cepReq = useRef<AbortController | null>(null);
  const cnpjReq = useRef<AbortController | null>(null);

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
      const [{ data }, { data: conta }] = await Promise.all([
        supabase.from("perfis_empresa").select("*").eq("conta_id", usuario.conta_id).maybeSingle(),
        supabase.from("contas").select("cor_primaria").eq("id", usuario.conta_id).maybeSingle(),
      ]);

      if (!ativo) return;
      if (conta?.cor_primaria) setCor(conta.cor_primaria);
      if (data) {
        const preenchido = perfilParaForm(data as PerfilEmpresa);
        setForm(preenchido);
        setCobrancaAberta(cobrancaPreenchida(preenchido));
      }
      setCarregando(false);
    })();

    return () => {
      ativo = false;
      cepReq.current?.abort();
      cnpjReq.current?.abort();
    };
  }, [supabase]);

  function atualizar(campo: keyof Formulario, valor: string) {
    setSalvo(false);
    setErro(null);
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function marcarTocado(campo: string) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  const erroCnpj =
    (tocados.cnpj || tentouSalvar) && form.cnpj && !cnpjValido(form.cnpj) ? "CNPJ inválido." : null;
  const erroEmail =
    (tocados.email || tentouSalvar) && form.email && !emailValido(form.email) ? "E-mail inválido." : null;
  const erroCpf =
    (tocados.cpf || tentouSalvar) && form.cpf_responsavel && !cpfValido(form.cpf_responsavel)
      ? "CPF inválido."
      : null;

  async function aoMudarCep(valor: string) {
    const mascarado = mascararCep(valor);
    atualizar("cep", mascarado);
    const digitos = apenasDigitos(mascarado);
    cepReq.current?.abort();
    if (digitos.length !== 8) {
      setCepEstado(null);
      return;
    }

    const controle = new AbortController();
    cepReq.current = controle;
    setCepEstado("buscando");
    try {
      const resultado = await buscarCep(digitos, controle.signal);
      if (controle.signal.aborted) return;
      if (!resultado) {
        setCepEstado("nao-encontrado");
        return;
      }
      setCepEstado(null);
      setSalvo(false);
      setForm((atual) => ({
        ...atual,
        cep: mascarado,
        endereco: resultado.endereco || atual.endereco,
        cidade: resultado.cidade || atual.cidade,
        estado: resultado.estado || atual.estado,
      }));
    } catch {
      if (!controle.signal.aborted) setCepEstado("nao-encontrado");
    }
  }

  async function aoMudarCnpj(valor: string) {
    const mascarado = mascararCnpj(valor);
    atualizar("cnpj", mascarado);
    cnpjReq.current?.abort();
    if (!cnpjValido(mascarado)) {
      setCnpjEstado(null);
      return;
    }

    const controle = new AbortController();
    cnpjReq.current = controle;
    setCnpjEstado("buscando");
    try {
      const resultado = await buscarCnpj(mascarado, controle.signal);
      if (controle.signal.aborted) return;
      if (!resultado) {
        setCnpjEstado("nao-encontrado");
        return;
      }
      setCnpjEstado(null);
      setSalvo(false);
      setForm((atual) => ({
        ...atual,
        cnpj: mascarado,
        razao_social: resultado.razao_social || atual.razao_social,
        nome_fantasia: atual.nome_fantasia || resultado.nome_fantasia,
        endereco: resultado.endereco || atual.endereco,
        numero: resultado.numero || atual.numero,
        complemento: resultado.complemento || atual.complemento,
        cidade: resultado.cidade || atual.cidade,
        estado: resultado.estado || atual.estado,
        cep: resultado.cep ? mascararCep(resultado.cep) : atual.cep,
      }));
    } catch {
      if (!controle.signal.aborted) setCnpjEstado("nao-encontrado");
    }
  }

  async function enviarImagem(arquivo: File, nome: "logo" | "carimbo") {
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
    const setEnviando = nome === "logo" ? setEnviandoLogo : setEnviandoCarimbo;
    setEnviando(true);
    const caminho = `${contaId}/${nome}.${extensao}`;
    const { error } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      upsert: true,
      contentType: arquivo.type,
    });
    setEnviando(false);
    if (error) {
      setErro(nome === "logo" ? "Não consegui enviar a logo. Tenta de novo." : "Não consegui enviar o carimbo. Tenta de novo.");
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
    atualizar(nome === "logo" ? "logo_url" : "carimbo_url", `${data.publicUrl}?v=${Date.now()}`);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!contaId || enviandoLogo || enviandoCarimbo) return;
    setTentouSalvar(true);
    setErro(null);
    setSalvo(false);

    if (
      (form.cnpj && !cnpjValido(form.cnpj)) ||
      (form.email && !emailValido(form.email)) ||
      (form.cpf_responsavel && !cpfValido(form.cpf_responsavel))
    ) {
      setErro("Confira os campos marcados.");
      return;
    }

    setSalvando(true);
    const [{ error }, { error: erroCor }] = await Promise.all([
      supabase.from("perfis_empresa").upsert(
        {
          conta_id: contaId,
          ...form,
          cnpj: form.cnpj || null,
          email: form.email || null,
          estado: form.estado || null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "conta_id" }
      ),
      supabase.from("contas").update({ cor_primaria: cor }).eq("id", contaId),
    ]);

    setSalvando(false);
    if (error || erroCor) {
      const mensagem = error?.message ?? erroCor?.message ?? "";
      const schemaAusente =
        error?.code === "PGRST205" ||
        error?.code === "PGRST204" ||
        mensagem.includes("perfis_empresa") ||
        mensagem.includes("registro_responsavel") ||
        mensagem.includes("carimbo_url");
      setErro(
        schemaAusente
          ? "Falta atualizar o banco. Rode a migration 0005 no Supabase."
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

  const dicaCep =
    cepEstado === "buscando"
      ? "Buscando CEP..."
      : cepEstado === "nao-encontrado"
        ? "Não encontrei esse CEP. Preencha o endereço."
        : "A cidade e a UF sobem para o cabeçalho.";

  const dicaCnpj =
    cnpjEstado === "buscando"
      ? "Buscando CNPJ..."
      : cnpjEstado === "nao-encontrado"
        ? "Não encontrei esse CNPJ. Preencha a razão social."
        : "A razão social e o endereço sobem quando o CNPJ é válido.";

  const faltas = faltasCabecalho(form);

  return (
    <main className="min-h-full bg-concreto-100 px-4 py-6 md:min-h-dvh">
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
        <div className="order-2 flex flex-col gap-4 md:order-1">
          <div>
            <h1 className="font-display text-xl">Empresa</h1>
            <p className={`mt-1 text-sm font-medium ${faltas.length === 0 ? "text-concluido" : "text-alerta"}`}>
              {faltas.length === 0 ? "Pronto para documento" : "Cabeçalho incompleto"}
            </p>
            {faltas.length > 0 && (
              <p className="mt-1 text-sm text-tinta-suave">Falta {faltas.join(", ")}.</p>
            )}
          </div>

          <form id="form-empresa" onSubmit={salvar} className="flex flex-col gap-4">
            <Secao titulo="Cabeçalho" descricao="O que o cliente vê no documento.">
              <label className="flex min-h-24 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-concreto-300 bg-concreto-50 p-3">
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.logo_url}
                    alt="Logo da empresa"
                    className="h-16 w-16 rounded-lg bg-white object-contain"
                  />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-lg bg-white text-xs text-tinta-suave">
                    Logo
                  </span>
                )}
                <span>
                  <span className="block font-display text-base text-tinta">
                    {enviandoLogo ? "Enviando logo..." : "Escolher logo"}
                  </span>
                  <span className="mt-1 block text-sm text-tinta-suave">PNG, JPG ou WebP, até 2 MB</span>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={enviandoLogo}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) enviarImagem(arquivo, "logo");
                    e.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
              <Campo
                label="Nome fantasia"
                value={form.nome_fantasia}
                autoComplete="organization"
                onChange={(v) => atualizar("nome_fantasia", v)}
              />
              <Campo
                label="Razão social"
                value={form.razao_social}
                autoComplete="organization"
                onChange={(v) => atualizar("razao_social", v)}
              />
              <Campo
                label="CNPJ"
                value={form.cnpj}
                inputMode="numeric"
                autoComplete="off"
                erro={erroCnpj}
                dica={dicaCnpj}
                onBlur={() => marcarTocado("cnpj")}
                onChange={aoMudarCnpj}
              />
              <Campo label="CREA da empresa" value={form.crea} onChange={(v) => atualizar("crea", v)} />
              <Campo
                label="Responsável técnico"
                value={form.responsavel_tecnico}
                autoComplete="name"
                onChange={(v) => atualizar("responsavel_tecnico", v)}
              />
              <Campo
                label="Registro do responsável"
                value={form.registro_responsavel}
                dica="CREA ou CAU de quem assina o documento."
                onChange={(v) => atualizar("registro_responsavel", v)}
              />
              <label className="flex min-h-20 cursor-pointer items-center gap-4 rounded-xl border border-dashed border-concreto-300 bg-concreto-50 p-3">
                {form.carimbo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.carimbo_url} alt="Carimbo" className="h-12 w-16 bg-white object-contain" />
                ) : (
                  <span className="grid h-12 w-16 place-items-center rounded-lg bg-white text-xs text-tinta-suave">
                    Carimbo
                  </span>
                )}
                <span>
                  <span className="block font-display text-base text-tinta">
                    {enviandoCarimbo ? "Enviando carimbo..." : "Escolher carimbo"}
                  </span>
                  <span className="mt-1 block text-sm text-tinta-suave">PNG, JPG ou WebP, até 2 MB</span>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={enviandoCarimbo}
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0];
                    if (arquivo) enviarImagem(arquivo, "carimbo");
                    e.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3">
                <Campo
                  label="Cidade"
                  value={form.cidade}
                  autoComplete="address-level2"
                  onChange={(v) => atualizar("cidade", v)}
                />
                <label className="text-sm text-tinta-suave">
                  UF
                  <select
                    value={form.estado ?? ""}
                    autoComplete="address-level1"
                    onChange={(e) => atualizar("estado", e.target.value)}
                    className={`${CLASSE_CONTROLE} border-concreto-300`}
                  >
                    <option value="">—</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <p className="text-sm text-tinta-suave">Cor do documento</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CORES_DOCUMENTO.map((opcao) => {
                    const ativa = cor.toLowerCase() === opcao.id.toLowerCase();
                    return (
                      <button
                        key={opcao.id}
                        type="button"
                        aria-label={opcao.nome}
                        aria-pressed={ativa}
                        onClick={() => {
                          setCor(opcao.id);
                          setSalvo(false);
                        }}
                        className={`h-14 w-14 rounded-full border-2 ${ativa ? "border-tinta" : "border-transparent"}`}
                        style={{ backgroundColor: opcao.id }}
                      />
                    );
                  })}
                </div>
              </div>
            </Secao>

            <details
              className="group rounded-xl border border-concreto-300 bg-white"
              open={cobrancaAberta}
              onToggle={(e) => setCobrancaAberta(e.currentTarget.open)}
            >
              <summary className="touch-target flex cursor-pointer list-none items-center justify-between gap-3 px-4 font-display text-base text-tinta [&::-webkit-details-marker]:hidden">
                Dados para cobrança
                <span className="text-sm font-normal text-tinta-suave group-open:hidden">
                  Contato, endereço e PIX
                </span>
              </summary>
              <div className="flex flex-col gap-6 px-4 pb-4">
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm text-tinta-suave">Contato</h3>
                  <Campo
                    label="Telefone"
                    value={form.telefone}
                    inputMode="tel"
                    autoComplete="tel"
                    onChange={(v) => atualizar("telefone", mascararTelefone(v))}
                  />
                  <Campo
                    label="WhatsApp"
                    value={form.whatsapp}
                    inputMode="tel"
                    autoComplete="tel"
                    onChange={(v) => atualizar("whatsapp", mascararTelefone(v))}
                  />
                  <button
                    type="button"
                    disabled={!form.telefone}
                    onClick={() => atualizar("whatsapp", form.telefone)}
                    className="self-start text-sm font-medium text-projeto-700 disabled:opacity-40"
                  >
                    Usar o mesmo do telefone
                  </button>
                  <Campo
                    label="E-mail"
                    type="email"
                    value={form.email}
                    inputMode="email"
                    autoComplete="email"
                    erro={erroEmail}
                    onBlur={() => marcarTocado("email")}
                    onChange={(v) => atualizar("email", v)}
                  />
                  <Campo
                    label="Site"
                    value={form.site}
                    autoComplete="url"
                    onChange={(v) => atualizar("site", v)}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm text-tinta-suave">Endereço</h3>
                  <Campo
                    label="CEP"
                    value={form.cep}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    dica={dicaCep}
                    onChange={aoMudarCep}
                  />
                  <Campo
                    label="Endereço"
                    value={form.endereco}
                    autoComplete="street-address"
                    onChange={(v) => atualizar("endereco", v)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo label="Número" value={form.numero} onChange={(v) => atualizar("numero", v)} />
                    <Campo
                      label="Complemento"
                      value={form.complemento}
                      onChange={(v) => atualizar("complemento", v)}
                    />
                  </div>
                  <Campo
                    label="Inscrição municipal"
                    value={form.inscricao_municipal}
                    onChange={(v) => atualizar("inscricao_municipal", v)}
                  />
                  <Campo
                    label="CPF do responsável"
                    value={form.cpf_responsavel}
                    inputMode="numeric"
                    autoComplete="off"
                    erro={erroCpf}
                    onBlur={() => marcarTocado("cpf")}
                    onChange={(v) => atualizar("cpf_responsavel", mascararCpf(v))}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm text-tinta-suave">Comercial</h3>
                  <Campo label="Chave PIX" value={form.pix_chave} onChange={(v) => atualizar("pix_chave", v)} />
                  <Campo label="Banco" value={form.banco} onChange={(v) => atualizar("banco", v)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo label="Agência" value={form.agencia} onChange={(v) => atualizar("agencia", v)} />
                    <Campo label="Conta" value={form.conta_bancaria} onChange={(v) => atualizar("conta_bancaria", v)} />
                  </div>
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
                      className="mt-1 w-full rounded-xl border border-concreto-300 bg-white p-3 text-base text-tinta outline-none focus:border-projeto-500"
                    />
                  </label>
                </div>
              </div>
            </details>
          </form>
        </div>

        <div className="order-1 md:order-2">
          <PreviaCabecalho
            nomeFantasia={form.nome_fantasia}
            razaoSocial={form.razao_social}
            cnpj={form.cnpj}
            crea={form.crea}
            responsavel={form.responsavel_tecnico}
            registro={form.registro_responsavel}
            assinatura={form.assinatura_padrao}
            cidade={form.cidade}
            estado={form.estado}
            logoUrl={form.logo_url}
            carimboUrl={form.carimbo_url}
            cor={cor}
          />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t border-concreto-300 bg-concreto-100 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          {erro && (
            <p className="text-sm text-alerta" role="alert">
              {erro}
            </p>
          )}
          {salvo && <p className="text-sm text-concluido">Dados da empresa salvos.</p>}
          <button
            type="submit"
            form="form-empresa"
            disabled={salvando || enviandoLogo || enviandoCarimbo}
            className="touch-target w-full rounded-xl bg-sinalizacao font-display text-base font-medium text-tinta active:bg-sinalizacao-escuro disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar empresa"}
          </button>
        </div>
      </div>
    </main>
  );
}
