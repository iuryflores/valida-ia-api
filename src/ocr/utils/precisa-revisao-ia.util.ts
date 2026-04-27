import { AtoExtraido } from './extrair-atos.util';

export function precisaRevisaoIA(ato: AtoExtraido): boolean {
  if (ato.confianca_ocr < 80) return true;

  if (ato.texto.length < 80) return true;

  if (/[\$][^\d]/.test(ato.texto)) return true;

  if (/retro/i.test(ato.texto)) return true;

  if (!ato.numero_ato) return true;

  return false;
}
