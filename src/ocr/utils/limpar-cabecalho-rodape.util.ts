function normalizarLinha(linha: string): string {
  return linha
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0]/g, 'O')
    .toUpperCase()
    .trim();
}

export function limparCabecalhoRodapeContinuacao(texto: string): string {
  const linhas = texto.split('\n');

  const linhasLimpas = linhas.filter((linha) => {
    const normalizada = normalizarLinha(linha);

    if (!normalizada) return false;

    const ehCabecalho =
      normalizada.includes('CNM') ||
      normalizada.includes('ESTADO DE GOIAS') ||
      normalizada.includes('COMARCA DE GOIANIA') ||
      normalizada.includes('CARTORIO DO REGISTRO') ||
      normalizada.includes('REGISTRO DE IMOVEIS') ||
      normalizada.includes('LIVRO 2') ||
      normalizada.includes('REGISTRO GERAL') ||
      normalizada.includes('FICHA') ||
      normalizada.includes('MATRICULA GOIANIA');

    const ehRodape =
      normalizada.includes('VIDE VERSO') ||
      (normalizada.includes('CONTINUA') && normalizada.includes('MATRICULA'));

    const ehLixoContinuacao =
      normalizada === '[NA' ||
      normalizada.includes('CONTINUACAO') ||
      normalizada.includes('CANTINUAC') ||
      normalizada.includes('GOLARIA') ||
      (normalizada.includes('GOIANIA') && normalizada.includes('DEZEMBRO'));
    normalizada.includes('GOLARIA') ||
      normalizada.includes('GLARIA') ||
      (normalizada.includes('GOIANIA') && normalizada.includes('DEZEMBRO')) ||
      (normalizada.includes('GOLARIA') && normalizada.includes('DEZEMBRO'));

    return !ehCabecalho && !ehRodape && !ehLixoContinuacao;
  });

  return linhasLimpas.join('\n').trim();
}
