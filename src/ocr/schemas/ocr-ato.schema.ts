import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OcrAtoDocument = HydratedDocument<OcrAto>;

@Schema({ timestamps: true, collection: 'ocr_atos' })
export class OcrAto {
  @Prop({ required: true, index: true })
  jobId!: string;

  @Prop({ type: String, default: null, index: true })
  matricula!: string | null;

  @Prop({ type: String, default: null, index: true })
  cnm!: string | null;

  @Prop({ required: true, index: true })
  numero_ato!: string;

  @Prop({
    required: true,
    enum: ['MATRICULA', 'REGISTRO', 'AVERBACAO', 'INDEFINIDO'],
    index: true,
  })
  tipo!: string;

  @Prop({ required: true })
  texto!: string;

  @Prop({ required: true })
  pagina_inicio!: number;

  @Prop({ required: true })
  confianca_ocr!: number;

  @Prop({ type: String, default: null })
  marcador_original!: string | null;

  @Prop({
    enum: ['EXTRAIDO', 'REVISADO_IA', 'ENVIADO_ASGARD', 'ERRO_ENVIO'],
    default: 'EXTRAIDO',
    index: true,
  })
  status!: string;

  @Prop({ type: String, default: null })
  texto_revisado!: string | null;

  @Prop({ type: Boolean, default: false })
  houve_correcao_ia!: boolean;

  @Prop({ type: [String], default: [] })
  observacoes_ia!: string[];

  @Prop({
    type: [
      {
        tipo: { type: String },
        valor_detectado: { type: String },
        descricao: { type: String },
      },
    ],
    default: [],
  })
  alertas_ia!: {
    tipo: string;
    valor_detectado: string;
    descricao: string;
  }[];
}

export const OcrAtoSchema = SchemaFactory.createForClass(OcrAto);

OcrAtoSchema.index({ jobId: 1, numero_ato: 1 }, { unique: true });
