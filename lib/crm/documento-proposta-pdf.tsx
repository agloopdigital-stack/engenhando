import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

interface DadosPropostaPdf {
  clienteNome: string;
  corpo: string;
  conta: { nome: string; logo_url: string | null; cor_primaria: string | null };
}

function criarEstilos(corPrimaria: string) {
  return StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
    cabecalho: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `2pt solid ${corPrimaria}`,
      paddingBottom: 12,
      marginBottom: 20,
    },
    logo: { width: 90, height: 40, objectFit: "contain" },
    titulo: { fontSize: 16, fontWeight: 700, color: corPrimaria },
    subtitulo: { fontSize: 10, color: "#4a4a46", marginTop: 2 },
    corpo: { fontSize: 11, whiteSpace: "pre-wrap" },
    rodape: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 9, color: "#4a4a46" },
  });
}

export function DocumentoProposta({ clienteNome, corpo, conta }: DadosPropostaPdf) {
  const corPrimaria = conta.cor_primaria ?? "#1B3A5C";
  const estilos = criarEstilos(corPrimaria);

  return (
    <Document>
      <Page size="A4" style={estilos.page}>
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.titulo}>Proposta de Serviço</Text>
            <Text style={estilos.subtitulo}>Para: {clienteNome}</Text>
          </View>
          {conta.logo_url && <Image src={conta.logo_url} style={estilos.logo} />}
        </View>

        <Text style={estilos.corpo}>{corpo}</Text>

        <Text style={estilos.rodape}>{conta.nome}</Text>
      </Page>
    </Document>
  );
}
