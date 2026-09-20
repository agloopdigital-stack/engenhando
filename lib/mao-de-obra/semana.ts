function paraISO(data: Date) {
  return data.toISOString().slice(0, 10);
}

// Semana de segunda a domingo, contendo a data de hoje.
export function obterSemanaAtual(): { inicio: string; fim: string } {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = domingo
  const deslocamentoSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + deslocamentoSegunda);

  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);

  return { inicio: paraISO(segunda), fim: paraISO(domingo) };
}

export function formatarReal(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
