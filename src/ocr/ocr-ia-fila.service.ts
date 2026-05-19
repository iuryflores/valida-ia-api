import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OcrIaFilaService {
  private readonly logger = new Logger(OcrIaFilaService.name);
  constructor(@InjectQueue('ocr-ia') private readonly queue: Queue) {}

  async enfileirarAto(atoId: string) {
    this.logger.log(`Adicionando ato ${atoId} na fila IA`);
    await this.queue.add(
      'revisar-ato',
      { atoId },
      {
        attempts: 3,
        removeOnComplete: true,
      },
    );
    this.logger.log(`Ato adicionado fila da IA`);
  }
}
