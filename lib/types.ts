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
