export function normalizarDocumentosOCR(texto: string): string {
  return texto.replace(
    /\b(CPF|CNPJ|CGC)\s*(?:n[ºo.]*)?\s*[:\-]?\s*([A-Za-z0-9.,/\\-]+)([,.]?)/gi,
    (_, tipo, valor, pontuacaoFinal) => {
      let valorCorrigido = String(valor)
        .replace(/[OoDd]/g, '0')
        .replace(/[Il]/g, '1')
        .replace(/[Ss]/g, '5')
        .replace(/[Bb]/g, '8');

      const numeros = valorCorrigido.replace(/\D/g, '');

      if (tipo.toUpperCase() === 'CGC' && numeros.length >= 9) {
        const base = numeros.padStart(12, '0');

        const formatado =
          base.slice(0, 3) +
          '.' +
          base.slice(3, 6) +
          '.' +
          base.slice(6, 9) +
          '/' +
          base.slice(9, 12);

        return `${tipo} nº ${formatado}${pontuacaoFinal ?? ''}`;
      }

      return `${tipo} nº ${valorCorrigido}${pontuacaoFinal ?? ''}`;
    },
  );
}
