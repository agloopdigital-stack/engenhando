import { Image, Text, View } from "@react-pdf/renderer";
import type { IdentidadeDocumento } from "./identidade";
import { linhasRodape } from "./identidade";

export function CabecalhoDocumento({
  identidade,
  titulo,
  subtitulo,
}: {
  identidade: IdentidadeDocumento;
  titulo: string;
  subtitulo: string;
}) {
  const linhas = [
    identidade.razaoSocial,
    identidade.cnpj && `CNPJ ${identidade.cnpj}`,
    identidade.crea && `CREA ${identidade.crea}`,
    identidade.cidadeUf,
  ].filter(Boolean);

  return (
    <View
      style={{
        borderBottom: `2pt solid ${identidade.cor}`,
        paddingBottom: 12,
        marginBottom: 16,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", gap: 10, flex: 1, paddingRight: 12 }}>
          {identidade.logoUrl && (
            <Image src={identidade.logoUrl} style={{ width: 72, height: 36, objectFit: "contain" }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: identidade.cor }}>{identidade.nome}</Text>
            {linhas.map((linha) => (
              <Text key={linha} style={{ fontSize: 9, color: "#4a4a46", marginTop: 1 }}>
                {linha}
              </Text>
            ))}
          </View>
        </View>
        <View style={{ alignItems: "flex-end", maxWidth: 180 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, color: identidade.cor }}>{titulo}</Text>
          <Text style={{ fontSize: 9, color: "#4a4a46", marginTop: 2, textAlign: "right" }}>{subtitulo}</Text>
        </View>
      </View>
    </View>
  );
}

export function AssinaturaDocumento({ identidade }: { identidade: IdentidadeDocumento }) {
  const temAssinatura =
    identidade.responsavel || identidade.registroResponsavel || identidade.carimboUrl || identidade.assinatura;
  if (!temAssinatura) return null;

  return (
    <View style={{ marginTop: 28, alignItems: "flex-start" }}>
      {identidade.carimboUrl && (
        <Image src={identidade.carimboUrl} style={{ width: 90, height: 40, objectFit: "contain", marginBottom: 4 }} />
      )}
      {identidade.responsavel && (
        <Text style={{ fontSize: 10, fontWeight: 700 }}>{identidade.responsavel}</Text>
      )}
      {identidade.registroResponsavel && (
        <Text style={{ fontSize: 9, color: "#4a4a46" }}>{identidade.registroResponsavel}</Text>
      )}
      {identidade.assinatura && (
        <Text style={{ fontSize: 9, color: "#4a4a46", marginTop: 2 }}>{identidade.assinatura}</Text>
      )}
    </View>
  );
}

export function RodapeDocumento({ identidade }: { identidade: IdentidadeDocumento }) {
  const linhas = linhasRodape(identidade);
  const texto = linhas.length > 0 ? linhas.join("\n") : identidade.nome;

  return (
    <Text
      style={{
        position: "absolute",
        bottom: 24,
        left: 32,
        right: 32,
        fontSize: 8,
        color: "#4a4a46",
      }}
      fixed
    >
      {texto}
    </Text>
  );
}
