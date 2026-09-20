import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { ResumoEstruturado } from "./organizar-resumo";
import type { Midia } from "@/lib/types";

interface DadosRdoPdf {
  obraNome: string;
  data: string;
  conta: { nome: string; logo_url: string | null; cor_primaria: string | null };
  resumo: ResumoEstruturado;
  fotos: Midia[];
}

function criarEstilos(corPrimaria: string) {
  return StyleSheet.create({
    page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
    cabecalho: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `2pt solid ${corPrimaria}`,
      paddingBottom: 12,
      marginBottom: 16,
    },
    logo: { width: 90, height: 40, objectFit: "contain" },
    titulo: { fontSize: 18, fontWeight: 700, color: corPrimaria },
    subtitulo: { fontSize: 11, color: "#4a4a46", marginTop: 2 },
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

export function DocumentoRdo({ obraNome, data, conta, resumo, fotos }: DadosRdoPdf) {
  const corPrimaria = conta.cor_primaria ?? "#1B3A5C";
  const estilos = criarEstilos(corPrimaria);

  return (
    <Document>
      <Page size="A4" style={estilos.page}>
        <View style={estilos.cabecalho}>
          <View>
            <Text style={estilos.titulo}>Relatório Diário de Obra</Text>
            <Text style={estilos.subtitulo}>
              {obraNome} — {new Date(data).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          {conta.logo_url && <Image src={conta.logo_url} style={estilos.logo} />}
        </View>

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
      </Page>
    </Document>
  );
}
