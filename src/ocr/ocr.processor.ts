import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OcrService } from './ocr.service';
import { Logger } from '@nestjs/common';

@Processor('ocr-pdf')
export class OcrProcessor extends WorkerHost {
  private readonly logger = new Logger(OcrProcessor.name);
  constructor(private readonly ocrService: OcrService) {
    super();
  }

  async process(job: Job) {
    const start = Date.now();
    this.logger.log(`Iniciando job OCR ${job.id}`);
    try {
      const { jobId, file } = job.data;

      const buffer = Buffer.from(file.buffer, 'base64');

      await this.ocrService.processPdf({
        buffer,
        originalname: file.originalname,
      } as Express.Multer.File);

      const duration = Date.now() - start;

      this.logger.log(`Finalizado job OCR ${jobId} em ${duration}ms`);
    } catch (error: any) {
      const duration = Date.now() - start;
      this.logger.error(
        `Erro no job OCR ${job.id} após ${duration}ms`,
        error.stack,
      );
      throw error;
    }
  }
}
