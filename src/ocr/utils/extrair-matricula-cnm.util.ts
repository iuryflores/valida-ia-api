export function extrairMatriculaDoCNM(cnm: string | null): string | null {
  if (!cnm) return null;

  const match = cnm.match(/^\d{6}\.(\d)\.(\d{1,7})-\d{2}$/);

  if (!match) return null;

  const tipoLivro = match[1];

  if (tipoLivro !== '2') return null;

  const numero = match[2];

  return String(parseInt(numero, 10));
}
