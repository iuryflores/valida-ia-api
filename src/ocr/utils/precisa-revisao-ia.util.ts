import { AtoExtraido } from './extrair-atos.util';

export function precisaRevisaoIA(ato: AtoExtraido): boolean {
  if (ato.confianca_ocr < 90) return true;

  if (ato.texto.length < 80) return true;

  if (/[*]{1,}|[|]{1,}/.test(ato.texto)) return true;

  if (/\b[O0B]{2}\s+de\s+/i.test(ato.texto)) return true;

  if (/[A-Z]{3,}\s+[A-Z]{3,}/.test(ato.texto)) return true;

  if (/\w-\w/.test(ato.texto)) return true;

  return false;
}
