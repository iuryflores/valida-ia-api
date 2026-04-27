export function corrigirDatas(texto: string): string {
  return texto.replace(
    /\b[O0](\d)\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/gi,
    (_, dia, mes) => `0${dia} de ${mes}`,
  );
}