import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OcrJob, OcrJobSchema } from './schemas/ocr-job.schema';
import { OcrAto, OcrAtoSchema } from './schemas/ocr-ato.schema';
import { OcrPersistenciaService } from './ocr-persistencia.service';
import { OcrIaService } from './ocr-ia.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OcrJob.name, schema: OcrJobSchema },
      { name: OcrAto.name, schema: OcrAtoSchema },
    ]),
  ],
  controllers: [OcrController],
  providers: [OcrService, OcrPersistenciaService, OcrIaService],
  exports: [OcrService, OcrPersistenciaService],
})
export class OcrModule {}
