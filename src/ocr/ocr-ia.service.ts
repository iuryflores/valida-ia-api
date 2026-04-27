import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { RevisaoIA } from './types/ia-revisao.type';

@Injectable()
export class OcrIaService {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });

    this.model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';
  }

  async revisarTextoAto(params: {
    numero_ato: string;
    tipo: string;
    texto: string;
  }): Promise<RevisaoIA> {
    const response = await this.openai.responses.create({
      model: this.model,
      input: [
        {
          role: 'system',
          content:
            'Você é um revisor técnico de OCR de matrículas de imóveis. Preserve o conteúdo jurídico, não invente dados e corrija apenas erros evidentes de OCR.',
        },
        {
          role: 'user',
          content: `
Revise o texto abaixo.

Regras:
1. Não invente informações.
2. Não reescreva juridicamente o ato.
3. Corrija apenas erros claros de OCR.
4. Preserve nomes, datas, valores, documentos e números.

5. CPF, CNPJ e CGC:
   - São documentos NUMÉRICOS.
   - CGC é equivalente antigo de CNPJ (12 dígitos).
   - Nunca transforme CGC em CNPJ.
   - Nunca complete dígitos ausentes.
   - Nunca adicione sufixos como "-XX".

6. Detecção de inconsistências (OBRIGATÓRIO):
   Você DEVE gerar alertas_ia quando houver qualquer uma das condições abaixo:

   - presença de letras em CPF/CNPJ/CGC
   - quantidade incorreta de dígitos
   - necessidade de normalização (ex: O → 0)
   - formato incompleto
   - valor suspeito ou ambíguo

7. Sempre que houver qualquer inconsistência:
   - gere pelo menos um item em alertas_ia
   - nunca retorne alertas_ia vazio nesses casos

8. Se nenhum problema existir:
   - retorne alertas_ia como []

9. Retorne:
   - texto revisado (mínima alteração possível)
   - observações objetivas
   - alertas estruturados

Ato: ${params.numero_ato}
Tipo: ${params.tipo}

Texto:
${params.texto}
          `,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'revisao_ato_ocr',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              texto_revisado: { type: 'string' },
              houve_correcao: { type: 'boolean' },
              observacoes: {
                type: 'array',
                items: { type: 'string' },
              },
              alertas_ia: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    tipo: {
                      type: 'string',
                      enum: [
                        'CPF_INCOMPLETO',
                        'CNPJ_INCOMPLETO',
                        'CGC_INCOMPLETO',
                        'DOCUMENTO_SUSPEITO',
                      ],
                    },
                    valor_detectado: { type: 'string' },
                    descricao: { type: 'string' },
                  },
                  required: ['tipo', 'valor_detectado', 'descricao'],
                },
              },
            },
            required: [
              'texto_revisado',
              'houve_correcao',
              'observacoes',
              'alertas_ia',
            ],
          },
          strict: true,
        },
      },
    });

    return JSON.parse(response.output_text) as RevisaoIA;
  }
}
