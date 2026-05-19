import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OcrJob, OcrJobSchema } from './schemas/ocr-job.schema';
import { OcrAto, OcrAtoSchema } from './schemas/ocr-ato.schema';
import { OcrPersistenciaService } from './ocr-persistencia.service';
import { OcrIaService } from './ocr-ia.service';
import { BullModule } from '@nestjs/bullmq';
import { OcrFilaService } from './ocr-fila.service';
import { OcrProcessor } from './ocr.processor';
import { OcrIaFilaService } from './ocr-ia-fila.service';
import { OcrIaProcessor } from './ocr-ia.processor';
import { AsgardModule } from 'src/asgard/asgard.module';

const workerProviders =
  process.env.ENABLE_WORKERS === 'true' ? [OcrProcessor, OcrIaProcessor] : [];

@Module({
  imports: [
    AsgardModule,
    BullModule.registerQueue({ name: 'ocr-pdf' }, { name: 'ocr-ia' }),

    MongooseModule.forFeature([
      { name: OcrJob.name, schema: OcrJobSchema },
      { name: OcrAto.name, schema: OcrAtoSchema },
    ]),
  ],
  controllers: [OcrController],
  providers: [
    OcrService,
    OcrPersistenciaService,
    OcrIaService,
    OcrIaFilaService,
    OcrFilaService,
    OcrProcessor,
    ...workerProviders,
  ],
  exports: [OcrService, OcrPersistenciaService],
})
export class OcrModule {}
