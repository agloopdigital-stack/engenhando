export type TipoMidia = "foto" | "audio" | "texto";

export interface Midia {
  id: string;
  obra_id: string;
  registro_dia_id: string | null;
  tipo: TipoMidia;
  url_storage: string | null;
  texto: string | null;
  transcricao: string | null;
  criado_por: string | null;
  criado_em: string;
}

export interface Obra {
  id: string;
  conta_id: string;
  nome: string;
  endereco: string | null;
  cliente_nome: string | null;
  status: "ativa" | "pausada" | "concluida";
}

export interface RegistroDia {
  id: string;
  obra_id: string;
  data: string;
  fechado: boolean;
}

export type EstagioLead = "novo" | "proposta_enviada" | "follow_up" | "fechado" | "perdido";

export interface TipoServico {
  id: string;
  nome: string;
}

export interface Lead {
  id: string;
  conta_id: string;
  nome: string;
  contato: string | null;
  tipo_servico_id: string | null;
  estagio: EstagioLead;
  obra_relacionada: string | null;
  criado_em: string;
}

export interface TemplateProposta {
  id: string;
  conta_id: string;
  nome: string;
  corpo_template: string;
  tipo_servico_id: string | null;
}

export interface Proposta {
  id: string;
  lead_id: string;
  template_id: string | null;
  valores_preenchidos: Record<string, string>;
  pdf_url: string | null;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  enviada_em: string | null;
  criado_em: string;
}

export type TipoDocumentoObra =
  | "alvara_construcao"
  | "licenca_ambiental"
  | "art"
  | "laudo_bombeiro"
  | "outro";

export interface DocumentoObra {
  id: string;
  obra_id: string;
  tipo: TipoDocumentoObra;
  identificacao: string | null;
  data_emissao: string | null;
  data_vencimento: string;
  criado_em: string;
}

export interface Orcamento {
  id: string;
  obra_id: string;
  categoria: string;
  valor_orcado: number;
}

export interface Gasto {
  id: string;
  obra_id: string;
  categoria: string;
  valor: number;
  data: string;
  fornecedor: string | null;
  nota_fiscal_url: string | null;
  criado_em: string;
}

export type FuncaoTrabalhador = "pedreiro" | "servente" | "eletricista" | "encanador" | "outro";

export interface Trabalhador {
  id: string;
  obra_id: string;
  nome: string;
  funcao: FuncaoTrabalhador;
  valor_diaria: number;
  ativo: boolean;
}

export interface Checkin {
  id: string;
  trabalhador_id: string;
  obra_id: string;
  data: string;
  presente: boolean;
}

export interface Vale {
  id: string;
  trabalhador_id: string;
  valor: number;
  data: string;
}
