export function normalizarTextoOCR(texto: string): string {
  return texto
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

export function normalizarMarcadorOriginal(marcador: string): string {
  const limpo = marcador
    .replace(/[—–=]/g, '-')
    .replace(/\s+/g, '')
    .toUpperCase();

  return limpo.replace(/^R(\d+)/, 'R-$1');
}
