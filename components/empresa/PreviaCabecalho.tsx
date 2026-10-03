import { faltasCabecalho } from "@/lib/empresa";

function linha(valor: string, falta: string) {
  if (!valor.trim()) {
    return <p className="text-sm text-tinta-suave">{falta}</p>;
  }
  return <p className="text-sm text-tinta">{valor}</p>;
}

export function PreviaCabecalho({
  nomeFantasia,
  razaoSocial,
  cnpj,
  crea,
  responsavel,
  registro,
  assinatura,
  cidade,
  estado,
  logoUrl,
  carimboUrl,
  cor,
}: {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  crea: string;
  responsavel: string;
  registro: string;
  assinatura: string;
  cidade: string;
  estado: string;
  logoUrl: string;
  carimboUrl: string;
  cor: string;
}) {
  const nome = nomeFantasia.trim() || razaoSocial.trim();
  const local = [cidade.trim(), estado.trim()].filter(Boolean).join(" / ");
  const faltas = faltasCabecalho({ logo_url: logoUrl, cnpj, crea, cidade });

  return (
    <aside className="rounded-xl border border-concreto-300 bg-white p-4 md:sticky md:top-6">
      <p className="font-display text-xs uppercase tracking-wide text-tinta-suave">Como sai no PDF</p>
      <div className="mt-3 border-b-2 pb-3" style={{ borderColor: cor }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-[4.5rem] object-contain" />
            ) : (
              <div className="grid h-9 w-[4.5rem] place-items-center border border-dashed border-concreto-300 text-[10px] text-tinta-suave">
                Logo
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-base" style={{ color: cor }}>
                {nome || "Nome da empresa"}
              </p>
              {razaoSocial.trim() && nomeFantasia.trim() && (
                <p className="truncate text-sm text-tinta-suave">{razaoSocial}</p>
              )}
            </div>
          </div>
          <p className="shrink-0 text-right font-display text-sm" style={{ color: cor }}>
            RDO
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-0.5">
          {linha(cnpj && `CNPJ ${cnpj}`, "CNPJ")}
          {linha(crea && `CREA ${crea}`, "CREA")}
          {linha(local, "Cidade / UF")}
        </div>
      </div>
      <div className="mt-3">
        {carimboUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={carimboUrl} alt="" className="mb-1 h-8 w-16 object-contain" />
        )}
        {linha(responsavel, "Responsável técnico")}
        {registro.trim() && <p className="text-sm text-tinta-suave">{registro}</p>}
        {assinatura.trim() && <p className="mt-1 text-sm text-tinta-suave">{assinatura}</p>}
      </div>
      {faltas.length > 0 && (
        <p className="mt-3 text-sm text-alerta">Falta {faltas.join(", ")} para o cabeçalho.</p>
      )}
    </aside>
  );
}
