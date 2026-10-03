import { Document, Page, Text, StyleSheet } from "@react-pdf/renderer";
import type { IdentidadeDocumento } from "@/lib/documentos/identidade";
import { AssinaturaDocumento, CabecalhoDocumento, RodapeDocumento } from "@/lib/documentos/blocos-pdf";

interface DadosPropostaPdf {
  clienteNome: string;
  corpo: string;
  identidade: IdentidadeDocumento;
}

function criarEstilos() {
  return StyleSheet.create({
    page: { padding: 40, paddingBottom: 72, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
    corpo: { fontSize: 11 },
  });
}

export function DocumentoProposta({ clienteNome, corpo, identidade }: DadosPropostaPdf) {
  const estilos = criarEstilos();

  return (
    <Document>
      <Page size="A4" style={estilos.page}>
        <CabecalhoDocumento
          identidade={identidade}
          titulo="Proposta de Serviço"
          subtitulo={`Para: ${clienteNome}`}
        />
        <Text style={estilos.corpo}>{corpo}</Text>
        <AssinaturaDocumento identidade={identidade} />
        <RodapeDocumento identidade={identidade} />
      </Page>
    </Document>
  );
}
