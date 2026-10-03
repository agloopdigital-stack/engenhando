import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { ResumoEstruturado } from "./organizar-resumo";
import type { Midia } from "@/lib/types";
import type { IdentidadeDocumento } from "@/lib/documentos/identidade";
import { AssinaturaDocumento, CabecalhoDocumento, RodapeDocumento } from "@/lib/documentos/blocos-pdf";

interface DadosRdoPdf {
  obraNome: string;
  data: string;
  identidade: IdentidadeDocumento;
  resumo: ResumoEstruturado;
  fotos: Midia[];
}

function criarEstilos(corPrimaria: string) {
  return StyleSheet.create({
    page: { padding: 32, paddingBottom: 64, fontSize: 11, fontFamily: "Helvetica" },
    secaoTitulo: {
      fontSize: 13,
      fontWeight: 700,
      color: corPrimaria,
      marginTop: 16,
      marginBottom: 6,
    },
    item: { marginBottom: 3, lineHeight: 1.4 },
    grade: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    foto: { width: 150, height: 110, objectFit: "cover", borderRadius: 4 },
  });
}

export function DocumentoRdo({ obraNome, data, identidade, resumo, fotos }: DadosRdoPdf) {
  const estilos = criarEstilos(identidade.cor);

  return (
    <Document>
      <Page size="A4" style={estilos.page}>
        <CabecalhoDocumento
          identidade={identidade}
          titulo="Relatório Diário de Obra"
          subtitulo={`${obraNome} — ${new Date(data).toLocaleDateString("pt-BR")}`}
        />

        {resumo.atividades.length > 0 && (
          <View>
            <Text style={estilos.secaoTitulo}>Atividades realizadas</Text>
            {resumo.atividades.map((item, i) => (
              <Text key={i} style={estilos.item}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {resumo.ocorrencias.length > 0 && (
          <View>
            <Text style={estilos.secaoTitulo}>Ocorrências</Text>
            {resumo.ocorrencias.map((item, i) => (
              <Text key={i} style={estilos.item}>
                • {item}
              </Text>
            ))}
          </View>
        )}

        {resumo.observacoes && (
          <View>
            <Text style={estilos.secaoTitulo}>Observações</Text>
            <Text style={estilos.item}>{resumo.observacoes}</Text>
          </View>
        )}

        {fotos.length > 0 && (
          <View>
            <Text style={estilos.secaoTitulo}>Registro fotográfico</Text>
            <View style={estilos.grade}>
              {fotos.map(
                (foto) =>
                  foto.url_storage && (
                    <Image key={foto.id} src={foto.url_storage} style={estilos.foto} />
                  )
              )}
            </View>
          </View>
        )}
        <AssinaturaDocumento identidade={identidade} />
        <RodapeDocumento identidade={identidade} />
      </Page>
    </Document>
  );
}
