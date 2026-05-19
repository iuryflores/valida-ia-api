import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class OcrFilaService {
  constructor(@InjectQueue('ocr-pdf') private readonly queue: Queue) {}

  async enfileirarPdf(file: Express.Multer.File) {
    const jobId = crypto.randomUUID();

    await this.queue.add(
      'processar-pdf',
      {
        jobId,
        file: {
          buffer: file.buffer.toString('base64'),
          originalname: file.originalname,
        },
      },
      {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return { jobId, status: 'ENFILEIRADO' };
  }
}
