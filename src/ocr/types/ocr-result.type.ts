export type PaginaOCR = {
  pagina: number;
  texto: string;
  confianca: number;
};

export type AtoOCR = {
  numero_ato: string;
  tipo: 'MATRICULA' | 'REGISTRO' | 'AVERBACAO' | 'INDEFINIDO';
  texto: string;
  pagina_inicio: number;
  confianca_ocr: number;
  marcador_original: string;
};

export type IdentificacaoOCR = {
  matricula: string | null;
  cnm: string | null;
};

export type OCRResult = {
  jobId: string;
  identificacao: IdentificacaoOCR;
  totalPaginas: number;
  totalAtos: number;
  paginas: PaginaOCR[];
  atos: AtoOCR[];
};
