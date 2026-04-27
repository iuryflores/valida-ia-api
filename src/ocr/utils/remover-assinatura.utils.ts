export function removerAssinaturaFinal(texto: string): string {
  const linhas = texto.split('\n');

  const linhasFiltradas = linhas.filter((linha) => {
    const normalizada = linha
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

    // padrões comuns de assinatura / lixo
    const ehAssinatura =
      normalizada.startsWith('A OFICIAL') ||
      normalizada.startsWith('OFICIAL') ||
      normalizada.startsWith('A TEA') ||
      normalizada.includes('ASSINATURA') ||
      normalizada.length < 5;

    return !ehAssinatura;
  });

  return linhasFiltradas.join('\n').trim();
}
