import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OcrJobDocument = HydratedDocument<OcrJob>;

@Schema({ timestamps: true, collection: 'ocr_jobs' })
export class OcrJob {
  @Prop({ required: true, unique: true, index: true })
  jobId!: string;

  @Prop({ type: String, default: null, index: true })
  matricula!: string | null;

  @Prop({ type: String, default: null, index: true })
  cnm!: string | null;

  @Prop({ type: String, default: null })
  nomeArquivo!: string | null;

  @Prop({ type: String, default: null })
  erro!: string | null;

  @Prop({ required: true })
  totalPaginas!: number;

  @Prop({ required: true })
  totalAtos!: number;

  @Prop({
    required: true,
    enum: ['PROCESSADO', 'ERRO', 'PENDENTE'],
    default: 'PROCESSADO',
    index: true,
  })
  status!: string;
}

export const OcrJobSchema = SchemaFactory.createForClass(OcrJob);
