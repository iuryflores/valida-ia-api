import { AtoExtraido } from './extrair-atos.util';
import { limparCabecalhoRodapeContinuacao } from './limpar-cabecalho-rodape.util';

function normalizarParaBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0]/g, 'O')
    .replace(/[—–]/g, '-')
    .toUpperCase();
}

function extrairNumeroAtoContinuacao(texto: string): string | null {
  const textoNormalizado = normalizarParaBusca(texto);

  const match = textoNormalizado.match(
    /C[A-Z]*NTINUA[A-Z]*:?\s*D[OA]?\s*((?:R|AV)[\s.\-=]*\d{1,4})/,
  );

  if (!match) return null;

  const marcador = match[1];
  const numero = marcador.match(/\d{1,4}/)?.[0];

  if (!numero) return null;

  const tipo = marcador.startsWith('AV') ? 'AV' : 'R';

  return `${tipo}-${numero}`;
}

function pareceContinuacao(texto: string): boolean {
  const textoNormalizado = normalizarParaBusca(texto);

  return (
    textoNormalizado.includes('CONTINUACAO') ||
    textoNormalizado.includes('CONTINUAC') ||
    texto.trim().startsWith('...') ||
    texto.trim().startsWith('«')
  );
}

export function unificarAtosEntrePaginas(atos: AtoExtraido[]): AtoExtraido[] {
  const resultado: AtoExtraido[] = [];

  for (const ato of atos) {
    const numeroContinuacao = extrairNumeroAtoContinuacao(ato.texto);
    const isContinuacao = pareceContinuacao(ato.texto);

    if (numeroContinuacao) {
      const atoAlvo = [...resultado]
        .reverse()
        .find((item) => item.numero_ato === numeroContinuacao);

      if (atoAlvo) {
        const textoLimpo = limparCabecalhoRodapeContinuacao(ato.texto);

        atoAlvo.texto = `${atoAlvo.texto}\n${textoLimpo}`;
        atoAlvo.confianca_ocr = Math.min(
          atoAlvo.confianca_ocr,
          ato.confianca_ocr,
        );
        continue;
      }
    }

    if (isContinuacao && resultado.length > 0 && ato.tipo !== 'MATRICULA') {
      const ultimoAto = resultado[resultado.length - 1];

      ultimoAto.texto = `${ultimoAto.texto}\n${ato.texto}`;
      ultimoAto.confianca_ocr = Math.min(
        ultimoAto.confianca_ocr,
        ato.confianca_ocr,
      );
      continue;
    }

    resultado.push({ ...ato });
  }

  return resultado;
}
