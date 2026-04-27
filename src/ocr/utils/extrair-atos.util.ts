import { normalizarMarcadorOriginal } from './normalizar-texto.util';

export type TipoAto = 'MATRICULA' | 'REGISTRO' | 'AVERBACAO' | 'INDEFINIDO';

export type AtoExtraido = {
  numero_ato: string;
  tipo: TipoAto;
  texto: string;
  pagina_inicio: number;
  confianca_ocr: number;
  marcador_original: string;
};

export function extrairAtosDaPagina(
  texto: string,
  pagina: number,
  confianca: number,
): AtoExtraido[] {
  const regexAto =
    /(?:^|\n)\s*((?:R|AV|Av)[\s=.\-—–]*[0-9]{1,4})[\s=.\-—–]*[0-9]{0,6}[:\-—–.]?/g;

  const matches = [...texto.matchAll(regexAto)];

  const atos: AtoExtraido[] = [];

  if (!matches.length) return atos;

  const primeiroMatch = matches[0];

  const textoAntesDoPrimeiroAto =
    matches[0]?.index !== undefined
      ? texto.slice(0, matches[0].index).trim()
      : '';

  const textoBuscaContinuacao = textoAntesDoPrimeiroAto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[0]/g, 'O')
    .replace(/[—–]/g, '-')
    .toUpperCase();

  const matchContinuacao = textoBuscaContinuacao.match(
    /C[A-Z]*NTINUA[A-Z]*:?\s*D[OA]?\s*((?:R|AV)[\s.\-=]*\d{1,4})/,
  );

  if (pagina > 1 && matchContinuacao && textoAntesDoPrimeiroAto.length > 30) {
    const marcador = matchContinuacao[1];
    const numero = marcador.match(/[0-9]{1,4}/)?.[0] ?? '0';
    const isAverbacao = /^AV/i.test(marcador);

    atos.push({
      numero_ato: `${isAverbacao ? 'AV' : 'R'}-${numero}`,
      tipo: isAverbacao ? 'AVERBACAO' : 'REGISTRO',
      texto: textoAntesDoPrimeiroAto,
      pagina_inicio: pagina,
      confianca_ocr: confianca,
      marcador_original: 'CONTINUACAO',
    });
  }

  if (pagina === 1 && primeiroMatch.index !== undefined) {
    const inicioPrimeiroAto = primeiroMatch.index;
    const textoInicial = texto.slice(0, inicioPrimeiroAto).trim();

    const pareceAberturaMatricula =
      /IM[ÓO]VEL/i.test(textoInicial) || /PROPRIET[ÁA]RI/i.test(textoInicial);

    if (textoInicial.length > 50 && pareceAberturaMatricula) {
      atos.push({
        numero_ato: 'M-0',
        tipo: 'MATRICULA',
        texto: textoInicial,
        pagina_inicio: pagina,
        confianca_ocr: confianca,
        marcador_original: 'MATRICULA',
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const atual = matches[i];
    const proximo = matches[i + 1];

    const inicio = atual.index ?? 0;
    const fim = proximo?.index ?? texto.length;

    const marcadorOriginal = normalizarMarcadorOriginal(atual[1].trim());

    const numeroMatch = marcadorOriginal.match(/[0-9]{1,4}/);
    const numero = numeroMatch?.[0] ?? '0';

    const isAverbacao = /^A[Vv]/.test(marcadorOriginal);

    atos.push({
      numero_ato: `${isAverbacao ? 'AV' : 'R'}-${numero}`,
      tipo: isAverbacao ? 'AVERBACAO' : 'REGISTRO',
      texto: texto.slice(inicio, fim).trim(),
      pagina_inicio: pagina,
      confianca_ocr: confianca,
      marcador_original: marcadorOriginal,
    });
  }

  return atos;
}
