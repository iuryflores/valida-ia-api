export type IdentificacaoMatricula = {
  matricula: string | null;
  cnm: string | null;
};

export function extrairIdentificacao(texto: string): IdentificacaoMatricula {
  // MATRÍCULA (número)
  const matchMatricula = texto.match(
    /Matr[ií]cula\s*(?:N[ºo°.]*)?\s*[:\-]?\s*([0-9]{1,10})/i
  );

  // CNM
  const matchCNM = texto.match(
    /CNM[:\s]*([0-9.\-]+)/i
  );

  return {
    matricula: matchMatricula ? matchMatricula[1] : null,
    cnm: matchCNM ? matchCNM[1] : null
  };
}