export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function mascararCnpj(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 14);
  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascararCep(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 8);
  return digitos.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function mascararCpf(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function mascararTelefone(valor: string) {
  const digitos = apenasDigitos(valor).slice(0, 11);
  if (digitos.length <= 10) {
    return digitos.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digitos.replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

export function cnpjValido(valor: string) {
  const cnpj = apenasDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  const digito = (base: string, pesos: number[]) => {
    const soma = pesos.reduce((total, peso, indice) => total + Number(base[indice]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiro = digito(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13]);
}

export function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

export function cpfValido(valor: string) {
  const cpf = apenasDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const digito = (tamanho: number) => {
    let soma = 0;
    for (let indice = 0; indice < tamanho; indice += 1) {
      soma += Number(cpf[indice]) * (tamanho + 1 - indice);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

export function faltasCabecalho(dados: {
  logo_url: string;
  cnpj: string;
  crea: string;
  cidade: string;
}) {
  return [
    !dados.logo_url.trim() && "logo",
    !dados.cnpj.trim() && "CNPJ",
    !dados.crea.trim() && "CREA",
    !dados.cidade.trim() && "cidade",
  ].filter((item): item is string => Boolean(item));
}

export type DadosCnpj = {
  razao_social: string;
  nome_fantasia: string;
  endereco: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;
  cep: string;
};

export async function buscarCnpj(cnpj: string, signal?: AbortSignal): Promise<DadosCnpj | null> {
  const digitos = apenasDigitos(cnpj);
  if (!cnpjValido(digitos)) return null;

  const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitos}`, { signal });
  if (!resposta.ok) return null;

  const dados = (await resposta.json()) as {
    razao_social?: string;
    nome_fantasia?: string;
    logradouro?: string;
    bairro?: string;
    numero?: string;
    complemento?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  };

  return {
    razao_social: dados.razao_social ?? "",
    nome_fantasia: dados.nome_fantasia ?? "",
    endereco: [dados.logradouro, dados.bairro].filter(Boolean).join(", "),
    numero: dados.numero ?? "",
    complemento: dados.complemento ?? "",
    cidade: dados.municipio ?? "",
    estado: dados.uf ?? "",
    cep: dados.cep ?? "",
  };
}

export type EnderecoCep = {
  endereco: string;
  cidade: string;
  estado: string;
};

export async function buscarCep(cep: string, signal?: AbortSignal): Promise<EnderecoCep | null> {
  const digitos = apenasDigitos(cep);
  if (digitos.length !== 8) return null;

  const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`, { signal });
  if (!resposta.ok) return null;

  const dados = (await resposta.json()) as {
    erro?: boolean;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };
  if (dados.erro) return null;

  return {
    endereco: [dados.logradouro, dados.bairro].filter(Boolean).join(", "),
    cidade: dados.localidade ?? "",
    estado: dados.uf ?? "",
  };
}
