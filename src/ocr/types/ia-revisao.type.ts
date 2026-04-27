export type AlertaIA = {
  tipo:
    | 'CPF_INCOMPLETO'
    | 'CNPJ_INCOMPLETO'
    | 'CGC_INCOMPLETO'
    | 'DOCUMENTO_SUSPEITO';
  valor_detectado: string;
  descricao: string;
};

export type RevisaoIA = {
  texto_revisado: string;
  houve_correcao: boolean;
  observacoes: string[];
  alertas_ia: AlertaIA[];
};
